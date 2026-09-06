import { differenceInHours, format, formatDistanceToNow } from "date-fns";
import { formatBillDeviceAge, formatBillMonthLabel } from "@/lib/bill-date";

/** e.g. "5 Sep 2026" */
export function formatPublishedDate(publishedAt: Date | null): string | null {
  if (!publishedAt) return null;
  return format(publishedAt, "d MMM yyyy");
}

/** e.g. "about 2 hours ago" */
export function formatListedAgo(publishedAt: Date | null): string | null {
  if (!publishedAt) return null;
  return formatDistanceToNow(publishedAt, { addSuffix: true });
}

/** Listed within the last 7 days — show "Fresh" urgency. */
export function isFreshListing(publishedAt: Date | null): boolean {
  if (!publishedAt) return false;
  return differenceInHours(new Date(), publishedAt) < 24 * 7;
}

export function plural(count: number, singular: string, pluralForm?: string) {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/** HTML date input value — safe for RSC props (Date or ISO string). */
export function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/** Bill / purchase month for trust display — e.g. "Sep 2023" */
export function formatBillMonth(purchasedAt: Date | null): string | null {
  return formatBillMonthLabel(purchasedAt);
}

/** Human device age from original bill date — e.g. "2 years 3 months" */
export function formatDeviceAge(purchasedAt: Date | null): string | null {
  return formatBillDeviceAge(purchasedAt);
}
