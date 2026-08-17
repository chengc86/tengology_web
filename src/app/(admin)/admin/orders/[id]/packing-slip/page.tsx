import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/order-access";
import { formatMoney } from "@/lib/money";
import { formatAddress, parseAddress } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "@/components/admin/PrintButton";

/**
 * Print-ready packing slip. Prices are shown for the seller's records but the
 * gift message is highlighted so it doesn't get missed when packing.
 */
export default async function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getAdminOrder(id), getSettings()]);

  if (!order) notFound();

  const shipping = parseAddress(order.shippingAddress);

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">Packing slip for {order.orderNumber}</p>
        <PrintButton />
      </div>

      <div className="rounded-md border p-8 print:rounded-none print:border-0 print:p-0">
        <header className="mb-8 flex items-start justify-between border-b pb-6">
          <div>
            <p className="font-heading text-xl font-light uppercase tracking-[0.2em]">
              {settings.storeName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Handmade in Oxford</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono">{order.orderNumber}</p>
            <p className="text-muted-foreground">
              {order.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Deliver to
            </p>
            <address className="not-italic leading-relaxed">
              {formatAddress(shipping).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            {shipping?.phone && <p className="mt-1">{shipping.phone}</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Delivery method
            </p>
            <p>{order.shippingMethodName ?? "Standard"}</p>
            {order.trackingNumber && (
              <p className="mt-1 font-mono text-xs">{order.trackingNumber}</p>
            )}
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-center font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-3">{item.productTitleSnapshot}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">{formatMoney(item.totalPrice, order.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-3 text-right text-muted-foreground">
                Subtotal
              </td>
              <td className="pt-3 text-right">{formatMoney(order.subtotal, order.currency)}</td>
            </tr>
            {order.discountAmount > 0 && (
              <tr>
                <td colSpan={2} className="text-right text-muted-foreground">
                  Discount
                </td>
                <td className="text-right">−{formatMoney(order.discountAmount, order.currency)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={2} className="text-right text-muted-foreground">
                Delivery
              </td>
              <td className="text-right">
                {order.shippingCost === 0 ? "Free" : formatMoney(order.shippingCost, order.currency)}
              </td>
            </tr>
            <tr className="font-medium">
              <td colSpan={2} className="pt-2 text-right">
                Total
              </td>
              <td className="pt-2 text-right">{formatMoney(order.total, order.currency)}</td>
            </tr>
          </tfoot>
        </table>

        {order.giftMessage && (
          <div className="mb-6 rounded-sm border-2 border-dashed p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em]">Gift message — write this on a card</p>
            <p className="text-base italic">&ldquo;{order.giftMessage}&rdquo;</p>
          </div>
        )}

        {order.notes && (
          <div className="mb-6 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Delivery notes
            </p>
            <p>{order.notes}</p>
          </div>
        )}

        <footer className="border-t pt-6 text-center text-xs text-muted-foreground">
          <p className="mb-1">Thank you for supporting a small handmade business.</p>
          <p>
            Questions? {settings.supportEmail} · Quote {order.orderNumber}
          </p>
        </footer>
      </div>
    </div>
  );
}
