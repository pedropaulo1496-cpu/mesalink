import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  AI_CREDIT_COSTS,
  hasAppAccess,
  InsufficientAiCreditsError,
  refundAiCredits,
  spendAiCredits,
} from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import {
  generateWebsiteBlueprint,
  getSuggestedWebsiteImages,
  loadWebsiteAiContext,
} from "@/lib/website-ai";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "A geração AI está temporariamente indisponível." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const brief = [
    clean(body?.brief, 1200),
    clean(body?.cuisine, 140) ? `Tipo de cozinha indicado no editor: ${clean(body?.cuisine, 140)}` : "",
    clean(body?.address, 260) ? `Morada indicada no editor: ${clean(body?.address, 260)}` : "",
    clean(body?.instagram, 180) ? `Instagram indicado no editor: ${clean(body?.instagram, 180)}` : "",
  ].filter(Boolean).join("\n").slice(0, 1600);
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });
  if (!hasAppAccess(user?.subscription)) return NextResponse.json({ error: "É necessário um plano MesaLink ativo." }, { status: 403 });

  const context = restaurantId ? await loadWebsiteAiContext(restaurantId) : null;
  if (!user || !context || context.userId !== user.id) {
    return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  }

  const creditReference = `website_blueprint:${context.id}:${crypto.randomUUID()}`;
  let creditsRemaining = user.subscription?.aiCredits || 0;
  try {
    const debit = await spendAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.WEBSITE_COPY,
      feature: "WEBSITE_BLUEPRINT",
      description: `Website AI completo para ${context.name}`,
      reference: creditReference,
    });
    creditsRemaining = debit.balance;
  } catch (error) {
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({
        error: `Saldo insuficiente. Criar o website completo custa ${AI_CREDIT_COSTS.WEBSITE_COPY} créditos.`,
        code: "INSUFFICIENT_AI_CREDITS",
        required: error.required,
        available: error.available,
      }, { status: 402 });
    }
    throw error;
  }

  try {
    const blueprint = await generateWebsiteBlueprint({ context, brief });
    const suggestedImages = getSuggestedWebsiteImages(context);
    const products = context.orderingCategories.flatMap((category) => category.products);

    return NextResponse.json({
      ...blueprint,
      suggestedImages,
      creditsRemaining,
      sourceStats: {
        dishes: products.length,
        reviews: context.reviewFeedback.length,
        images: suggestedImages.length,
        prompts: context.aiVisibilityScans[0]?.results.length || 0,
      },
    });
  } catch (error) {
    console.error("Website AI generation error:", error);
    await refundAiCredits({
      userId: user.id,
      amount: AI_CREDIT_COSTS.WEBSITE_COPY,
      feature: "WEBSITE_BLUEPRINT",
      description: `Créditos devolvidos: website AI de ${context.name} não concluído`,
      reference: creditReference,
    }).catch(() => null);

    return NextResponse.json({
      error: "A IA não conseguiu concluir o website. Os créditos foram devolvidos; tenta novamente.",
    }, { status: 502 });
  }
}
