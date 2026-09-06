"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/server/auth/actions";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  LayoutDashboard,
  Smartphone,
  Store,
  BarChart3,
  LogOut,
  FileText,
  QrCode,
  Bell,
  MessagesSquare,
  BadgePercent,
} from "lucide-react";

interface AdminSidebarProps {
  ownerName: string;
  ownerEmail: string;
  shopName: string;
  dashboardLogoUrl?: string | null;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Smartphone },
  { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/admin/shop", label: "Shop Settings", icon: Store },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/qr", label: "QR", icon: QrCode },
  { href: "/admin/leads", label: "Leads", icon: MessagesSquare },
  { href: "/admin/notify", label: "Stock alerts", icon: Bell },
] as const;

export function AdminSidebar({ ownerName, ownerEmail, shopName, dashboardLogoUrl }: AdminSidebarProps) {
  const pathname = usePathname();
  const effectiveLogoUrl = dashboardLogoUrl;

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-sidebar lg:flex">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/admin" className="flex items-center gap-2">
          {effectiveLogoUrl ? (
            <img src={effectiveLogoUrl} alt={shopName} className="h-10 w-auto max-w-[140px] rounded-md object-contain" />
          ) : (
            <span className="text-lg font-bold text-foreground truncate max-w-[120px]">{shopName}</span>
          )}
        </Link>
        <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Owner info + logout */}
      <div className="border-t border-border p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-foreground">
            {ownerName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {ownerEmail}
          </p>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
