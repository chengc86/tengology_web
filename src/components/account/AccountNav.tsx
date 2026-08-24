"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MapPin, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Favourites", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:sticky lg:top-28 lg:self-start">
      <p className="eyebrow mb-4 hidden lg:block">My account</p>
      <ul className="flex gap-1 overflow-x-auto border-b pb-2 lg:flex-col lg:gap-0.5 lg:border-0 lg:pb-0">
        {links.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          const Icon = link.icon;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
