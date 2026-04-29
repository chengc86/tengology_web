"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, X } from "lucide-react";
import type { Metadata } from "next";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-heading text-3xl font-light mb-4">
          Your Bag is Empty
        </h1>
        <p className="text-muted-foreground mb-8">
          Discover something special.
        </p>
        <Button asChild>
          <Link
            href="/shop"
            className="text-xs tracking-[0.15em] uppercase"
          >
            Continue Shopping
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <h1 className="font-heading text-3xl lg:text-4xl font-light mb-10">
        Your Bag
      </h1>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 pb-6 border-b"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-sm"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                &pound;{item.price.toFixed(2)}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="p-1 hover:bg-muted rounded"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  className="p-1 hover:bg-muted rounded"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeItem(item.productId)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                &pound;{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-medium">
            &pound;{totalPrice.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping calculated at checkout
        </p>
        <Button asChild className="w-full h-12 text-xs tracking-[0.2em] uppercase">
          <Link href="/checkout">Proceed to Checkout</Link>
        </Button>
        <Button
          variant="outline"
          asChild
          className="w-full text-xs tracking-[0.15em] uppercase"
        >
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
