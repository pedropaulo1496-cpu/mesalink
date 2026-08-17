import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.mesalink.pt";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/software-para-restaurantes", "/sistema-reservas-restaurantes", "/qr-ordering-restaurantes", "/website-para-restaurantes", "/marketing-para-restaurantes", "/partners", "/pricing", "/contact", "/s/", "/r/"],
      disallow: [
        "/api/",
        "/dashboard",
        "/restaurants/",
        "/billing",
        "/onboarding",
        "/trial-expired",
        "/partners/app",
        "/partners/register",
        "/partners/cards/",
        "/backoffice",
        "/backoffice-access",
        "/hq",
        "/admin",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
