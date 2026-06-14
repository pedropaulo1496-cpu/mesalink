import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY missing" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const body = await req.json();

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

Nome: ${body.name || ""}
Tipo/cozinha: ${body.cuisine || ""}
Morada/cidade: ${body.address || ""}
Instagram: ${body.instagram || ""}
Brief/conceito: ${body.brief || ""}

Responde apenas em JSON válido:
{
  "headline": "",
  "description": "",
  "aboutTitle": "",
  "aboutText": "",
  "featureTitle": "",
  "featureText": "",
  "galleryTitle": "",
  "galleryDescription": "",
  "locationTitle": "",
  "locationDescription": "",
  "ctaTitle": "",
  "ctaText": "",
  "seoTitle": "",
  "seoDescription": ""
}
`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return NextResponse.json(
    JSON.parse(response.choices[0].message.content || "{}")
  );
}