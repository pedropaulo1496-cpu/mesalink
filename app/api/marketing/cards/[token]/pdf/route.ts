import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const themes: Record<string, { background: [number, number, number]; panel: [number, number, number]; accent: [number, number, number]; text: [number, number, number]; muted: [number, number, number] }> = {
  GOLD: { background: [0.09, 0.07, 0.05], panel: [0.13, 0.1, 0.07], accent: [0.84, 0.7, 0.4], text: [1, 0.98, 0.94], muted: [0.84, 0.78, 0.7] },
  TERRACOTTA: { background: [0.54, 0.25, 0.18], panel: [0.62, 0.29, 0.21], accent: [0.96, 0.83, 0.65], text: [1, 0.98, 0.94], muted: [0.95, 0.84, 0.79] },
  FOREST: { background: [0.09, 0.23, 0.17], panel: [0.13, 0.29, 0.23], accent: [0.82, 0.71, 0.44], text: [1, 0.99, 0.96], muted: [0.82, 0.88, 0.85] },
  MIDNIGHT: { background: [0.07, 0.11, 0.18], panel: [0.1, 0.15, 0.25], accent: [0.85, 0.71, 0.42], text: [1, 1, 1], muted: [0.79, 0.83, 0.89] },
};

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response("Cartão inválido", { status: 404 });
  const campaign = await prisma.aiMarketingCampaign.findUnique({
    where: { cardToken: token },
    include: { restaurant: { select: { name: true } } },
  });
  if (!campaign?.offerTitle || !campaign.offerDescription) return new Response("Cartão não encontrado", { status: 404 });

  const theme = themes[campaign.cardTheme] || themes.GOLD;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([1200, 630]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const color = (value: [number, number, number]) => rgb(value[0], value[1], value[2]);
  page.drawRectangle({ x: 0, y: 0, width: 1200, height: 630, color: color(theme.background) });
  page.drawRectangle({ x: 48, y: 48, width: 1104, height: 534, color: color(theme.panel), borderColor: color(theme.accent), borderWidth: 2 });
  page.drawText(campaign.restaurant.name.toUpperCase().slice(0, 55), { x: 102, y: 530, size: 19, font: bold, color: color(theme.accent) });
  page.drawText("MESALINK PARTNER CARD", { x: 885, y: 530, size: 12, font: bold, color: color(theme.muted) });
  let titleY = 385;
  if (campaign.discountPercent) {
    page.drawText(`${campaign.discountPercent}% DE DESCONTO`, { x: 102, y: 435, size: 19, font: bold, color: color(theme.accent) });
  } else titleY = 420;
  drawWrapped(page, campaign.offerTitle, 102, titleY, 950, 56, 58, serif, color(theme.text));
  drawWrapped(page, campaign.offerDescription, 102, titleY - 130, 930, 21, 31, regular, color(theme.muted));
  page.drawText("CÓDIGO PESSOAL", { x: 102, y: 115, size: 11, font: bold, color: color(theme.muted) });
  page.drawText(campaign.promoCode || "MESA-LINK", { x: 102, y: 78, size: 25, font: bold, color: color(theme.accent) });
  const validUntil = campaign.validUntil?.toLocaleDateString("pt-PT");
  if (validUntil) page.drawText(`Válido até ${validUntil}`, { x: 885, y: 103, size: 13, font: regular, color: color(theme.muted) });
  page.drawText("Apresente no restaurante · Sujeito a disponibilidade", { x: 785, y: 78, size: 11, font: regular, color: color(theme.muted) });
  pdf.setTitle(`${campaign.offerTitle} — ${campaign.restaurant.name}`);
  pdf.setCreator("MesaLink Marketing Autopilot");
  const bytes = await pdf.save();
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cartao-${safeFilename(campaign.restaurant.name)}.pdf"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function drawWrapped(page: ReturnType<PDFDocument["addPage"]>, text: string, x: number, y: number, maxWidth: number, size: number, lineHeight: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, color: ReturnType<typeof rgb>) {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font, color });
      line = word;
      cursorY -= lineHeight;
    } else line = candidate;
  }
  if (line) page.drawText(line, { x, y: cursorY, size, font, color });
}

function safeFilename(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 60) || "promocao";
}
