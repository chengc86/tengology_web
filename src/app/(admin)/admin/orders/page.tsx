import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FULFILLING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-200 text-green-900",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-red-100 text-red-800",
};

export default async function AdminOrdersPage() {
  let orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    guestEmail: string | null;
    createdAt: Date;
    user: { name: string | null; email: string } | null;
    _count: { items: number };
  }> = [];

  try {
    orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">Orders</h1>

      {orders.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs tracking-wider uppercase text-muted-foreground">
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-mono hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {order.user?.name || order.user?.email || order.guestEmail}
                    </td>
                    <td className="p-3 text-sm">{order._count.items}</td>
                    <td className="p-3 text-sm">{formatPrice(order.total)}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status] || ""}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {order.createdAt.toLocaleDateString("en-GB")}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-md">
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      )}
    </div>
  );
}
