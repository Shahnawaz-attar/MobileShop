"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaKind } from "@/types";

interface Media {
  id: string;
  url: string;
  alt: string | null;
  kind?: MediaKind;
}

const ROTATION_KINDS: MediaKind[] = ["FRONT", "SIDE", "BACK"];

/** Real-photo spin frames — spec: no AI 3D, only turntable-style photos. */
function getSpinFrames(media: Media[]): Media[] {
  const tagged = media.filter((m) => m.kind && ROTATION_KINDS.includes(m.kind));
  if (tagged.length >= 3) return tagged;
  return media.length >= 3 ? media : [];
}

export function ProductGallery({ media }: { media: Media[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"gallery" | "spin">("gallery");
  const [spinIndex, setSpinIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const spinFrames = useMemo(() => getSpinFrames(media), [media]);
  const canSpin = spinFrames.length >= 3;

  const dragStartX = useRef(0);
  const dragAccum = useRef(0);
  const isDraggingRef = useRef(false);
  const spinIndexRef = useRef(0);

  useEffect(() => {
    spinIndexRef.current = spinIndex;
  }, [spinIndex]);

  const setSpinFrame = useCallback(
    (index: number) => {
      const len = spinFrames.length;
      if (len === 0) return;
      const next = ((index % len) + len) % len;
      spinIndexRef.current = next;
      setSpinIndex(next);
    },
    [spinFrames.length]
  );

  const onSpinPointerDown = (clientX: number) => {
    dragStartX.current = clientX;
    dragAccum.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const onSpinPointerMove = (clientX: number) => {
    if (!isDraggingRef.current || spinFrames.length === 0) return;
    const delta = clientX - dragStartX.current;
    dragStartX.current = clientX;
    dragAccum.current += delta;

    const pixelsPerFrame = 28;
    const len = spinFrames.length;
    while (Math.abs(dragAccum.current) >= pixelsPerFrame) {
      const step = dragAccum.current > 0 ? -1 : 1;
      dragAccum.current += step * pixelsPerFrame;
      spinIndexRef.current = ((spinIndexRef.current + step) % len + len) % len;
      setSpinIndex(spinIndexRef.current);
    }
  };

  const endSpinDrag = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

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

  const mainImage = viewMode === "spin" ? spinFrames[spinIndex] : media[activeIndex];

  return (
    <div className="flex flex-col gap-4">
      {canSpin && (
        <div className="flex rounded-full border border-slate-200/80 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("gallery")}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              viewMode === "gallery"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Photos
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("spin");
              setSpinFrame(0);
            }}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              viewMode === "spin"
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            360° spin
          </button>
        </div>
      )}

      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[2rem] border border-slate-200/50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all",
          viewMode === "spin" && "cursor-grab active:cursor-grabbing",
          viewMode === "spin" && isDragging && "select-none"
        )}
        style={viewMode === "spin" ? { perspective: "1200px" } : undefined}
        onPointerDown={
          viewMode === "spin"
            ? (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                onSpinPointerDown(e.clientX);
              }
            : undefined
        }
        onPointerMove={
          viewMode === "spin" ? (e) => onSpinPointerMove(e.clientX) : undefined
        }
        onPointerUp={viewMode === "spin" ? endSpinDrag : undefined}
        onPointerCancel={viewMode === "spin" ? endSpinDrag : undefined}
        onKeyDown={
          viewMode === "spin"
            ? (e) => {
                if (e.key === "ArrowLeft") setSpinFrame(spinIndex - 1);
                if (e.key === "ArrowRight") setSpinFrame(spinIndex + 1);
              }
            : undefined
        }
        tabIndex={viewMode === "spin" ? 0 : undefined}
        role={viewMode === "spin" ? "slider" : undefined}
        aria-label={
          viewMode === "spin"
            ? `360 degree product view, frame ${spinIndex + 1} of ${spinFrames.length}`
            : undefined
        }
        aria-valuemin={viewMode === "spin" ? 1 : undefined}
        aria-valuemax={viewMode === "spin" ? spinFrames.length : undefined}
        aria-valuenow={viewMode === "spin" ? spinIndex + 1 : undefined}
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-150",
            viewMode === "spin" && !isDragging && "duration-300"
          )}
          style={
            viewMode === "spin"
              ? {
                  transform: `rotateY(${(spinIndex - spinFrames.length / 2) * 2}deg)`,
                }
              : undefined
          }
        >
          <Image
            src={mainImage?.url || ""}
            alt={mainImage?.alt || "Product photo"}
            fill
            draggable={false}
            className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] pointer-events-none"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>

        {viewMode === "spin" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <span className="rounded-full bg-black/70 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Drag to rotate · {spinFrames.length} real photos
            </span>
          </div>
        )}

        {viewMode === "gallery" && media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-slate-900 shadow-[0_8px_20px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all hover:bg-white hover:scale-110 active:scale-95"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>

      {viewMode === "gallery" && media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar">
          {media.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 snap-center overflow-hidden rounded-2xl transition-all cursor-pointer",
                activeIndex === idx
                  ? "border-2 border-slate-900 ring-4 ring-slate-900/10 opacity-100 shadow-md scale-[1.02]"
                  : "border-2 border-transparent opacity-50 hover:opacity-100 bg-slate-50"
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

      {viewMode === "spin" && canSpin && (
        <p className="text-center text-xs font-medium text-slate-500">
          Upload photos in order — front, sides, back — for the smoothest spin.
        </p>
      )}
    </div>
  );
}
