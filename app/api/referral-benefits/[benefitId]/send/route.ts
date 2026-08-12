import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { getMarketingCardTheme, marketingBenefitSentence, marketingBenefitValue } from "@/lib/marketing-card-themes";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { prisma } from "@/lib/prisma";
import { createBenefitCardCode } from "@/lib/referrals";

export async function POST(request: Request, { params }: { params: Promise<{ benefitId: string }> }) {
  const { benefitId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const requestedCustomerIds: string[] = Array.isArray(body?.customerIds) ? body.customerIds.filter((id: unknown): id is string => typeof id === "string") : [];
  const customerIds = Array.from(new Set(requestedCustomerIds)).slice(0, 100);
  if (customerIds.length === 0) return NextResponse.json({ error: "Escolhe pelo menos um cliente." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user || !hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "Esta funcionalidade requer o plano Growth." }, { status: 403 });
  const benefit = await prisma.referralBenefit.findFirst({ where: { id: benefitId, restaurant: { userId: user.id } }, include: { restaurant: { select: { id: true, name: true } } } });
  if (!benefit) return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
  const now = new Date();
  if (!benefit.active || benefit.validFrom > now || (benefit.validUntil && benefit.validUntil <= now)) return NextResponse.json({ error: "Este cartão está pausado ou fora da validade." }, { status: 409 });

  const alreadyIssued = await prisma.marketingPromoCard.count({ where: { campaignId: benefit.id } });
  const remaining = benefit.maxRedemptions == null ? customerIds.length : Math.max(0, benefit.maxRedemptions - alreadyIssued);
  if (remaining === 0) return NextResponse.json({ error: "Este cartão já atingiu o limite de utilizações definido." }, { status: 409 });
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds.slice(0, remaining) }, restaurantId: benefit.restaurantId, marketingOptIn: true, email: { not: null } },
    select: { id: true, name: true, email: true },
  });
  if (customers.length === 0) return NextResponse.json({ error: "Os clientes escolhidos não têm email e consentimento de marketing válidos." }, { status: 409 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "O canal de email ainda não está configurado." }, { status: 503 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
  const theme = getMarketingCardTheme(benefit.template);
  const benefitType = benefit.benefitType === "PERK" ? "GIFT" : benefit.benefitType;
  const value = benefit.value == null ? null : Number(benefit.value);
  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    const trackingToken = createMarketingTrackingToken();
    const action = await prisma.marketingAction.create({ data: { restaurantId: benefit.restaurantId, customerId: customer.id, automationId: benefit.id, type: "CARD_GIFT", status: "QUEUED", channel: "EMAIL", trackingToken } });
    const reference = `email:loyalty_card:${action.id}`;
    let reserved = false;
    let card: { id: string; publicCode: string } | null = null;
    try {
      const allowance = await reserveEmailSend({ userId: user.id, restaurantId: benefit.restaurantId, category: "LOYALTY_CARD", reference });
      if (!allowance.canSend) throw new Error("Email already reserved");
      reserved = true;
      card = await prisma.marketingPromoCard.create({ data: { publicCode: createBenefitCardCode(), restaurantId: benefit.restaurantId, customerId: customer.id, campaignId: benefit.id, title: benefit.title, description: benefit.description, benefitType, value: benefitType === "GIFT" ? null : value, minSpend: benefit.minSpend, terms: benefit.terms, template: benefit.template, expiresAt: benefit.validUntil } });
      const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, trackingToken);
      const cardUrl = `${clickUrl}?offer=${encodeURIComponent(card.publicCode)}`;
      const delivery = await resend.emails.send({
        from: `${benefit.restaurant.name} via MesaLink <noreply@mesalink.pt>`,
        to: customer.email!,
        subject: `${benefit.restaurant.name} preparou um cartão para si`,
        html: cardEmail({ restaurantName: benefit.restaurant.name, customerName: customer.name, title: benefit.title, description: benefit.description, publicCode: card.publicCode, cardUrl, benefitType, value, expiry: benefit.validUntil, openUrl, theme }),
      });
      const deliveryId = requireAcceptedEmail(delivery);
      await completeEmailSend(reference);
      const sentAt = new Date();
      await prisma.$transaction([prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", sentAt, deliveryId } }), prisma.marketingPromoCard.update({ where: { id: card.id }, data: { sentAt } })]);
      sent += 1;
    } catch (error) {
      if (reserved) await refundEmailSend(reference).catch(() => null);
      if (card) await prisma.marketingPromoCard.delete({ where: { id: card.id } }).catch(() => null);
      await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Falha no envio" } }).catch(() => null);
      failed += 1;
      if (error instanceof InsufficientEmailAllowanceError) break;
    }
  }
  return NextResponse.json({ success: sent > 0, sent, failed });
}

function cardEmail(input: { restaurantName: string; customerName: string; title: string; description: string | null; publicCode: string; cardUrl: string; benefitType: string; value: number | null; expiry: Date | null; openUrl: string; theme: ReturnType<typeof getMarketingCardTheme> }) {
  const expiry = input.expiry ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(input.expiry) : null;
  return `<div style="font-family:Arial,sans-serif;background:#F4EEE5;padding:32px 14px;color:#17120D"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #E1D0B8;border-radius:28px;overflow:hidden"><div style="padding:32px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:800">${escapeHtml(input.restaurantName)}</p><h1 style="font-size:30px;line-height:1.08;margin:14px 0">Preparámos algo especial para si.</h1><p style="font-size:15px;line-height:1.75;color:#62584E">Olá ${escapeHtml(input.customerName)},</p><p style="font-size:15px;line-height:1.75;color:#62584E">Gostávamos de o voltar a receber. Guardámos este cartão digital para utilizar na sua próxima visita.</p><p style="font-size:15px;line-height:1.75;color:#62584E;font-weight:700">${escapeHtml(marketingBenefitSentence(input.benefitType, input.value))}</p><a href="${input.cardUrl}" style="display:block;margin-top:24px;padding:24px;border-radius:22px;background:${input.theme.background};color:${input.theme.foreground};text-decoration:none;box-shadow:0 18px 40px rgba(48,32,18,.16)"><span style="display:block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${input.theme.accent};font-weight:800">Cartão digital · ${escapeHtml(input.restaurantName)}</span><span style="display:block;margin-top:18px;font-size:27px;line-height:1.05;font-weight:800">${escapeHtml(input.title)}</span>${input.description ? `<span style="display:block;margin-top:10px;font-size:14px;line-height:1.5;color:${input.theme.muted}">${escapeHtml(input.description)}</span>` : ""}<span style="display:block;margin-top:16px;font-size:31px;font-weight:900;color:${input.theme.accent}">${escapeHtml(marketingBenefitValue(input.benefitType, input.value))}</span><span style="display:block;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);font-family:monospace;font-size:14px;letter-spacing:2px">${escapeHtml(input.publicCode)}</span></a><p style="font-size:11px;line-height:1.6;color:#8A7C6D">Cartão individual de utilização única${expiry ? `, válido até ${expiry}` : ""}. Apresente o número no restaurante.</p><a href="${input.cardUrl}" style="display:inline-block;margin-top:10px;background:#17120D;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800">Abrir cartão digital</a><p style="margin-top:28px;font-size:11px;line-height:1.6;color:#918579">Recebeu este email porque aceitou comunicações de ${escapeHtml(input.restaurantName)}. Enviado através do MesaLink.</p>${marketingTrackingPixel(input.openUrl)}</div></div></div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
