import { MetadataRoute } from "next";
import { resolvePublicAppUrl } from "@/lib/qr";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolvePublicAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
