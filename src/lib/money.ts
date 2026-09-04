/**
 * Money utilities — all money is stored as integer paise in the database.
 * NEVER use floating point for money calculations.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format paise as Indian Rupees (e.g., 3299900 → "₹32,999").
 * Always pass integer paise from the database.
 */
export function formatINR(paise: number): string {
  return INR_FORMATTER.format(paise / 100);
}

/**
 * Convert rupees to paise for database storage.
 * Input: 32999 → Output: 3299900
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Calculate discount percentage from selling price and MRP.
 * Returns null if MRP is missing or discount is below 5% (not worth showing).
 * Discount is always DERIVED, never stored.
 */
export function discountPercent(pricePaise: number, mrpPaise?: number | null): number | null {
  if (!mrpPaise || mrpPaise <= pricePaise) {
    return null;
  }

  const discount = Math.round(((mrpPaise - pricePaise) / mrpPaise) * 100);

  // Only show discount if >= 5% (avoid trivial "1% off" noise)
  if (discount < 5) {
    return null;
  }

  return discount;
}
