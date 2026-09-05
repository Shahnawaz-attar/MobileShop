import { Calendar, FileCheck } from "lucide-react";
import { formatBillMonth, formatDeviceAge } from "@/lib/time-ago";
import type { DeviceType } from "@/types";

interface ProductTrustProofProps {
  deviceType: DeviceType;
  hasBill: boolean;
  purchasedAt: Date | null;
}

export function ProductTrustProof({ deviceType, hasBill, purchasedAt }: ProductTrustProofProps) {
  if (!hasBill || (deviceType !== "PHONE" && deviceType !== "TABLET")) {
    return null;
  }

  const deviceAge = formatDeviceAge(purchasedAt);
  const billMonth = formatBillMonth(purchasedAt);

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80 mb-3">
        Trust &amp; documentation
      </p>
      <ul className="space-y-2">
        <li className="flex items-start gap-2 text-sm font-semibold text-slate-800">
          <FileCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          Original purchase bill available at shop
        </li>
        {deviceAge && billMonth ? (
          <li className="flex items-start gap-2 text-sm font-semibold text-slate-800">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Device age ~{deviceAge}
            <span className="font-medium text-slate-500">(bill dated {billMonth})</span>
          </li>
        ) : (
          <li className="flex items-start gap-2 text-sm font-medium text-slate-600">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Ask the shop for bill date and device age details
          </li>
        )}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Shown only when the owner confirms an original bill. Useful for second-hand phones and tablets.
      </p>
    </div>
  );
}
