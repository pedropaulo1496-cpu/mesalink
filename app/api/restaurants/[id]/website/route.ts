import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { WEBSITE_AI_VERSION } from "@/lib/website-ai";

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getText(formData: FormData, key: string, maxLength = 2000) {
  return String(formData.get(key) || "").trim().slice(0, maxLength);
}

function getJsonArray(formData: FormData, key: string) {
  try {
    const parsed = JSON.parse(String(formData.get(key) || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const currentRestaurant = user
    ? await prisma.restaurant.findFirst({ where: { id, userId: user.id }, select: { id: true, slug: true } })
    : null;
  if (!currentRestaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const formData = await request.formData();
  const requestedSlug = normalizeSlug(getText(formData, "slug", 100));
  const slug = requestedSlug || currentRestaurant.slug;
  const slugOwner = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } });
  if (slugOwner && slugOwner.id !== id) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/website?error=slug`, request.url), 303);
  }

  const menuTitles = formData.getAll("websiteMenuItemTitle[]").map(String);
  const menuPdfs = formData.getAll("websiteMenuItemPdf[]").map(String);

  const menus = menuPdfs
    .map((pdf, index) => ({
      title: (menuTitles[index] || `Menu ${index + 1}`).trim().slice(0, 100),
      pdf: pdf.trim(),
      sortOrder: index,
    }))
    .filter((menu) => /^https:\/\//i.test(menu.pdf))
    .slice(0, 12);
  const faqItems = getJsonArray(formData, "websiteFaqItems")
    .map((item) => {
      const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        question: String(value.question || "").trim().slice(0, 160),
        answer: String(value.answer || "").trim().slice(0, 360),
      };
    })
    .filter((item) => item.question && item.answer)
    .slice(0, 4);
  const specialties = getJsonArray(formData, "websiteSpecialties")
    .map((item) => String(item || "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 6);
  const generatedWithAi = formData.get("websiteAiGenerated") === "1";

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id },
      data: {
        name: getText(formData, "name", 120) || undefined,
        email: getText(formData, "email", 254),
        phone: getText(formData, "phone", 40),
        address: getText(formData, "address", 300),

        websiteEnabled: formData.get("websiteEnabled") === "on",
        websiteTemplate: getText(formData, "websiteTemplate", 30) || "PREMIUM",
        websitePrimaryColor: /^#[0-9a-f]{6}$/i.test(getText(formData, "websitePrimaryColor", 7)) ? getText(formData, "websitePrimaryColor", 7) : "#111827",
        slug,

        websiteHeadline: getText(formData, "websiteHeadline"),
        websiteDescription: getText(formData, "websiteDescription"),
        websiteCuisine: getText(formData, "websiteCuisine"),
        websiteInstagram: getText(formData, "websiteInstagram", 200),
        websiteHeroImage: getText(formData, "websiteHeroImage", 1000),
        websiteLogoImage: getText(formData, "websiteLogoImage", 1000),

        websiteAboutTitle: getText(formData, "websiteAboutTitle"),
        websiteAboutText: getText(formData, "websiteAboutText"),
        websiteFeatureTitle: getText(formData, "websiteFeatureTitle"),
        websiteFeatureText: getText(formData, "websiteFeatureText"),

        websiteSectionTitle: getText(formData, "websiteSectionTitle"),
        websiteSectionText: getText(formData, "websiteSectionText"),
        websiteGalleryTitle: getText(formData, "websiteGalleryTitle"),
        websiteGalleryDescription: getText(formData, "websiteGalleryDescription"),
        websiteLocationTitle: getText(formData, "websiteLocationTitle"),
        websiteLocationDescription: getText(formData, "websiteLocationDescription"),
        websiteFinalCtaTitle: getText(formData, "websiteFinalCtaTitle"),
        websiteFinalCtaText: getText(formData, "websiteFinalCtaText"),
        websiteFaqTitle: getText(formData, "websiteFaqTitle", 120),
        websiteFaqItems: faqItems as Prisma.InputJsonValue,
        websiteSpecialties: specialties,
        ...(generatedWithAi ? { websiteLastGeneratedAt: new Date(), websiteAiVersion: WEBSITE_AI_VERSION } : {}),

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

        // Mantém compatibilidade com sites antigos enquanto migramos para WebsiteMenu[]
        websiteMenuPdf: menus[0]?.pdf || "",

        websiteSeoTitle: getText(formData, "websiteSeoTitle", 70),
        websiteSeoDescription: getText(formData, "websiteSeoDescription", 180),
        customDomain: getText(formData, "customDomain", 253),
      },
    });

    await tx.websiteMenu.deleteMany({
      where: {
        restaurantId: id,
      },
    });

    if (menus.length > 0) {
      await tx.websiteMenu.createMany({
        data: menus.map((menu) => ({
          title: menu.title,
          pdf: menu.pdf,
          sortOrder: menu.sortOrder,
          restaurantId: id,
        })),
      });
    }
  });

  return NextResponse.redirect(
    new URL(`/restaurants/${id}/website?success=1`, request.url)
  );
}
