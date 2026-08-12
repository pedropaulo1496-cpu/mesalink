import { randomBytes } from "node:crypto";
import OpenAI from "openai";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { AI_CREDIT_COSTS, hasGrowthAccess, refundAiCredits, spendAiCredits } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { getMarketingCardTheme, marketingBenefitValue, type MarketingCardTheme } from "@/lib/marketing-card-themes";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { createBenefitCardCode } from "@/lib/referrals";

const resend = new Resend(process.env.RESEND_API_KEY);
export const AUTOPILOT_MAX_RECIPIENTS = 100;

type CampaignDraft = {
  segment: "ALL" | "VIP" | "INACTIVE";
  subject: string;
  message: string;
  createCard: boolean;
  offerTitle: string;
  offerDescription: string;
  discountPercent: number;
  aiReason: string;
  cardTheme: "GOLD" | "TERRACOTTA" | "FOREST" | "MIDNIGHT";
};

export async function runMarketingAutopilotForRestaurant(restaurantId: string, options?: { force?: boolean }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("A geração de campanhas por IA não está configurada.");
  if (!process.env.RESEND_API_KEY) throw new Error("O canal de email não está configurado.");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      user: { include: { subscription: true } },
      orderingCategories: {
        orderBy: { position: "asc" },
        take: 12,
        select: {
          name: true,
          products: {
            where: { active: true },
            orderBy: { sortOrder: "asc" },
            take: 8,
            select: { name: true, description: true, price: true },
          },
        },
      },
    },
  });

  if (!restaurant?.user || !hasGrowthAccess(restaurant.user.subscription)) throw new Error("O Marketing Autopilot requer o plano Growth.");
  if (!restaurant.marketingAutopilotEnabled) throw new Error("O Marketing Autopilot está desativado.");

  const now = new Date();
  const dueBefore = new Date(now.getTime() - Math.max(7, restaurant.marketingAutopilotFrequencyDays) * 24 * 60 * 60 * 1000);
  if (!options?.force && restaurant.marketingAutopilotLastRunAt && restaurant.marketingAutopilotLastRunAt > dueBefore) {
    return { skipped: true, reason: "NOT_DUE" as const };
  }

  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const baseWhere = { restaurantId, marketingOptIn: true, email: { not: null } } as const;
  const [allCount, vipCount, inactiveCount] = await Promise.all([
    prisma.customer.count({ where: baseWhere }),
    prisma.customer.count({ where: { ...baseWhere, vipTier: { not: null } } }),
    prisma.customer.count({ where: { ...baseWhere, OR: [{ lastVisitAt: { lt: sixtyDaysAgo } }, { lastReservationAt: { lt: sixtyDaysAgo } }] } }),
  ]);

  const eligibleSegments = [
    ...(allCount > 0 ? ["ALL"] : []),
    ...(vipCount > 0 ? ["VIP"] : []),
    ...(inactiveCount > 0 ? ["INACTIVE"] : []),
  ] as CampaignDraft["segment"][];
  if (eligibleSegments.length === 0) return { skipped: true, reason: "NO_AUDIENCE" as const };

  const lock = await prisma.restaurant.updateMany({
    where: {
      id: restaurantId,
      ...(options?.force ? {} : { OR: [{ marketingAutopilotLastRunAt: null }, { marketingAutopilotLastRunAt: { lte: dueBefore } }] }),
    },
    data: { marketingAutopilotLastRunAt: now },
  });
  if (lock.count !== 1) return { skipped: true, reason: "NOT_DUE" as const };

  const campaign = await prisma.aiMarketingCampaign.create({
    data: {
      restaurantId,
      status: "GENERATING",
      segment: eligibleSegments.includes("INACTIVE") ? "INACTIVE" : eligibleSegments[0],
      subject: "Campanha em preparação",
      message: "A IA está a preparar esta campanha.",
      aiCreditCost: AI_CREDIT_COSTS.MARKETING_AUTOPILOT,
    },
  });
  const creditReference = `marketing_autopilot:${campaign.id}`;

  try {
    await spendAiCredits({
      userId: restaurant.user.id,
      amount: AI_CREDIT_COSTS.MARKETING_AUTOPILOT,
      feature: "MARKETING_AUTOPILOT",
      description: `Campanha automática para ${restaurant.name}`,
      reference: creditReference,
    });

    const draft = await generateCampaignDraft({
      restaurant: {
        name: restaurant.name,
        cuisine: restaurant.websiteCuisine,
        city: restaurant.address,
        averageTicket: restaurant.averageTicket,
        websiteSpecialties: restaurant.websiteSpecialties,
        maxDiscount: Math.min(30, Math.max(0, restaurant.marketingAutopilotMaxDiscount)),
        existingOffers: [restaurant.birthdayOffer, restaurant.vipOffer, restaurant.recoveryOffer].filter(Boolean),
      },
      audience: { all: allCount, vip: vipCount, inactive: inactiveCount, eligibleSegments },
      products: restaurant.orderingCategories.flatMap((category) => category.products.map((product) => ({
        name: product.name,
        description: product.description,
        category: category.name,
        price: Number(product.price),
      }))).slice(0, 30),
    });

    const selectedSegment = eligibleSegments.includes(draft.segment) ? draft.segment : eligibleSegments[0];
    const maxDiscount = Math.min(30, Math.max(0, restaurant.marketingAutopilotMaxDiscount));
    const discountPercent = draft.createCard ? Math.min(maxDiscount, Math.max(0, Math.round(draft.discountPercent))) : 0;
    const createCard = Boolean(draft.createCard && draft.offerTitle && draft.offerDescription);
    const validUntil = createCard ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    const cardToken = createCard ? randomBytes(24).toString("hex") : null;
    const promoCode = createCard ? `ML-${randomBytes(3).toString("hex").toUpperCase()}` : null;

    const customers = await getAudience(restaurantId, selectedSegment, sixtyDaysAgo);
    const recipients = customers.slice(0, AUTOPILOT_MAX_RECIPIENTS);
    await prisma.aiMarketingCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "SENDING",
        segment: selectedSegment,
        subject: cleanText(draft.subject, 120),
        message: cleanText(draft.message, 2400),
        offerTitle: createCard ? cleanText(draft.offerTitle, 100) : null,
        offerDescription: createCard ? cleanText(draft.offerDescription, 280) : null,
        discountPercent: createCard && discountPercent > 0 ? discountPercent : null,
        promoCode,
        validUntil,
        cardToken,
        cardTheme: draft.cardTheme,
        aiReason: cleanText(draft.aiReason, 500),
        audienceSize: recipients.length,
      },
    });

    let emailsSent = 0;
    let failures = 0;
    for (let index = 0; index < recipients.length; index += 10) {
      const batch = recipients.slice(index, index + 10);
      const results = await Promise.all(batch.map((customer) => sendAutopilotEmail({
        restaurant: { id: restaurant.id, name: restaurant.name, slug: restaurant.slug, userId: restaurant.user!.id },
        customer,
        campaign: {
          id: campaign.id,
          subject: cleanText(draft.subject, 120),
          message: cleanText(draft.message, 2400),
          offerTitle: createCard ? cleanText(draft.offerTitle, 100) : null,
          offerDescription: createCard ? cleanText(draft.offerDescription, 280) : null,
          discountPercent: createCard && discountPercent > 0 ? discountPercent : null,
          cardTheme: draft.cardTheme,
          validUntil,
        },
      })));
      emailsSent += results.filter((result) => result === "SENT").length;
      failures += results.filter((result) => result === "FAILED").length;
    }

    const status = emailsSent === 0 ? "FAILED" : failures > 0 ? "PARTIAL" : "SENT";
    const sentAt = new Date();
    await prisma.aiMarketingCampaign.update({
      where: { id: campaign.id },
      data: { status, emailsSent, sentAt, error: failures > 0 ? `${failures} emails falharam.` : null },
    });
    return { skipped: false, campaignId: campaign.id, status, emailsSent, audienceSize: recipients.length, hasCard: createCard };
  } catch (error) {
    await prisma.aiMarketingCampaign.update({
      where: { id: campaign.id },
      data: { status: "FAILED", error: error instanceof Error ? error.message.slice(0, 1000) : "Falha ao criar campanha" },
    });
    await refundAiCredits({
      userId: restaurant.user.id,
      amount: AI_CREDIT_COSTS.MARKETING_AUTOPILOT,
      feature: "MARKETING_AUTOPILOT",
      description: `Reembolso da campanha automática de ${restaurant.name}`,
      reference: creditReference,
    }).catch(() => null);
    throw error;
  }
}

async function generateCampaignDraft(context: unknown): Promise<CampaignDraft> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MARKETING_MODEL || "gpt-5.4-mini",
    messages: [
      {
        role: "system",
        content: "És o diretor de marketing de um restaurante em Portugal. Cria uma campanha curta, elegante, específica e honesta em português europeu. Decide a audiência com maior oportunidade. Podes criar um cartão promocional apenas quando houver uma razão comercial clara. Nunca inventes pratos, eventos, prémios, datas ou condições. Nunca excedas o desconto máximo. Evita urgência falsa, spam, letras maiúsculas excessivas e promessas absolutas. A mensagem deve ter saudação neutra, valor claro e convite para reservar. Explica numa frase a razão da decisão.",
      },
      { role: "user", content: `Cria a próxima campanha do Marketing Autopilot com estes dados verificados:\n${JSON.stringify(context)}` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "mesalink_marketing_campaign",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            segment: { type: "string", enum: ["ALL", "VIP", "INACTIVE"] },
            subject: { type: "string", maxLength: 120 },
            message: { type: "string", maxLength: 2400 },
            createCard: { type: "boolean" },
            offerTitle: { type: "string", maxLength: 100 },
            offerDescription: { type: "string", maxLength: 280 },
            discountPercent: { type: "integer", minimum: 0, maximum: 30 },
            aiReason: { type: "string", maxLength: 500 },
            cardTheme: { type: "string", enum: ["GOLD", "TERRACOTTA", "FOREST", "MIDNIGHT"] },
          },
          required: ["segment", "subject", "message", "createCard", "offerTitle", "offerDescription", "discountPercent", "aiReason", "cardTheme"],
        },
      },
    },
  });
  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("A IA não devolveu uma campanha.");
  return JSON.parse(content) as CampaignDraft;
}

async function getAudience(restaurantId: string, segment: CampaignDraft["segment"], sixtyDaysAgo: Date) {
  const baseWhere = { restaurantId, marketingOptIn: true, email: { not: null } } as const;
  return prisma.customer.findMany({
    where: {
      ...baseWhere,
      ...(segment === "VIP" ? { vipTier: { not: null } } : {}),
      ...(segment === "INACTIVE" ? { OR: [{ lastVisitAt: { lt: sixtyDaysAgo } }, { lastReservationAt: { lt: sixtyDaysAgo } }] } : {}),
    },
    orderBy: [{ riskScore: "desc" }, { totalVisits: "desc" }],
    take: AUTOPILOT_MAX_RECIPIENTS,
  });
}

async function sendAutopilotEmail(input: {
  restaurant: { id: string; name: string; slug: string; userId: string };
  customer: { id: string; name: string; email: string | null };
  campaign: { id: string; subject: string; message: string; offerTitle: string | null; offerDescription: string | null; discountPercent: number | null; cardTheme: MarketingCardTheme; validUntil: Date | null };
}) {
  if (!input.customer.email) return "SKIPPED" as const;
  const action = await prisma.marketingAction.create({
    data: {
      restaurantId: input.restaurant.id,
      customerId: input.customer.id,
      automationId: input.campaign.id,
      type: "AI_CAMPAIGN",
      status: "QUEUED",
      channel: "EMAIL",
      trackingToken: createMarketingTrackingToken(),
    },
  });
  const reference = `email:marketing_autopilot:${action.id}`;
  let reserved = false;
  let cardId: string | null = null;
  try {
    const allowance = await reserveEmailSend({ userId: input.restaurant.userId, restaurantId: input.restaurant.id, category: "AI_CAMPAIGN", reference });
    if (!allowance.canSend) return "SKIPPED" as const;
    reserved = true;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
    const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);
    const card = input.campaign.offerTitle ? await prisma.marketingPromoCard.create({
      data: {
        publicCode: createBenefitCardCode(),
        restaurantId: input.restaurant.id,
        customerId: input.customer.id,
        campaignId: input.campaign.id,
        title: input.campaign.offerTitle,
        description: input.campaign.offerDescription,
        benefitType: input.campaign.discountPercent ? "PERCENT" : "GIFT",
        value: input.campaign.discountPercent,
        template: input.campaign.cardTheme,
        expiresAt: input.campaign.validUntil,
      },
    }) : null;
    cardId = card?.id || null;
    const cardUrl = card ? `${clickUrl}?offer=${encodeURIComponent(card.publicCode)}` : null;
    const delivery = await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: input.customer.email,
      subject: input.campaign.subject,
      html: campaignEmailHtml({ ...input, clickUrl, openUrl, cardUrl, publicCode: card?.publicCode || null }),
    });
    const deliveryId = requireAcceptedEmail(delivery);
    await completeEmailSend(reference);
    const sentAt = new Date();
    await prisma.$transaction([
      prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", sentAt, deliveryId } }),
      ...(card ? [prisma.marketingPromoCard.update({ where: { id: card.id }, data: { sentAt } })] : []),
    ]);
    return "SENT" as const;
  } catch (error) {
    if (reserved) await refundEmailSend(reference);
    if (cardId) await prisma.marketingPromoCard.delete({ where: { id: cardId } }).catch(() => null);
    await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Falha no envio" } });
    if (!(error instanceof InsufficientEmailAllowanceError)) console.error("Autopilot email failed", action.id, error);
    return "FAILED" as const;
  }
}

function campaignEmailHtml(input: Parameters<typeof sendAutopilotEmail>[0] & { clickUrl: string; openUrl: string; cardUrl: string | null; publicCode: string | null }) {
  const date = input.campaign.validUntil?.toLocaleDateString("pt-PT") || "";
  const theme = getMarketingCardTheme(input.campaign.cardTheme);
  const card = input.cardUrl && input.publicCode ? `<a href="${input.cardUrl}" style="display:block;margin-top:24px;padding:24px;border-radius:22px;background:${theme.background};color:${theme.foreground};text-decoration:none;box-shadow:0 18px 40px rgba(48,32,18,.16)"><span style="display:block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${theme.accent};font-weight:800">Cartão digital · ${escapeHtml(input.restaurant.name)}</span><span style="display:block;margin-top:18px;font-size:27px;line-height:1.05;font-weight:800">${escapeHtml(input.campaign.offerTitle || "Oferta especial")}</span><span style="display:block;margin-top:16px;font-size:31px;font-weight:900;color:${theme.accent}">${escapeHtml(marketingBenefitValue(input.campaign.discountPercent ? "PERCENT" : "GIFT", input.campaign.discountPercent))}</span><span style="display:block;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);font-family:monospace;font-size:14px;letter-spacing:2px">${escapeHtml(input.publicCode)}</span></a><p style="font-size:12px;line-height:1.6;color:#8A7C6D">Cartão individual de utilização única${date ? `, válido até ${date}` : ""}. Apresente o número no restaurante.</p>` : "";
  return `<div style="font-family:Arial,sans-serif;background:#F4EEE5;padding:32px 14px"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #E1D0B8;border-radius:30px;overflow:hidden"><div style="padding:34px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:800">${escapeHtml(input.restaurant.name)}</p><h1 style="font-size:32px;line-height:1.08;margin:16px 0;color:#16120E">${escapeHtml(input.campaign.subject)}</h1><p style="font-size:16px;line-height:1.8;color:#62584E;white-space:pre-line">Olá ${escapeHtml(input.customer.name)},\n\n${escapeHtml(input.campaign.message)}</p>${card}<a href="${input.cardUrl || input.clickUrl}" style="display:inline-block;margin-top:22px;background:#17120D;color:#fff;text-decoration:none;padding:15px 24px;border-radius:999px;font-weight:800">${input.cardUrl ? "Abrir cartão digital" : "Reservar mesa"}</a><p style="margin-top:30px;font-size:11px;line-height:1.6;color:#918579">Recebeu este email porque aceitou comunicações deste restaurante. Campanha criada pelo MesaLink Marketing Autopilot.</p>${marketingTrackingPixel(input.openUrl)}</div></div></div>`;
}

function cleanText(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
