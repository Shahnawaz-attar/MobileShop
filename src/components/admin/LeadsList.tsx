"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBrandInterestAction } from "@/server/modules/leads/actions";

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
                <a href={`tel:+${lead.whatsapp}`} className="hover:underline">
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
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-xs font-bold text-foreground"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(lead.id)}
                  className="inline-flex min-h-10 items-center rounded-xl border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
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
