"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  RefreshCw,
  Settings,
  Store,
  Share2,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Inventory", href: "/admin/inventory", icon: BarChart3 },
  { name: "Social Media", href: "/admin/social", icon: Share2 },
  { name: "Sync", href: "/admin/sync", icon: RefreshCw },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r bg-sidebar min-h-screen flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b">
        <Link href="/admin">
          <h1 className="font-heading text-lg tracking-[0.15em] uppercase font-light">
            Tengology
          </h1>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
            Admin
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Store className="h-3.5 w-3.5" />
          View Storefront
        </Link>
      </div>
    </aside>
  );
}
