"use client";

import { useState, useTransition } from "react";
import { trackEventAction } from "@/server/modules/analytics/actions";

interface ProductShareBarProps {
  productId: string;
  productUrl: string;
  whatsappUrl: string;
  shareWhatsappUrl: string;
  statusImageUrl?: string;
}

export function ProductShareBar({
  productId,
  productUrl,
  whatsappUrl,
  shareWhatsappUrl,
  statusImageUrl,
}: ProductShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function trackShare() {
    startTransition(() => {
      void trackEventAction({ type: "SHARE_CLICK", productId });
    });
  }

  async function copyLink() {
    trackShare();
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <a
        href={whatsappUrl}
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => {
            void trackEventAction({ type: "WHATSAPP_CLICK", productId });
          });
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
      >
        Enquire on WhatsApp
      </a>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a
          href={shareWhatsappUrl}
          onClick={(e) => {
            e.preventDefault();
            trackShare();
            window.open(shareWhatsappUrl, "_blank", "noopener,noreferrer");
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          Share listing
        </a>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        {statusImageUrl && (
          <a
            href={statusImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackShare}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-black sm:col-span-1 col-span-2"
          >
            Status card
          </a>
        )}
      </div>
    </div>
  );
}
