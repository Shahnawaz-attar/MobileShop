"use client";

import { useState } from "react";
import Link from "next/link";
import { buildWhatsAppShareLink, generateProductShareText } from "@/lib/whatsapp";
import { CONDITION_LABELS } from "@/lib/constants";
import type { Condition } from "@/types";

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
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white"
        >
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(productUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
        <Link
          href={`/phones/${slug}`}
          target="_blank"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          View on site
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          Add another
        </Link>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
      >
        Dismiss
      </button>
    </div>
  );
}
