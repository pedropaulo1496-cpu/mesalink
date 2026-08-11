import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { WebsiteEditorClient } from "./WebsiteEditorClient";
import { publicDomainOrder } from "@/lib/domain-orders";
import { isVercelDomainServiceConfigured } from "@/lib/vercel-domains";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; domain?: string; order?: string }>;
};

export default async function RestaurantWebsitePage({
  params,
  searchParams,
}: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    include: {
      websiteMenus: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      domainOrders: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!restaurant) notFound();

  const { domainOrders, ...restaurantData } = restaurant;

  return (
    <WebsiteEditorClient
      restaurant={restaurantData}
      saved={query?.success === "1"}
      domainOrder={publicDomainOrder(domainOrders[0] || null)}
      domainServiceConfigured={isVercelDomainServiceConfigured()}
    />
  );
}
