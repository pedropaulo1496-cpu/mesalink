import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";

async function createRestaurant(formData: FormData) {
  "use server";

  const name = String(formData.get("name"));
  const slug = String(formData.get("slug"));
  const email = String(formData.get("email"));
  const phone = String(formData.get("phone"));
  const address = String(formData.get("address"));

  try {
    await prisma.restaurant.create({
      data: { name, slug, email, phone, address },
    });

    redirect("/");
  } catch (err) {
    if ((err as any)?.code === "P2002") {
      redirect("/restaurants/new?error=slug_taken");
    }

    throw err;
  }
}

export default async function NewRestaurantPage() {
  const t = await getTranslations("restaurants.new");

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <LanguageSwitcher />
        </div>

        <form action={createRestaurant} className="space-y-4">
          <input
            name="name"
            placeholder={t("namePlaceholder")}
            className="w-full border p-3 rounded"
            required
          />

          <input
            name="slug"
            placeholder={t("slugPlaceholder")}
            className="w-full border p-3 rounded"
            required
          />

          <input
            name="email"
            placeholder={t("emailPlaceholder")}
            className="w-full border p-3 rounded"
          />

          <input
            name="phone"
            placeholder={t("phonePlaceholder")}
            className="w-full border p-3 rounded"
          />

          <input
            name="address"
            placeholder={t("addressPlaceholder")}
            className="w-full border p-3 rounded"
          />

          <button className="w-full bg-black text-white p-3 rounded">
            {t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}