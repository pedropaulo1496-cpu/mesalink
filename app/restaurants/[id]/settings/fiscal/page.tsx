import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import FiscalSettingsClient from "./FiscalSettingsClient";

export default async function FiscalSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      fiscalIntegration: true,
      fiscalDocuments: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!restaurant) notFound();

  const documents = restaurant.fiscalDocuments.map((document) => ({
    ...document,
    totalAmount: Number(document.totalAmount),
  }));

  return (
    <main className="flex min-h-screen bg-[#F6F1EA] text-[#171412]">
      <RestaurantSidebar
        id={restaurant.id}
        restaurantName={restaurant.name}
        active="Definições"
      />

      <FiscalSettingsClient
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        integration={restaurant.fiscalIntegration}
        documents={documents}
      />
    </main>
  );
}