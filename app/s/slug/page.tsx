import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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

  if (!slug) notFound();

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant || !restaurant.websiteEnabled) notFound();

  const primaryColor = restaurant.websitePrimaryColor || "#111827";

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        {restaurant.websiteHeroImage && (
          <img
            src={restaurant.websiteHeroImage}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}

        <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-20">
          {restaurant.websiteCuisine && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
              {restaurant.websiteCuisine}
            </p>
          )}

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            {restaurant.websiteHeadline || restaurant.name}
          </h1>

          {restaurant.websiteDescription && (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              {restaurant.websiteDescription}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`/r/${restaurant.slug}`}
              className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar mesa
            </a>

            {restaurant.websiteInstagram && (
              <a
                href={restaurant.websiteInstagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Powered by</p>
          <p className="text-lg font-bold text-zinc-900">MesaLink</p>
        </div>
      </section>
    </main>
  );
}