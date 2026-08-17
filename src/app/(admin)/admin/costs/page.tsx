import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ACCOUNTING_GBP_TO_CNY,
  LABOUR_CNY_PER_BEAD,
  OVERHEAD_CNY_PER_BEAD,
  PAYMENT_FIXED_FEE_CENTS_PER_ORDER,
  PAYMENT_PROCESSING_RATE,
  TARGET_PROFIT_MARGIN,
  WASTE_RATE,
  inventoryPricingRows,
} from '@/features/admin/beadPricing';
import {
  SHIPPING_RATE_CNY_PER_KG,
  type CostConfidence,
} from '@/features/admin/inventoryCosts';
import { cn, formatCents } from '@/lib/utils';

function cny(n: number): string {
  return `¥${n.toFixed(2)}`;
}

function percent(n: number): string {
  const value = n * 100;
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}%`;
}

function confidenceLabel(confidence: CostConfidence): string {
  switch (confidence) {
    case 'confirmed':
      return 'confirmed';
    case 'estimated':
      return 'estimated';
    case 'needs_review':
      return 'review';
  }
}

function confidenceClass(confidence: CostConfidence): string {
  switch (confidence) {
    case 'confirmed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'estimated':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'needs_review':
      return 'border-rose-200 bg-rose-50 text-rose-800';
  }
}

export default function AdminCostsPage() {
  return (
    // Chrome (sidebar, padding, auth) comes from the admin layout.
    <div className="text-foreground">
      <div className="flex flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <Link href="/designer/bracelet" className="text-sm text-muted-foreground hover:text-foreground">
              Open the designer
            </Link>
            <h1 className="mt-2 font-heading text-3xl">Bead Costs</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Freight: {cny(SHIPPING_RATE_CNY_PER_KG)} / kg · FX: £1 = {cny(ACCOUNTING_GBP_TO_CNY)}
            <br />
            Pricing: landed cost + {percent(WASTE_RATE)} waste + {cny(LABOUR_CNY_PER_BEAD)} labour + {cny(OVERHEAD_CNY_PER_BEAD)} overhead
            <br />
            Target margin: {percent(TARGET_PROFIT_MARGIN)} · Payment buffer: {percent(PAYMENT_PROCESSING_RATE)} + {formatCents(PAYMENT_FIXED_FEE_CENTS_PER_ORDER)} / order
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-white text-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <Th>网站款式</Th>
                  <Th>图片</Th>
                  <Th>尺寸</Th>
                  <Th>标签价格 / 串</Th>
                  <Th>串数</Th>
                  <Th>颗 / 串</Th>
                  <Th>运费 / 串</Th>
                  <Th>总成本 / 串</Th>
                  <Th>单颗成本</Th>
                  <Th>计价成本</Th>
                  <Th>卖价 / 颗</Th>
                  <Th>Payment / 颗</Th>
                  <Th>利润 / 颗</Th>
                  <Th>Margin</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {inventoryPricingRows.map((row) => {
                  const lot = row.lot;

                  return (
                    <tr key={lot.id} className="align-top hover:bg-muted/45">
                      <Td>
                        <div className="font-medium">{lot.catalogName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {lot.catalogSlug}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {lot.material} · {lot.shape}
                        </div>
                        {lot.notes && <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{lot.notes}</div>}
                      </Td>
                      <Td className="font-mono text-xs">{lot.sourceImageFile}</Td>
                      <Td>{lot.sizeMm ? `${lot.sizeMm}mm` : 'Needs check'}</Td>
                      <Td className="font-mono text-xs">{lot.labelText}</Td>
                      <Td>{lot.purchaseQuantity}</Td>
                      <Td>{lot.beadsPerStrand}</Td>
                      <Td>{cny(lot.shippingCnyPerStrand)}</Td>
                      <Td className="font-medium">{cny(lot.totalCostCnyPerStrand)}</Td>
                      <Td className="font-medium">{cny(lot.unitCostCnyPerBead)}</Td>
                      <Td>
                        <div className="font-medium">{cny(row.pricingBaseCnyPerBead)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          +{cny(row.wasteCnyPerBead)} waste · +{cny(row.stylePremiumCnyPerBead)} style
                        </div>
                      </Td>
                      <Td className="font-medium">
                        <div>{formatCents(row.retailPriceCentsPerBead)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{cny(row.retailPriceCnyPerBead)}</div>
                      </Td>
                      <Td>{cny(row.paymentFeeCnyPerBead)}</Td>
                      <Td className="font-medium">
                        <div>{cny(row.profitCnyPerBead)}</div>
                        <div className="mt-1 text-xs text-muted-foreground">£{row.profitGbpPerBead.toFixed(2)}</div>
                      </Td>
                      <Td>{percent(row.marginAfterPayment)}</Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <ConfidencePill label="price" confidence={lot.priceConfidence} />
                          <ConfidencePill label="count" confidence={lot.countConfidence} />
                          <ConfidencePill label="weight" confidence={lot.weightConfidence} />
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function ConfidencePill({ label, confidence }: { label: string; confidence: CostConfidence }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        confidenceClass(confidence),
      )}
    >
      {label}: {confidenceLabel(confidence)}
    </span>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-3 font-semibold">{children}</th>;
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn('px-3 py-3', className)}>{children}</td>;
}
