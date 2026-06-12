"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function updateRestaurantWebsite(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId"));
  const rawSlug = String(formData.get("slug") || "");

  const slug = normalizeSlug(rawSlug);

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      websiteEnabled: formData.get("websiteEnabled") === "on",
      slug,
      websiteHeadline: String(formData.get("websiteHeadline") || ""),
      websiteDescription: String(formData.get("websiteDescription") || ""),
      websiteCuisine: String(formData.get("websiteCuisine") || ""),
      websiteInstagram: String(formData.get("websiteInstagram") || ""),
      websiteHeroImage: String(formData.get("websiteHeroImage") || ""),
      websitePrimaryColor: String(
        formData.get("websitePrimaryColor") || "#111827"
      ),
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/website`);
  revalidatePath(`/s/${slug}`);

  redirect(`/restaurants/${restaurantId}/website`);
}