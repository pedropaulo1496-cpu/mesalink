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
      websiteTemplate: getText(formData, "websiteTemplate"),
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
      websiteGalleryImage5: getText(formData, "websiteGalleryImage5"),
      websiteGalleryImage6: getText(formData, "websiteGalleryImage6"),

      websiteMenuTitle: getText(formData, "websiteMenuTitle"),
      websiteMenuDescription: getText(formData, "websiteMenuDescription"),

      websiteDish1Name: getText(formData, "websiteDish1Name"),
      websiteDish1Description: getText(formData, "websiteDish1Description"),
      websiteDish1Price: getText(formData, "websiteDish1Price"),
      websiteDish1Image: getText(formData, "websiteDish1Image"),

      websiteDish2Name: getText(formData, "websiteDish2Name"),
      websiteDish2Description: getText(formData, "websiteDish2Description"),
      websiteDish2Price: getText(formData, "websiteDish2Price"),
      websiteDish2Image: getText(formData, "websiteDish2Image"),

      websiteDish3Name: getText(formData, "websiteDish3Name"),
      websiteDish3Description: getText(formData, "websiteDish3Description"),
      websiteDish3Price: getText(formData, "websiteDish3Price"),
      websiteDish3Image: getText(formData, "websiteDish3Image"),

      websiteDish4Name: getText(formData, "websiteDish4Name"),
      websiteDish4Description: getText(formData, "websiteDish4Description"),
      websiteDish4Price: getText(formData, "websiteDish4Price"),
      websiteDish4Image: getText(formData, "websiteDish4Image"),

      websiteDish5Name: getText(formData, "websiteDish5Name"),
      websiteDish5Description: getText(formData, "websiteDish5Description"),
      websiteDish5Price: getText(formData, "websiteDish5Price"),
      websiteDish5Image: getText(formData, "websiteDish5Image"),

      websiteDish6Name: getText(formData, "websiteDish6Name"),
      websiteDish6Description: getText(formData, "websiteDish6Description"),
      websiteDish6Price: getText(formData, "websiteDish6Price"),
      websiteDish6Image: getText(formData, "websiteDish6Image"),

      websiteSeoTitle: getText(formData, "websiteSeoTitle"),
      websiteSeoDescription: getText(formData, "websiteSeoDescription"),

      customDomain: getText(formData, "customDomain"),
    },
  });

  return NextResponse.redirect(
    new URL(`/restaurants/${id}/website?success=1`, request.url)
  );
}