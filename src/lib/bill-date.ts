import { differenceInMonths, format } from "date-fns";

/** Store bill month as 1st of month at noon UTC — avoids day/timezone drift. */
export function normalizeBillMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12, 0, 0));
}

/** Parse `YYYY-MM` from month input or selects. */
export function parseBillMonthInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return normalizeBillMonth(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));
}

/** Format a stored bill month for `<input type="month">` or picker state. */
export function formatBillMonthInput(value: Date | string | null | undefined): string {
  if (!value) return "";

  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";

  const normalized = normalizeBillMonth(d);
  const y = normalized.getUTCFullYear();
  const m = String(normalized.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Display on website — e.g. "Apr 2025" */
export function formatBillMonthLabel(purchasedAt: Date | null): string | null {
  if (!purchasedAt) return null;
  return format(normalizeBillMonth(purchasedAt), "MMM yyyy");
}

/** Human device age from bill month — e.g. "2 years 3 months" */
export function formatBillDeviceAge(purchasedAt: Date | null): string | null {
  if (!purchasedAt) return null;

  const billMonth = normalizeBillMonth(purchasedAt);
  const now = new Date();
  const currentMonth = normalizeBillMonth(now);
  const months = differenceInMonths(currentMonth, billMonth);

  if (months < 0) return null;
  if (months === 0) return "less than 1 month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"}`;
}

export const BILL_MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export function billMonthYearOptions(maxYear = new Date().getFullYear(), span = 30): number[] {
  const start = maxYear - span + 1;
  return Array.from({ length: span }, (_, i) => start + i).reverse();
}
