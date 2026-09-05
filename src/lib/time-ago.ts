import { differenceInHours, format, formatDistanceToNow } from "date-fns";

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
