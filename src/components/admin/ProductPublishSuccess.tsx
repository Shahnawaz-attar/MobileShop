"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Plus, X } from "lucide-react";
import { buildWhatsAppShareLink, generateProductShareText } from "@/lib/whatsapp";
import { CONDITION_LABELS } from "@/lib/constants";
import type { Condition } from "@/types";

/** Official WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

interface ProductPublishSuccessProps {
  slug: string;
  title: string;
  pricePaise: number;
  storageGb: number | null;
  colour: string | null;
  condition: Condition;
  shopName: string;
  publicAppUrl: string;
  onDismiss: () => void;
}

export function ProductPublishSuccess({
  slug,
  title,
  pricePaise,
  storageGb,
  colour,
  condition,
  shopName,
  publicAppUrl,
  onDismiss,
}: ProductPublishSuccessProps) {
  const [copied, setCopied] = useState(false);
  const productUrl = `${publicAppUrl}/phones/${slug}`;
  const shareText = generateProductShareText(
    { title, storageGb, colour, pricePaise, condition: CONDITION_LABELS[condition] },
    productUrl,
    shopName
  );
  const shareUrl = buildWhatsAppShareLink(shareText);

  return (
    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 sm:p-6">
      <p className="text-lg font-extrabold text-foreground">Published — it&apos;s live on your shop</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Share it on WhatsApp Status or send to your groups now.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(productUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-success" />
          ) : (
            <Copy className="h-4 w-4 shrink-0" />
          )}
          {copied ? "Link copied" : "Copy link"}
        </button>
        <Link
          href={`/phones/${slug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View on site
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Add another
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
      >
        <X className="h-3.5 w-3.5" />
        Dismiss
      </button>
    </div>
  );
}
