"use client";

import { useRef, useState } from "react";
import { toPng, toBlob } from "html-to-image";
import { Download, Share2, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { CONDITION_LABELS } from "@/lib/constants";

interface StatusPosterProduct {
  title: string;
  storageGb?: number | null;
  ramGb?: number | null;
  colour?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  condition: string;
  primaryImageUrl: string | null;
  primaryImageAlt?: string | null;
  slug: string;
}

interface StatusPosterShop {
  name: string;
  logoUrl: string | null;
  city: string;
  addressLine1?: string;
  whatsapp?: string;
}

interface WhatsAppStatusGeneratorProps {
  product: StatusPosterProduct;
  shop: StatusPosterShop;
  productUrl: string;
}

/**
 * "Create WhatsApp Status" — renders a 9:16 (1080×1920) poster in the DOM
 * and exports it to PNG client-side (html-to-image, zero server CPU).
 * Supports Download + native Web Share (files) for one-tap WhatsApp Status.
 */
export function WhatsAppStatusGenerator({
  product,
  shop,
  productUrl,
}: WhatsAppStatusGeneratorProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storageLabel = [product.storageGb ? `${product.storageGb}GB` : null, product.ramGb ? `${product.ramGb}GB RAM` : null, product.colour].filter(Boolean).join(" • ");
  const discount =
    product.mrpPaise && product.mrpPaise > product.pricePaise
      ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
      : 0;
  const conditionLabel = CONDITION_LABELS[product.condition as keyof typeof CONDITION_LABELS] ?? product.condition;

  async function renderPoster(): Promise<Blob | null> {
    const node = posterRef.current;
    if (!node) return null;
    // Poster is laid out at 360x640; export at 3x → 1080x1920
    return await toBlob(node, { pixelRatio: 3, cacheBust: true });
  }

  async function handleDownload() {
    const node = posterRef.current;
    if (!node) return;
    setBusy("download");
    setError(null);
    try {
      const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-status.png`;
      a.click();
    } catch {
      setError("Could not generate image. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    setError(null);
    try {
      const blob = await renderPoster();
      if (!blob) throw new Error("no blob");
      const file = new File([blob], "status.png", { type: "image/png" });
      const shareData = {
        files: [file],
        title: product.title,
        text: `${product.title} — ${formatINR(product.pricePaise)} at ${shop.name}. Check it: ${productUrl}`,
      };
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: download
        const dataUrl = await toPng(posterRef.current!, { pixelRatio: 3, cacheBust: true });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "status.png";
        a.click();
      }
    } catch (err) {
      // User cancelled the share sheet — not an error
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Could not share. Try Download instead.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">WhatsApp Status poster</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate a 9:16 image to post on your WhatsApp Status today.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={busy !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy === "download" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {busy === "download" ? "Generating…" : "Download poster"}
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={busy !== null}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 text-sm font-semibold text-[#128C4A] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy === "share" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="h-4 w-4" aria-hidden="true" />
          )}
          {busy === "share" ? "Preparing…" : "Share to Status"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {/* Hidden poster — laid out at 360x640, exported at 3x */}
      <div className="pointer-events-none fixed -left-[10000px] top-0">
        <div
          ref={posterRef}
          style={{ width: 360, height: 640 }}
          className="relative flex flex-col overflow-hidden bg-[#0a0a0a] font-sans text-white"
        >
          {/* Top brand bar */}
          <div className="flex items-center gap-2 px-5 pt-5">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="" className="h-8 w-8 rounded-xl object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-sm">📱</span>
            )}
            <span className="truncate text-sm font-black tracking-tight">{shop.name}</span>
          </div>

          {/* Photo */}
          <div className="mx-5 mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-3">
            {product.primaryImageUrl ? (
              <img
                src={product.primaryImageUrl}
                alt=""
                className="max-h-full max-w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
              />
            ) : (
              <span className="text-6xl">📱</span>
            )}
          </div>

          {/* Details */}
          <div className="px-5 pb-5 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              {storageLabel || "Pre-owned"}
            </p>
            <h4 className="mt-1 text-xl font-black leading-tight">{product.title}</h4>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-black tracking-tight text-[#25D366]">
                {formatINR(product.pricePaise)}
              </span>
              {discount > 0 && (
                <span className="pb-1 text-sm text-white/50 line-through">
                  {formatINR(product.mrpPaise!)}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#25D366]/15 px-2.5 py-1 text-[11px] font-bold text-[#25D366]">
                {conditionLabel}
              </span>
              {discount > 0 && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80">
                  {discount}% off MRP
                </span>
              )}
            </div>

            {/* CTA banner */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <div className="text-black">
                <p className="text-sm font-black leading-tight">DM / Visit today</p>
                <p className="text-[10px] font-medium text-black/60">
                  {shop.addressLine1 ? `${shop.addressLine1}, ` : ""}{shop.city}
                </p>
              </div>
              <span className="rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-black text-black">
                WhatsApp
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
