"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogueFilters } from "./CatalogueFilters";
import { useSearchParams } from "next/navigation";

interface MobileFiltersDrawerProps {
  brands: { id: string; name: string; slug: string }[];
}

export function MobileFiltersDrawer({ brands }: MobileFiltersDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  
  // Count active filters to show a badge
  const activeBrands = searchParams.get("brands")?.split(",").filter(Boolean).length || 0;
  const activeConditions = searchParams.get("conditions")?.split(",").filter(Boolean).length || 0;
  const hasMinPrice = searchParams.has("minPrice") ? 1 : 0;
  const hasMaxPrice = searchParams.has("maxPrice") ? 1 : 0;
  
  const activeFilterCount = activeBrands + activeConditions + hasMinPrice + hasMaxPrice;

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
        className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-slate-200 lg:hidden relative"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white lg:hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <CatalogueFilters brands={brands} />
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full rounded-2xl bg-black px-6 py-4 text-base font-bold text-white transition-transform hover:scale-[1.02] shadow-xl shadow-black/10"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </>
  );
}
