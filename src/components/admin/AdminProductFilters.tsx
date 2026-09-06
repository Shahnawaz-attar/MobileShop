"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  useCatalogueFilters,
  STORAGE_OPTIONS,
  formatStorageGb,
  type StorageGb,
} from "@/lib/catalogue-filters";
import { CONDITION_LABELS } from "@/lib/constants";
import {
  FilterCheckboxGroup,
  FilterCheckboxRow,
  FilterChipRow,
  FilterChip,
} from "@/components/shared/FilterControls";
import type { Condition } from "@/types";

interface AdminProductFiltersProps {
  brands: { id: string; name: string; slug: string }[];
}

/**
 * Search + filter bar for the admin product list.
 *
 * Shares the same URL-driven filter logic as the public catalogue
 * (useCatalogueFilters), so a filter behaves identically in both places.
 *
 * Responsive behaviour:
 *  - Desktop (lg+): the filter groups expand inline below the search box.
 *  - Mobile: tapping "Filters" opens a full-screen sheet (same UX as the
 *    storefront's mobile filter drawer).
 */
export function AdminProductFilters({ brands }: AdminProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { active, toggleBrand, toggleCondition, toggleStorage, setPriceRange, clearAll, hasActiveFilters } =
    useCatalogueFilters();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minVal, setMinVal] = useState(active.minPrice ? (Number(active.minPrice) / 100).toString() : "");
  const [maxVal, setMaxVal] = useState(active.maxPrice ? (Number(active.maxPrice) / 100).toString() : "");

  const initialRender = useRef(true);

  // Keep search box in sync if q is cleared elsewhere.
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Debounced search navigation (preserves the active tab & filters).
  const runSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");
      params.delete("cursor");
      router.replace(`/admin/products?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    const currentQ = searchParams.get("q") ?? "";
    if (query === currentQ) return;
    const t = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, searchParams, runSearch]);

  const clearSearch = () => {
    setQuery("");
    runSearch("");
  };

  const activeFilterCount =
    active.brands.length +
    active.conditions.length +
    active.storage.length +
    (active.minPrice ? 1 : 0) +
    (active.maxPrice ? 1 : 0);

  /** The four filter groups — shared between the desktop panel & mobile sheet. */
  const renderFilterGroups = () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
      {/* Brands */}
      <FilterCheckboxGroup title="Brand">
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <FilterCheckboxRow
              key={brand.slug}
              label={brand.name}
              checked={active.brands.includes(brand.slug)}
              onToggle={() => toggleBrand(brand.slug)}
            />
          ))}
        </div>
      </FilterCheckboxGroup>

      {/* Condition */}
      <FilterCheckboxGroup title="Condition">
        <div className="space-y-1">
          {(Object.keys(CONDITION_LABELS) as Condition[]).map((key) => (
            <FilterCheckboxRow
              key={key}
              label={CONDITION_LABELS[key]}
              checked={active.conditions.includes(key)}
              onToggle={() => toggleCondition(key)}
            />
          ))}
        </div>
      </FilterCheckboxGroup>

      {/* Storage */}
      <FilterChipRow title="Storage">
        {STORAGE_OPTIONS.map((gb: StorageGb) => (
          <FilterChip
            key={gb}
            label={formatStorageGb(gb)}
            checked={active.storage.includes(gb)}
            onToggle={() => toggleStorage(gb)}
          />
        ))}
      </FilterChipRow>

      {/* Price */}
      <FilterCheckboxGroup title="Price Range (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:outline-none"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Max"
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setPriceRange(minVal, maxVal)}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Apply Price
        </button>
      </FilterCheckboxGroup>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      {/* Search + filter trigger row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, brand, model, specs, notes…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile trigger — opens the sheet */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Desktop trigger — toggles the inline panel */}
        <button
          type="button"
          onClick={() => setDesktopOpen((v) => !v)}
          className="relative hidden h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary lg:inline-flex"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop inline panel */}
      {desktopOpen && (
        <div className="mt-5 hidden border-t border-border pt-5 lg:block">
          {renderFilterGroups()}
          {hasActiveFilters && (
            <div className="mt-6">
              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-semibold text-destructive transition-opacity hover:opacity-70"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile filter bottom sheet (opens from bottom, like ConfirmModal) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Backdrop — tap to close */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-lg animate-in slide-in-from-bottom-full"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            {/* Drag handle */}
            <div className="flex shrink-0 justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 pb-3 pt-2">
              <h2 className="text-lg font-bold text-foreground">Filters</h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-sm font-semibold text-destructive"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close filters"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-border"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {renderFilterGroups()}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

