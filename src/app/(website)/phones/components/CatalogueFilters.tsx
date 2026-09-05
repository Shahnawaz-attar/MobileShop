"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CONDITION_LABELS } from "@/lib/constants";
import type { Condition } from "@/types";

interface CatalogueFiltersProps {
  brands: { id: string; name: string; slug: string }[];
}

export function CatalogueFilters({ brands }: CatalogueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleArrayParam = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const currentStr = params.get(name);
      const current = currentStr ? currentStr.split(",") : [];
      
      if (current.includes(value)) {
        const next = current.filter((v) => v !== value);
        if (next.length > 0) {
          params.set(name, next.join(","));
        } else {
          params.delete(name);
        }
      } else {
        current.push(value);
        params.set(name, current.join(","));
      }
      return params.toString();
    },
    [searchParams]
  );

  const activeBrands = searchParams.get("brands")?.split(",") || [];
  const activeConditions = (searchParams.get("conditions")?.split(",") || []) as Condition[];

  // Price state
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const [minVal, setMinVal] = useState(minPrice ? (Number(minPrice) / 100).toString() : "");
  const [maxVal, setMaxVal] = useState(maxPrice ? (Number(maxPrice) / 100).toString() : "");

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minVal) params.set("minPrice", (Number(minVal) * 100).toString());
    else params.delete("minPrice");
    
    if (maxVal) params.set("maxPrice", (Number(maxVal) * 100).toString());
    else params.delete("maxPrice");

    router.push(pathname + "?" + params.toString());
  };

  return (
    <div className="space-y-8">
      {/* Brands */}
      <div>
        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-ink">Brands</h3>
        <div className="space-y-1">
          {brands.map((brand) => (
            <label key={brand.slug} className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-hover">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded-md border border-border-strong bg-white transition-all checked:border-ink checked:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                  checked={activeBrands.includes(brand.slug)}
                  onChange={() => {
                    router.push(pathname + "?" + toggleArrayParam("brands", brand.slug));
                  }}
                />
                <svg
                  className="pointer-events-none absolute h-3.5 w-3.5 stroke-white opacity-0 transition-opacity peer-checked:opacity-100"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-ink-soft transition-colors group-hover:text-ink">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Condition */}
      <div>
        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-ink">Condition</h3>
        <div className="space-y-1">
          {(Object.entries(CONDITION_LABELS) as [Condition, string][]).map(([key, label]) => (
            <label key={key} className="group flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-hover">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded-md border border-border-strong bg-white transition-all checked:border-ink checked:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                  checked={activeConditions.includes(key)}
                  onChange={() => {
                    router.push(pathname + "?" + toggleArrayParam("conditions", key));
                  }}
                />
                <svg
                  className="pointer-events-none absolute h-3.5 w-3.5 stroke-white opacity-0 transition-opacity peer-checked:opacity-100"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-ink-soft transition-colors group-hover:text-ink">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Price */}
      <div>
        <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-ink">Price Range (₹)</h3>
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
          onClick={handlePriceApply}
          className="btn-dark mt-3 w-full !min-h-0 !px-4 py-2.5 text-sm"
        >
          Apply Price
        </button>
      </div>
    </div>
  );
}
