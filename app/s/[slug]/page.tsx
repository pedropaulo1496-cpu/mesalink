import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PublicWebsite } from "./PublicWebsite";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicRestaurantWebsitePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) notFound();

  return <PublicWebsite restaurant={restaurant} />;
}