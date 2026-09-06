"use client";

import { useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Condition } from "@/types";

/**
 * Catalogue filter helpers + hook.
 *
 * Shared between the public storefront (/phones) and the admin product list
 * (/admin/products). Both pages drive their filters from the same URL search
 * params (brands, conditions, storage, minPrice, maxPrice) so a single hook
 * keeps the behaviour identical and each page only owns its own layout.
 */

/** Storage sizes offered as filter chips (values present in the live DB). */
export const STORAGE_OPTIONS = [64, 128, 256, 512, 1024] as const;

export type StorageGb = (typeof STORAGE_OPTIONS)[number];

/** Format a storage number for display (e.g. 1024 → "1TB", 512 → "512GB"). */
export function formatStorageGb(gb: number): string {
  return gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;
}

/** Turn a comma-separated URL param into an array of numbers. */
export function parseStorageParam(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v > 0);
}

/**
 * Toggle a value inside a comma-separated URL array param and navigate.
 * Shared by brand / condition / storage chip groups.
 */
export function toggleArrayParam(searchParams: URLSearchParams, name: string, value: string): URLSearchParams {
  const params = new URLSearchParams(searchParams.toString());
  const currentStr = params.get(name);
  const current = currentStr ? currentStr.split(",") : [];

  if (current.includes(value)) {
    const next = current.filter((v) => v !== value);
    if (next.length > 0) params.set(name, next.join(","));
    else params.delete(name);
  } else {
    current.push(value);
    params.set(name, current.join(","));
  }
  return params;
}

/** Current active selections derived from the URL search params. */
export interface ActiveFilterState {
  brands: string[];
  conditions: Condition[];
  storage: number[];
  minPrice: string;
  maxPrice: string;
}

export interface CatalogueFilterHook {
  /** Active selections from the URL (read-only). */
  active: ActiveFilterState;
  /** Toggle a brand by slug. */
  toggleBrand: (slug: string) => void;
  /** Toggle a condition key. */
  toggleCondition: (condition: Condition) => void;
  /** Toggle a storage size (GB). */
  toggleStorage: (gb: number) => void;
  /** Set the price range (values in rupees, not paise). Empty string clears. */
  setPriceRange: (min: string, max: string) => void;
  /** Remove every filter (keeps q, tab, sort, etc.). */
  clearAll: () => void;
  /** True when any brand/condition/storage/price filter is active. */
  hasActiveFilters: boolean;
}

/**
 * Single source of truth for catalogue filtering across public + admin pages.
 * Reads + writes the same URL params the server-side services parse.
 */
export function useCatalogueFilters(): CatalogueFilterHook {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = useMemo<ActiveFilterState>(() => {
    const brands = searchParams.get("brands")?.split(",").filter(Boolean) ?? [];
    const conditions = (searchParams.get("conditions")?.split(",").filter(Boolean) ?? []) as Condition[];
    const storage = parseStorageParam(searchParams.get("storage"));
    const minPrice = searchParams.get("minPrice") ?? "";
    const maxPrice = searchParams.get("maxPrice") ?? "";
    return { brands, conditions, storage, minPrice, maxPrice };
  }, [searchParams]);

  /** Push a fresh URLSearchParams, preserving unrelated params (q, tab, sort). */
  const push = useCallback(
    (params: URLSearchParams) => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router]
  );

  const toggleBrand = useCallback(
    (slug: string) => {
      push(toggleArrayParam(searchParams, "brands", slug));
    },
    [push, searchParams]
  );

  const toggleCondition = useCallback(
    (condition: Condition) => {
      push(toggleArrayParam(searchParams, "conditions", condition));
    },
    [push, searchParams]
  );

  const toggleStorage = useCallback(
    (gb: number) => {
      push(toggleArrayParam(searchParams, "storage", String(gb)));
    },
    [push, searchParams]
  );

  const setPriceRange = useCallback(
    (min: string, max: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (min) params.set("minPrice", String(Number(min) * 100));
      else params.delete("minPrice");
      if (max) params.set("maxPrice", String(Number(max) * 100));
      else params.delete("maxPrice");
      push(params);
    },
    [push, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brands");
    params.delete("conditions");
    params.delete("storage");
    params.delete("minPrice");
    params.delete("maxPrice");
    push(params);
  }, [push, searchParams]);

  const hasActiveFilters =
    active.brands.length > 0 ||
    active.conditions.length > 0 ||
    active.storage.length > 0 ||
    Boolean(active.minPrice) ||
    Boolean(active.maxPrice);

  return {
    active,
    toggleBrand,
    toggleCondition,
    toggleStorage,
    setPriceRange,
    clearAll,
    hasActiveFilters,
  };
}
