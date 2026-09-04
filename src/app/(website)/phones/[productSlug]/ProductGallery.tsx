"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Media {
  id: string;
  url: string;
  alt: string | null;
}

export function ProductGallery({ media }: { media: Media[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
        <div className="text-center text-slate-400">
          <span className="text-4xl" aria-hidden="true">📱</span>
          <p className="mt-2 text-sm font-medium">No photos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image View */}
      <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] border border-slate-200/50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all">
        <Image
          src={media[activeIndex]?.url || ""}
          alt={media[activeIndex]?.alt || "Product photo"}
          fill
          className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
        
        {/* Navigation Arrows for Desktop */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
          {media.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 snap-center overflow-hidden rounded-2xl transition-all cursor-pointer",
                activeIndex === idx ? "border-2 border-slate-900 ring-4 ring-slate-900/10 opacity-100 shadow-md scale-[1.02]" : "border-2 border-transparent opacity-50 hover:opacity-100 bg-slate-50"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
