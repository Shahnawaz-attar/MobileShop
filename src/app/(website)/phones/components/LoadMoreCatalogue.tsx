"use client";

import { useState } from "react";
import { loadMorePublicProductsAction } from "@/server/modules/catalog/actions";
import { PublicProductCard } from "./PublicProductCard";
import type { PublicFilters } from "@/server/modules/catalog";

interface LoadMoreCatalogueProps {
  initialNextCursor: string | null;
  filters: PublicFilters;
}

export function LoadMoreCatalogue({ initialNextCursor, filters }: LoadMoreCatalogueProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await loadMorePublicProductsAction({
        ...filters,
        cursor: nextCursor,
      });

      setItems((prev) => [...prev, ...result.products]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more products");
    } finally {
      setIsLoading(false);
    }
  };

  if (!nextCursor && items.length === 0) return null;

  return (
    <>
      {items.map((product) => (
        <PublicProductCard key={product.id} product={product} />
      ))}
      
      {nextCursor && (
        <div className="col-span-1 mt-8 flex flex-col items-center justify-center sm:col-span-2 lg:col-span-3">
          {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
