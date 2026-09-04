"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Smartphone,
  Store,
  BarChart3,
  FileText,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Smartphone },
  { href: "/admin/shop", label: "Shop", icon: Store },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/analytics", label: "Insights", icon: BarChart3 },
] as const;

/**
 * Bottom navigation bar for mobile admin (visible below lg breakpoint).
 * Thumb-friendly 44px+ targets for one-handed Android use.
 */
export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card lg:hidden"
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
