"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart";

const navigation = [
  { name: "Shop", href: "/shop" },
  { name: "Hair Accessories", href: "/shop?category=HAIR_ACCESSORIES" },
  { name: "Jewellery", href: "/shop?category=JEWELLERY" },
  { name: "Christmas", href: "/shop?category=CHRISTMAS_ORNAMENTS" },
  { name: "Brooches", href: "/shop?category=BROOCHES" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.totalItems());

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs tracking-widest uppercase py-2 px-4">
        Designed &amp; Made in Oxford &mdash; Free shipping over &pound;50
      </div>

      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="font-heading text-2xl lg:text-3xl font-light tracking-[0.2em] uppercase">
                Tengology
              </h1>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/auth/signin">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Sheet>
                <SheetTrigger className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose text-[10px] font-medium text-white flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <CartDrawer />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t px-4 py-4 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm tracking-wider uppercase text-muted-foreground hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-lg font-heading">Your bag is empty</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add something beautiful
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-heading text-xl mb-6">
        Your Bag ({items.length})
      </h2>
      <div className="flex-1 overflow-y-auto space-y-4">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                Qty: {item.quantity}
              </p>
              <p className="text-sm">&pound;{item.price.toFixed(2)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.productId)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="border-t pt-4 mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-medium">&pound;{totalPrice.toFixed(2)}</span>
        </div>
        <Button asChild className="w-full">
          <Link href="/checkout">Checkout</Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link href="/cart">View Bag</Link>
        </Button>
      </div>
    </div>
  );
}
