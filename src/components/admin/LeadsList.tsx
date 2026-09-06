"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Phone } from "lucide-react";
import { deleteBrandInterestAction } from "@/server/modules/leads/actions";

/** Official WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

interface LeadRow {
  id: string;
  device: string;
  whatsapp: string;
  name: string | null;
  createdAt: string;
  waUrl: string;
}

interface LeadsListProps {
  leads: LeadRow[];
}

export function LeadsList({ leads }: LeadsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteBrandInterestAction(id);
      if (res.success) {
        setConfirmId(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <ul className="divide-y divide-border/70">
        {leads.map((lead) => (
          <li key={lead.id} className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                  {lead.device}
                </span>
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-foreground">
                {lead.name || "+" + lead.whatsapp}
              </p>
              <p className="text-xs text-muted-foreground">
                <a href={`tel:+${lead.whatsapp}`} className="inline-flex items-center gap-1 hover:underline">
                  <Phone className="h-3 w-3" aria-hidden="true" />
                  +{lead.whatsapp}
                </a>
                {" · "}
                {lead.createdAt}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={lead.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              {confirmId === lead.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => remove(lead.id)}
                    className="inline-flex min-h-10 items-center rounded-xl bg-destructive px-3 text-xs font-bold text-white disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-xs font-bold text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(lead.id)}
                  className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
