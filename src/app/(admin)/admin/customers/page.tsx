import Link from "next/link";
import { Search, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 30;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        marketingOptIn: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Lifetime value per customer, in one grouped query rather than N+1.
  const spendByUser = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      userId: { in: customers.map((c) => c.id) },
      paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
    },
    _sum: { total: true, refundedAmount: true },
  });

  const spend = new Map(
    spendByUser.map((row) => [row.userId, (row._sum.total ?? 0) - (row._sum.refundedAmount ?? 0)])
  );

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-light">Customers</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {total} {total === 1 ? "account" : "accounts"}
          </p>
        </div>

        <form action="/admin/customers" className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Name or email…"
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-9">
            Search
          </Button>
        </form>
      </div>

      {customers.length === 0 ? (
        <div className="rounded-md border py-20 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {query ? "No customers match that search." : "No customers yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[680px]">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Orders</th>
                <th className="p-3 font-medium">Lifetime value</th>
                <th className="p-3 font-medium">Marketing</th>
                <th className="p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-3">
                    <Link href={`/admin/customers/${customer.id}`} className="block hover:underline">
                      <span className="text-sm">{customer.name ?? "—"}</span>
                      <span className="block text-xs text-muted-foreground">{customer.email}</span>
                    </Link>
                    {customer.role === "ADMIN" && (
                      <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        admin
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm">{customer._count.orders}</td>
                  <td className="p-3 text-sm">{formatMoney(spend.get(customer.id) ?? 0)}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {customer.marketingOptIn ? "Subscribed" : "—"}
                  </td>
                  <td className="whitespace-nowrap p-3 text-sm text-muted-foreground">
                    {customer.createdAt.toLocaleDateString("en-GB", {
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
              <Link href={`/admin/customers?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(page - 1) })}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/customers?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(page + 1) })}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
