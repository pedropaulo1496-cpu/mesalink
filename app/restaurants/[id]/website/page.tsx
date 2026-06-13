import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RestaurantWebsitePage({ params }: PageProps) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Mini-site</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cria uma página pública simples para o restaurante receber reservas.
        </p>
      </div>

      <form
  action={`/api/restaurants/${restaurant.id}/website`}
  method="POST"
  className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
>
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="websiteEnabled"
            defaultChecked={restaurant.websiteEnabled}
          />
          <span className="text-sm font-medium">Ativar mini-site público</span>
        </label>

        <div>
          <label className="text-sm font-medium">Slug público</label>
          <input
            name="slug"
            defaultValue={restaurant.slug ?? ""}
            placeholder="ex: restaurante-demo"
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
          <p className="mt-1 text-xs text-zinc-500">
            O site ficará disponível em /s/slug
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">Título principal</label>
          <input
            name="websiteHeadline"
            defaultValue={restaurant.websiteHeadline ?? ""}
            placeholder="Reservas online no teu restaurante favorito"
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            name="websiteDescription"
            defaultValue={restaurant.websiteDescription ?? ""}
            rows={4}
            placeholder="Uma breve descrição do restaurante..."
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tipo de cozinha</label>
          <input
            name="websiteCuisine"
            defaultValue={restaurant.websiteCuisine ?? ""}
            placeholder="Portuguesa, Japonesa, Coreana..."
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Instagram</label>
          <input
            name="websiteInstagram"
            defaultValue={restaurant.websiteInstagram ?? ""}
            placeholder="https://instagram.com/restaurante"
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Imagem principal</label>
          <input
            name="websiteHeroImage"
            defaultValue={restaurant.websiteHeroImage ?? ""}
            placeholder="URL da imagem"
            className="mt-1 w-full rounded-xl border px-4 py-3"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Cor principal</label>
          <input
            type="color"
            name="websitePrimaryColor"
            defaultValue={restaurant.websitePrimaryColor ?? "#111827"}
            className="mt-1 h-12 w-24 rounded-xl border"
          />
        </div>

        <button
  type="submit"
  className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
>
  Guardar mini-site
</button>
      </form>

      {restaurant.slug && (
        <a
          href={`/s/${restaurant.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-medium text-zinc-700 underline"
        >
          Ver site público
        </a>
      )}
    </div>
  );
}