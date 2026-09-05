"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/auth/actions";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  LayoutDashboard,
  Smartphone,
  Store,
  BarChart3,
  FileText,
  QrCode,
  Bell,
  MoreHorizontal,
  LogOut,
} from "lucide-react";

const PRIMARY_ITEMS = [
  { href: "/admin", label: "Home", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Smartphone },
  { href: "/admin/shop", label: "Shop", icon: Store },
  { href: "/admin/analytics", label: "Insights", icon: BarChart3 },
] as const;

const MORE_ITEMS = [
  { href: "/admin/content", label: "Content", hint: "Announcements & testimonials", icon: FileText },
  { href: "/admin/qr", label: "Shop QR", hint: "Print counter code", icon: QrCode },
  { href: "/admin/notify", label: "Stock alerts", hint: "50 shop alerts / day · listings separate", icon: Bell },
] as const;

function pathMatches(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Android-style bottom bar: 4 main destinations + More.
 * Extra screens live in a bottom sheet so the bar stays 5 items.
 */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((item) => pathMatches(pathname, item.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-card pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <p className="px-5 pb-2 pt-3 text-sm font-bold text-foreground">More</p>
            <ul className="px-2 pb-2">
              {MORE_ITEMS.map((item) => {
                const active = pathMatches(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl px-3 py-2",
                        active ? "bg-primary/10 text-primary" : "text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.hint}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mx-5 mb-2 flex min-h-14 items-center justify-between rounded-xl border border-border px-3">
              <span className="text-sm font-semibold text-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <form action={logoutAction} className="px-2 pb-2">
              <button
                type="submit"
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-destructive"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      <nav
        aria-label="Admin navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-5">
          {PRIMARY_ITEMS.map((item) => {
            const isActive = pathMatches(pathname, item.href);
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
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              moreOpen || moreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
