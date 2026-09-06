import { cache } from "react";
import { db } from "@/server/db/client";
import type { PublicShopInfo } from "@/types";

/**
 * Retrieves the singleton Shop configuration for this deployment.
 * The system assumes exactly one Shop row exists.
 *
 * Wrapped in React `cache()` so the many call sites across a layout, its
 * generateMetadata, and page bodies share a SINGLE DB query per request
 * instead of hitting the (remote) database once each.
 */
export const getShop = cache(async () => {
  const shop = await db.shop.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!shop) {
    throw new Error("Shop configuration not found in the database. Have you run the seed script?");
  }

  return shop;
});

/**
 * Maps the raw Prisma Shop row → PublicShopInfo DTO.
 * Safely casts JSON columns and strips no private data (Shop has none).
 */
export function toPublicShopInfo(shop: Awaited<ReturnType<typeof getShop>>): PublicShopInfo {
  return {
    name: shop.name,
    slug: shop.slug,
    tagline: shop.tagline,
    about: shop.about,
    logoUrl: shop.logoUrl,
    footerLogoUrl: shop.footerLogoUrl,
    dashboardLogoUrl: shop.dashboardLogoUrl,
    coverUrl: shop.coverUrl,
    phone: shop.phone,
    whatsapp: shop.whatsapp,
    email: shop.email,
    addressLine1: shop.addressLine1,
    addressLine2: shop.addressLine2,
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    lat: shop.lat,
    lng: shop.lng,
    mapsUrl: shop.mapsUrl,
    instagram: shop.instagram,
    facebook: shop.facebook,
    hours: (shop.hours ?? {}) as Record<string, string>,
    yearsInBiz: shop.yearsInBiz,
    trustBadges: (shop.trustBadges ?? []) as string[],
    policies: (shop.policies ?? {}) as Record<string, string>,
    isActive: shop.isActive,
  };
}

/**
 * Builds a clean wa.me URL from a phone number string.
 * Strips all non-digits for universal compatibility.
 */
export function buildWhatsAppHref(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
