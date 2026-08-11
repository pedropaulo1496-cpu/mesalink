import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const t = await getTranslations("restaurants.list");

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">{t("title")}</h1>
            <p className="text-gray-600">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              href="/restaurants/new"
              className="bg-black text-white px-6 py-3 rounded"
            >
              {t("createButton")}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {restaurant.name}
                </h2>

                <p className="text-gray-600">
                  {restaurant.address}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  /reserve/{restaurant.slug}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  {t("manage")}
                </Link>

                <Link
                  href={`/restaurants/${restaurant.id}/reservations`}
                  className="border px-4 py-2 rounded"
                >
                  {t("reservations")}
                </Link>

                <Link
                  href={`/restaurants/${restaurant.id}/calendar`}
                  className="border px-4 py-2 rounded"
                >
                  {t("calendar")}
                </Link>

                <Link
                  href={`/reserve/${restaurant.slug}`}
                  className="border px-4 py-2 rounded"
                >
                  {t("publicPage")}
                </Link>
              </div>
            </div>
          ))}

          {restaurants.length === 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              {t("emptyState")}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}