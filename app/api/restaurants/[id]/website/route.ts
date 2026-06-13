import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();

  await prisma.restaurant.update({
    where: { id },
    data: {
      websiteEnabled: formData.get("websiteEnabled") === "on",
      slug: normalizeSlug(String(formData.get("slug") || "")),
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

  return NextResponse.redirect(
    new URL(`/restaurants/${id}/website`, request.url)
  );
}