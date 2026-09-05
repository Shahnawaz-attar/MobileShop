import type { Metadata } from "next";
import Link from "next/link";
import { getShop, toPublicShopInfo, buildWhatsAppHref } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { FadeIn } from "@/components/shared/FadeIn";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();
  const title = `About ${shop.name} — ${shop.city}`;
  const description =
    shop.about ||
    shop.tagline ||
    `Visit ${shop.name} in ${shop.city} for trusted pre-owned phones.`;

  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      title,
      description,
      url: "/about",
      siteName: shop.name,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const rawShop = await getShop();
  const shop = toPublicShopInfo(rawShop);
  const siteUrl = resolvePublicAppUrl();
  const fullAddress = [shop.addressLine1, shop.addressLine2, `${shop.city}, ${shop.state} ${shop.pincode}`]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = shop.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;
  const whatsAppHref = buildWhatsAppHref(shop.whatsapp);
  const policyEntries = Object.entries(shop.policies).filter(([, value]) => value.trim().length > 0);

  return (
    <div className="bg-white">
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <Breadcrumbs
          className="mb-6"
          items={[{ label: "Home", href: "/" }, { label: "About" }]}
        />
        <FadeIn>
          <span className="eyebrow"><span className="eyebrow-dot" />About the store</span>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
            {shop.name}
          </h1>
          {shop.tagline && (
            <p className="mt-4 text-lg font-medium text-ink-soft">{shop.tagline}</p>
          )}
          {shop.yearsInBiz != null && shop.yearsInBiz > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {shop.yearsInBiz}+ years in business
            </p>
          )}
        </FadeIn>

        {shop.coverUrl && (
          <FadeIn delay={80}>
            <img
              src={shop.coverUrl}
              alt={`${shop.name} store`}
              className="mt-10 w-full rounded-[1.75rem] object-cover shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)]"
            />
          </FadeIn>
        )}

        <FadeIn delay={120}>
          <div className="mt-10 space-y-4 text-base leading-relaxed text-ink-soft">
            <p>
              {shop.about ||
                `${shop.name} in ${shop.city} sells inspected pre-owned phones. Come to the shop to check a device in person before you buy.`}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={160}>
          <div className="device-card mt-12 p-6 sm:p-8">
            <h2 className="text-lg font-black text-ink">Address</h2>
            <p className="mt-3 font-medium text-ink-soft">
              {shop.addressLine1}
              {shop.addressLine2 ? (
                <>
                  <br />
                  {shop.addressLine2}
                </>
              ) : null}
              <br />
              {shop.city}, {shop.state} {shop.pincode}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark !min-h-0 px-5 py-2.5 text-sm"
              >
                Directions
              </a>
              <a
                href={`tel:${shop.phone}`}
                className="btn-ghost !min-h-0 px-5 py-2.5 text-sm"
              >
                Call {shop.phone}
              </a>
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !min-h-0 px-5 py-2.5 text-sm"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="device-card mt-8 p-6 sm:p-8">
            <h2 className="text-lg font-black text-ink">Hours</h2>
            <ul className="mt-4 divide-y divide-border/70">
              {Object.entries(shop.hours).map(([day, time]) => {
                const val = String(time || "");
                const isClosed = val.trim() === "" || val.includes("Closed");
                const isHoliday = val.includes("Holiday");
                let displayTime = val.replace(/Holiday\|?/g, "").trim();
                if (displayTime === "") displayTime = "Closed";
                return (
                  <li key={day} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-semibold capitalize text-ink-soft">{day}</span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${isClosed ? "bg-ink/5 text-ink-faint" : "bg-ink/5 text-ink"}`}>
                      {isHoliday ? "Holiday · " : ""}
                      {displayTime}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </FadeIn>

        {policyEntries.length > 0 && (
          <FadeIn delay={240}>
            <div className="device-card mt-8 p-6 sm:p-8">
              <h2 className="text-lg font-black text-ink">Policies</h2>
              <dl className="mt-4 space-y-6">
                {policyEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-bold capitalize text-ink">{key.replace(/_/g, " ")}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </FadeIn>
        )}

        <p className="mt-10 text-center text-sm font-medium text-ink-soft">
          <Link href="/phones" className="font-bold text-brand underline underline-offset-4">
            Browse today&apos;s stock
          </Link>
          <span className="mx-2">·</span>
          <span className="font-mono text-xs">{siteUrl}</span>
        </p>
      </section>
    </div>
  );
}
