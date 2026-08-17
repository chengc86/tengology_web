"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { profileSchema, passwordChangeSchema, savedAddressSchema, fieldErrors } from "@/lib/validation";

/**
 * Account self-service: profile, password, and the address book that
 * pre-fills checkout.
 */

export type AccountResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function updateProfile(input: unknown): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name || null,
      phone: parsed.data.phone || null,
      marketingOptIn: parsed.data.marketingOptIn,
    },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(input: unknown): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    return { ok: false, error: "This account signs in without a password." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: "That password isn't right.",
      fieldErrors: { currentPassword: "Incorrect password" },
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
  });

  return { ok: true, message: "Password changed." };
}

export async function saveAddress(input: unknown): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the address.", fieldErrors: fieldErrors(parsed.error) };
  }

  const { id, isDefault, ...address } = parsed.data;

  const data = {
    label: address.label || "Home",
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone || null,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    county: address.county || null,
    // Blank for destinations that don't use postal codes at all.
    postcode: address.postcode?.toUpperCase() ?? "",
    country: address.country,
    isDefault,
  };

  await prisma.$transaction(async (tx) => {
    // Exactly one default at a time.
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    if (id) {
      // updateMany scopes the write to this user — an id alone isn't proof of ownership.
      await tx.address.updateMany({ where: { id, userId }, data });
    } else {
      const count = await tx.address.count({ where: { userId } });
      await tx.address.create({
        data: { ...data, userId, isDefault: isDefault || count === 0 },
      });
    }
  });

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true, message: id ? "Address updated." : "Address saved." };
}

export async function deleteAddress(id: string): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const deleted = await prisma.address.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) return { ok: false, error: "That address no longer exists." };

  revalidatePath("/account/addresses");
  return { ok: true, message: "Address removed." };
}

export async function setDefaultAddress(id: string): Promise<AccountResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const owned = await prisma.address.count({ where: { id, userId } });
  if (!owned) return { ok: false, error: "That address no longer exists." };

  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);

  revalidatePath("/account/addresses");
  return { ok: true, message: "Default address updated." };
}

// ─── Wishlist ───────────────────────────────────────

export async function toggleWishlist(productId: string): Promise<AccountResult & { saved?: boolean }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to save favourites." };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { ok: true, saved: false, message: "Removed from favourites." };
  }

  await prisma.wishlistItem.create({ data: { userId, productId } });
  revalidatePath("/account/wishlist");
  return { ok: true, saved: true, message: "Saved to favourites." };
}
