"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogueFilters } from "./CatalogueFilters";
import { useSearchParams } from "next/navigation";

interface MobileFiltersDrawerProps {
  brands: { id: string; name: string; slug: string }[];
  /** True when at least one discount is currently live — only then show "On Sale". */
  hasActiveDiscounts?: boolean;
}

export function MobileFiltersDrawer({ brands, hasActiveDiscounts = false }: MobileFiltersDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  
  // Count active filters to show a badge
  const activeBrands = searchParams.get("brands")?.split(",").filter(Boolean).length || 0;
  const activeConditions = searchParams.get("conditions")?.split(",").filter(Boolean).length || 0;
  const activeStorage = searchParams.get("storage")?.split(",").filter(Boolean).length || 0;
  const hasMinPrice = searchParams.has("minPrice") ? 1 : 0;
  const hasMaxPrice = searchParams.has("maxPrice") ? 1 : 0;
  const onSale = searchParams.get("sale") === "1" ? 1 : 0;

  const activeFilterCount =
    activeBrands + activeConditions + activeStorage + hasMinPrice + hasMaxPrice + onSale;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-surface-hover lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white lg:hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-black text-ink">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-hover text-ink transition-colors hover:bg-border"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <CatalogueFilters brands={brands} hasActiveDiscounts={hasActiveDiscounts} />
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              onClick={() => setIsOpen(false)}
              className="btn-dark w-full !min-h-[52px] !rounded-2xl text-base"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
