import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminDashboard() {
  let stats = {
    totalProducts: 0,
    publishedProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockProducts: [] as Array<{ id: string; title: string; stockCount: number }>,
    recentOrders: [] as Array<{
      id: string;
      orderNumber: string;
      status: string;
      total: unknown;
      createdAt: Date;
    }>,
  };

  try {
    const [totalProducts, publishedProducts, totalOrders, pendingOrders, lowStockProducts, recentOrders] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isPublished: true } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.findMany({
          where: {
            isPublished: true,
            stockCount: { lte: prisma.product.fields?.lowStockThreshold ? 3 : 3 },
          },
          select: { id: true, title: true, stockCount: true },
          take: 10,
        }),
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        }),
      ]);

    stats = {
      totalProducts,
      publishedProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      recentOrders,
    };
  } catch {
    // DB not connected yet
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-normal">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-light">
              {stats.publishedProducts}
              <span className="text-sm text-muted-foreground font-sans">
                /{stats.totalProducts}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-normal">
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-light">
              {stats.totalOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-normal">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-light">
              {stats.pendingOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs tracking-wider uppercase text-muted-foreground font-normal">
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-heading font-light">
              {stats.lowStockProducts.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {stats.lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}`}
                    className="flex justify-between items-center p-2 rounded hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{product.title}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        product.stockCount === 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {product.stockCount} left
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All products are well-stocked.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">
                Recent Orders
              </CardTitle>
              <Link
                href="/admin/orders"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-2">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex justify-between items-center p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div>
                      <span className="text-sm font-mono">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt.toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted">
                      {order.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
