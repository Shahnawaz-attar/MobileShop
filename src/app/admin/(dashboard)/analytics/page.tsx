import type { Metadata } from "next";
import Link from "next/link";
import { getOwnerInsights } from "@/server/modules/analytics";

export const metadata: Metadata = {
  title: "Insights",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const insights = await getOwnerInsights();
  const { totals, products } = insights;

  const summaryCards = [
    { label: "Product views", value: totals.productViews },
    { label: "WhatsApp taps", value: totals.whatsappClicks },
    { label: "Call taps", value: totals.callClicks },
    { label: "Searches", value: totals.searches },
    { label: "Directions", value: totals.directionsClicks },
    { label: "Shares", value: totals.shareClicks },
    { label: "QR scans", value: totals.qrScans },
  ];

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Insights
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Customer interest in the last 7 days — which phones people look at and enquire about.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
          >
            <p className="text-3xl font-black tracking-tight text-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-muted/20 px-6 py-5">
          <h2 className="text-base font-bold text-foreground">Phones people asked about</h2>
          <p className="mt-1.5 text-xs font-medium text-muted-foreground">
            Views and WhatsApp taps this week, not lifetime page views.
          </p>
        </div>

        {products.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted-foreground">
            No product views or WhatsApp taps yet this week. When buyers open a listing or tap
            WhatsApp, it will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {products.map((product) => (
              <li key={product.productId}>
                <Link
                  href={`/admin/products/${product.productId}/edit`}
                  className="block px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  <p className="text-sm font-semibold text-foreground">
                    Your {product.title} was viewed {product.viewCount}{" "}
                    {product.viewCount === 1 ? "time" : "times"} and received{" "}
                    {product.whatsappClicks} WhatsApp{" "}
                    {product.whatsappClicks === 1 ? "tap" : "taps"} this week.
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
