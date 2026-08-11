import React from "react";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const themes: Record<string, { background: string; panel: string; accent: string; text: string; muted: string }> = {
  GOLD: { background: "#17120D", panel: "#221A12", accent: "#D7B267", text: "#FFF9F0", muted: "#D5C6B4" },
  TERRACOTTA: { background: "#8A3F2D", panel: "#9D4A35", accent: "#F4D3A6", text: "#FFF9F0", muted: "#F2D7CB" },
  FOREST: { background: "#173A2C", panel: "#204B3A", accent: "#D0B56F", text: "#FFFDF4", muted: "#D2E0D8" },
  MIDNIGHT: { background: "#111B2E", panel: "#192640", accent: "#D8B66A", text: "#FFFFFF", muted: "#CAD3E2" },
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
  const validUntil = campaign.validUntil?.toLocaleDateString("pt-PT") || "";
  const h = React.createElement;
  const card = h("div", {
    style: { width: "1200px", height: "630px", display: "flex", padding: "48px", background: theme.background, color: theme.text, fontFamily: "Arial, sans-serif" },
  }, h("div", {
    style: { width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 58px", borderRadius: "42px", border: `2px solid ${theme.accent}`, background: theme.panel, position: "relative", overflow: "hidden" },
  },
  h("div", { style: { position: "absolute", width: "360px", height: "360px", borderRadius: "999px", right: "-120px", top: "-170px", border: `2px solid ${theme.accent}`, opacity: 0.25 } }),
  h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
    h("div", { style: { fontSize: "22px", fontWeight: 800, letterSpacing: "5px", textTransform: "uppercase", color: theme.accent } }, campaign.restaurant.name),
    h("div", { style: { fontSize: "17px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: theme.muted } }, "MesaLink Partner Card"),
  ),
  h("div", { style: { display: "flex", flexDirection: "column", maxWidth: "870px" } },
    campaign.discountPercent ? h("div", { style: { display: "flex", fontSize: "24px", fontWeight: 800, color: theme.accent, marginBottom: "14px" } }, `${campaign.discountPercent}% DE DESCONTO`) : null,
    h("div", { style: { display: "flex", fontFamily: "Georgia, serif", fontSize: "67px", lineHeight: 1.02, fontWeight: 700, letterSpacing: "-2px" } }, campaign.offerTitle),
    h("div", { style: { display: "flex", marginTop: "18px", fontSize: "25px", lineHeight: 1.45, color: theme.muted } }, campaign.offerDescription),
  ),
  h("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between" } },
    h("div", { style: { display: "flex", flexDirection: "column" } },
      h("div", { style: { fontSize: "14px", textTransform: "uppercase", letterSpacing: "3px", color: theme.muted } }, "Código pessoal"),
      h("div", { style: { marginTop: "8px", fontSize: "27px", fontWeight: 900, letterSpacing: "3px", color: theme.accent } }, campaign.promoCode || "MESA-LINK"),
    ),
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: "16px", lineHeight: 1.5, color: theme.muted } },
      validUntil ? h("div", null, `Válido até ${validUntil}`) : null,
      h("div", null, "Apresente no restaurante · Sujeito a disponibilidade"),
    ),
  )));

  return new ImageResponse(card, {
    width: 1200,
    height: 630,
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
