import type { Metadata } from "next";
import Link from "next/link";
import { requireOwner } from "@/server/auth/guards";
import { listBrandInterests } from "@/server/modules/leads";
import { getShop } from "@/server/modules/shop";
import { LeadsList } from "@/components/admin/LeadsList";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function AdminLeadsPage() {
  await requireOwner();
  const [leads, shop] = await Promise.all([listBrandInterests(), getShop()]);

  const total = leads.length;

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Leads</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Buyers who typed the device they want. Message them on WhatsApp when it comes in.
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground/70">
          {total} {total === 1 ? "lead" : "leads"} captured
        </p>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center">
          <span className="text-4xl">🔔</span>
          <h2 className="mt-4 text-lg font-bold text-foreground">No leads yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Buyers can type the device they&apos;re looking for on the browse page and leave their WhatsApp number. Leads will appear here.
          </p>
          <Link
            href="/phones"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground"
          >
            View browse page
          </Link>
        </div>
      ) : (
        <LeadsList
          leads={leads.map((lead) => {
            const msg = `Hi${lead.name ? ` ${lead.name}` : ""}! You asked about "${lead.device}". We now have it in stock at ${shop.name}. Want to see what's available?`;
            return {
              id: lead.id,
              device: lead.device,
              whatsapp: lead.whatsapp,
              name: lead.name,
              createdAt: format(lead.createdAt, "d MMM yyyy, h:mm a"),
              waUrl: `https://wa.me/${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`,
            };
          })}
        />
      )}
    </div>
  );
}
