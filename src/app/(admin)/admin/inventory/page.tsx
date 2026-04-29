"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

interface Product {
  id: string;
  title: string;
  stockCount: number;
  lowStockThreshold: number;
  price: number;
  category: string;
  isPublished: boolean;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then((r) => r.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdjust = async (productId: string) => {
    const delta = parseInt(adjustDelta);
    if (isNaN(delta) || delta === 0) return;

    const res = await fetch(`/api/admin/inventory/${productId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta, note: "Manual adjustment" }),
    });

    if (res.ok) {
      const updated = await res.json();
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stockCount: updated.quantityAfter } : p
        )
      );
    }

    setAdjusting(null);
    setAdjustDelta("");
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-light mb-8">Inventory</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : products.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs tracking-wider uppercase text-muted-foreground">
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="p-3 text-sm font-medium">{product.title}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {product.category.replace(/_/g, " ")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-sm font-medium ${
                        product.stockCount === 0
                          ? "text-destructive"
                          : product.stockCount <= product.lowStockThreshold
                            ? "text-amber-600"
                            : "text-green-700"
                      }`}
                    >
                      {product.stockCount}
                    </span>
                  </td>
                  <td className="p-3">
                    {product.stockCount === 0 ? (
                      <Badge variant="destructive">Out of stock</Badge>
                    ) : product.stockCount <= product.lowStockThreshold ? (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Low stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        In stock
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {adjusting === product.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={adjustDelta}
                          onChange={(e) => setAdjustDelta(e.target.value)}
                          placeholder="+5 or -2"
                          className="w-24 h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAdjust(product.id)}
                          className="h-8 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAdjusting(null);
                            setAdjustDelta("");
                          }}
                          className="h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdjusting(product.id)}
                        className="h-8 text-xs"
                      >
                        Adjust
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-md">
          <p className="text-muted-foreground">No products to manage.</p>
        </div>
      )}
    </div>
  );
}
