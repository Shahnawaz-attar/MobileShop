import { MetadataRoute } from "next";
import { db } from "@/server/db/client";
import { resolvePublicAppUrl } from "@/lib/qr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = resolvePublicAppUrl();

  // Fetch all active products
  const products = await db.product.findMany({
    where: {
      availability: { in: ["AVAILABLE", "RESERVED"] },
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/phones/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/phones`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...productUrls,
  ];
}
