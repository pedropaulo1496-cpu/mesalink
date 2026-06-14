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

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
  });

  if (!restaurant) notFound();

  const primaryColor = restaurant.websitePrimaryColor || "#111827";
  const hasImage =
    restaurant.websiteHeroImage &&
    restaurant.websiteHeroImage.startsWith("http");

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        {hasImage && (
          <img
            src={restaurant.websiteHeroImage!}
            alt={restaurant.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-zinc-950" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-6 py-20">
          {restaurant.websiteCuisine && (
            <p className="mb-5 text-xs font-black uppercase tracking-[0.35em] text-white/70">
              {restaurant.websiteCuisine}
            </p>
          )}

          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            {restaurant.websiteHeadline || restaurant.name}
          </h1>

          {restaurant.websiteDescription && (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              {restaurant.websiteDescription}
            </p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={`/reserve/${restaurant.slug}`}
              className="rounded-full px-7 py-4 text-sm font-black text-white shadow-xl transition hover:scale-[1.02]"
              style={{ backgroundColor: primaryColor }}
            >
              Reservar mesa
            </a>

            {restaurant.websiteInstagram && (
              <a
                href={restaurant.websiteInstagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/25 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur hover:bg-white/15"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-3">
        {restaurant.address && (
          <InfoCard label="Morada" value={restaurant.address} />
        )}

        {restaurant.phone && (
          <InfoCard label="Telefone" value={restaurant.phone} />
        )}

        {restaurant.email && (
          <InfoCard label="Email" value={restaurant.email} />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-[2rem] border bg-white p-7 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Reservas online</p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">
                Reserva a tua mesa em segundos.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Escolhe o dia, hora e número de pessoas. O restaurante recebe a
                reserva diretamente no MesaLink.
              </p>
            </div>

            <a
              href={`/reserve/${restaurant.slug}`}
              className="inline-flex shrink-0 items-center justify-center rounded-full px-6 py-3 text-sm font-black text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Fazer reserva
            </a>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Powered by</p>
          <p className="text-lg font-black text-zinc-900">MesaLink</p>
        </div>
      </footer>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </p>
      <p className="mt-3 text-base font-bold text-zinc-900">{value}</p>
    </div>
  );
}