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

  return (
    <div className="pb-8">
      <style>{`
        @media print {
          aside, nav, header, .no-print { display: none !important; }
          main { padding: 0 !important; }
          @page { size: A5; margin: 12mm; }
        }
      `}</style>

      <div className="no-print mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Shop QR
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Print this for the counter. Customers scan to see today&apos;s stock on {shop.name}.
        </p>
      </div>

      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm print:border-0 print:shadow-none">
        <p className="text-lg font-bold text-foreground">{shop.name}</p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Scan to see today&apos;s stock
        </p>
        <img
          src="/api/qr.png"
          alt={`QR code for ${shop.name}`}
          width={320}
          height={320}
          className="mt-6 h-64 w-64 bg-white p-2 sm:h-80 sm:w-80"
        />
        <p className="mt-4 break-all font-mono text-xs text-muted-foreground">{targetUrl}</p>
      </div>

      <div className="no-print mt-8">
        <QrKitActions targetUrl={targetUrl} />
      </div>
    </div>
  );
}
