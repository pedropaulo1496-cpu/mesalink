import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "O gerador de IA ainda não está configurado." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
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

  const clean = (value: unknown, maxLength: number) =>
    typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  const cuisine = clean(body?.cuisine, 160);
  const address = clean(body?.address, 240);
  const instagram = clean(body?.instagram, 160);
  const brief = clean(body?.brief, 1200);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
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

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error("Website AI generation error:", error);
    return NextResponse.json(
      { error: "Não foi possível criar os textos agora. Tenta novamente." },
      { status: 500 },
    );
  }
}
