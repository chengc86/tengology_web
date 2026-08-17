import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, ExternalLink, Mail, MapPin, ShoppingBag, User } from "lucide-react";
import { getAdminOrder } from "@/lib/order-access";
import { formatMoney } from "@/lib/money";
import { formatAddress, parseAddress } from "@/lib/orders";
import { trackingUrlFor } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) notFound();

  const shipping = parseAddress(order.shippingAddress);
  const billing = parseAddress(order.billingAddress);
  const tracking = order.trackingUrl ?? trackingUrlFor(order.shippingCarrier, order.trackingNumber);
  const payment = order.payments.find((p) => p.status === "COMPLETED") ?? order.payments[0];

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Orders
      </Link>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-light">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
            {order.paymentStatus !== "PAID" && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {order.paymentStatus.replace(/_/g, " ").toLowerCase()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {order.createdAt.toLocaleString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AdminOrderActions order={order} />

          {/* Items */}
          <section className="rounded-md border">
            <h2 className="border-b px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Items
            </h2>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                    {item.productImageSnapshot ? (
                      <Image
                        src={item.productImageSnapshot}
                        alt={item.productTitleSnapshot}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.productTitleSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.unitPrice, order.currency)} × {item.quantity}
                      {item.quantityRefunded > 0 && (
                        <span className="ml-2 text-amber-600">
                          {item.quantityRefunded} returned
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm">{formatMoney(item.totalPrice, order.currency)}</p>
                </div>
              ))}
            </div>

            <dl className="space-y-1.5 border-t p-4 text-sm">
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
            </dl>
          </section>

          {/* Timeline */}
          <section className="rounded-md border p-4">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Timeline
            </h2>
            <OrderTimeline events={order.events} showInternal />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="rounded-md border p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Customer
            </h2>
            {order.user ? (
              <>
                <p className="text-sm">{order.user.name ?? "—"}</p>
                <Link
                  href={`/admin/customers/${order.user.id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {order.user.email}
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm">Guest checkout</p>
                <p className="break-words text-sm text-muted-foreground">{order.email}</p>
              </>
            )}
            {order.phone && <p className="mt-1 text-sm text-muted-foreground">{order.phone}</p>}

            <a
              href={`mailto:${order.email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs underline hover:no-underline"
            >
              <Mail className="h-3 w-3" />
              Email customer
            </a>
          </section>

          <section className="rounded-md border p-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Delivery address
            </h2>
            <address className="text-sm not-italic leading-relaxed text-muted-foreground">
              {formatAddress(shipping).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {tracking && (
              <a
                href={tracking}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs underline hover:no-underline"
              >
                Track {order.trackingNumber}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </section>

          {billing && order.billingAddress !== order.shippingAddress && (
            <section className="rounded-md border p-4">
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

          <section className="rounded-md border p-4">
            <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Payment
            </h2>
            {payment ? (
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {payment.cardBrand
                    ? `${payment.cardBrand} ending ${payment.last4}`
                    : payment.walletType ?? "Card"}
                </p>
                <p>
                  {formatMoney(payment.amount, payment.currency)} · {payment.status.toLowerCase()}
                </p>
                {payment.errorMessage && (
                  <p className="text-destructive">{payment.errorMessage}</p>
                )}
                {payment.receiptUrl && (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs underline hover:no-underline"
                  >
                    Square receipt
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payment recorded.</p>
            )}
          </section>

          {order.refunds.length > 0 && (
            <section className="rounded-md border p-4">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Refunds
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {order.refunds.map((refund) => (
                  <li key={refund.id} className="flex justify-between gap-2">
                    <span>
                      {formatMoney(refund.amount, refund.currency)}
                      {refund.reason && <span className="block text-xs">{refund.reason}</span>}
                    </span>
                    <span className="text-xs">{refund.status.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(order.notes || order.giftMessage) && (
            <section className="rounded-md border p-4">
              {order.notes && (
                <>
                  <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Delivery notes
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">{order.notes}</p>
                </>
              )}
              {order.giftMessage && (
                <>
                  <h2 className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Gift message
                  </h2>
                  <p className="text-sm italic text-muted-foreground">{order.giftMessage}</p>
                </>
              )}
            </section>
          )}
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
