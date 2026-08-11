import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mesalink.pt";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/software-para-restaurantes`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${baseUrl}/sistema-reservas-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/qr-ordering-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/website-para-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/marketing-para-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/guias/como-escolher-software-para-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
