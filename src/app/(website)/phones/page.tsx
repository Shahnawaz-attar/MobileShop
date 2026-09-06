import { Suspense } from "react";
import Link from "next/link";
import { listPublicProducts, listBrands, type PublicFilters } from "@/server/modules/catalog";
import { getActiveDiscounts } from "@/server/modules/discounts";
import type { Condition } from "@/types";
import { PublicProductCard } from "./components/PublicProductCard";
import { CatalogueFilters } from "./components/CatalogueFilters";
import { LoadMoreCatalogue } from "./components/LoadMoreCatalogue";
import { SortSelect } from "./components/SortSelect";
import { SearchInput } from "@/components/shared/SearchInput";
import { FadeIn } from "@/components/shared/FadeIn";
import { MobileFiltersDrawer } from "./components/MobileFiltersDrawer";
import { ActiveFilters } from "./components/ActiveFilters";
import { SaleFilterToggle } from "./components/SaleFilterToggle";
import { BrandInterestForm } from "@/components/public/BrandInterestForm";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

import { getShop } from "@/server/modules/shop";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();
  return {
    title: `Browse Phones | ${shop.name}`,
    description: `Browse our inventory of premium pre-owned phones at ${shop.name}. Verified condition, best prices.`,
    alternates: {
      canonical: "/phones",
    }
  };
}

export default async function PhonesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Parse search params into filters
  const filters: PublicFilters = {
    q: typeof params.q === "string" ? params.q : undefined,
    brands: Array.isArray(params.brands) 
      ? params.brands.flatMap(b => b.split(",")).filter(Boolean)
      : typeof params.brands === "string" 
        ? params.brands.split(",").filter(Boolean) 
        : undefined,
    conditions: Array.isArray(params.conditions) 
      ? (params.conditions.flatMap(c => c.split(",")) as Condition[]).filter(Boolean)
      : typeof params.conditions === "string" 
        ? (params.conditions.split(",") as Condition[]).filter(Boolean) 
        : undefined,
    storage: Array.isArray(params.storage)
      ? params.storage.flatMap(s => s.split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0)
      : typeof params.storage === "string"
        ? params.storage.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0)
        : undefined,
    minPrice: typeof params.minPrice === "string" ? Number(params.minPrice) : undefined,
    maxPrice: typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined,
    onSale: params.sale === "1" ? true : undefined,
    sort: typeof params.sort === "string" && ["NEWEST", "PRICE_ASC", "PRICE_DESC"].includes(params.sort) 
      ? (params.sort as "NEWEST" | "PRICE_ASC" | "PRICE_DESC") 
      : "NEWEST",
  };

  const [productsData, brands, activeDiscounts] = await Promise.all([
    listPublicProducts(filters),
    listBrands(),
    getActiveDiscounts(),
  ]);
  const hasActiveDiscounts = activeDiscounts.length > 0;

  return (
    <>
      {/* Header Area */}
      <div className="relative overflow-hidden border-b border-border bg-[#f7f8fa]">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="brand-glow absolute right-[-8%] top-[-30%] h-[300px] w-[420px] opacity-70" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
          <Breadcrumbs
            className="mb-4"
            items={[{ label: "Home", href: "/" }, { label: "All Products" }]}
          />
          <FadeIn direction="up">
            <span className="eyebrow"><span className="eyebrow-dot" />Live inventory</span>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Browse our stock
            </h1>
            <p className="mt-3 max-w-xl text-lg font-medium text-ink-soft">
              {productsData.total} {productsData.total === 1 ? "device" : "devices"} ready to inspect — tap any card for full photos & honest condition.
            </p>
          </FadeIn>

          {/* Mobile Search & Sort (Desktop uses sidebar for filters, but top for search/sort) */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:max-w-md">
              <Suspense fallback={<div className="h-10 animate-pulse rounded-full bg-surface-hover" />}>
                <SearchInput defaultValue={filters.q} />
              </Suspense>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-4">
              {hasActiveDiscounts && (
                <Suspense fallback={<div className="h-10 w-24 animate-pulse rounded-full bg-surface-hover" />}>
                  <SaleFilterToggle />
                </Suspense>
              )}

              <Suspense fallback={<div className="h-10 w-24 animate-pulse rounded-full bg-surface-hover" />}>
                <MobileFiltersDrawer brands={brands} hasActiveDiscounts={hasActiveDiscounts} />
              </Suspense>

              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-semibold text-ink-soft sm:inline">Sort by:</span>
                <Suspense fallback={<div className="h-10 w-40 animate-pulse rounded-full bg-surface-hover" />}>
                  <SortSelect defaultValue={filters.sort || "NEWEST"} />
                </Suspense>
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            <ActiveFilters brands={brands} hasActiveDiscounts={hasActiveDiscounts} />
          </Suspense>
        </div>
      </div>

      <main className="mx-auto max-w-7xl min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row">

          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-8">
              <div className="device-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-base font-black text-ink">Filters</h2>
                  {(filters.brands || filters.conditions || filters.storage || filters.minPrice || filters.maxPrice || filters.onSale) && (
                    <Link href="/phones" className="text-xs font-semibold text-brand hover:underline">
                      Clear all
                    </Link>
                  )}
                </div>
                <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-surface-hover" />}>
                  <CatalogueFilters brands={brands} hasActiveDiscounts={hasActiveDiscounts} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {productsData.products.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white text-center">
                <span className="text-5xl">🔍</span>
                <h3 className="mt-6 text-xl font-black text-ink">No devices found</h3>
                <p className="mt-2 max-w-md text-sm font-medium text-ink-soft">
                  We couldn&apos;t find any devices matching your current filters. Try adjusting your search criteria or clear all filters.
                </p>
                <Link href="/phones" className="btn-dark mt-8 !min-h-0 px-6 py-2.5 text-sm">
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {productsData.products.map((product, i) => (
                  <FadeIn key={product.id} delay={i * 80}>
                    <PublicProductCard product={product} priority={i < 4} />
                  </FadeIn>
                ))}

                {/* Client component for pagination */}
                <LoadMoreCatalogue
                  initialNextCursor={productsData.nextCursor}
                  filters={filters}
                />
              </div>
            )}

            {/* Lead capture — free-text device */}
            <div className="mt-10">
              <BrandInterestForm />
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
