import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/money";
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
  };
  priority?: boolean;
}

export function PublicProductCard({ product, priority = false }: PublicProductCardProps) {
  const discount =
    product.mrpPaise && product.mrpPaise > product.pricePaise
      ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
      : 0;

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
          <div className="flex items-end gap-2">
            <span className="text-xl font-black tracking-tight text-ink sm:text-2xl">
              {formatINR(product.pricePaise)}
            </span>
            {product.mrpPaise && product.mrpPaise > product.pricePaise && (
              <span className="pb-0.5 text-sm font-semibold text-ink-faint line-through">
                {formatINR(product.mrpPaise)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-xs font-bold text-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></svg>
              Save {discount}%
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
