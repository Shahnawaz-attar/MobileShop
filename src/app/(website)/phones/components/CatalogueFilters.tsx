"use client";

import { useState } from "react";
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

interface CatalogueFiltersProps {
  brands: { id: string; name: string; slug: string }[];
}

export function CatalogueFilters({ brands }: CatalogueFiltersProps) {
  const { active, toggleBrand, toggleCondition, toggleStorage, setPriceRange } =
    useCatalogueFilters();

  // Price inputs are local state; they only navigate on "Apply".
  const [minVal, setMinVal] = useState(
    active.minPrice ? (Number(active.minPrice) / 100).toString() : ""
  );
  const [maxVal, setMaxVal] = useState(
    active.maxPrice ? (Number(active.maxPrice) / 100).toString() : ""
  );

  return (
    <div className="space-y-8">
      {/* Brands */}
      <FilterCheckboxGroup title="Brands">
        <div className="space-y-1">
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

      <div className="h-px w-full bg-border" />

      {/* Condition */}
      <FilterCheckboxGroup title="Condition">
        <div className="space-y-1">
          {(Object.entries(CONDITION_LABELS) as [Condition, string][]).map(([key, label]) => (
            <FilterCheckboxRow
              key={key}
              label={label}
              checked={active.conditions.includes(key)}
              onToggle={() => toggleCondition(key)}
            />
          ))}
        </div>
      </FilterCheckboxGroup>

      <div className="h-px w-full bg-border" />

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

      <div className="h-px w-full bg-border" />

      {/* Price */}
      <FilterCheckboxGroup title="Price Range (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none focus-visible:outline-none"
          />
          <span className="text-ink-faint">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none focus-visible:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setPriceRange(minVal, maxVal)}
          className="btn-dark mt-3 w-full !min-h-0 !px-4 py-2.5 text-sm"
        >
          Apply Price
        </button>
      </FilterCheckboxGroup>
    </div>
  );
}

