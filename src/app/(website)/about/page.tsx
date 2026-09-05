import type { Metadata } from "next";
import Link from "next/link";
import { getShop, toPublicShopInfo, buildWhatsAppHref } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { FadeIn } from "@/components/shared/FadeIn";

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
    <div className="bg-[#f5f5f7]">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <FadeIn>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Visit us</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {shop.name}
          </h1>
          {shop.tagline && (
            <p className="mt-4 text-lg font-medium text-slate-600">{shop.tagline}</p>
          )}
          {shop.yearsInBiz != null && shop.yearsInBiz > 0 && (
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {shop.yearsInBiz}+ years in business
            </p>
          )}
        </FadeIn>

        {shop.coverUrl && (
          <FadeIn delay={80}>
            <img
              src={shop.coverUrl}
              alt={`${shop.name} store`}
              className="mt-10 w-full rounded-3xl object-cover shadow-sm"
            />
          </FadeIn>
        )}

        <FadeIn delay={120}>
          <div className="mt-10 space-y-4 text-base leading-relaxed text-slate-700">
            <p>
              {shop.about ||
                `${shop.name} in ${shop.city} sells inspected pre-owned phones. Come to the shop to check a device in person before you buy.`}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={160}>
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Address</h2>
            <p className="mt-3 text-slate-600">
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-semibold text-white"
              >
                Directions
              </a>
              <a
                href={`tel:${shop.phone}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-900"
              >
                Call {shop.phone}
              </a>
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-900"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Hours</h2>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              {Object.entries(shop.hours).map(([day, time]) => {
                const val = String(time || "");
                const isClosed = val.trim() === "";
                const isHoliday = val.includes("Holiday");
                let displayTime = val.replace("Holiday|", "").replace("Holiday", "").trim();
                if (displayTime === "") displayTime = "Closed";
                return (
                  <li key={day} className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="capitalize">{day}</span>
                    <span className={isClosed || displayTime === "Closed" ? "text-slate-400" : "font-bold"}>
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
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">Policies</h2>
              <dl className="mt-4 space-y-6">
                {policyEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-bold capitalize text-slate-900">{key.replace(/_/g, " ")}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </FadeIn>
        )}

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/phones" className="font-semibold text-slate-900 underline">
            Browse today&apos;s stock
          </Link>
          <span className="mx-2">·</span>
          <span className="font-mono text-xs">{siteUrl}</span>
        </p>
      </section>
    </div>
  );
}
