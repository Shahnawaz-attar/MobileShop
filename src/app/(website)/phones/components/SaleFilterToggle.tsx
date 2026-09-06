"use client";

import { BadgePercent, X } from "lucide-react";
import { useCatalogueFilters } from "@/lib/catalogue-filters";

/**
 * Prominent "On Sale" quick filter for the browse page. Toggles ?sale=1 so only
 * products that currently carry an active campaign discount are shown.
 */
export function SaleFilterToggle() {
  const { active, toggleSale } = useCatalogueFilters();
  const isOn = active.onSale;

  return (
    <button
      type="button"
      onClick={toggleSale}
      aria-pressed={isOn}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-all ${
        isOn
          ? "border-error bg-error text-white shadow-md"
          : "border-error/40 bg-error/5 text-error hover:bg-error/10"
      }`}
    >
      <BadgePercent className="h-4 w-4 shrink-0" />
      On Sale
      {isOn && <X className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  );
}
