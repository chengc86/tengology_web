import type { DesignState } from './types';
import { getCrystal } from '@/lib/crystals/catalog';
import { retailPriceCentsForCrystal } from '@/lib/crystals/retailPricing';

function beadPriceCents(crystalSlug: string, sizeMm: number): number {
  const crystal = getCrystal(crystalSlug);
  if (!crystal) return 0; // stale slug in design state — don't crash pricing
  return retailPriceCentsForCrystal(crystal, sizeMm);
}

const FINDINGS_PRICE_CENTS = {
  'bracelet:elastic': 300,
  'necklace:elastic': 450,
  'ring:elastic': 200,
  'earrings:french-hook': 350,
  'earrings:leverback': 550,
  'earrings:post-stud': 400,
} as const;

function findingsPriceCents(state: DesignState): number {
  switch (state.findings.kind) {
    case 'bracelet':
    case 'necklace':
    case 'ring':
      return FINDINGS_PRICE_CENTS[`${state.findings.kind}:elastic`];
    case 'earrings':
      return FINDINGS_PRICE_CENTS[`earrings:${state.findings.hook}`];
  }
}

export interface PriceBreakdown {
  beadsCents: number;
  findingsCents: number;
  focalCents: number;
  /** Earrings are sold as a pair, so beads price doubles when mirrored. */
  multiplier: number;
  totalCents: number;
}

export function priceDesign(state: DesignState): PriceBreakdown {
  const beadsCents = state.beads.reduce(
    (sum, b) => sum + beadPriceCents(b.crystalSlug, b.sizeMm),
    0,
  );
  const findingsCents = findingsPriceCents(state);
  const focalCrystal = state.focal ? getCrystal(state.focal.slug) : undefined;
  const focalCents = focalCrystal
    ? retailPriceCentsForCrystal(focalCrystal, focalCrystal.availableSizesMm?.[0] ?? 8) * 2
    : 0;
  const multiplier = state.kind === 'earrings' && (state.mirror ?? true) ? 2 : 1;
  const totalCents = beadsCents * multiplier + findingsCents + focalCents;
  return { beadsCents, findingsCents, focalCents, multiplier, totalCents };
}
