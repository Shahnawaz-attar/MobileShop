import Link from "next/link";
import Image from "next/image";
import { BadgePercent } from "lucide-react";
import { formatINR, discountPercent } from "@/lib/money";
import { CONDITION_LABELS } from "@/lib/constants";
import { ProductEngagement } from "@/components/public/ProductEngagement";
import type { Condition, Availability } from "@/types";

interface PublicProductCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    brandName: string;
    pricePaise: number;
    mrpPaise: number | null;
    condition: Condition;
    availability: Availability;
    isFeatured: boolean;
    publishedAt?: Date | null;
    viewCount?: number;
    primaryImageUrl: string | null;
    primaryImageAlt: string | null;
    storageGb?: number | null;
    ramGb?: number | null;
    /** Active campaign discount applied to this product (if any). */
    discount?: {
      label: string;
      percent: number;
      salePricePaise: number;
      originalPricePaise: number;
    } | null;
  };
  priority?: boolean;
}

export function PublicProductCard({ product, priority = false }: PublicProductCardProps) {
  // MRP strikethrough deal (existing per-product MRP vs price).
  const discount = discountPercent(product.pricePaise, product.mrpPaise);
  // Campaign discount (timed promo) — takes precedence over the plain MRP deal.
  const campaign = product.discount ?? null;

  return (
    <Link
      href={`/phones/${product.slug}`}
      className="device-card device-card-hover group flex h-full flex-col"
    >
      {/* Image Container (Studio Backdrop) */}
      <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06),transparent_65%),linear-gradient(180deg,#fafbfc,#f1f3f6)] p-6 sm:aspect-square sm:p-8">
        {product.primaryImageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={product.primaryImageUrl}
              alt={product.primaryImageAlt || product.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 70vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.18)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center opacity-40 transition-opacity duration-300 group-hover:opacity-70">
            <span className="text-8xl drop-shadow-sm">📱</span>
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-2 sm:left-4 sm:top-4">
          {product.isFeatured && (
            <span className="rounded-full bg-ink px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
              Featured
            </span>
          )}
          {product.availability === "RESERVED" && (
            <span className="rounded-full bg-warning px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
              Reserved
            </span>
          )}
        </div>

        <ProductEngagement
          publishedAt={product.publishedAt ?? null}
          viewCount={product.viewCount ?? 0}
          whatsappClicksWeek={0}
          variant="card"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-widest text-ink-faint">
            {product.brandName}
          </span>
          <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
            {CONDITION_LABELS[product.condition]}
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand sm:text-[17px]">
          {product.title}
        </h3>

        {/* Quick Specs */}
        {(product.storageGb || product.ramGb) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 text-[13px] font-semibold text-ink-soft">
            {product.storageGb && <span>{product.storageGb}GB</span>}
            {product.storageGb && product.ramGb && <span className="text-ink-faint">•</span>}
            {product.ramGb && <span>{product.ramGb}GB RAM</span>}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            {/* Final price — campaign sale price wins over the plain price */}
            <span className={`text-xl font-black tracking-tight sm:text-2xl ${campaign ? "text-error" : "text-ink"}`}>
              {formatINR(campaign ? campaign.salePricePaise : product.pricePaise)}
            </span>

            {/* Campaign strikes through the normal selling price */}
            {campaign && (
              <span className="flex items-center gap-1 pb-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-ink-faint">Usual</span>
                <span className="text-sm font-semibold text-ink-faint line-through">
                  {formatINR(campaign.originalPricePaise)}
                </span>
              </span>
            )}
            {/* MRP always struck if higher than the normal selling price */}
            {!campaign &&
              product.mrpPaise &&
              product.mrpPaise > product.pricePaise && (
                <span className="flex items-center gap-1 pb-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-ink-faint">MRP</span>
                  <span className="text-sm font-semibold text-ink-faint line-through">
                    {formatINR(product.mrpPaise)}
                  </span>
                </span>
              )}
          </div>

          {/* Campaign badge (timed promotion) */}
          {campaign && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-error/10 px-2 py-1 text-xs font-black text-error">
              <BadgePercent className="h-3 w-3" aria-hidden="true" />
              {campaign.percent}% OFF
              <span className="font-bold normal-case">· {campaign.label}</span>
            </div>
          )}
          {/* Plain MRP deal (only when no campaign is overriding) */}
          {!campaign && discount !== null && discount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
              <BadgePercent className="h-3 w-3" aria-hidden="true" />
              Save {discount}%
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
