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
  const closeCart = useCartStore((s) => s.closeCart);
  const subtotal = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow mb-3">Your bag</p>
        <h2 className="font-heading text-3xl leading-[0.95]">
          Your bag is <em>empty</em>
        </h2>
        <Button
          asChild
          onClick={closeCart}
          className="mt-8 rounded-none text-xs uppercase tracking-[0.2em]"
        >
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 border-t pt-5">
        <p className="eyebrow mb-2">Your bag</p>
        <h2 className="font-heading text-2xl leading-none">
          {items.reduce((n, i) => n + i.quantity, 0)} item
          {items.reduce((n, i) => n + i.quantity, 0) === 1 ? "" : "s"}
        </h2>
      </div>

      <div className="mb-6">
        <p className="eyebrow mb-2">
          {remaining > 0 ? (
            <>{formatMoney(remaining)} away from free delivery</>
          ) : (
            <span className="text-moss">Free delivery unlocked</span>
          )}
        </p>
        <div className="h-px w-full bg-muted">
          <div
            className="h-full bg-moss transition-[width] duration-500"
            style={{
              width: `${progress}%`,
              transitionTimingFunction: "var(--ease-soft)",
            }}
          />
        </div>
      </div>

      <div className="-mr-2 flex-1 space-y-5 overflow-y-auto pr-2">
        {items.map((item) => {
          // Bespoke designs are their own line, so mutations key off the line,
          // not the underlying product.
          const key = cartLineKey(item);

          return (
            <div key={key} className="flex gap-4 border-t pt-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-muted">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg leading-tight">
                  {item.title}
                </p>
                {item.design && (
                  <p className="eyebrow mt-1">
                    Your design &middot; {item.design.beadCount} beads
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatMoney(item.price)}
                </p>

                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center border transition-colors hover:bg-muted"
                    aria-label={`Reduce quantity of ${item.title}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center border transition-colors hover:bg-muted"
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
                <span className="text-sm tabular-nums">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4 border-t pt-5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Subtotal</span>
          <span className="font-heading text-2xl tabular-nums">
            {formatMoney(subtotal)}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Delivery and any discounts are calculated at checkout.
        </p>
        <Button
          asChild
          onClick={closeCart}
          className="h-12 w-full rounded-none text-xs uppercase tracking-[0.2em]"
        >
          <Link href="/checkout">Checkout</Link>
        </Button>
        <Link
          href="/cart"
          onClick={closeCart}
          className="link-underline eyebrow block text-center text-foreground"
        >
          View bag
        </Link>
      </div>
    </div>
  );
}
