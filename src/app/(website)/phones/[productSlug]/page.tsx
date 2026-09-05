import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/server/modules/catalog";
import { getShop } from "@/server/modules/shop";
import { formatINR } from "@/lib/money";
import { CONDITION_LABELS } from "@/lib/constants";
import { buildWhatsAppLink, generateProductEnquiryText } from "@/lib/whatsapp";
import { resolvePublicAppUrl } from "@/lib/qr";
import { ProductGallery } from "./ProductGallery";
import { WhatsAppCTA } from "./WhatsAppCTA";
import { ProductViewTracker } from "./ProductViewTracker";

interface PageProps {
  params: Promise<{ productSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getPublicProduct(productSlug);
  
  if (!product) {
    return { title: "Product Not Found" };
  }

  const variantStr = [product.storageGb ? `${product.storageGb}GB` : null, product.colour].filter(Boolean).join(" ");
  const fullName = variantStr ? `${product.title} (${variantStr})` : product.title;
  const description = `Buy pre-owned ${fullName} in ${CONDITION_LABELS[product.condition].toLowerCase()} condition.`;

  const primaryMedia = product.media.find(m => m.kind === "FRONT") || product.media[0];
  const ogImageUrl = `/api/og/product?title=${encodeURIComponent(fullName)}&price=${product.pricePaise / 100}${primaryMedia ? `&image=${encodeURIComponent(primaryMedia.url)}` : ""}`;

  return {
    title: fullName,
    description,
    alternates: {
      canonical: `/phones/${product.slug}`,
    },
    openGraph: {
      title: fullName,
      description,
      url: `/phones/${product.slug}`,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: fullName }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullName,
      description,
      images: [ogImageUrl],
    }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productSlug } = await params;
  
  // Fetch data in parallel
  const [product, shop] = await Promise.all([
    getPublicProduct(productSlug),
    getShop(),
  ]);

  if (!product) {
    notFound();
  }

  const productUrl = `${resolvePublicAppUrl()}/phones/${product.slug}`;
  const waText = generateProductEnquiryText(product, productUrl);
  const whatsappUrl = buildWhatsAppLink(shop.whatsapp, waText);

  const discount = product.mrpPaise && product.mrpPaise > product.pricePaise
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;

  const primaryMedia = product.media.find(m => m.kind === "FRONT") || product.media[0];
  
  // JSON-LD Structured Data for Product
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "image": primaryMedia ? [primaryMedia.url] : [],
    "description": `Pre-owned ${product.title} in ${CONDITION_LABELS[product.condition].toLowerCase()} condition.`,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brand.name
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "INR",
      "price": product.pricePaise / 100,
      "itemCondition": "https://schema.org/UsedCondition",
      "availability": product.availability === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": shop.name
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Client-side tracking component (avoids cache issues) */}
      <ProductViewTracker productId={product.id} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-[#fafafa] min-h-screen">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* Left Column: Media */}
          <div className="lg:sticky lg:top-8 lg:h-max">
            <ProductGallery media={product.media} />
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col">
            {/* Badges */}
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full bg-slate-100/80 px-4 py-1.5 text-xs font-bold text-slate-700 backdrop-blur-md shadow-sm border border-slate-200/50">
                {CONDITION_LABELS[product.condition]}
              </span>
              {product.availability === "RESERVED" && (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-500/20">
                  Reserved
                </span>
              )}
              {product.availability === "SOLD" && (
                <span className="inline-flex items-center rounded-full bg-slate-800 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-slate-800/20">
                  Sold Out
                </span>
              )}
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1] mb-4">
              {product.title}
            </h1>
            
            <p className="text-lg sm:text-xl font-bold text-slate-400">
              {product.brand.name} {product.model?.name ? <span className="text-slate-300 mx-2">•</span> : ""} {product.model?.name}
            </p>

            <div className="mt-8 flex items-baseline gap-4 border-b border-slate-200/60 pb-8">
              <span className="text-5xl font-black tracking-tight text-slate-900">
                {formatINR(product.pricePaise)}
              </span>
              {product.mrpPaise && product.mrpPaise > product.pricePaise && (
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-slate-400 line-through">
                    {formatINR(product.mrpPaise)}
                  </span>
                  <span className="mt-1 inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 shadow-sm border border-green-200/50">
                    {discount}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Key Specifications Grid */}
            <div className="mt-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Device Specifications</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {product.storageGb && (
                  <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Storage</p>
                    <p className="text-xl font-bold text-slate-900">{product.storageGb} GB</p>
                  </div>
                )}
                {product.ramGb && (
                  <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">RAM</p>
                    <p className="text-xl font-bold text-slate-900">{product.ramGb} GB</p>
                  </div>
                )}
                {product.colour && (
                  <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Colour</p>
                    <p className="text-xl font-bold text-slate-900">{product.colour}</p>
                  </div>
                )}
                {product.batteryPct && (
                  <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Battery</p>
                    <p className="text-xl font-bold text-slate-900">{product.batteryPct}%</p>
                  </div>
                )}
                {product.warrantyMonths !== null && product.warrantyMonths > 0 && (
                  <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Warranty</p>
                    <p className="text-xl font-bold text-slate-900">{product.warrantyMonths} Months</p>
                  </div>
                )}
              </div>
            </div>

            {/* What's Included */}
            <div className="mt-12 border-t border-slate-200/60 pt-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">What's in the box</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <li className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                  <span className="text-lg font-bold text-slate-700">The Device</span>
                </li>
                {product.hasBox && (
                  <li className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="text-lg font-bold text-slate-700">Original Box</span>
                  </li>
                )}
                {product.hasCharger && (
                  <li className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="text-lg font-bold text-slate-700">Power Adapter</span>
                  </li>
                )}
                {product.hasCable && (
                  <li className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="text-lg font-bold text-slate-700">Charging Cable</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Shop Details / Trust */}
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-900">Sold by {shop.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{shop.addressLine1}, {shop.city}</p>
            </div>

          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (Mobile + Desktop) */}
      {product.availability === "AVAILABLE" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/80 p-4 backdrop-blur-xl sm:px-6 lg:static lg:mt-10 lg:border-none lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mx-auto max-w-5xl">
            <WhatsAppCTA productId={product.id} whatsappUrl={whatsappUrl} />
          </div>
        </div>
      )}
    </>
  );
}
