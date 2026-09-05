import { Suspense } from "react";
import Link from "next/link";
import { listPublicProducts, listBrands, type PublicFilters } from "@/server/modules/catalog";
import type { Condition } from "@/types";
import { PublicProductCard } from "./components/PublicProductCard";
import { CatalogueFilters } from "./components/CatalogueFilters";
import { LoadMoreCatalogue } from "./components/LoadMoreCatalogue";
import { SortSelect } from "./components/SortSelect";
import { SearchInput } from "@/components/shared/SearchInput";
import { FadeIn } from "@/components/shared/FadeIn";
import { MobileFiltersDrawer } from "./components/MobileFiltersDrawer";
import { ActiveFilters } from "./components/ActiveFilters";

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
    minPrice: typeof params.minPrice === "string" ? Number(params.minPrice) : undefined,
    maxPrice: typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined,
    sort: typeof params.sort === "string" && ["NEWEST", "PRICE_ASC", "PRICE_DESC"].includes(params.sort) 
      ? (params.sort as "NEWEST" | "PRICE_ASC" | "PRICE_DESC") 
      : "NEWEST",
  };

  const [productsData, brands] = await Promise.all([
    listPublicProducts(filters),
    listBrands(),
  ]);

  return (
    <>
      {/* Header Area */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-[#f5f5f7]">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-bl from-blue-100 to-purple-50 blur-3xl opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-12">
          <FadeIn direction="up">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
              Browse at {productsData.total > 0 ? "live" : "our"} stock
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-500">
              {productsData.total} {productsData.total === 1 ? "device" : "devices"} ready to inspect — tap any card for full photos & honest condition.
            </p>
          </FadeIn>

          {/* Mobile Search & Sort (Desktop uses sidebar for filters, but top for search/sort) */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="w-full sm:max-w-md">
              <Suspense fallback={<div className="h-10 animate-pulse rounded-full bg-slate-100" />}>
                <SearchInput defaultValue={filters.q} />
              </Suspense>
            </div>

            <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-4">
              <Suspense fallback={<div className="h-10 w-24 animate-pulse rounded-2xl bg-slate-100" />}>
                <MobileFiltersDrawer brands={brands} />
              </Suspense>
              
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-sm font-medium text-slate-700">Sort by:</span>
                <Suspense fallback={<div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-100" />}>
                  <SortSelect defaultValue={filters.sort || "NEWEST"} />
                </Suspense>
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            <ActiveFilters brands={brands} />
          </Suspense>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-[#fbfbfd] min-h-screen">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block lg:w-64 shrink-0">
            <div className="sticky top-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="typography-h4 text-slate-900">Filters</h2>
                  {(filters.brands || filters.conditions || filters.minPrice || filters.maxPrice) && (
                    <Link href="/phones" className="text-xs font-semibold text-blue-600 hover:underline">
                      Clear all
                    </Link>
                  )}
                </div>
                <Suspense fallback={<div className="h-40 animate-pulse bg-slate-100 rounded-lg" />}>
                  <CatalogueFilters brands={brands} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {productsData.products.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center">
                <span className="text-5xl">🔍</span>
                <h3 className="typography-h4 mt-6 text-slate-900">No devices found</h3>
                <p className="typography-body mt-2 max-w-md">
                  We couldn't find any devices matching your current filters. Try adjusting your search criteria or clear all filters.
                </p>
                <Link href="/phones" className="mt-8 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 shadow-sm">
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
          
        </div>
      </main>
    </>
  );
}
