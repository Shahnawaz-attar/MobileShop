import type { Metadata } from "next";
import { headers } from "next/headers";
import { getShop } from "@/server/modules/shop";
import { buildShopQrUrl, resolvePublicAppUrl } from "@/lib/qr";
import { QrKitActions } from "@/components/admin/QrKitActions";

export const metadata: Metadata = {
  title: "Shop QR",
};

export default async function AdminQrPage() {
  const shop = await getShop();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const targetUrl = buildShopQrUrl(
    resolvePublicAppUrl(new Request(`${proto}://${host}/`))
  );

  const fullAddress = [shop.addressLine1, shop.addressLine2, shop.city, shop.state, shop.pincode]
    .filter(Boolean)
    .join(", ");
  const openDays = Object.entries((shop.hours ?? {}) as Record<string, unknown>)
    .filter(([, v]) => {
      const s = String(v || "");
      return s.trim() !== "" && !s.includes("Closed") && !s.includes("Holiday");
    })
    .slice(0, 3)
    .map(([day, time]) => `${day.slice(0, 3)} ${String(time)}`);

  return (
    <div className="pb-8">
      <style>{`
        @media print {
          aside, nav, header, .no-print, .qr-preview { display: none !important; }
          main { padding: 0 !important; }
          @page { size: A5 landscape; margin: 8mm; }
          body { background: white !important; }
        }
        .a5-flyer { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `}</style>

      {/* On-screen preview (hidden when printing) */}
      <div className="qr-preview">
        <div className="no-print mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Shop QR</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Print the A5 flyer for your counter. Customers scan to see today&apos;s live stock.
          </p>
        </div>

        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-foreground">{shop.name}</p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Scan to see today&apos;s stock</p>
          <img
            src="/api/qr.png"
            alt={`QR code for ${shop.name}`}
            width={240}
            height={240}
            className="mt-6 h-56 w-56 bg-white p-2"
          />
        </div>

        <div className="no-print mt-8">
          <QrKitActions targetUrl={targetUrl} />
        </div>
      </div>

      {/* Print-only A5 counter flyer */}
      <div className="a5-flyer hidden print:block" aria-hidden>
        <div className="flex h-full w-full flex-col items-center justify-center bg-white text-center text-black">
          <div className="flex items-center justify-center gap-3">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-2xl text-white">📱</span>
            )}
            <div className="text-left">
              <p className="text-2xl font-black leading-none">{shop.name}</p>
              <p className="mt-1 text-xs font-semibold text-black/60">
                {shop.tagline || "Pre-owned phones, honest prices"}
              </p>
            </div>
          </div>

          <p className="mt-6 text-lg font-bold">Scan to see today&apos;s live stock</p>
          <img
            src="/api/qr.png"
            alt=""
            width={260}
            height={260}
            className="mt-3 h-60 w-60 bg-white p-2"
          />
          <p className="mt-2 text-[11px] text-black/50">No app needed · WhatsApp enquiry</p>

          <div className="mt-5 w-full max-w-md border-t border-black/10 pt-3 text-[11px] leading-relaxed text-black/70">
            <p className="font-semibold text-black">{fullAddress}</p>
            {shop.phone && <p>{shop.phone}</p>}
            {openDays.length > 0 && <p>Open {openDays.join(" · ")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
