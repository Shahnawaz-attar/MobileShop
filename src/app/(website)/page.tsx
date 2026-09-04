import Link from "next/link";
import type { Metadata } from "next";
import { PublicProductCard } from "./phones/components/PublicProductCard";
import { listPublicProducts, listBrands, listPublicSoldProducts } from "@/server/modules/catalog";
import { getShop, toPublicShopInfo } from "@/server/modules/shop";
import { listPublicTestimonials } from "@/server/modules/content";
import { FadeIn } from "@/components/shared/FadeIn";

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
  const [rawShop, brands, latestData, featuredData, soldData, testimonials] = await Promise.all([
    getShop(),
    listBrands(),
    listPublicProducts({ limit: 4, sort: "NEWEST" }),
    listPublicProducts({ limit: 4, isFeatured: true }),
    listPublicSoldProducts(4),
    listPublicTestimonials(),
  ]);

  const shop = toPublicShopInfo(rawShop);

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
    "@id": "",
    "url": "",
    "telephone": shop.phone || "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": shop.addressLine1 || "",
      "addressLocality": shop.city || "",
      "addressRegion": shop.state || "",
      "postalCode": shop.pincode || "",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": shop.lat || 0,
      "longitude": shop.lng || 0
    },
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
      <div className="bg-[#f5f5f7]">
      {/* 1. HERO SECTION (Classic Minimal with Deep Grid & Glow) */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        {/* Background Premium Mesh & Soft Glows */}
        <div className="absolute inset-0 z-0 bg-[#f5f5f7] overflow-hidden">
          {/* Subtle grid pattern for texture */}
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          
          {/* Premium Ambient Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-100 to-indigo-50 blur-[120px] mix-blend-multiply opacity-70 pointer-events-none animate-pulse-slow" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-purple-100 to-pink-50 blur-[120px] mix-blend-multiply opacity-60 pointer-events-none" />
          
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#f5f5f7] to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          
          <FadeIn delay={100} direction="up">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-slate-900 mb-6 max-w-5xl leading-[1.1]">
              Premium pre-owned. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600">
                Without the premium price.
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={200} direction="up">
            <p className="text-lg sm:text-2xl font-medium text-slate-500 mt-4 max-w-3xl mx-auto mb-16 px-4 leading-relaxed">
              {shop.tagline || "Rigorously tested, honestly graded, and backed by warranty."}
            </p>
          </FadeIn>
          
          <FadeIn delay={300} direction="up" className="w-full max-w-3xl mx-auto px-4 sm:px-0">
            <form action="/phones" className="w-full group relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 opacity-50 blur-lg transition duration-500 group-focus-within:opacity-100 group-hover:opacity-100"></div>
              <div className="relative flex items-center bg-white/80 backdrop-blur-xl rounded-full p-1.5 sm:p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 transition-all duration-300 focus-within:shadow-[0_20px_40px_rgb(0,0,0,0.12)] focus-within:border-white focus-within:bg-white">
                <svg className="ml-3 sm:ml-6 h-5 w-5 sm:h-6 sm:w-6 text-slate-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {/* on focus-visible remove border of input */}
                <input 
                  type="text" 
                  name="q"
                  placeholder="Search devices..." 
                  className="w-full min-w-0 bg-transparent px-3 sm:px-6 py-3 sm:py-4 text-base sm:text-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0"
                />
                <button type="submit" className="shrink-0 rounded-full bg-slate-900 px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg font-bold text-white transition-all hover:bg-black hover:scale-[1.02] hover:shadow-lg active:scale-95">
                  Search
                </button>
              </div>
            </form>
          </FadeIn>

          <FadeIn delay={400} direction="up">
            <div className="mt-16 text-sm font-medium text-slate-400 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {latestData.total}+ devices currently available
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 2. BROWSE BY BRAND */}
      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-32">
          <FadeIn>
            <p className="typography-micro text-center mb-8">
              Shop By Brand
            </p>
          </FadeIn>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {brands.map((brand, i) => (
              <FadeIn key={brand.slug} delay={i * 50}>
                <Link
                  href={`/phones?brands=${brand.slug}`}
                  className="flex items-center justify-center rounded-full bg-white/60 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-3.5 border border-slate-200/50 text-sm sm:text-base font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-white hover:text-black hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5"
                >
                  {brand.name}
                </Link>
              </FadeIn>
            ))}
            <FadeIn delay={brands.length * 50}>
              <Link
                href="/phones"
                className="flex items-center justify-center rounded-full bg-slate-900 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white transition-all hover:bg-black hover:shadow-lg hover:-translate-y-0.5"
              >
                View All &rarr;
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* 3. LATEST ARRIVALS */}
      {latestData.products.length > 0 && (
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Latest Drops.</h2>
                <p className="text-lg text-slate-500 font-medium mt-2">Fresh inventory, just inspected and listed.</p>
              </div>
              <Link href="/phones?sort=NEWEST" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-black hover:text-slate-600 transition-colors">
                View all latest <span aria-hidden="true">&rarr;</span>
              </Link>
            </FadeIn>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {latestData.products.map((product, i) => (
                <FadeIn key={product.id} delay={i * 100}>
                  <div className="transform transition-all duration-300 hover:-translate-y-2">
                    <PublicProductCard product={product} priority={i < 4} />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. FEATURED SPOTLIGHT */}
      {featuredData.products.length > 0 && (
        <section className="py-32 bg-[#fbfbfd] border-t border-slate-100 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <FadeIn className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">Featured Devices.</h2>
              <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl mx-auto">Handpicked by our experts for incredible value and pristine condition.</p>
            </FadeIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredData.products.map((product, i) => (
                <FadeIn key={product.id} delay={i * 100}>
                  <div className="transform transition-all duration-300 hover:-translate-y-2">
                     <PublicProductCard product={product} priority={i < 4} />
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. WHY BUY FROM US (Clean Bento Box) */}
      <section className="py-32 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">The {shop.name} Difference.</h2>
            <p className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl mx-auto">We engineer trust into every transaction.</p>
          </FadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
            {/* Box 1 */}
            <FadeIn delay={100} className="md:col-span-2 h-full">
              <div className="h-full rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white p-10 sm:p-14 flex flex-col justify-end relative overflow-hidden group hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 border border-slate-200/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="relative z-10">
                  <div className="mb-8 p-4 bg-white shadow-sm border border-slate-100 rounded-2xl inline-block">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Brutal Honesty.</h3>
                  <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">No hidden scratches. No fake battery health. If it has a dent, we show you the dent.</p>
                </div>
              </div>
            </FadeIn>
            
            {/* Box 2 */}
            <FadeIn delay={200} className="h-full">
              <div className="h-full rounded-[2.5rem] bg-gradient-to-b from-slate-50 to-white p-10 flex flex-col justify-end relative overflow-hidden group hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 border border-slate-200/50">
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">30-Point Test.</h3>
                  <p className="text-base text-slate-500 font-medium">Cameras, mics, sensors, and screens—tested flawlessly.</p>
                </div>
              </div>
            </FadeIn>
            
            {/* Box 3 */}
            <FadeIn delay={300} className="h-full">
              <div className="h-full rounded-[2.5rem] bg-slate-900 p-10 flex flex-col justify-end relative overflow-hidden group hover:bg-black hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] transition-all duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white tracking-tight mb-3">Free Warranty.</h3>
                  <p className="text-base text-slate-400 font-medium">We stand by our stock with a comprehensive local warranty.</p>
                </div>
              </div>
            </FadeIn>
            
            {/* Box 4 */}
            <FadeIn delay={400} className="md:col-span-2 h-full">
              <div className="h-full rounded-[2.5rem] bg-white border border-slate-200/60 p-10 sm:p-12 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-shadow duration-500">
                 <div className="relative z-10 max-w-lg mb-8 sm:mb-0 text-center sm:text-left">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Visit our store.</h3>
                  <p className="text-lg text-slate-500 font-medium">Experience the devices in person before you buy.</p>
                </div>
                <a href="#visit-us" className="inline-flex rounded-full bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:scale-[1.02] hover:bg-black hover:shadow-lg whitespace-nowrap">
                  Get Directions
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS (Horizontal Slider) — from DB, hidden when empty */}
      {testimonials.length > 0 && (
        <section className="py-32 bg-[#fbfbfd] border-t border-slate-100 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-16">
               <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">What our customers say.</h2>
               <p className="text-lg text-slate-500 font-medium">Real feedback from real buyers.</p>
               <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-widest">Shop-provided customer feedback</p>
            </FadeIn>
            
            <div className="flex overflow-x-auto snap-x snap-mandatory pb-8 pt-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {testimonials.map((t, i) => (
                <FadeIn key={t.id} delay={i * 100} className="snap-center shrink-0 w-[350px]">
                  <div className="h-full rounded-3xl bg-white p-10 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-transform hover:-translate-y-2">
                    <div className="flex gap-1 text-black mb-6">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <svg key={si} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      ))}
                    </div>
                    <p className="text-lg font-medium text-slate-700 mb-8">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {t.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-black">{t.customerName}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />
          </div>
        </section>
      )}

      {/* 7. RECENTLY SOLD */}
      {soldData.length > 0 && (
        <section className="py-32 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">Just missed it.</h2>
              <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">Good deals go fast. Here's what was recently sold.</p>
            </FadeIn>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {soldData.map((product, i) => (
                <FadeIn key={product.id} delay={i * 100}>
                  <div className="relative group">
                    <div className="opacity-50 transition-opacity duration-500 group-hover:opacity-100">
                      <PublicProductCard product={product} />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <span className="rotate-[-10deg] inline-block border-2 border-black bg-white/90 backdrop-blur-sm px-6 py-2 text-2xl font-black uppercase tracking-widest text-black shadow-xl">Sold</span>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. VISIT US */}
      <section id="visit-us" className="py-32 bg-[#fbfbfd] border-t border-slate-100 overflow-hidden relative">
        {/* Decorative Map Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <FadeIn direction="right">
              <div className="max-w-xl">
                <span className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black text-white text-2xl sm:text-3xl mb-6 sm:mb-8 shadow-xl">📍</span>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6">Drop by anytime.</h3>
                <p className="text-lg sm:text-xl text-slate-500 font-medium mb-10 sm:mb-12 leading-relaxed">We love meeting our customers in person. Come check out our inventory, test the devices yourself, and have a cup of coffee on us.</p>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center items-center rounded-xl bg-black px-6 py-3.5 sm:px-8 sm:py-4 font-semibold text-white transition-transform hover:scale-105 shadow-xl shadow-black/10 w-full sm:w-auto">
                    Open in Maps
                  </a>
                  <Link href="/phones" className="inline-flex justify-center items-center rounded-xl bg-white px-6 py-3.5 sm:px-8 sm:py-4 font-semibold text-black border border-slate-200 transition-transform hover:scale-105 shadow-sm hover:shadow-md w-full sm:w-auto">
                    Browse Devices
                  </Link>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn delay={200} direction="left">
              <div className="bg-white rounded-[2rem] p-6 sm:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-200/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                
                <div className="relative z-10">
                  <h4 className="typography-micro mb-4">Store Location</h4>
                  <p className="typography-h3 mb-2">{shop.name}</p>
                  <p className="typography-body mb-10 sm:mb-12">
                    {shop.addressLine1}{shop.addressLine2 && <><br/>{shop.addressLine2}</>}<br/>
                    {shop.city}, {shop.state} {shop.pincode}
                  </p>
                  
                  <h4 className="typography-micro mb-4">Hours</h4>
                  <ul className="space-y-3 text-sm sm:text-base font-medium text-slate-700">
                    {Object.entries(shop.hours).map(([day, time]) => {
                      const val = String(time || "");
                      const isClosed = val.trim() === "";
                      const isHoliday = val.includes("Holiday");
                      let displayTime = val.replace("Holiday|", "").replace("Holiday", "").trim();
                      if (displayTime === "") displayTime = "Closed";

                      return (
                        <li key={day} className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="capitalize">{day}</span>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {isHoliday && (
                              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase bg-rose-100 text-rose-600 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                                Holiday
                              </span>
                            )}
                            <span className={`whitespace-nowrap font-bold px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${
                              isClosed || displayTime === "Closed" 
                                ? "bg-slate-50 text-slate-400"
                                : "bg-slate-100 text-black"
                            }`}>
                              {displayTime}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </FadeIn>
            
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
