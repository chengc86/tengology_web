import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { requireAdmin } from "@/lib/order-access";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    notFound();
  }

  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
          refundedAmount: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const paidOrders = customer.orders.filter((o) => !["CANCELLED", "FAILED"].includes(o.status));
  const lifetime = paidOrders.reduce((sum, o) => sum + o.total - o.refundedAmount, 0);
  const average = paidOrders.length > 0 ? lifetime / paidOrders.length : 0;

  return (
    <div>
      <Link
        href="/admin/customers"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Customers
      </Link>

      <header className="mb-6 border-b pb-5">
        <h1 className="font-heading text-2xl font-light">{customer.name ?? "Customer"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
        {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
        <a
          href={`mailto:${customer.email}`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs underline hover:no-underline"
        >
          <Mail className="h-3 w-3" />
          Email customer
        </a>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Orders" value={String(customer.orders.length)} />
        <Stat label="Lifetime value" value={formatMoney(lifetime)} />
        <Stat label="Average order" value={formatMoney(average)} />
        <Stat
          label="Customer since"
          value={customer.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-md border lg:col-span-2">
          <h2 className="border-b px-4 py-3 text-sm font-medium">Order history</h2>

          {customer.orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="divide-y">
              {customer.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-sm">{formatMoney(order.total, order.currency)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" />
            Addresses
          </h2>

          {customer.addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved addresses.</p>
          ) : (
            <ul className="space-y-4">
              {customer.addresses.map((address) => (
                <li key={address.id} className="text-sm text-muted-foreground">
                  <p className="mb-0.5 text-xs uppercase tracking-wide text-foreground">
                    {address.label}
                    {address.isDefault && " · default"}
                  </p>
                  {address.firstName} {address.lastName}
                  <br />
                  {address.line1}
                  {address.line2 && (
                    <>
                      <br />
                      {address.line2}
                    </>
                  )}
                  <br />
                  {address.city}, {address.postcode}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            Marketing: {customer.marketingOptIn ? "subscribed" : "not subscribed"}
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-xl font-light">{value}</p>
    </div>
  );
}
