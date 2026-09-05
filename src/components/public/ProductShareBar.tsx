"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/track-event";

interface ProductShareBarProps {
  productId: string;
  productUrl: string;
  whatsappUrl: string;
  shareWhatsappUrl: string;
  statusImageUrl?: string;
  /** Mobile: split sticky WhatsApp vs in-page share actions */
  mode?: "all" | "whatsapp-only" | "secondary-only";
}

export function ProductShareBar({
  productId,
  productUrl,
  whatsappUrl,
  shareWhatsappUrl,
  statusImageUrl,
  mode = "all",
}: ProductShareBarProps) {
  const [copied, setCopied] = useState(false);

  function trackShare() {
    trackEvent({ type: "SHARE_CLICK", productId });
  }

  async function copyLink() {
    trackShare();
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const showWhatsApp = mode === "all" || mode === "whatsapp-only";
  const showSecondary = mode === "all" || mode === "secondary-only";

  return (
    <div className="flex flex-col gap-3">
      {showWhatsApp && (
        <a
          href={whatsappUrl}
            onClick={(e) => {
              e.preventDefault();
              trackEvent({ type: "WHATSAPP_CLICK", productId });
              window.open(whatsappUrl, "_blank", "noopener,noreferrer");
            }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          Enquire on WhatsApp
        </a>
      )}
      {showSecondary && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <a
            href={shareWhatsappUrl}
            onClick={(e) => {
              e.preventDefault();
              trackShare();
              window.open(shareWhatsappUrl, "_blank", "noopener,noreferrer");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-3 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-surface-hover"
          >
            Share listing
          </a>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-white px-3 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-surface-hover"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          {statusImageUrl && (
            <a
              href={statusImageUrl}
              download={`${productUrl.split("/").pop() ?? "listing"}-status.png`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackShare}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-ink bg-ink px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-black sm:col-span-1 col-span-2"
            >
              Status card
            </a>
          )}
        </div>
      )}
    </div>
  );
}
