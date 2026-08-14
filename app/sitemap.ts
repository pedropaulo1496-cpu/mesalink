import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.mesalink.pt";
  const now = new Date();
  const restaurants = await prisma.restaurant.findMany({
    where: { websiteEnabled: true },
    select: {
      slug: true,
      customDomain: true,
      customDomainVerified: true,
      updatedAt: true,
      user: { select: { subscription: true } },
    },
    take: 5000,
  });
  const publicRestaurants = restaurants.filter((restaurant) => {
    const subscription = restaurant.user?.subscription;
    return subscription?.status === "ACTIVE" || (subscription?.status === "TRIAL" && subscription.trialEndsAt && subscription.trialEndsAt > now);
  });

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
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/guias/como-escolher-software-para-restaurantes`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/global-sales-partners`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...publicRestaurants.map((restaurant) => ({
      url:
        restaurant.customDomainVerified && restaurant.customDomain
          ? `https://${restaurant.customDomain}`
          : `${baseUrl}/s/${restaurant.slug}`,
      lastModified: restaurant.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];
}
