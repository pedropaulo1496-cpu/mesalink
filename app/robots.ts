import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mesalink.pt";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/software-para-restaurantes", "/sistema-reservas-restaurantes", "/qr-ordering-restaurantes", "/website-para-restaurantes", "/marketing-para-restaurantes", "/pricing", "/contact", "/s/", "/r/"],
      disallow: [
        "/api/",
        "/dashboard",
        "/restaurants/",
        "/billing",
        "/onboarding",
        "/trial-expired",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
