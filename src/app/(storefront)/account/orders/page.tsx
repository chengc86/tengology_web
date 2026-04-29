import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import Link from "next/link";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  let orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: Date;
    _count: { items: number };
  }> = [];

  try {
    orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not connected
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <h1 className="font-heading text-3xl font-light mb-8">My Orders</h1>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
              <div key={order.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-mono">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.createdAt.toLocaleDateString("en-GB")} &middot;{" "}
                      {order._count.items}{" "}
                      {order._count.items === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-md">
          <p className="text-muted-foreground mb-4">No orders yet.</p>
          <Link
            href="/shop"
            className="text-sm underline hover:text-foreground"
          >
            Start shopping
          </Link>
        </div>
      )}
    </div>
  );
}
