import { Eye, MessageCircle, Clock } from "lucide-react";
import { formatListedAgo, formatPublishedDate, isFreshListing, plural } from "@/lib/time-ago";

interface ProductEngagementProps {
  publishedAt: Date | null;
  viewCount: number;
  whatsappClicksWeek: number;
  variant?: "detail" | "card";
}

export function ProductEngagement({
  publishedAt,
  viewCount,
  whatsappClicksWeek,
  variant = "detail",
}: ProductEngagementProps) {
  const listedAgo = formatListedAgo(publishedAt);
  const publishedDate = formatPublishedDate(publishedAt);
  const fresh = isFreshListing(publishedAt);

  if (variant === "card") {
    if (!fresh && viewCount <= 0) return null;
    return (
      <div className="absolute left-5 bottom-5 right-5 flex flex-wrap gap-1.5 pointer-events-none">
        {fresh && (
          <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
            Just listed
          </span>
        )}
        {viewCount > 0 && (
          <span className="rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {viewCount} {plural(viewCount, "view")}
          </span>
        )}
      </div>
    );
  }

  if (!publishedAt && viewCount === 0 && whatsappClicksWeek === 0) {
    return null;
  }

  return (
    <div className="device-card relative mt-6 p-4">
      {fresh && (
        <span className="absolute right-4 top-4 rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-warning">
          Fresh
        </span>
      )}
      <p className="mb-3 pr-16 text-[10px] font-black uppercase tracking-widest text-ink-faint">
        Live interest
      </p>
      <ul className="space-y-2">
        {publishedDate && (
          <li className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
              Listed {publishedDate}
            </span>
            {listedAgo ? <span className="ml-2 font-medium text-ink-soft">{listedAgo}</span> : null}
          </li>
        )}
        {viewCount > 0 ? (
          <li className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Eye className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            {viewCount} {plural(viewCount, "person")} viewed this listing
          </li>
        ) : fresh ? (
          <li className="flex items-center gap-2 text-sm font-medium text-ink-soft">
            <Eye className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            Be the first to view — enquire before it sells
          </li>
        ) : null}
        {whatsappClicksWeek > 0 && (
          <li className="flex items-center gap-2 text-sm font-semibold text-ink">
            <MessageCircle className="h-4 w-4 shrink-0 text-whatsapp" aria-hidden />
            {whatsappClicksWeek} WhatsApp {plural(whatsappClicksWeek, "enquiry")} this week
          </li>
        )}
      </ul>
    </div>
  );
}
