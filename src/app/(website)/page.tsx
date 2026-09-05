import Link from "next/link";
import type { Metadata } from "next";
import { PublicProductCard } from "./phones/components/PublicProductCard";
import { listPublicProducts, listBrands, listPublicSoldProducts, getHeroProduct } from "@/server/modules/catalog";
import { getShop, toPublicShopInfo } from "@/server/modules/shop";
import { listPublicTestimonials } from "@/server/modules/content";
import { FadeIn } from "@/components/shared/FadeIn";
import { StoreMap } from "@/components/public/StoreMap";
import { Tilt3D } from "@/components/public/Tilt3D";
import { AutocompleteSearch } from "@/components/shared/AutocompleteSearch";
import { resolvePublicAppUrl } from "@/lib/qr";

export async function generateMetadata(): Promise<Metadata> {
  const shop = await getShop();
  const title = `${shop.name} — Premium Pre-Owned Phones in ${shop.city}`;
  const description = shop.tagline || `Browse trusted pre-owned mobile phones at ${shop.name}, ${shop.city}. Honest condition reports and warranty.`;

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: "/",
      siteName: shop.name,
      locale: "en_IN",
      type: "website",
      images: shop.logoUrl ? [{ url: shop.logoUrl, width: 800, height: 800, alt: shop.name }] : [],
    },
  };
}

export default async function HomePage() {
  const [rawShop, brands, latestData, featuredData, soldData, testimonials, heroProductRow] =
    await Promise.all([
      getShop(),
      listBrands(),
      listPublicProducts({ limit: 4, sort: "NEWEST" }),
      listPublicProducts({ limit: 4, isFeatured: true }),
      listPublicSoldProducts(4),
      listPublicTestimonials(),
      getHeroProduct(),
    ]);

  const shop = toPublicShopInfo(rawShop);
  const siteUrl = resolvePublicAppUrl();

  // Prefer the owner-chosen hero product; fall back to the newest listing if none is set.
  const heroProduct = heroProductRow ?? latestData.products[0] ?? null;

  // Determine today's opening status (server-rendered, so computed at request time)
  const hourRows = Object.entries(shop.hours || {});
  const todayKey = new Date().toLocaleDateString("en-IN", { weekday: "long" }).toLowerCase();
  const todayRow = hourRows.find(([day]) => day.toLowerCase() === todayKey);
  const todayVal = todayRow ? String(todayRow[1] || "") : "";
  const isTodayClosed = todayVal.trim() === "" || todayVal.includes("Closed") || todayVal.includes("Holiday");
  const todayStatus = isTodayClosed ? "Closed today" : "Open today";

  // Order hours for display: Today first, then open days (weekday order), then holidays/closed grouped at the bottom.
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const isOff = (time: unknown) => {
    const v = String(time || "");
    return v.trim() === "" || v.includes("Closed") || v.includes("Holiday");
  };
  const openRows = hourRows.filter(([, time]) => !isOff(time));
  const offRows = hourRows.filter(([, time]) => isOff(time));
  const rank = ([day]: [string, unknown]) => (day.toLowerCase() === todayKey ? -1 : dayOrder.indexOf(day.toLowerCase()));
  const sortedHourRows = [...openRows, ...offRows]
    .map((row) => ({ row, r: rank(row) }))
    .sort((a, b) => a.r - b.r)
    .map(({ row }) => row);

  const fullAddress = [shop.addressLine1, shop.addressLine2, `${shop.city}, ${shop.state} ${shop.pincode}`]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = shop.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  // JSON-LD Structured Data for LocalBusiness
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": shop.name,
    "image": shop.logoUrl ? [shop.logoUrl] : [],
    "@id": `${siteUrl}/#business`,
    "url": siteUrl,
    "telephone": shop.phone || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": shop.addressLine1 || "",
      "addressLocality": shop.city || "",
      "addressRegion": shop.state || "",
      "postalCode": shop.pincode || "",
      "addressCountry": "IN"
    },
    ...(shop.lat != null && shop.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: shop.lat, longitude: shop.lng } }
      : {}),
    "openingHoursSpecification": Object.entries(shop.hours || {}).map(([day, time]) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [day.charAt(0).toUpperCase() + day.slice(1)],
      "opens": time === "Closed" ? "00:00" : (time as string).split(" - ")[0] || "10:00",
      "closes": time === "Closed" ? "00:00" : (time as string).split(" - ")[1] || "20:00"
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-white">
        {/* ============ 1. HERO — Device Showroom ============ */}
        <section className="relative overflow-hidden border-b border-border bg-[#f7f8fa]">
          {/* Soft brand wash */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="brand-glow absolute left-1/2 top-[-12%] h-[420px] w-[120%] -translate-x-1/2 sm:h-[520px]" />
          </div>

          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:pb-24 lg:pt-20">
            {/* Left — copy */}
            <div className="relative z-10 text-center lg:text-left">
              <FadeIn>
                <span className="eyebrow justify-center lg:justify-start">
                  <span className="eyebrow-dot" />
                  Trusted pre-owned · {shop.city}
                </span>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="mt-5 text-[2.6rem] font-black leading-[1.03] tracking-tight text-ink sm:text-6xl lg:text-[4.4rem]">
                  Fresh phones.
                  <br />
                  <span className="relative inline-block">
                    <span className="relative z-10">Honest prices.</span>
                    <span className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 rounded-sm bg-brand/15 sm:h-4" />
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={160}>
                <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-relaxed text-ink-soft sm:text-lg lg:mx-0">
                  {shop.tagline || "Every device tested, photographed and graded with brutal honesty — so you buy with confidence."}
                </p>
              </FadeIn>

              <FadeIn delay={240} className="relative z-30">
                <div className="mx-auto mt-8 w-full max-w-lg lg:mx-0">
                  <AutocompleteSearch placeholder="Search iPhone 13, Pixel, Samsung…" large />
                </div>
              </FadeIn>

              <FadeIn delay={320}>
                <div className="mt-7 flex items-center justify-center gap-3 lg:justify-start">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                    </span>
                    {latestData.total}+ live right now
                  </span>
                  <span className="h-4 w-px bg-border" />
                  <Link href="/phones" className="text-sm font-bold text-brand transition-opacity hover:opacity-70">
                    Browse stock →
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right — floating device showcase */}
            <FadeIn delay={200} direction="none" className="relative">
              <div className="relative mx-auto flex w-full max-w-[300px] items-center justify-center sm:max-w-[340px] lg:max-w-[380px]">
                {/* Brand glow behind device */}
                <div className="brand-glow absolute inset-0 scale-125" />

                {/* Floating device image — shown directly, no frame — wrapped in light 3D depth */}
                <Tilt3D parallax={55} maxTilt={8} className="relative w-full">
                  <div className="relative aspect-[4/5] w-full animate-float">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[2.5rem] bg-white/40 p-6 backdrop-blur-sm">
                      {heroProduct?.primaryImageUrl ? (
                        <img
                          src={heroProduct.primaryImageUrl}
                          alt={heroProduct.primaryImageAlt || heroProduct.title}
                          className="h-full w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.25)]"
                          loading="eager"
                        />
                      ) : (
                        <span className="text-8xl opacity-30">📱</span>
                      )}
                    </div>
                  </div>
                </Tilt3D>

                {/* Floating "newest" chip — stronger parallax so it feels closer */}
                {heroProduct && (
                  <Tilt3D parallax={110} maxTilt={12} className="absolute -left-3 top-16 z-10 hidden sm:block lg:-left-10">
                    <div className="animate-float-sm rounded-2xl border border-border bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Newest</p>
                      <Link href={`/phones/${heroProduct.slug}`} className="text-sm font-black text-ink hover:text-brand">
                        {heroProduct.title.split(" ").slice(0, 2).join(" ")}
                      </Link>
                    </div>
                  </Tilt3D>
                )}

                {/* Floating "verified" chip — stronger parallax */}
                <Tilt3D parallax={140} maxTilt={12} className="absolute -right-2 bottom-20 z-10 hidden sm:block lg:-right-8">
                  <div className="animate-float-sm rounded-2xl border border-border bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur" style={{ animationDelay: "1.2s" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-success">Verified</p>
                    <p className="text-sm font-black text-ink">30-pt tested</p>
                  </div>
                </Tilt3D>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ============ 2. BRAND MARQUEE ============ */}
        {brands.length > 0 && (
          <section className="border-b border-border bg-white py-6">
            <div className="group/marquee marquee-mask overflow-hidden">
              <div className="flex w-max animate-marquee items-center gap-3 pr-3">
                {[...brands, ...brands].map((brand, i) => (
                  <Link
                    key={`${brand.slug}-${i}`}
                    href={`/phones?brands=${brand.slug}`}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:border-ink"
                  >
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ============ 3. LATEST ARRIVALS ============ */}
      {latestData.products.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-8 flex items-end justify-between gap-4 sm:mb-12">
              <div className="section-head">
                <span className="eyebrow"><span className="eyebrow-dot" />Just landed</span>
                <h2 className="section-title">Latest arrivals</h2>
              </div>
              <Link href="/phones?sort=NEWEST" className="btn-ghost hidden !min-h-0 !px-4 py-2 text-xs sm:inline-flex">
                View all
              </Link>
            </FadeIn>

            {/* Mobile: horizontal snap row */}
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0 lg:hidden">
              {latestData.products.map((product, i) => (
                <div key={product.id} className="w-[78%] max-w-[300px] shrink-0 snap-start">
                  <PublicProductCard product={product} priority={i < 2} />
                </div>
              ))}
            </div>

            {/* Desktop: grid */}
            <div className="hidden grid-cols-2 gap-6 lg:grid lg:grid-cols-4">
              {latestData.products.map((product, i) => (
                <FadeIn key={product.id} delay={i * 70}>
                  <PublicProductCard product={product} priority={i < 4} />
                </FadeIn>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/phones?sort=NEWEST" className="btn-ghost w-full">
                View all latest
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ 4. FEATURED SPOTLIGHT ============ */}
      {featuredData.products.length > 0 && (
        <section className="border-y border-border bg-[#f4f5f8] py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-10 text-center sm:mb-14">
              <span className="eyebrow justify-center"><span className="eyebrow-dot" />Editor&apos;s picks</span>
              <h2 className="section-title mt-3">Featured devices</h2>
              <p className="section-sub mx-auto mt-3 max-w-xl">Handpicked for incredible value and pristine condition.</p>
            </FadeIn>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {featuredData.products.map((product, i) => (
                <FadeIn key={product.id} delay={i * 80}>
                  <PublicProductCard product={product} priority={i < 4} />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ 5. WHY BUY (Bento) ============ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-10 sm:mb-14">
            <span className="eyebrow"><span className="eyebrow-dot" />The {shop.name} difference</span>
            <h2 className="section-title mt-3">Buying used, without the doubt.</h2>
          </FadeIn>

          <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {[
              {
                title: "Brutal honesty",
                text: "No hidden scratches, no fake battery health. If it has a dent, we show you the dent.",
                icon: "🛡️",
                dark: true,
              },
              {
                title: "30-point test",
                text: "Cameras, mics, sensors and screens — everything checked before it hits the shelf.",
                icon: "🔬",
              },
              {
                title: "Real warranty",
                text: "We stand behind our stock with a clear local warranty you can rely on.",
                icon: "📜",
              },
              {
                title: "Fair, honest price",
                text: "Transparent pricing with MRP savings shown upfront. No surprises at the counter.",
                icon: "💸",
              },
            ].map((box, i) => (
              <FadeIn key={box.title} delay={i * 80} className={i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}>
                <div className={`device-card device-card-hover flex h-full flex-col justify-between p-6 sm:p-8 ${box.dark ? "!border-transparent !bg-ink" : ""}`}>
                  <div>
                    <span className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${box.dark ? "bg-white/10" : "bg-brand/10"}`}>
                      {box.icon}
                    </span>
                    <h3 className={`text-xl font-black tracking-tight sm:text-2xl ${box.dark ? "text-white" : "text-ink"}`}>{box.title}</h3>
                    <p className={`mt-2 text-[15px] font-medium leading-relaxed ${box.dark ? "text-white/70" : "text-ink-soft"}`}>{box.text}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. TESTIMONIALS ============ */}
      {testimonials.length > 0 && (
        <section className="border-y border-border bg-[#f4f5f8] py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-10 text-center sm:mb-14">
              <span className="eyebrow justify-center"><span className="eyebrow-dot" />Real feedback</span>
              <h2 className="section-title mt-3">What buyers say</h2>
              <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">Shop-provided customer feedback</p>
            </FadeIn>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:snap-none lg:grid-cols-3">
              {testimonials.map((t, i) => (
                <FadeIn key={t.id} delay={i * 80} className="w-[82%] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                  <figure className="device-card device-card-hover flex h-full flex-col p-7">
                    <div className="mb-4 text-base tracking-[0.2em] text-brand" aria-label="5 star rating">★★★★★</div>
                    <blockquote className="flex-1 text-[15px] font-medium leading-relaxed text-ink">
                      &ldquo;{t.text}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-lg font-black text-brand">
                        {t.customerName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-ink">{t.customerName}</span>
                    </figcaption>
                  </figure>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ 7. RECENTLY SOLD ============ */}
      {soldData.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-8 text-center sm:mb-12">
              <span className="eyebrow justify-center"><span className="eyebrow-dot" />Proof of movement</span>
              <h2 className="section-title mt-3">Just missed these</h2>
              <p className="section-sub mx-auto mt-3 max-w-xl">Good deals go fast. Here&apos;s what sold recently.</p>
            </FadeIn>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:snap-none lg:grid-cols-3">
              {soldData.map((product) => (
                <div key={product.id} className="relative w-[72%] max-w-[280px] shrink-0 snap-start opacity-80 sm:w-auto sm:max-w-none sm:opacity-100">
                  <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-lg border-2 border-ink bg-white/90 px-4 py-1.5 text-base font-black uppercase tracking-widest text-ink shadow-lg">
                    Sold
                  </span>
                  <PublicProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ 8. VISIT US ============ */}
      <section className="border-t border-border bg-[#f4f5f8] py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="device-card grid grid-cols-1 overflow-hidden lg:grid-cols-2">
            {/* Copy side */}
            <FadeIn className="flex flex-col justify-center p-7 sm:p-12">
              <span className="eyebrow"><span className="eyebrow-dot" />Visit the store</span>
              <h2 className="section-title mt-3">Come see them in person.</h2>
              <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-ink-soft sm:text-lg">
                Test the device, feel the build, and grab a coffee on us. We&apos;d love to meet you.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-lg">📍</span>
                  <div>
                    <p className="text-sm font-bold text-ink">{shop.name}</p>
                    <p className="text-sm font-medium leading-relaxed text-ink-soft">
                      {shop.addressLine1}{shop.addressLine2 && <><br />{shop.addressLine2}</>}<br />
                      {shop.city}, {shop.state} {shop.pincode}
                    </p>
                  </div>
                </div>

                {/* Opening hours — standalone card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-white">
                  {/* Card header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-surface px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-ink">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/10 text-xs">🕘</span>
                      Opening hours
                    </p>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${isTodayClosed ? "bg-ink/5 text-ink-soft" : "bg-success/10 text-success"}`}>
                      <span className="relative flex h-1.5 w-1.5">
                        {!isTodayClosed && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
                        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isTodayClosed ? "bg-ink-faint" : "bg-success"}`} />
                      </span>
                      {todayStatus}
                    </span>
                  </div>

                  {(() => {
                    const todayEntry = sortedHourRows.find(([day]) => day.toLowerCase() === todayKey);
                    const otherRows = sortedHourRows.filter(([day]) => day.toLowerCase() !== todayKey);
                    const todayVal = todayEntry ? String(todayEntry[1] || "") : "";
                    const todayHoliday = todayVal.includes("Holiday");
                    const todayClosed = todayVal.trim() === "" || todayVal.includes("Closed") || todayHoliday;
                    const todayTime = todayVal.replace(/Holiday\|?/g, "").trim() || "Closed";

                    return (
                      <>
                        {/* TODAY featured block (stacked, not side-by-side) */}
                        {todayEntry && (
                          <div className="border-b border-border/70 bg-brand/[0.06] px-4 py-3.5">
                            <div className="flex flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-black capitalize text-ink">{todayEntry[0]}</span>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white ${
                                    todayHoliday ? "bg-error" : todayClosed ? "bg-ink-faint" : "bg-success"
                                  }`}
                                >
                                  {todayHoliday ? "Holiday" : todayClosed ? "Closed" : "Open today"}
                                </span>
                              </div>
                              <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                todayClosed ? "bg-ink/5 text-ink-soft" : "bg-success/10 text-success"
                              }`}>
                                <span className="relative flex h-1.5 w-1.5">
                                  {!todayClosed && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />}
                                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${todayClosed ? "bg-ink-faint" : "bg-success"}`} />
                                </span>
                                {todayTime}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Remaining days */}
                        <ul className="divide-y divide-border/70">
                          {otherRows.map(([day, time]) => {
                            const val = String(time || "");
                            const isClosed = val.trim() === "" || val.includes("Closed");
                            const isHoliday = val.includes("Holiday");
                            const displayTime = val.replace(/Holiday\|?/g, "").trim() || "Closed";
                            return (
                              <li key={day} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <span className="text-sm font-semibold capitalize text-ink-soft">{day}</span>
                                <span className="flex items-center gap-2">
                                  {isHoliday && (
                                    <span className="rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-error">Holiday</span>
                                  )}
                                  <span className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${isClosed ? "bg-ink/5 text-ink-faint" : "bg-ink/5 text-ink"}`}>
                                    {displayTime}
                                  </span>
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-dark">
                  Open in Maps
                </a>
                <Link href="/phones" className="btn-ghost">
                  Browse devices
                </Link>
              </div>
            </FadeIn>

            {/* Visual side — embedded map */}
            <div className="relative min-h-[320px] overflow-hidden bg-[#eef0f3] lg:min-h-full">
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-white/95 px-4 py-2.5 backdrop-blur">
                <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs">📍</span>
                  <span className="truncate">{shop.name}</span>
                </span>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80"
                >
                  Open in Maps
                </a>
              </div>
              <div className="h-full pt-11">
                <StoreMap
                  lat={shop.lat}
                  lng={shop.lng}
                  query={`${shop.name}, ${fullAddress}`}
                  mapsUrl={mapsUrl}
                  title={shop.name}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
