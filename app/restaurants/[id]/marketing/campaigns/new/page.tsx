import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import NewCampaignForm from "@/components/marketing/NewCampaignForm";

export default async function NewCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ segment?: string; tag?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="Marketing"
        />

        <section className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
            Marketing Suite
          </p>

          <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
            Nova campanha
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
            Envie uma campanha para clientes VIP, inativos ou para toda a base
            com autorização de marketing.
          </p>

          <NewCampaignForm
            restaurantId={id}
            initialSegment={query.segment || "ALL"}
            initialTag={query.tag || ""}
          />
        </section>
      </div>
    </main>
  );
}