import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publicReservationUrl } from "@/lib/public-links";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicReserveRedirectPage({ params }: PageProps) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) {
    redirect("/");
  }

  redirect(publicReservationUrl(restaurant.slug));
}
