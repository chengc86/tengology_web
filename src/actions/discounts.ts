"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/order-access";
import { discountCodeSchema, fieldErrors } from "@/lib/validation";

export type DiscountResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveDiscountCode(input: unknown): Promise<DiscountResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const parsed = discountCodeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  const { id, code, endsAt, ...rest } = parsed.data;
  const normalised = code.toUpperCase();

  // Percentages above 100 would hand out money.
  if (rest.type === "PERCENT" && rest.value > 100) {
    return { ok: false, error: "A percentage discount can't exceed 100%.", fieldErrors: { value: "Max 100" } };
  }

  const data = {
    code: normalised,
    description: rest.description || null,
    type: rest.type,
    value: rest.type === "FREE_SHIPPING" ? 0 : rest.value,
    minSubtotal: rest.minSubtotal ?? null,
    maxRedemptions: rest.maxRedemptions ?? null,
    perCustomerLimit: rest.perCustomerLimit ?? null,
    isActive: rest.isActive,
    endsAt: endsAt ? new Date(endsAt) : null,
  };

  const clash = await prisma.discountCode.findUnique({ where: { code: normalised } });
  if (clash && clash.id !== id) {
    return { ok: false, error: "That code already exists.", fieldErrors: { code: "Already in use" } };
  }

  if (id) {
    await prisma.discountCode.update({ where: { id }, data });
  } else {
    await prisma.discountCode.create({ data });
  }

  revalidatePath("/admin/discounts");
  return { ok: true, message: id ? "Code updated." : "Code created." };
}

export async function toggleDiscountCode(id: string): Promise<DiscountResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "That code no longer exists." };

  await prisma.discountCode.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/admin/discounts");
  return { ok: true, message: existing.isActive ? "Code paused." : "Code activated." };
}

export async function deleteDiscountCode(id: string): Promise<DiscountResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const redemptions = await prisma.discountRedemption.count({ where: { discountCodeId: id } });

  // Deleting would cascade away the redemption history attached to real orders.
  if (redemptions > 0) {
    await prisma.discountCode.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/discounts");
    return { ok: true, message: "Code has been used on orders, so it was paused instead of deleted." };
  }

  await prisma.discountCode.delete({ where: { id } });
  revalidatePath("/admin/discounts");
  return { ok: true, message: "Code deleted." };
}
