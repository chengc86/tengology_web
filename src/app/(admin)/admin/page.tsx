import Link from "next/link";
import { AlertTriangle, ArrowRight, Package, PoundSterling, ShoppingCart, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { isSquareConfigured } from "@/lib/square";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

/** Rolling windows for the revenue comparison. */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function AdminDashboard() {
  const thirtyDays = daysAgo(30);
  const sixtyDays = daysAgo(60);

  const paid = { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } };

  const [
    revenue30,
    revenuePrev30,
    ordersToday,
    needsAction,
    unfulfilled,
    lowStock,
    recentOrders,
    productCounts,
    lifetime,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...paid, createdAt: { gte: thirtyDays } },
      _sum: { total: true, refundedAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { ...paid, createdAt: { gte: sixtyDays, lt: thirtyDays } },
      _sum: { total: true, refundedAmount: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: daysAgo(0) } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "FAILED"] } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "FULFILLING"] } } }),
    prisma.product.findMany({
      where: { isPublished: true, stockCount: { lte: 3 } },
      select: { id: true, title: true, stockCount: true, slug: true },
      orderBy: { stockCount: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        currency: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.product.groupBy({ by: ["isPublished"], _count: true }),
    prisma.order.aggregate({ where: paid, _sum: { total: true }, _count: true }),
  ]);

  const net30 = (revenue30._sum.total ?? 0) - (revenue30._sum.refundedAmount ?? 0);
  const netPrev30 = (revenuePrev30._sum.total ?? 0) - (revenuePrev30._sum.refundedAmount ?? 0);
  const change = netPrev30 > 0 ? ((net30 - netPrev30) / netPrev30) * 100 : null;

  const published = productCounts.find((p) => p.isPublished)?._count ?? 0;
  const draft = productCounts.find((p) => !p.isPublished)?._count ?? 0;

  const averageOrder = lifetime._count > 0 ? (lifetime._sum.total ?? 0) / lifetime._count : 0;

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-light">Dashboard</h1>

      {!isSquareConfigured() && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Card payments aren&apos;t connected</p>
            <p className="text-muted-foreground">
              Orders can still be placed, but they&apos;ll sit as awaiting payment. Add your Square
              credentials to <code className="rounded bg-muted px-1">.env.local</code> to start
              taking cards.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={PoundSterling}
          label="Revenue (30 days)"
          value={formatMoney(net30)}
          sub={
            change !== null
              ? `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs previous 30 days`
              : `${revenue30._count} paid ${revenue30._count === 1 ? "order" : "orders"}`
          }
          tone={change !== null && change < 0 ? "down" : "up"}
        />
        <Stat icon={ShoppingCart} label="Orders today" value={String(ordersToday)} />
        <Stat
          icon={Package}
          label="To fulfil"
          value={String(unfulfilled)}
          sub={needsAction > 0 ? `${needsAction} awaiting payment` : undefined}
          href="/admin/orders?status=PAID"
        />
        <Stat icon={TrendingUp} label="Average order" value={formatMoney(averageOrder)} sub={`${lifetime._count} lifetime`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
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
                    <p className="truncate text-xs text-muted-foreground">{order.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{formatMoney(order.total, order.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-md border">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Low stock</h2>
            <Link
              href="/admin/inventory"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Inventory
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Everything is well stocked.
            </p>
          ) : (
            <div className="divide-y">
              {lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3">
                  <span className="truncate text-sm">{product.title}</span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      product.stockCount === 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                    }`}
                  >
                    {product.stockCount === 0 ? "Sold out" : `${product.stockCount} left`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t p-3 text-xs text-muted-foreground">
            {published} published · {draft} draft
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  href,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
  tone?: "up" | "down";
  href?: string;
}) {
  const content = (
    <div className="rounded-md border p-4 transition-colors hover:border-foreground/30">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="font-heading text-2xl font-light">{value}</p>
      {sub && (
        <p
          className={`mt-0.5 text-xs ${
            tone === "down" ? "text-destructive" : tone === "up" ? "text-emerald-600" : "text-muted-foreground"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
