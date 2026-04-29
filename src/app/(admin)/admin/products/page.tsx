import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatPrice } from "@/lib/format";

export default async function AdminProductsPage() {
  let products: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
    stockCount: number;
    isPublished: boolean;
    isFeatured: boolean;
    images: Array<{ url: string }>;
    createdAt: Date;
  }> = [];

  try {
    products = await prisma.product.findMany({
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB not connected
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-light">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {products.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs tracking-wider uppercase text-muted-foreground">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="flex items-center gap-3"
                      >
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt=""
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                            T
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {product.title}
                        </span>
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {product.category.replace(/_/g, " ")}
                    </td>
                    <td className="p-3 text-sm">{formatPrice(product.price)}</td>
                    <td className="p-3">
                      <span
                        className={`text-sm ${
                          product.stockCount === 0
                            ? "text-destructive"
                            : product.stockCount <= 3
                              ? "text-amber-600"
                              : ""
                        }`}
                      >
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          product.isPublished ? "default" : "secondary"
                        }
                      >
                        {product.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-md">
          <p className="text-muted-foreground mb-4">No products yet</p>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Product
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
