import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Package, Receipt, ShoppingBag, Truck } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatAddress, parseAddress } from "@/lib/orders";
import { CUSTOMER_CANCELLABLE, trackingUrlFor } from "@/lib/constants";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTimeline } from "./OrderTimeline";
import { CancelOrderButton, ReorderButton } from "./OrderActions";

interface OrderDetailOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  shippingCost: number;
  taxAmount: number;
  total: number;
  refundedAmount: number;
  shippingMethodName: string | null;
  shippingAddress: string | null;
  billingAddress: string | null;
  notes: string | null;
  giftMessage: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippingCarrier: string | null;
  squareReceiptUrl: string | null;
  createdAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  email: string;
  items: Array<{
    id: string;
    productTitleSnapshot: string;
    productSlugSnapshot: string | null;
    productImageSnapshot: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  events: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: Date;
    isCustomerVisible: boolean;
  }>;
}

export function OrderDetail({
  order,
  guestToken,
}: {
  order: OrderDetailOrder;
  guestToken?: string | null;
}) {
  const shipping = parseAddress(order.shippingAddress);
  const billing = parseAddress(order.billingAddress);
  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
  const tracking = order.trackingUrl ?? trackingUrlFor(order.shippingCarrier, order.trackingNumber);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
        <div>
          <div className="mb-1.5 flex items-center gap-3">
            <h1 className="font-heading text-2xl font-light">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed{" "}
            {order.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl font-light">{formatMoney(order.total, order.currency)}</p>
          {order.refundedAmount > 0 && (
            <p className="text-xs text-amber-600">
              {formatMoney(order.refundedAmount, order.currency)} refunded
            </p>
          )}
        </div>
      </header>

      {tracking && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-violet-700 dark:text-violet-300" />
            <div>
              <p className="text-sm font-medium">On its way</p>
              <p className="text-xs text-muted-foreground">
                {order.shippingCarrier?.replace(/_/g, " ")}
                {order.trackingNumber && ` · ${order.trackingNumber}`}
              </p>
            </div>
          </div>
          <a
            href={tracking}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm underline hover:no-underline"
          >
            Track parcel
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-sm border">
            <h2 className="border-b px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Items
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {item.productImageSnapshot ? (
                      <Image
                        src={item.productImageSnapshot}
                        alt={item.productTitleSnapshot}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.productSlugSnapshot ? (
                      <Link
                        href={`/product/${item.productSlugSnapshot}`}
                        className="text-sm hover:underline"
                      >
                        {item.productTitleSnapshot}
                      </Link>
                    ) : (
                      <p className="text-sm">{item.productTitleSnapshot}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm">{formatMoney(item.totalPrice, order.currency)}</p>
                </div>
              ))}
            </div>

            <dl className="space-y-2 border-t p-5 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                  value={`−${formatMoney(order.discountAmount, order.currency)}`}
                />
              )}
              <Row
                label={`Delivery${order.shippingMethodName ? ` — ${order.shippingMethodName}` : ""}`}
                value={order.shippingCost === 0 ? "Free" : formatMoney(order.shippingCost, order.currency)}
              />
              {order.taxAmount > 0 && <Row label="VAT" value={formatMoney(order.taxAmount, order.currency)} />}
              <div className="flex justify-between border-t pt-2 font-medium">
                <dt>Total</dt>
                <dd>{formatMoney(order.total, order.currency)}</dd>
              </div>
              {order.refundedAmount > 0 && (
                <Row
                  label="Refunded"
                  value={`−${formatMoney(order.refundedAmount, order.currency)}`}
                />
              )}
            </dl>
          </section>

          {/* Timeline */}
          <section className="rounded-sm border p-5">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Progress
            </h2>
            <OrderTimeline events={order.events} />
          </section>

          <div className="flex flex-wrap items-start gap-3">
            <ReorderButton orderNumber={order.orderNumber} guestToken={guestToken} />
            {order.squareReceiptUrl && (
              <a
                href={order.squareReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs shadow-sm transition-colors hover:bg-accent"
              >
                <Receipt className="h-3.5 w-3.5" />
                Payment receipt
              </a>
            )}
            {canCancel && <CancelOrderButton orderNumber={order.orderNumber} guestToken={guestToken} />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="rounded-sm border p-5">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Delivery address
            </h2>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              {formatAddress(shipping).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {shipping?.phone && (
              <p className="mt-2 text-sm text-muted-foreground">{shipping.phone}</p>
            )}
          </section>

          {billing && order.billingAddress !== order.shippingAddress && (
            <section className="rounded-sm border p-5">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Billing address
              </h2>
              <address className="text-sm not-italic leading-relaxed text-muted-foreground">
                {formatAddress(billing).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </section>
          )}

          <section className="rounded-sm border p-5">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Contact
            </h2>
            <p className="break-words text-sm text-muted-foreground">{order.email}</p>
          </section>

          {order.notes && (
            <section className="rounded-sm border p-5">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Delivery notes
              </h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </section>
          )}

          {order.giftMessage && (
            <section className="rounded-sm border p-5">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Gift message
              </h2>
              <p className="text-sm italic text-muted-foreground">&ldquo;{order.giftMessage}&rdquo;</p>
            </section>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Need help with this order?{" "}
            <Link href="/pages/contact" className="underline hover:text-foreground">
              Get in touch
            </Link>{" "}
            and quote {order.orderNumber}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
