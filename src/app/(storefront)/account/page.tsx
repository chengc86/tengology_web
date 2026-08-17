import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Heart, MapPin, Package } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export const metadata: Metadata = {
  title: "My account | Tengology",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/account");

  const userId = session.user.id;

  const [user, orderCount, activeOrders, recentOrders, addressCount, wishlistCount, spend] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true, createdAt: true },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: { userId, status: { in: ["PENDING", "PAID", "FULFILLING", "SHIPPED"] } },
      }),
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
        },
      }),
      prisma.address.count({ where: { userId } }),
      prisma.wishlistItem.count({ where: { userId } }),
      prisma.order.aggregate({
        where: { userId, paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
        _sum: { total: true },
      }),
    ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-light">
          Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={String(orderCount)} sub={activeOrders > 0 ? `${activeOrders} in progress` : undefined} />
        <Stat label="Total spent" value={formatMoney(spend._sum.total ?? 0)} />
        <Stat
          label="Member since"
          value={
            user?.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) ?? "—"
          }
        />
      </div>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Recent orders
          </h2>
          {orderCount > 3 && (
            <Link href="/account/orders" className="text-xs underline hover:text-foreground">
              View all
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-sm border py-12 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="mb-4 text-sm text-muted-foreground">You haven&apos;t ordered anything yet.</p>
            <Button asChild size="sm">
              <Link href="/shop">Browse the shop</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y rounded-sm border">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-sm">{formatMoney(order.total, order.currency)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <QuickLink
          href="/account/addresses"
          icon={MapPin}
          title="Addresses"
          description={
            addressCount === 0
              ? "Save an address for faster checkout"
              : `${addressCount} saved ${addressCount === 1 ? "address" : "addresses"}`
          }
        />
        <QuickLink
          href="/account/wishlist"
          icon={Heart}
          title="Favourites"
          description={
            wishlistCount === 0 ? "Nothing saved yet" : `${wishlistCount} saved ${wishlistCount === 1 ? "piece" : "pieces"}`
          }
        />
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button variant="outline" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-sm border p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-2xl font-light">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof MapPin;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-sm border p-4 transition-colors hover:border-foreground/40 hover:bg-accent/30"
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
