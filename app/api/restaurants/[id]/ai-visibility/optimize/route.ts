import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { calculateAiVisibility } from "@/lib/ai-visibility";
import {
  AI_CREDIT_COSTS,
  hasGrowthAccess,
  InsufficientAiCreditsError,
  refundAiCredits,
  spendAiCredits,
} from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import {
  generateWebsiteBlueprint,
  getSuggestedWebsiteImages,
  loadWebsiteAiContext,
  WEBSITE_AI_VERSION,
} from "@/lib/website-ai";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "A otimização AI está temporariamente indisponível." }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user || !hasGrowthAccess(user.subscription)) {
    return NextResponse.json({ error: "O Growth Engine está disponível no plano Growth." }, { status: 403 });
  }
  const context = await loadWebsiteAiContext(id);
  if (!context || context.userId !== user.id) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const brief = typeof body?.brief === "string" ? body.brief.trim().slice(0, 1600) : "";
  const reviews = await prisma.reviewFeedback.aggregate({
    where: { restaurantId: id },
    _count: { id: true },
    _avg: { rating: true },
  });
  const products = context.orderingCategories.flatMap((category) => category.products);
  const before = calculateAiVisibility({
    ...context,
    menuCount: context.websiteMenus.length,
    productCount: products.length,
    describedProductCount: products.filter((product) => product.description?.trim()).length,
    reviewCount: reviews._count.id,
    averageRating: reviews._avg.rating || 0,
  });
  const optimization = await prisma.aiVisibilityOptimization.create({
    data: { restaurantId: id, beforeScore: before.overall, creditCost: AI_CREDIT_COSTS.AI_VISIBILITY_OPTIMIZE },
  });
  const creditReference = `ai_visibility_optimize:${optimization.id}`;
  let creditsRemaining = user.subscription?.aiCredits || 0;

  try {
    const debit = await spendAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.AI_VISIBILITY_OPTIMIZE,
      feature: "AI_VISIBILITY_OPTIMIZE",
      description: `Growth Engine GEO para ${context.name}`,
      reference: creditReference,
    });
    creditsRemaining = debit.balance;
  } catch (error) {
    await prisma.aiVisibilityOptimization.delete({ where: { id: optimization.id } });
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({
        error: `Saldo insuficiente. Aplicar o pacote GEO custa ${AI_CREDIT_COSTS.AI_VISIBILITY_OPTIMIZE} créditos.`,
        code: "INSUFFICIENT_AI_CREDITS",
        required: error.required,
        available: error.available,
      }, { status: 402 });
    }
    throw error;
  }

  try {
    const blueprint = await generateWebsiteBlueprint({ context, brief });
    const images = fillImageSlots(context, getSuggestedWebsiteImages(context));
    const descriptionsById = new Map(
      blueprint.productDescriptions
        .filter((item) => products.some((product) => product.id === item.productId && !product.description?.trim()))
        .map((item) => [item.productId, item.description]),
    );
    const actions = [
      "WEBSITE_CONTENT",
      "LOCAL_SEO",
      "GEO_FAQ",
      "STRUCTURED_DATA",
      "AI_READABLE_FEED",
      "WEBSITE_PUBLISHED",
    ];
    if (descriptionsById.size) actions.push("DISH_DESCRIPTIONS");
    if (images.some(Boolean)) actions.push("EXISTING_IMAGES_REUSED");

    let dishesUpdated = 0;
    await prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id },
        data: {
          websiteEnabled: true,
          websiteTemplate: blueprint.template,
          websitePrimaryColor: blueprint.primaryColor,
          websiteHeadline: blueprint.headline,
          websiteDescription: blueprint.description,
          websiteCuisine: blueprint.cuisine,
          websiteAboutTitle: blueprint.aboutTitle,
          websiteAboutText: blueprint.aboutText,
          websiteFeatureTitle: blueprint.featureTitle,
          websiteFeatureText: blueprint.featureText,
          websiteSectionTitle: blueprint.sectionTitle,
          websiteSectionText: blueprint.sectionText,
          websiteGalleryTitle: blueprint.galleryTitle,
          websiteGalleryDescription: blueprint.galleryDescription,
          websiteGalleryTitle1: blueprint.galleryTitles[0] || null,
          websiteGalleryTitle2: blueprint.galleryTitles[1] || null,
          websiteGalleryTitle3: blueprint.galleryTitles[2] || null,
          websiteGalleryTitle4: blueprint.galleryTitles[3] || null,
          websiteLocationTitle: blueprint.locationTitle,
          websiteLocationDescription: blueprint.locationDescription,
          websiteFinalCtaTitle: blueprint.ctaTitle,
          websiteFinalCtaText: blueprint.ctaText,
          websiteMenuTitle: blueprint.menuTitle,
          websiteMenuDescription: blueprint.menuDescription,
          websiteSeoTitle: blueprint.seoTitle,
          websiteSeoDescription: blueprint.seoDescription,
          websiteFaqTitle: blueprint.faqTitle,
          websiteFaqItems: blueprint.faqItems as Prisma.InputJsonValue,
          websiteSpecialties: blueprint.specialties,
          websiteHeroImage: images[0] || context.websiteHeroImage,
          websiteGalleryImage1: images[1] || context.websiteGalleryImage1,
          websiteGalleryImage2: images[2] || context.websiteGalleryImage2,
          websiteGalleryImage3: images[3] || context.websiteGalleryImage3,
          websiteGalleryImage4: images[4] || context.websiteGalleryImage4,
          websiteLastGeneratedAt: new Date(),
          websiteAiVersion: WEBSITE_AI_VERSION,
        },
      });

      for (const [productId, description] of descriptionsById) {
        const result = await tx.orderingProduct.updateMany({
          where: { id: productId, OR: [{ description: null }, { description: "" }] },
          data: { description, activeOnWebsite: true },
        });
        dishesUpdated += result.count;
      }

      const describedProductCount = products.filter((product) => product.description?.trim()).length + dishesUpdated;
      const after = calculateAiVisibility({
        ...context,
        websiteEnabled: true,
        websiteHeadline: blueprint.headline,
        websiteDescription: blueprint.description,
        websiteCuisine: blueprint.cuisine,
        websiteAboutText: blueprint.aboutText,
        websiteSectionText: blueprint.sectionText,
        websiteGalleryDescription: blueprint.galleryDescription,
        websiteMenuDescription: blueprint.menuDescription,
        websiteSeoTitle: blueprint.seoTitle,
        websiteSeoDescription: blueprint.seoDescription,
        menuCount: context.websiteMenus.length,
        productCount: products.length,
        describedProductCount,
        reviewCount: reviews._count.id,
        averageRating: reviews._avg.rating || 0,
      });

      await tx.aiVisibilityOptimization.update({
        where: { id: optimization.id },
        data: {
          status: "COMPLETED",
          afterScore: after.overall,
          actions,
          fieldsFilled: countFilledFields(blueprint),
          dishesUpdated,
          completedAt: new Date(),
        },
      });
    });

    revalidatePath(`/restaurants/${id}/ai-visibility`);
    revalidatePath(`/restaurants/${id}/website`);
    revalidatePath(`/s/${context.slug}`);
    return NextResponse.json({
      success: true,
      optimizationId: optimization.id,
      actions,
      fieldsFilled: countFilledFields(blueprint),
      dishesUpdated,
      creditsRemaining,
    });
  } catch (error) {
    console.error("AI visibility optimization failed", error);
    await refundAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.AI_VISIBILITY_OPTIMIZE,
      feature: "AI_VISIBILITY_OPTIMIZE",
      description: `Créditos devolvidos: Growth Engine de ${context.name} não concluído`,
      reference: creditReference,
    }).catch(() => null);
    await prisma.aiVisibilityOptimization.update({
      where: { id: optimization.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 500) : "Optimization failed", completedAt: new Date() },
    }).catch(() => null);
    return NextResponse.json({ error: "A otimização não ficou concluída e os 20 créditos foram devolvidos." }, { status: 502 });
  }
}

function fillImageSlots(
  context: NonNullable<Awaited<ReturnType<typeof loadWebsiteAiContext>>>,
  suggestions: string[],
) {
  const existing = [
    context.websiteHeroImage,
    context.websiteGalleryImage1,
    context.websiteGalleryImage2,
    context.websiteGalleryImage3,
    context.websiteGalleryImage4,
  ];
  const used = new Set(existing.filter(Boolean));
  const available = suggestions.filter((image) => !used.has(image));
  return existing.map((image) => image || available.shift() || null);
}

function countFilledFields(blueprint: Awaited<ReturnType<typeof generateWebsiteBlueprint>>) {
  return [
    blueprint.headline, blueprint.description, blueprint.cuisine, blueprint.aboutTitle, blueprint.aboutText,
    blueprint.featureTitle, blueprint.featureText, blueprint.sectionTitle, blueprint.sectionText, blueprint.galleryTitle,
    blueprint.galleryDescription, blueprint.locationTitle, blueprint.locationDescription, blueprint.ctaTitle, blueprint.ctaText,
    blueprint.menuTitle, blueprint.menuDescription, blueprint.seoTitle, blueprint.seoDescription, blueprint.faqTitle,
    ...blueprint.specialties, ...blueprint.faqItems.flatMap((item) => [item.question, item.answer]),
  ].filter(Boolean).length;
}
