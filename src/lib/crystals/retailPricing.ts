import type { Crystal } from './types';

export const PUBLIC_RETAIL_PRICE_CENTS_BY_SLUG_SIZE = {
  'blue-tigers-eye-premium:12': 125,
  'clear-quartz:8': 85,
  'clear-quartz:9': 85,
  'clear-quartz:10': 90,
  'clear-quartz:12': 110,
  'gold-alphabet-a:12': 345,
  'green-agate:10': 100,
  'green-agate:6.3': 80,
  'howlite:6.4': 80,
  'howlite:8': 95,
  'ice-obsidian:10.5': 100,
  'lychee-jelly:10': 100,
  'lychee-jelly:12': 115,
  'lychee-jelly:6': 80,
  'lychee-jelly:8': 95,
  'red-tigers-eye:6.5': 80,
  'silver-sheen-obsidian-cat:13.6': 370,
  'silver-sheen-obsidian-heart:14': 405,
  'silver-sheen-obsidian-round:12': 110,
  'silver-sheen-obsidian-round:6': 95,
  'silver-sheen-obsidian-round:8': 95,
  'silver-sheen-obsidian-square:10': 240,
  'silver-sheen-obsidian:10': 155,
  'silver-sheen-obsidian:7': 150,
  'tigers-eye:10.5': 100,
  'tigers-eye:6.5': 80,
  'tigers-eye:8.5': 100,
} as const;

export function retailSizeKey(sizeMm: number): string {
  return Number.isInteger(sizeMm) ? String(sizeMm) : String(Number(sizeMm.toFixed(1)));
}

function retailSlugFor(crystal: Crystal): string {
  return crystal.category === 'alphabet' ? 'gold-alphabet-a' : crystal.slug;
}

export function retailPriceCentsForCrystal(crystal: Crystal, sizeMm: number): number {
  const key = `${retailSlugFor(crystal)}:${retailSizeKey(sizeMm)}`;
  return PUBLIC_RETAIL_PRICE_CENTS_BY_SLUG_SIZE[
    key as keyof typeof PUBLIC_RETAIL_PRICE_CENTS_BY_SLUG_SIZE
  ] ?? crystal.priceCents;
}

export function minRetailPriceCentsForCrystal(crystal: Crystal): number {
  const prices = (crystal.availableSizesMm ?? [8]).map((sizeMm) => retailPriceCentsForCrystal(crystal, sizeMm));
  return Math.min(...prices);
}
