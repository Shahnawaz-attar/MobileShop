import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, CircleDollarSign, FileEdit, ImageOff, AlertTriangle, Clock, Eye, ArrowRight } from "lucide-react";
import { db } from "@/server/db/client";
import { formatINR } from "@/lib/money";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    availableCount,
    soldCount,
    draftCount,
    missingPhotosCount,
    oldestLive,
    topViewed,
  ] = await Promise.all([
    db.product.count({ where: { availability: "AVAILABLE" } }),
    db.product.count({ where: { availability: "SOLD" } }),
    db.product.count({ where: { availability: "DRAFT" } }),
    // Phones missing photos (needs attention)
    db.product.count({
      where: {
        availability: { in: ["AVAILABLE", "RESERVED"] },
        media: { none: {} },
      },
    }),
    // Oldest live listings (>30 days stale)
    db.product.findMany({
      where: {
        availability: "AVAILABLE",
        publishedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { publishedAt: "asc" },
      take: 5,
      select: { id: true, title: true, pricePaise: true },
    }),
    // Top viewed products
    db.product.findMany({
      where: { viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, pricePaise: true, viewCount: true },
    }),
  ]);

  const stats = [
    { label: "Live phones", value: availableCount, icon: Smartphone, href: "/admin/products?tab=AVAILABLE" },
    { label: "Sold", value: soldCount, icon: CircleDollarSign, href: "/admin/products?tab=SOLD" },
    { label: "Drafts", value: draftCount, icon: FileEdit, href: "/admin/products?tab=DRAFT" },
    { label: "Missing photos", value: missingPhotosCount, icon: ImageOff, href: "/admin/products" },
  ];

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Welcome back! Here&apos;s your shop overview.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          On Android Chrome: menu → <strong>Add to Home screen</strong> to install the admin. Admin pages are never cached offline.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-5">
              <p className="text-3xl font-black tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Needs attention */}
      {missingPhotosCount > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-warning/30 bg-warning/5 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className="text-base font-bold text-warning">
                {missingPhotosCount} {missingPhotosCount === 1 ? "phone needs" : "phones need"} photos
              </h2>
              <p className="mt-1 text-sm text-warning/80">
                Phones without photos rarely sell. Add photos to your live listings to increase visibility.
              </p>
              <Link
                href="/admin/products"
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-warning px-6 text-sm font-bold text-warning-foreground shadow-sm transition-all hover:bg-warning/90 hover:shadow-md"
              >
                Review listings
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Lists Row */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stale listings */}
        {oldestLive.length > 0 && (
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/20 px-6 py-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> Live for 30+ days
              </h2>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                These phones may be sold already. Keep stock accurate to build trust.
              </p>
            </div>
            <ul className="flex-1 divide-y divide-border/50">
              {oldestLive.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="truncate pr-4 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {p.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
                      {formatINR(p.pricePaise)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top viewed */}
        {topViewed.length > 0 && (
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-muted/20 px-6 py-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> Most viewed
              </h2>
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                Your most popular listings based on customer views.
              </p>
            </div>
            <ul className="flex-1 divide-y divide-border/50">
              {topViewed.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                  >
                    <span className="truncate pr-4 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {p.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                      {p.viewCount} views
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
