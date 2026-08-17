"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Package, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { CartDrawer } from "./CartDrawer";

const navigation = [
  { name: "Shop", href: "/shop" },
  { name: "Design Your Own", href: "/designer/bracelet" },
  { name: "Jewellery", href: "/shop?category=JEWELLERY" },
  { name: "Hair Accessories", href: "/shop?category=HAIR_ACCESSORIES" },
  { name: "Christmas", href: "/shop?category=CHRISTMAS_ORNAMENTS" },
  { name: "Crystal Guide", href: "/encyclopedia" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = useCartStore((s) => s.totalItems());

  // The cart is restored from localStorage after hydration, so the badge stays
  // hidden on the first paint to keep server and client markup identical.
  const mounted = useHydrated();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Announcement bar */}
      <div className="bg-primary text-primary-foreground text-center text-xs tracking-widest uppercase py-2 px-4">
        Designed &amp; Made in Oxford &mdash; Worldwide delivery &middot; Free UK shipping over
        &pound;50
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
              <Button variant="ghost" size="icon" asChild aria-label="Track an order">
                <Link href="/orders/lookup">
                  <Package className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="My account">
                <Link href="/account">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Sheet>
                <SheetTrigger
                  aria-label={`Open bag${mounted && itemCount > 0 ? `, ${itemCount} items` : ""}`}
                  className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && itemCount > 0 && (
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
