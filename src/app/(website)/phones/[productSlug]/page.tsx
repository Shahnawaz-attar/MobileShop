import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProduct } from "@/server/modules/catalog";
import { getShop } from "@/server/modules/shop";
import { formatINR } from "@/lib/money";
import { CONDITION_LABELS, CONDITION_DESCRIPTIONS } from "@/lib/constants";
import { buildWhatsAppLink, generateProductEnquiryText, generateProductShareText, buildWhatsAppShareLink } from "@/lib/whatsapp";
import { resolvePublicAppUrl } from "@/lib/qr";
import { ProductGallery } from "./ProductGallery";
import { ProductShareBar } from "@/components/public/ProductShareBar";
import { ProductEngagement } from "@/components/public/ProductEngagement";
import { ProductTrustProof } from "@/components/public/ProductTrustProof";
import { ProductViewTracker } from "./ProductViewTracker";
import { FadeIn } from "@/components/shared/FadeIn";
import { ogSafeCloudinaryUrl } from "@/lib/image";

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
  const ogImageUrl = `/api/og/product?title=${encodeURIComponent(fullName)}&price=${product.pricePaise / 100}${
    primaryMedia
      ? `&image=${encodeURIComponent(ogSafeCloudinaryUrl(primaryMedia.url))}&imageW=${primaryMedia.width ?? 800}&imageH=${primaryMedia.height ?? 800}`
      : ""
  }`;

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
  const shareText = generateProductShareText(
    {
      title: product.title,
      storageGb: product.storageGb,
      colour: product.colour,
      pricePaise: product.pricePaise,
      condition: CONDITION_LABELS[product.condition],
    },
    productUrl,
    shop.name
  );
  const shareWhatsappUrl = buildWhatsAppShareLink(shareText);

  const discount = product.mrpPaise && product.mrpPaise > product.pricePaise
    ? Math.round(((product.mrpPaise - product.pricePaise) / product.mrpPaise) * 100)
    : 0;

  const primaryMedia = product.media.find(m => m.kind === "FRONT") || product.media[0];
  const variantStr = [product.storageGb ? `${product.storageGb}GB` : null, product.colour].filter(Boolean).join(" ");
  const fullName = variantStr ? `${product.title} (${variantStr})` : product.title;
  const statusImageUrl = `/api/og/product?variant=status&title=${encodeURIComponent(fullName)}&price=${product.pricePaise / 100}&shop=${encodeURIComponent(shop.name)}${
    primaryMedia
      ? `&image=${encodeURIComponent(ogSafeCloudinaryUrl(primaryMedia.url))}&imageW=${primaryMedia.width ?? 800}&imageH=${primaryMedia.height ?? 800}`
      : ""
  }`;
  
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

      <main
        className={`mx-auto max-w-6xl min-h-screen bg-white px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${
          product.availability === "AVAILABLE" ? "pb-28 lg:pb-8" : ""
        }`}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">

          <FadeIn direction="up" className="lg:sticky lg:top-8 lg:h-max">
            <ProductGallery media={product.media} />
          </FadeIn>

          <FadeIn direction="up" delay={100} className="flex flex-col overflow-visible">
            {/* Badges */}
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-ink/5 px-3.5 py-1.5 text-xs font-bold text-ink">
                {CONDITION_LABELS[product.condition]}
              </span>
              {product.availability === "RESERVED" && (
                <span className="inline-flex items-center rounded-full bg-warning px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                  Reserved
                </span>
              )}
              {product.availability === "SOLD" && (
                <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                  Sold Out
                </span>
              )}
            </div>
            <p className="mb-6 text-sm font-medium leading-relaxed text-ink-soft">
              {CONDITION_DESCRIPTIONS[product.condition]}
            </p>

            <h1 className="mb-3 text-3xl font-black leading-[1.12] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              {product.title}
            </h1>

            <p className="text-lg font-bold text-ink-soft">
              {product.brand.name}{product.model?.name ? <span className="mx-2 text-ink-faint">•</span> : ""}{product.model?.name}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2 border-b border-border pb-6 sm:mt-8 sm:pb-8">
              <span className="text-4xl font-black leading-none tracking-tight text-ink sm:text-5xl">
                {formatINR(product.pricePaise)}
              </span>
              {product.mrpPaise && product.mrpPaise > product.pricePaise && (
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-start">
                  <span className="text-lg font-semibold text-ink-faint line-through sm:text-xl">
                    {formatINR(product.mrpPaise)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                    {discount}% OFF
                  </span>
                </div>
              )}
            </div>

            <ProductEngagement
              publishedAt={product.publishedAt}
              viewCount={product.viewCount}
              whatsappClicksWeek={product.whatsappClicksWeek}
            />

            {product.availability === "AVAILABLE" && (
              <div className="mt-6 lg:hidden">
                <ProductShareBar
                  mode="secondary-only"
                  productId={product.id}
                  productUrl={productUrl}
                  whatsappUrl={whatsappUrl}
                  shareWhatsappUrl={shareWhatsappUrl}
                  statusImageUrl={statusImageUrl}
                />
              </div>
            )}

            <ProductTrustProof
              hasBill={product.hasBill}
              purchasedAt={product.purchasedAt}
              billUrl={product.billUrl}
            />

            {/* Key Specifications Grid */}
            <div className="mt-10">
              <h3 className="mb-6 text-2xl font-black tracking-tight text-ink">Device Specifications</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {product.storageGb && (
                  <div className="device-card p-5">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-ink-faint">Storage</p>
                    <p className="text-xl font-bold text-ink">{product.storageGb} GB</p>
                  </div>
                )}
                {product.ramGb && (
                  <div className="device-card p-5">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-ink-faint">RAM</p>
                    <p className="text-xl font-bold text-ink">{product.ramGb} GB</p>
                  </div>
                )}
                {product.colour && (
                  <div className="device-card p-5">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-ink-faint">Colour</p>
                    <p className="text-xl font-bold text-ink">{product.colour}</p>
                  </div>
                )}
                {product.batteryPct && (
                  <div className="device-card p-5">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-ink-faint">Battery</p>
                    <p className="text-xl font-bold text-ink">{product.batteryPct}%</p>
                  </div>
                )}
                {product.warrantyMonths !== null && product.warrantyMonths > 0 && (
                  <div className="device-card p-5">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-ink-faint">Warranty</p>
                    <p className="text-xl font-bold text-ink">{product.warrantyMonths} Months</p>
                  </div>
                )}
              </div>
            </div>

            {/* What's Included */}
            <div className="mt-12 border-t border-border pt-10">
              <h3 className="mb-6 text-2xl font-black tracking-tight text-ink">What&apos;s in the box</h3>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <li className="device-card flex items-center gap-4 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span className="text-base font-bold text-ink">The Device</span>
                </li>
                {product.hasBox && (
                  <li className="device-card flex items-center gap-4 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <span className="text-base font-bold text-ink">Original Box</span>
                  </li>
                )}
                {product.hasCharger && (
                  <li className="device-card flex items-center gap-4 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <span className="text-base font-bold text-ink">Power Adapter</span>
                  </li>
                )}
                {product.hasCable && (
                  <li className="device-card flex items-center gap-4 p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <span className="text-base font-bold text-ink">Charging Cable</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Shop Details / Trust */}
            <div className="device-card mt-10 p-6">
              <h3 className="font-bold text-ink">Sold by {shop.name}</h3>
              <p className="mt-1 text-sm font-medium text-ink-soft">{shop.addressLine1}, {shop.city}</p>
            </div>

          </FadeIn>
        </div>
      </main>

      {product.availability === "AVAILABLE" && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 p-3 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="mx-auto max-w-6xl px-1">
              <ProductShareBar
                mode="whatsapp-only"
                productId={product.id}
                productUrl={productUrl}
                whatsappUrl={whatsappUrl}
                shareWhatsappUrl={shareWhatsappUrl}
                statusImageUrl={statusImageUrl}
              />
            </div>
          </div>
          <div className="hidden lg:block mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
            <ProductShareBar
              productId={product.id}
              productUrl={productUrl}
              whatsappUrl={whatsappUrl}
              shareWhatsappUrl={shareWhatsappUrl}
              statusImageUrl={statusImageUrl}
            />
          </div>
        </>
      )}
    </>
  );
}
