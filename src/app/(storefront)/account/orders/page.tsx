import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ChevronRight, Package, ShoppingBag } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export const metadata: Metadata = {
  title: "My orders | Tengology",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/account/orders");

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          select: {
            id: true,
            productTitleSnapshot: true,
            productImageSnapshot: true,
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-light">My orders</h1>
        {total > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "order" : "orders"}
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-sm border py-20 text-center">
          <Package className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
          <p className="mb-1 font-heading text-lg">No orders yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            When you order something, it&apos;ll appear here.
          </p>
          <Button asChild>
            <Link href="/shop">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);

            return (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="group flex items-center gap-4 rounded-sm border p-4 transition-colors hover:border-foreground/40 hover:bg-accent/30"
              >
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm border-2 border-background bg-muted"
                    >
                      {item.productImageSnapshot ? (
                        <Image
                          src={item.productImageSnapshot}
                          alt={item.productTitleSnapshot}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border-2 border-background bg-muted text-xs text-muted-foreground">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium">{formatMoney(order.total, order.currency)}</p>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders?page=${page - 1}`}>Previous</Link>
            </Button>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          {page < pageCount && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/account/orders?page=${page + 1}`}>Next</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
