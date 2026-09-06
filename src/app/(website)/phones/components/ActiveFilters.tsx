"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CONDITION_LABELS } from "@/lib/constants";
import { formatStorageGb } from "@/lib/catalogue-filters";
import type { Condition } from "@/types";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  brands: { id: string; name: string; slug: string }[];
  /** Whether a discount is live right now. Reserved for show/hide parity; the
   *  active "On Sale" chip still renders while ?sale=1 so it can be removed. */
  hasActiveDiscounts?: boolean;
}

export function ActiveFilters({ brands }: ActiveFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeBrands = searchParams.get("brands")?.split(",").filter(Boolean) || [];
  const activeConditions = (searchParams.get("conditions")?.split(",").filter(Boolean) || []) as Condition[];
  const activeStorage = (searchParams.get("storage")?.split(",").filter(Boolean) || []).map(Number);
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const onSale = searchParams.get("sale") === "1";

  if (
    activeBrands.length === 0 &&
    activeConditions.length === 0 &&
    activeStorage.length === 0 &&
    !minPrice &&
    !maxPrice &&
    !onSale
  ) {
    return null;
  }

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      const currentStr = params.get(key);
      const current = currentStr ? currentStr.split(",") : [];
      const next = current.filter(v => v !== value);
      if (next.length > 0) {
        params.set(key, next.join(","));
      } else {
        params.delete(key);
      }
    } else {
      params.delete(key);
    }
    
    // Also reset pagination if it exists
    params.delete("cursor");
    
    router.push(pathname + "?" + params.toString());
  };

  const removePriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("cursor");
    router.push(pathname + "?" + params.toString());
  };

  const clearAll = () => {
    // Preserve sort and query, but clear filters
    const params = new URLSearchParams();
    if (searchParams.has("q")) params.set("q", searchParams.get("q") as string);
    if (searchParams.has("sort")) params.set("sort", searchParams.get("sort") as string);
    router.push(pathname + "?" + params.toString());
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 lg:hidden">
      <span className="mr-1 text-sm font-semibold text-ink-faint">Active:</span>

      {activeBrands.map(slug => {
        const brandName = brands.find(b => b.slug === slug)?.name || slug;
        return (
          <span key={`brand-${slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
            {brandName}
            <button onClick={() => removeFilter("brands", slug)} className="rounded-full transition-colors hover:bg-white/20">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        );
      })}

      {activeConditions.map(cond => (
        <span key={`cond-${cond}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
          {CONDITION_LABELS[cond] || cond}
          <button onClick={() => removeFilter("conditions", cond)} className="rounded-full transition-colors hover:bg-white/20">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {activeStorage.map(gb => (
        <span key={`storage-${gb}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
          {formatStorageGb(gb)}
          <button onClick={() => removeFilter("storage", String(gb))} className="rounded-full transition-colors hover:bg-white/20">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {(minPrice || maxPrice) && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
          {minPrice && maxPrice
            ? `₹${Number(minPrice) / 100} - ₹${Number(maxPrice) / 100}`
            : minPrice
              ? `Over ₹${Number(minPrice) / 100}`
              : `Under ₹${Number(maxPrice) / 100}`
          }
          <button onClick={removePriceFilter} className="rounded-full transition-colors hover:bg-white/20">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      {onSale && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error px-3 py-1 text-xs font-semibold text-white">
          On Sale
          <button onClick={() => removeFilter("sale")} className="rounded-full transition-colors hover:bg-white/20">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      <button
        onClick={clearAll}
        className="ml-1 text-xs font-bold text-brand transition-opacity hover:opacity-70"
      >
        Clear
      </button>
    </div>
  );
}
