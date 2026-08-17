import Link from "next/link";
import { Package, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 25;

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Awaiting payment" },
  { value: "PAID", label: "Paid" },
  { value: "FULFILLING", label: "Preparing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { trackingNumber: { contains: query, mode: "insensitive" as const } },
            { user: { name: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count]));
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(overrides: Record<string, string>) {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (status) next.set("status", status);
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light">Orders</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? "order" : "orders"}
            {status ? ` · ${ORDER_STATUS_LABELS[status] ?? status}` : ""}
          </p>
        </div>

        <form action="/admin/orders" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Order number, email, tracking…"
              className="h-9 w-64 pl-8 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Search
          </Button>
        </form>
      </div>

      {/* Status filters */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = status === filter.value;
          const count = filter.value ? countByStatus.get(filter.value) : undefined;

          return (
            <Link
              key={filter.value || "all"}
              href={href({ status: filter.value, page: "" })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"
              }`}
            >
              {filter.label}
              {count !== undefined && count > 0 && (
                <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 text-muted-foreground"}>
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-md border py-20 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {query || status ? "No orders match that search." : "No orders yet."}
          </p>
          {(query || status) && (
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/admin/orders">Clear filters</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[760px]">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Items</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sm hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="max-w-[200px] truncate p-3 text-sm text-muted-foreground">
                    {order.user?.name || order.email}
                  </td>
                  <td className="p-3 text-sm">{order._count.items}</td>
                  <td className="p-3 text-sm">
                    {formatMoney(order.total, order.currency)}
                    {order.refundedAmount > 0 && (
                      <span className="ml-1 text-xs text-amber-600">
                        −{formatMoney(order.refundedAmount, order.currency)}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs ${
                        order.paymentStatus === "PAID"
                          ? "text-emerald-600"
                          : order.paymentStatus === "FAILED"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {order.paymentStatus.replace(/_/g, " ").toLowerCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap p-3 text-sm text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={href({ page: String(page - 1) })}>Previous</Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Button asChild variant="outline" size="sm">
              <Link href={href({ page: String(page + 1) })}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
