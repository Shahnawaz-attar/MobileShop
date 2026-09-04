import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/money";
import { CONDITION_LABELS } from "@/lib/constants";
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
    <Link href={`/phones/${product.slug}`} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:border-slate-300/50">
      
      {/* Image Container (Studio Backdrop) */}
      <div className="relative flex aspect-[4/5] sm:aspect-square w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white p-6 sm:p-8">
        {product.primaryImageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={product.primaryImageUrl}
              alt={product.primaryImageAlt || product.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-200 opacity-50 transition-opacity duration-300 group-hover:opacity-100">
            <span className="text-9xl drop-shadow-sm">📱</span>
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute left-5 top-5 flex flex-col gap-2">
          {product.isFeatured && (
            <span className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20">
              Featured
            </span>
          )}
          {product.availability === "RESERVED" && (
            <span className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
              Reserved
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {product.brandName}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            {CONDITION_LABELS[product.condition]}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 line-clamp-2 transition-colors group-hover:text-blue-600 leading-tight">
          {product.title}
        </h3>

        {/* Quick Specs */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] font-semibold text-slate-500">
          {product.storageGb && <span>{product.storageGb}GB</span>}
          {product.storageGb && product.ramGb && <span className="text-slate-300">•</span>}
          {product.ramGb && <span>{product.ramGb}GB RAM</span>}
        </div>

        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatINR(product.pricePaise)}
            </span>
            {product.mrpPaise && product.mrpPaise > product.pricePaise && (
              <span className="text-sm font-semibold text-slate-400 line-through">
                {formatINR(product.mrpPaise)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              Save {discount}%
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
