"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/order-access";
import { setSettings, type SettingKey } from "@/lib/settings";

/**
 * Store configuration. These values drive real money — the free-shipping
 * threshold and VAT rate feed straight into `priceCart` — so they are
 * validated here rather than trusted from the form.
 */

export type SettingsResult = { ok: true; message: string } | { ok: false; error: string };

const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(80),
  storeEmail: z.string().trim().email(),
  supportEmail: z.string().trim().email(),
  freeShippingThreshold: z.number().min(0).max(100000),
  taxRatePercent: z.number().min(0).max(100),
  taxIncludedInPrice: z.boolean(),
  lowStockThreshold: z.number().int().min(0).max(1000),
  orderPrefix: z
    .string()
    .trim()
    .min(2)
    .max(6)
    .regex(/^[A-Za-z]+$/, "Letters only"),
});

export async function updateStoreSettings(input: unknown): Promise<SettingsResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const parsed = storeSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const data = parsed.data;

  await setSettings({
    storeName: data.storeName,
    storeEmail: data.storeEmail,
    supportEmail: data.supportEmail,
    freeShippingThreshold: String(data.freeShippingThreshold),
    taxRatePercent: String(data.taxRatePercent),
    taxIncludedInPrice: String(data.taxIncludedInPrice),
    lowStockThreshold: String(data.lowStockThreshold),
    orderPrefix: data.orderPrefix.toUpperCase(),
  } as Partial<Record<SettingKey, string>>);

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true, message: "Settings saved." };
}

const shippingMethodSchema = z.object({
  id: z.string().nullish(),
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(160).optional().or(z.literal("")),
  carrier: z.string().trim().max(40).optional().or(z.literal("")),
  price: z.number().min(0).max(10000),
  freeThreshold: z.number().min(0).nullish(),
  minDays: z.number().int().min(0).max(365).nullish(),
  maxDays: z.number().int().min(0).max(365).nullish(),
  countries: z.string().trim().min(1).max(200),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(999),
});

export async function saveShippingMethod(input: unknown): Promise<SettingsResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const parsed = shippingMethodSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const { id, ...rest } = parsed.data;

  if (rest.minDays !== null && rest.maxDays !== null && rest.minDays! > rest.maxDays!) {
    return { ok: false, error: "The fastest estimate can't be slower than the slowest." };
  }

  const data = {
    name: rest.name,
    description: rest.description || null,
    carrier: rest.carrier || null,
    price: rest.price,
    freeThreshold: rest.freeThreshold ?? null,
    minDays: rest.minDays ?? null,
    maxDays: rest.maxDays ?? null,
    countries: rest.countries.toUpperCase(),
    isActive: rest.isActive,
    sortOrder: rest.sortOrder,
  };

  if (id) {
    await prisma.shippingMethod.update({ where: { id }, data });
  } else {
    await prisma.shippingMethod.create({ data });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true, message: id ? "Delivery option updated." : "Delivery option added." };
}

export async function deleteShippingMethod(id: string): Promise<SettingsResult> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Not authorised." };
  }

  const remaining = await prisma.shippingMethod.count({ where: { isActive: true, id: { not: id } } });
  if (remaining === 0) {
    return { ok: false, error: "Keep at least one delivery option so customers can check out." };
  }

  await prisma.shippingMethod.delete({ where: { id } });

  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  return { ok: true, message: "Delivery option removed." };
}
