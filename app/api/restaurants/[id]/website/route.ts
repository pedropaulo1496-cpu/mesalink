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

function getText(formData: FormData, key: string) {
  return String(formData.get(key) || "");
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
      websiteTemplate: getText(formData, "websiteTemplate") || "PREMIUM",
      websitePrimaryColor: getText(formData, "websitePrimaryColor") || "#111827",
      slug: normalizeSlug(getText(formData, "slug")),

      websiteHeadline: getText(formData, "websiteHeadline"),
      websiteDescription: getText(formData, "websiteDescription"),
      websiteCuisine: getText(formData, "websiteCuisine"),
      websiteInstagram: getText(formData, "websiteInstagram"),
      websiteHeroImage: getText(formData, "websiteHeroImage"),
      websiteLogoImage: getText(formData, "websiteLogoImage"),

      websiteAboutTitle: getText(formData, "websiteAboutTitle"),
      websiteAboutText: getText(formData, "websiteAboutText"),
      websiteFeatureTitle: getText(formData, "websiteFeatureTitle"),
      websiteFeatureText: getText(formData, "websiteFeatureText"),

      websiteGalleryImage1: getText(formData, "websiteGalleryImage1"),
      websiteGalleryImage2: getText(formData, "websiteGalleryImage2"),
      websiteGalleryImage3: getText(formData, "websiteGalleryImage3"),
      websiteGalleryImage4: getText(formData, "websiteGalleryImage4"),
      websiteGalleryTitle1: getText(formData, "websiteGalleryTitle1"),
      websiteGalleryTitle2: getText(formData, "websiteGalleryTitle2"),
      websiteGalleryTitle3: getText(formData, "websiteGalleryTitle3"),
      websiteGalleryTitle4: getText(formData, "websiteGalleryTitle4"),

      websiteMenuTitle: getText(formData, "websiteMenuTitle"),
      websiteMenuDescription: getText(formData, "websiteMenuDescription"),
      websiteMenuPdf: getText(formData, "websiteMenuPdf"),

      websiteSeoTitle: getText(formData, "websiteSeoTitle"),
      websiteSeoDescription: getText(formData, "websiteSeoDescription"),
      customDomain: getText(formData, "customDomain"),
    },
  });

  return NextResponse.redirect(
    new URL(`/restaurants/${id}/website?success=1`, request.url)
  );
}
