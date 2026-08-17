"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, cartLineKey } from "@/store/cart";
import { formatMoney } from "@/lib/money";

const FREE_SHIPPING_THRESHOLD = 50;

export function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const subtotal = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="font-heading text-lg">Your bag is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">Add something beautiful</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-5 font-heading text-xl">
        Your bag ({items.reduce((n, i) => n + i.quantity, 0)})
      </h2>

      {remaining > 0 ? (
        <div className="mb-5">
          <p className="mb-2 text-xs text-muted-foreground">
            {formatMoney(remaining)} away from free delivery
          </p>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <p className="mb-5 rounded-sm bg-emerald-50 p-2 text-center text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          You&apos;ve unlocked free delivery
        </p>
      )}

      <div className="-mr-2 flex-1 space-y-4 overflow-y-auto pr-2">
        {items.map((item) => {
          // Bespoke designs are their own line, so mutations key off the line,
          // not the underlying product.
          const key = cartLineKey(item);

          return (
            <div key={key} className="flex gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.title}</p>
                {item.design && (
                  <p className="text-xs text-muted-foreground">
                    Your design · {item.design.beadCount} beads
                  </p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">{formatMoney(item.price)}</p>

                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border transition-colors hover:bg-accent"
                    aria-label={`Reduce quantity of ${item.title}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border transition-colors hover:bg-accent"
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  type="button"
                  onClick={() => removeItem(key)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Remove ${item.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-sm">{formatMoney(item.price * item.quantity)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 space-y-3 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-medium">{formatMoney(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Delivery and any discounts are calculated at checkout.
        </p>
        <Button asChild className="h-11 w-full text-xs uppercase tracking-[0.2em]">
          <Link href="/checkout">Checkout</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/cart">View bag</Link>
        </Button>
      </div>
    </div>
  );
}
