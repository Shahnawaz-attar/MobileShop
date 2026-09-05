"use client";

interface QrKitActionsProps {
  targetUrl: string;
}

export function QrKitActions({ targetUrl }: QrKitActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href="/api/qr.png"
        download="shop-qr.png"
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Download PNG
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground"
      >
        Print A5 flyer
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(targetUrl);
        }}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground"
      >
        Copy link
      </button>
    </div>
  );
}
