import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicWebsite } from "./PublicWebsite";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    return {
      title: "MesaLink",
      description: "Reservas online para restaurantes.",
    };
  }

  const title =
    restaurant.websiteSeoTitle ||
    restaurant.websiteHeadline ||
    restaurant.name;

  const description =
    restaurant.websiteSeoDescription ||
    restaurant.websiteDescription ||
    `${restaurant.name} - Reservas online.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: restaurant.websiteHeroImage
        ? [{ url: restaurant.websiteHeroImage }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: restaurant.websiteHeroImage
        ? [restaurant.websiteHeroImage]
        : [],
    },
  };
}

export default async function PublicRestaurantWebsitePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      websiteMenus: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!restaurant) notFound();

  return <PublicWebsite restaurant={restaurant} />;
}
