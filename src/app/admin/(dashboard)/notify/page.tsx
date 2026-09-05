import type { Metadata } from "next";
import { getNotifySummary } from "@/server/modules/notify";
import { NotifyBroadcastForm } from "@/components/admin/NotifyBroadcastForm";

export const metadata: Metadata = { title: "Stock alerts" };
export const dynamic = "force-dynamic";

export default async function AdminNotifyPage() {
  const summary = await getNotifySummary();

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Stock alerts</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Buyers get a ping automatically when a phone becomes Available — that has its own daily
          count ({summary.productsLast24h} sent, {summary.remainingProductPings} left). Shop alerts
          and banners share a separate 50/day pool ({summary.remainingAlerts} left).
        </p>
      </div>

      {!summary.configured && (
        <p className="mb-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          Add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the host, then redeploy.
          Generate with: npx web-push generate-vapid-keys
        </p>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-3xl font-black">{summary.subscriberCount}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Customers subscribed</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-3xl font-black">{summary.alertsLast24h}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Shop alerts last 24h</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-3xl font-black">{summary.productsLast24h}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">New-listing pings last 24h</p>
        </div>
      </div>

      <div className="max-w-lg rounded-2xl border border-border/50 bg-card p-6">
        <NotifyBroadcastForm remainingToday={summary.configured ? summary.remainingAlerts : 0} />
      </div>

      {summary.recent.length > 0 && (
        <ul className="mt-8 max-w-lg divide-y divide-border rounded-2xl border border-border/50 bg-card">
          {summary.recent.map((row) => (
            <li key={row.id} className="px-5 py-4">
              <p className="text-sm font-semibold">{row.title}</p>
              <p className="text-xs text-muted-foreground">
                {row.body} · {row.sentCount} delivered
                {row.kind === "PRODUCT" ? " · listing" : row.kind === "ANNOUNCEMENT" ? " · banner" : " · alert"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
