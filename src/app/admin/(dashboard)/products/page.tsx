import type { Metadata } from "next";
import Link from "next/link";
import { listAdminProducts } from "@/server/modules/catalog";
import { formatINR } from "@/lib/money";
import { AVAILABILITY_LABELS, CONDITION_LABELS, DEVICE_TYPE_LABELS } from "@/lib/constants";
import { ProductListClient } from "@/components/admin/ProductListClient";
import type { Availability } from "@/types";

export const metadata: Metadata = {
  title: "Products",
};

const TABS: { key: "ALL" | Availability; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "AVAILABLE", label: "Available" },
  { key: "RESERVED", label: "Reserved" },
  { key: "SOLD", label: "Sold" },
  { key: "DRAFT", label: "Drafts" },
];

interface ProductsPageProps {
  searchParams: Promise<{ tab?: string; q?: string; cursor?: string }>;
}

const PAGE_SIZE = 20;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const tab = params.tab ?? "ALL";
  const q = params.q ?? "";
  const cursor = params.cursor;

  const availability =
    tab === "ALL" ? undefined : (tab as Availability);

  const { products, total, nextCursor } = await listAdminProducts({
    availability,
    q: q || undefined,
    cursor,
    limit: PAGE_SIZE,
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} {total === 1 ? "device" : "devices"} in your shop
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <span className="text-base leading-none" aria-hidden="true">+</span>
          Add a device
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          const href =
            t.key === "ALL"
              ? "/admin/products"
              : `/admin/products?tab=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              className={
                isActive
                  ? "inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background"
                  : "inline-flex h-10 items-center rounded-full border border-border bg-background px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-6">
        <ProductListClient
          initialProducts={products.map((p) => ({
            ...p,
            price: formatINR(p.pricePaise),
            conditionLabel: CONDITION_LABELS[p.condition],
            availabilityLabel: AVAILABILITY_LABELS[p.availability],
            deviceTypeLabel: DEVICE_TYPE_LABELS[p.deviceType],
          }))}
          initialNextCursor={nextCursor}
          tab={tab}
          q={q}
        />
      </div>

    </div>
  );
}
