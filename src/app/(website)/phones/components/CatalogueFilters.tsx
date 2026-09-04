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
        <h3 className="text-sm font-bold text-slate-900 mb-4">Brands</h3>
        <div className="space-y-3">
          {brands.map((brand) => (
            <label key={brand.slug} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded border border-slate-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                  checked={activeBrands.includes(brand.slug)}
                  onChange={() => {
                    router.push(pathname + "?" + toggleArrayParam("brands", brand.slug));
                  }}
                />
                <svg
                  className="absolute h-3.5 w-3.5 pointer-events-none stroke-white opacity-0 peer-checked:opacity-100 transition-opacity"
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
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* Condition */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Condition</h3>
        <div className="space-y-3">
          {(Object.entries(CONDITION_LABELS) as [Condition, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded border border-slate-300 bg-white checked:border-blue-600 checked:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
                  checked={activeConditions.includes(key)}
                  onChange={() => {
                    router.push(pathname + "?" + toggleArrayParam("conditions", key));
                  }}
                />
                <svg
                  className="absolute h-3.5 w-3.5 pointer-events-none stroke-white opacity-0 peer-checked:opacity-100 transition-opacity"
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
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* Price */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Price Range (₹)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
          <span className="text-slate-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-3 w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition-colors"
        >
          Apply Price
        </button>
      </div>
    </div>
  );
}
