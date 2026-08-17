import { prisma } from "./db";

/**
 * Store settings live in a key/value table so the shop owner can change
 * commercial rules (free-shipping threshold, VAT rate, contact email)
 * without a deploy. Every key has a code default so the store still works
 * on a fresh database.
 */

export const SETTING_DEFAULTS = {
  storeName: "Tengology",
  storeEmail: "orders@tengology.com",
  supportEmail: "hello@tengology.com",
  freeShippingThreshold: "50",
  taxRatePercent: "0", // handmade sole trader below the VAT threshold by default
  taxIncludedInPrice: "true",
  allowGuestCheckout: "true",
  lowStockThreshold: "3",
  orderPrefix: "TNG",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...SETTING_DEFAULTS, ...stored } as Record<SettingKey, string>;
}

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key];
}

export async function getNumericSetting(key: SettingKey): Promise<number> {
  const value = await getSetting(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number(SETTING_DEFAULTS[key]);
}

export async function setSetting(key: SettingKey, value: string) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function setSettings(values: Partial<Record<SettingKey, string>>) {
  const entries = Object.entries(values) as [SettingKey, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
}
