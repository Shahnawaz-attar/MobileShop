import { differenceInHours, differenceInMonths, format, formatDistanceToNow } from "date-fns";

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

/** Listed within the last 3 days — show "Fresh" urgency. */
export function isFreshListing(publishedAt: Date | null): boolean {
  if (!publishedAt) return false;
  return differenceInHours(new Date(), publishedAt) < 72;
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
  if (!purchasedAt) return null;
  return format(purchasedAt, "MMM yyyy");
}

/** Human device age from original bill date — e.g. "2 years 3 months" */
export function formatDeviceAge(purchasedAt: Date | null): string | null {
  if (!purchasedAt) return null;
  const months = differenceInMonths(new Date(), purchasedAt);
  if (months < 0) return null;
  if (months === 0) return "less than 1 month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"}`;
}
