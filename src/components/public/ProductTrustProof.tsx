import { Calendar, FileCheck, ShieldCheck } from "lucide-react";
import { formatBillMonth, formatDeviceAge } from "@/lib/time-ago";
import { ProductBillViewButton } from "@/components/public/ProductBillViewButton";
import { cn } from "@/lib/utils";

interface ProductTrustProofProps {
  hasBill: boolean;
  purchasedAt: Date | null;
  billUrl?: string | null;
}

function TrustRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof FileCheck;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-100/80 bg-white/80 p-3.5 shadow-[0_2px_12px_rgb(16,185,129,0.06)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold leading-snug text-slate-900">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ProductTrustProof({
  hasBill,
  purchasedAt,
  billUrl,
}: ProductTrustProofProps) {
  if (!hasBill) {
    return null;
  }

  const deviceAge = formatDeviceAge(purchasedAt);
  const billMonth = formatBillMonth(purchasedAt);

  return (
    <section
      className={cn(
        "mt-6 overflow-hidden rounded-2xl border border-emerald-200/80",
        "bg-gradient-to-br from-emerald-50/90 via-white to-white p-4 sm:p-5",
        "shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
      )}
      aria-label="Trust and documentation"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/90">
            Trust &amp; documentation
          </p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 sm:text-sm">
            Owner confirmed original purchase details for this device.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <TrustRow
          icon={FileCheck}
          title="Original bill available"
          subtitle="Ask at the shop or view the uploaded bill below."
        />

        {deviceAge && billMonth ? (
          <TrustRow
            icon={Calendar}
            title={`Device age ~${deviceAge}`}
            subtitle={`Bill month: ${billMonth}`}
          />
        ) : (
          <TrustRow
            icon={Calendar}
            title="Bill month on request"
            subtitle="Contact the shop for purchase date details."
          />
        )}
      </div>

      {billUrl ? (
        <div className="mt-4">
          <ProductBillViewButton billUrl={billUrl} />
        </div>
      ) : null}
    </section>
  );
}
