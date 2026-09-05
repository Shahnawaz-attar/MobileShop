"use client";

import { useState, useTransition } from "react";
import { createBrandInterestAction } from "@/server/modules/leads/actions";
import { cn } from "@/lib/utils";

/**
 * "Notify me when this device arrives" — buyer types the device they want
 * (free text) + drops their WhatsApp number. The owner messages them when
 * that device comes in stock.
 */
export function BrandInterestForm() {
  const [device, setDevice] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!device.trim()) {
      setMessage({ type: "err", text: "Tell us which device you're looking for." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await createBrandInterestAction({
        device,
        whatsapp,
        name: name || null,
      });
      if (result.success) {
        setMessage({
          type: "ok",
          text: `Got it! We'll message you on WhatsApp when ${device.trim()} arrives.`,
        });
        setDevice("");
        setWhatsapp("");
        setName("");
      } else {
        setMessage({ type: "err", text: result.error });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔔</span>
        <h3 className="text-sm font-bold text-ink">Looking for a specific device?</h3>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        Tell us what you want and drop your WhatsApp number — we&apos;ll message you when it arrives.
      </p>

      {/* Device (free text) */}
      <label className="mt-4 block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
          Which device?
        </span>
        <input
          type="text"
          value={device}
          onChange={(e) => setDevice(e.target.value)}
          placeholder="e.g. iPhone 15 Pro or Samsung Galaxy S24"
          className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none"
        />
      </label>

      {/* Contact */}
      <label className="mt-3 block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
          Your WhatsApp number
        </span>
        <input
          type="tel"
          inputMode="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. 98765 43210"
          className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none"
        />
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name (optional)"
        className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-border-strong focus:outline-none"
      />

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="btn-dark mt-3 w-full !min-h-0 py-2.5 text-sm disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Notify me on WhatsApp"}
      </button>

      {message && (
        <p
          className={cn(
            "mt-3 text-xs font-semibold",
            message.type === "ok" ? "text-success" : "text-error"
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
