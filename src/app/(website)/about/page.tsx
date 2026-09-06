import type { Metadata } from "next";
import Link from "next/link";
import { Navigation, Phone } from "lucide-react";
import { getShop, toPublicShopInfo, buildWhatsAppHref } from "@/server/modules/shop";
import { resolvePublicAppUrl } from "@/lib/qr";
import { FadeIn } from "@/components/shared/FadeIn";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";

/** Official WhatsApp glyph (lucide has no brand icons). */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  );
}

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
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Directions
              </a>
              <a
                href={`tel:${shop.phone}`}
                className="btn-ghost !min-h-0 px-5 py-2.5 text-sm"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call {shop.phone}
              </a>
              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !min-h-0 px-5 py-2.5 text-sm"
              >
                <WhatsAppIcon className="h-4 w-4" />
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
