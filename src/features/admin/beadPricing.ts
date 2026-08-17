import { CRYSTALS } from '@/lib/crystals/catalog';
import { retailPriceCentsForCrystal } from '@/lib/crystals/retailPricing';
import { inventoryCostLots, type InventoryCostLot } from './inventoryCosts';

export const ACCOUNTING_GBP_TO_CNY = 9.1;
export const PAYMENT_PROCESSING_RATE = 0.025;
export const PAYMENT_FIXED_FEE_CENTS_PER_ORDER = 25;
export const WASTE_RATE = 0.1;
export const LABOUR_CNY_PER_BEAD = 2;
export const OVERHEAD_CNY_PER_BEAD = 1;
export const TARGET_PROFIT_MARGIN = 0.5;
export const MIN_RETAIL_PRICE_CENTS = 75;
export const RETAIL_ROUNDING_CENTS = 5;

export interface InventoryPricingRow {
  lot: InventoryCostLot;
  pricingSizeMm: number;
  wasteCnyPerBead: number;
  labourCnyPerBead: number;
  overheadCnyPerBead: number;
  stylePremiumCnyPerBead: number;
  pricingBaseCnyPerBead: number;
  suggestedRetailPriceCentsPerBead: number;
  retailPriceCentsPerBead: number;
  retailPriceCnyPerBead: number;
  paymentFeeCnyPerBead: number;
  profitCnyPerBead: number;
  profitGbpPerBead: number;
  marginAfterPayment: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function roundRetailCents(cents: number): number {
  return Math.max(MIN_RETAIL_PRICE_CENTS, Math.ceil(cents / RETAIL_ROUNDING_CENTS) * RETAIL_ROUNDING_CENTS);
}

function stylePremiumCnyForLot(lot: InventoryCostLot): number {
  if (/cat|heart|star|moon|rose|bear|nugget|letter|connector|charm/i.test(lot.shape)) return 10;
  if (/square|rondelle|faceted|donut|disc/i.test(lot.shape)) return 2;
  return 0;
}

function pricingSizeMmForLot(lot: InventoryCostLot): number {
  const crystal = CRYSTALS.find((c) => c.slug === lot.catalogSlug);
  if (!crystal) return lot.sizeMm ?? 8;
  if (!lot.sizeMm) return crystal.availableSizesMm?.[0] ?? 8;

  const sizes = crystal.availableSizesMm;
  if (!sizes) return lot.sizeMm;

  const nearest = sizes.reduce((best, sizeMm) => (
    Math.abs(sizeMm - lot.sizeMm!) < Math.abs(best - lot.sizeMm!) ? sizeMm : best
  ), sizes[0]);

  return Math.abs(nearest - lot.sizeMm) <= 0.35 ? nearest : lot.sizeMm;
}

function retailPriceCentsForLot(lot: InventoryCostLot): number {
  const crystal = CRYSTALS.find((c) => c.slug === lot.catalogSlug);
  if (!crystal) return 0;

  return retailPriceCentsForCrystal(crystal, pricingSizeMmForLot(lot));
}

export function calculateInventoryPricingRow(lot: InventoryCostLot): InventoryPricingRow {
  const pricingSizeMm = pricingSizeMmForLot(lot);
  const wasteCnyPerBead = round2(lot.unitCostCnyPerBead * WASTE_RATE);
  const labourCnyPerBead = LABOUR_CNY_PER_BEAD;
  const overheadCnyPerBead = OVERHEAD_CNY_PER_BEAD;
  const stylePremiumCnyPerBead = stylePremiumCnyForLot(lot);
  const pricingBaseCnyPerBead = round2(
    lot.unitCostCnyPerBead + wasteCnyPerBead + labourCnyPerBead + overheadCnyPerBead + stylePremiumCnyPerBead,
  );
  const suggestedRetailPriceCentsPerBead = roundRetailCents(
    (pricingBaseCnyPerBead / (1 - PAYMENT_PROCESSING_RATE - TARGET_PROFIT_MARGIN) / ACCOUNTING_GBP_TO_CNY) * 100,
  );
  const retailPriceCentsPerBead = retailPriceCentsForLot(lot);
  const retailPriceCnyPerBead = round2((retailPriceCentsPerBead / 100) * ACCOUNTING_GBP_TO_CNY);
  const paymentFeeCnyPerBead = round2(retailPriceCnyPerBead * PAYMENT_PROCESSING_RATE);
  const profitCnyPerBead = round2(retailPriceCnyPerBead - paymentFeeCnyPerBead - pricingBaseCnyPerBead);
  const profitGbpPerBead = round2(profitCnyPerBead / ACCOUNTING_GBP_TO_CNY);
  const marginAfterPayment = retailPriceCnyPerBead > 0 ? profitCnyPerBead / retailPriceCnyPerBead : 0;

  return {
    lot,
    pricingSizeMm,
    wasteCnyPerBead,
    labourCnyPerBead,
    overheadCnyPerBead,
    stylePremiumCnyPerBead,
    pricingBaseCnyPerBead,
    suggestedRetailPriceCentsPerBead,
    retailPriceCentsPerBead,
    retailPriceCnyPerBead,
    paymentFeeCnyPerBead,
    profitCnyPerBead,
    profitGbpPerBead,
    marginAfterPayment,
  };
}

export const inventoryPricingRows = inventoryCostLots.map(calculateInventoryPricingRow);
