import { NextResponse } from 'next/server';
import {
  ACCOUNTING_GBP_TO_CNY,
  LABOUR_CNY_PER_BEAD,
  MIN_RETAIL_PRICE_CENTS,
  OVERHEAD_CNY_PER_BEAD,
  PAYMENT_FIXED_FEE_CENTS_PER_ORDER,
  PAYMENT_PROCESSING_RATE,
  RETAIL_ROUNDING_CENTS,
  TARGET_PROFIT_MARGIN,
  WASTE_RATE,
  inventoryPricingRows,
} from '@/features/admin/beadPricing';
import {
  SHIPPING_RATE_CNY_PER_KG,
  inventoryCostLots,
} from '@/features/admin/inventoryCosts';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    shippingRateCnyPerKg: SHIPPING_RATE_CNY_PER_KG,
    accountingGbpToCny: ACCOUNTING_GBP_TO_CNY,
    paymentProcessingRate: PAYMENT_PROCESSING_RATE,
    paymentFixedFeeCentsPerOrder: PAYMENT_FIXED_FEE_CENTS_PER_ORDER,
    wasteRate: WASTE_RATE,
    labourCnyPerBead: LABOUR_CNY_PER_BEAD,
    overheadCnyPerBead: OVERHEAD_CNY_PER_BEAD,
    targetProfitMargin: TARGET_PROFIT_MARGIN,
    minRetailPriceCents: MIN_RETAIL_PRICE_CENTS,
    retailRoundingCents: RETAIL_ROUNDING_CENTS,
    lots: inventoryCostLots,
    pricingRows: inventoryPricingRows,
  });
}
