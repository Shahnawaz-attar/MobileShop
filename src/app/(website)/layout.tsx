import { PublicNavbar } from "@/components/public/PublicNavbar";
import { PublicFooter } from "@/components/public/PublicFooter";
import { getShop, toPublicShopInfo, buildWhatsAppHref } from "@/server/modules/shop";
import { getActiveAnnouncement } from "@/server/modules/content";
import Link from "next/link";
import { FloatingWhatsApp } from "@/components/public/FloatingWhatsApp";

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rawShop, announcement] = await Promise.all([
    getShop(),
    getActiveAnnouncement(),
  ]);
  const shop = toPublicShopInfo(rawShop);
  const whatsAppHref = buildWhatsAppHref(shop.whatsapp);

  // Banner content: active announcement > warranty policy > default tagline
  const bannerText = announcement?.title || shop.policies.warranty || `Premium Pre-Owned Devices at ${shop.name}`;
  const bannerCta = announcement?.ctaLabel || "Shop Now";
  const bannerHref = announcement?.ctaHref || "/phones";

  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-black/10">
      {/* Top Announcement Banner */}
      <div className="bg-black px-4 py-2.5 text-center text-[13px] font-medium tracking-wide text-white sm:text-sm">
        {bannerText}
        <Link href={bannerHref} className="ml-2 font-bold hover:text-slate-300 transition-colors">
          {bannerCta} &rarr;
        </Link>
      </div>

      <PublicNavbar shopName={shop.name} logoUrl={shop.logoUrl} />
      <main className="flex-grow">{children}</main>
      <PublicFooter shop={shop} whatsAppHref={whatsAppHref} />
      
      {/* WhatsApp CTA — uses real shop number from DB */}
      <FloatingWhatsApp href={whatsAppHref} shopName={shop.name} />
    </div>
  );
}
