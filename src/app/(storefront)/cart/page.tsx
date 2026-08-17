"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, Loader2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, cartLineKey, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { quoteCheckout, type QuoteResult } from "@/actions/checkout";

const FREE_SHIPPING_THRESHOLD = 50;

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.totalPrice());

  // The persisted cart only exists after hydration.
  const mounted = useHydrated();

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [checking, setChecking] = useState(false);

  const orderLines = useMemo(() => {
    const byProduct = new Map<string, number>();
    for (const item of items) {
      byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
    }
    return [...byProduct].map(([productId, quantity]) => ({ productId, quantity }));
  }, [items]);

  const cartKey = useMemo(
    () => items.map((i) => `${cartLineKey(i)}:${i.quantity}`).join("|"),
    [items]
  );

  /**
   * Check the basket against live stock and pricing so a shopper finds out
   * here — not on the payment step — that something has sold out.
   */
  useEffect(() => {
    if (!mounted || items.length === 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setChecking(true);

    quoteCheckout({ items: orderLines })
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, mounted]);

  /** Live stock for a product, so quantity steppers stop at what's available. */
  const stockByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of quote?.lines ?? []) map.set(line.productId, line.stockCount);
    return map;
  }, [quote]);

  function quantityUsedFor(productId: string, exclude: CartItem): number {
    return items
      .filter((i) => i.productId === productId && cartLineKey(i) !== cartLineKey(exclude))
      .reduce((n, i) => n + i.quantity, 0);
  }

  if (!mounted) {
    return (
      <div className="mx-auto flex max-w-3xl justify-center px-4 py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShoppingBag className="mx-auto mb-6 h-12 w-12 text-muted-foreground/40" />
        <h1 className="mb-3 font-heading text-3xl font-light">Your bag is empty</h1>
        <p className="mb-8 text-muted-foreground">Discover something special.</p>
        <Button asChild className="text-xs uppercase tracking-[0.15em]">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <h1 className="mb-8 font-heading text-3xl font-light lg:text-4xl">Your bag</h1>

      {quote?.issues.map((issue) => (
        <div
          key={`${issue.productId}-${issue.type}`}
          className="mb-3 flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{issue.message}</span>
        </div>
      ))}

      <div className="mb-8">
        {remaining > 0 ? (
          <>
            <p className="mb-2 text-xs text-muted-foreground">
              Spend {formatMoney(remaining)} more for free delivery
            </p>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
            </div>
          </>
        ) : (
          <p className="rounded-sm bg-emerald-50 p-2.5 text-center text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            You&apos;ve unlocked free delivery
          </p>
        )}
      </div>

      <div className="space-y-6">
        {items.map((item) => {
          const key = cartLineKey(item);
          const stock = stockByProduct.get(item.productId);
          const headroom =
            stock === undefined ? Infinity : stock - quantityUsedFor(item.productId, item);
          const atLimit = item.quantity >= headroom;

          return (
            <div key={key} className="flex gap-4 border-b pb-6">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-muted">
                {item.image ? (
                  <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{item.title}</h3>
                {item.design && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Your design · {item.design.beadCount} beads
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{formatMoney(item.price)}</p>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(key, item.quantity - 1)}
                    className="rounded p-1 transition-colors hover:bg-muted"
                    aria-label={`Reduce quantity of ${item.title}`}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(key, item.quantity + 1)}
                    disabled={atLimit}
                    className="rounded p-1 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  {atLimit && Number.isFinite(headroom) && (
                    <span className="text-xs text-muted-foreground">
                      {headroom <= 0 ? "None left" : "All we have"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(key)}
                  className="rounded p-1 transition-colors hover:bg-muted"
                  aria-label={`Remove ${item.title}`}
                >
                  <X className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">
                  {formatMoney(item.price * item.quantity)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex justify-between text-lg">
          <span>Subtotal</span>
          <span className="flex items-center gap-2 font-medium">
            {checking && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {formatMoney(subtotal)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Delivery and any discount codes are applied at checkout.
        </p>
        <Button asChild className="h-12 w-full text-xs uppercase tracking-[0.2em]">
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
        <Button asChild variant="outline" className="w-full text-xs uppercase tracking-[0.15em]">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
