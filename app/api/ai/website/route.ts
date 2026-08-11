import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AI_CREDIT_COSTS, hasAppAccess, InsufficientAiCreditsError, spendAiCredits } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  const restaurant = user && restaurantId
    ? await prisma.restaurant.findFirst({
        where: { id: restaurantId, userId: user.id },
        select: { id: true, name: true },
      })
    : null;

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  }
  if (!hasAppAccess(user?.subscription)) return NextResponse.json({ error: "É necessário um plano MesaLink ativo." }, { status: 403 });

  let creditsRemaining = user?.subscription?.aiCredits || 0;
  try {
    const creditCharge = await spendAiCredits({
      userId: user!.id,
      amount: AI_CREDIT_COSTS.WEBSITE_COPY,
      feature: "WEBSITE_COPY",
      description: `Conteúdo AI para o website de ${restaurant.name}`,
      reference: `website_copy:${restaurant.id}:${crypto.randomUUID()}`,
    });
    creditsRemaining = creditCharge.balance;
  } catch (error) {
    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json({ error: "Saldo insuficiente. Gerar o conteúdo completo custa 5 créditos.", code: "INSUFFICIENT_AI_CREDITS", required: error.required, available: error.available }, { status: 402 });
    }
    throw error;
  }

  const clean = (value: unknown, maxLength: number) =>
    typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  const cuisine = clean(body?.cuisine, 160);
  const address = clean(body?.address, 240);
  const instagram = clean(body?.instagram, 160);
  const brief = clean(body?.brief, 1200);

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OpenAI not configured");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "És um copywriter premium para websites de restaurantes, bares, cafés e brunch spots em Portugal. Escreve em português europeu, sem exageros, sem clichés e sem inventar factos.",
        },
        {
          role: "user",
          content: `
Cria textos para um website.

Nome: ${restaurant.name}
Tipo/cozinha: ${cuisine}
Morada/cidade: ${address}
Instagram: ${instagram}
Brief/conceito: ${brief}
`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "restaurant_website_copy",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              headline: { type: "string" },
              description: { type: "string" },
              aboutTitle: { type: "string" },
              aboutText: { type: "string" },
              featureTitle: { type: "string" },
              featureText: { type: "string" },
              galleryTitle: { type: "string" },
              galleryDescription: { type: "string" },
              locationTitle: { type: "string" },
              locationDescription: { type: "string" },
              ctaTitle: { type: "string" },
              ctaText: { type: "string" },
              seoTitle: { type: "string" },
              seoDescription: { type: "string" }
            },
            required: [
              "headline",
              "description",
              "aboutTitle",
              "aboutText",
              "featureTitle",
              "featureText",
              "galleryTitle",
              "galleryDescription",
              "locationTitle",
              "locationDescription",
              "ctaTitle",
              "ctaText",
              "seoTitle",
              "seoDescription"
            ]
          }
        }
      }
    });

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("Resposta de IA vazia.");

    return NextResponse.json({ ...JSON.parse(content), creditsRemaining });
  } catch (error) {
    console.error("Website AI generation error:", error);
    const place = address || "a sua localização";
    const concept = brief || cuisine || "uma experiência pensada para receber bem";
    return NextResponse.json({
      headline: `${restaurant.name}, à mesa em ${place}`,
      description: `${restaurant.name} apresenta ${concept}. Consulte o menu e reserve diretamente.`,
      aboutTitle: `A história do ${restaurant.name}`,
      aboutText: brief || `Conheça o conceito, a cozinha e a equipa do ${restaurant.name}.`,
      featureTitle: cuisine ? `Uma cozinha de ${cuisine}` : "Uma experiência com identidade",
      featureText: brief || "Descubra o menu, as especialidades e a experiência preparada pelo restaurante.",
      galleryTitle: "O restaurante em imagens",
      galleryDescription: "Conheça o espaço, os pratos e os detalhes antes da sua visita.",
      locationTitle: "Onde estamos",
      locationDescription: address ? `Encontre-nos em ${address}.` : "Consulte a localização e planeie a sua visita.",
      ctaTitle: "Reserve a sua mesa",
      ctaText: "Escolha a data e envie o pedido de reserva diretamente ao restaurante.",
      seoTitle: `${restaurant.name}${cuisine ? ` | ${cuisine}` : ""}`.slice(0, 60),
      seoDescription: `${restaurant.name}${address ? ` em ${address}` : ""}. Menu, informações e reservas online.`.slice(0, 155),
      fallback: true,
      creditsRemaining,
    });
  }
}
