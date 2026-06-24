import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { WebsiteEditorClient } from "./WebsiteEditorClient";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string }>;
};

export default async function RestaurantWebsitePage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const hasWebsiteAccess = await canAccessApp(session.user.email);

  if (!hasWebsiteAccess) {
    redirect("/billing?addon=website");
  }

  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      websiteMenus: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!restaurant) notFound();

  return (
    <WebsiteEditorClient
      restaurant={restaurant}
      saved={query?.success === "1"}
    />
  );
}