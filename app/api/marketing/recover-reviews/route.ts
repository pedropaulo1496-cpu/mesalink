import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { getMarketingCardTheme, MARKETING_CARD_THEMES, marketingBenefitSentence, marketingBenefitValue, type MarketingCardTheme } from "@/lib/marketing-card-themes";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { prisma } from "@/lib/prisma";
import { createBenefitCardCode } from "@/lib/referrals";

const benefitTypes = new Set(["PERCENT", "FIXED", "GIFT"]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);

  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  const title = clean(body?.title, 100);
  const description = clean(body?.description, 280);
  const benefitType = String(body?.benefitType || "PERCENT").toUpperCase();
  const template = String(body?.template || "GOLD").toUpperCase() as MarketingCardTheme;
  const value = Number(body?.value || 0);
  const minSpend = Number(body?.minSpend || 0);
  const validDays = Math.round(Number(body?.validDays || 30));
  const terms = clean(body?.terms, 320);
  const ratingThreshold = Math.min(4, Math.max(3, Math.round(Number(body?.ratingThreshold || 3))));

  if (!restaurantId || title.length < 3 || description.length < 3) return NextResponse.json({ error: "Preenche o título e a mensagem do cartão." }, { status: 400 });
  if (!benefitTypes.has(benefitType)) return NextResponse.json({ error: "Tipo de oferta inválido." }, { status: 400 });
  if (!(template in MARKETING_CARD_THEMES)) return NextResponse.json({ error: "Template inválido." }, { status: 400 });
  if (!Number.isFinite(value) || (benefitType !== "GIFT" && value <= 0) || (benefitType === "PERCENT" && value > 50) || (benefitType === "FIXED" && value > 1000)) return NextResponse.json({ error: "Valor da promoção inválido." }, { status: 400 });
  if (!Number.isFinite(minSpend) || minSpend < 0 || minSpend > 10000) return NextResponse.json({ error: "Consumo mínimo inválido." }, { status: 400 });
  if (validDays < 1 || validDays > 180) return NextResponse.json({ error: "A validade deve ficar entre 1 e 180 dias." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user || !hasGrowthAccess(user.subscription)) return NextResponse.json({ error: "Esta funcionalidade requer o plano Growth." }, { status: 403 });
  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, userId: user.id }, select: { id: true, name: true, slug: true } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "O canal de email ainda não está configurado." }, { status: 503 });

  const [reviewPool, existingCards] = await Promise.all([
    prisma.reviewFeedback.findMany({ where: { restaurantId, rating: { lte: ratingThreshold } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.marketingPromoCard.findMany({ where: { restaurantId, reviewFeedbackId: { not: null } }, select: { reviewFeedbackId: true } }),
  ]);
  const recoveredReviewIds = new Set(existingCards.map((card) => card.reviewFeedbackId).filter(Boolean));
  const reviews = reviewPool.filter((review) => !recoveredReviewIds.has(review.id)).slice(0, 150);
  const reservationIds = reviews.map((review) => review.reservationId).filter((value): value is string => Boolean(value));
  const reservations = reservationIds.length ? await prisma.reservation.findMany({
    where: { id: { in: reservationIds }, restaurantId },
    select: { id: true, customerId: true, customerName: true, email: true },
  }) : [];
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  const seenEmails = new Set<string>();
  const candidates = reviews.flatMap((review) => {
    const reservation = review.reservationId ? reservationById.get(review.reservationId) : null;
    const email = reservation?.email?.trim().toLowerCase();
    if (!email || seenEmails.has(email)) return [];
    seenEmails.add(email);
    return [{ review, reservation: reservation! }];
  }).slice(0, 100);

  if (candidates.length === 0) return NextResponse.json({ error: `Não existem avaliações de 1 a ${ratingThreshold} estrelas com email elegível por recuperar.`, code: "NO_ELIGIBLE_REVIEWS" }, { status: 409 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);
  const campaignId = randomUUID();
  const theme = getMarketingCardTheme(template);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/+$/, "");
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const card = await prisma.marketingPromoCard.create({
      data: {
        publicCode: createBenefitCardCode(), restaurantId, customerId: candidate.reservation.customerId,
        reviewFeedbackId: candidate.review.id, campaignId, title, description, benefitType,
        value: benefitType === "GIFT" ? null : value, minSpend: minSpend || null, terms: terms || null,
        template, expiresAt,
      },
    });
    const emailReference = `email:review_recovery:${candidate.review.id}`;
    let reserved = false;
    let actionId: string | null = null;

    try {
      const allowance = await reserveEmailSend({ userId: user.id, restaurantId, category: "REVIEW_RECOVERY", reference: emailReference });
      if (!allowance.canSend) {
        await prisma.marketingPromoCard.delete({ where: { id: card.id } });
        skipped += 1;
        continue;
      }
      reserved = true;

      const trackingToken = createMarketingTrackingToken();
      const action = await prisma.marketingAction.create({
        data: { restaurantId, customerId: candidate.reservation.customerId, reservationId: candidate.review.reservationId, automationId: campaignId, type: "REVIEW_RECOVERY", status: "QUEUED", channel: "EMAIL", trackingToken },
      });
      actionId = action.id;
      const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, trackingToken);
      const cardUrl = `${clickUrl}?offer=${encodeURIComponent(card.publicCode)}`;
      const delivery = await resend.emails.send({
        from: `${restaurant.name} via MesaLink <noreply@mesalink.pt>`,
        to: candidate.reservation.email!,
        subject: `${restaurant.name}: queremos recebê-lo melhor`,
        html: recoveryEmail({ customerName: candidate.reservation.customerName, restaurantName: restaurant.name, message: description, cardUrl, publicCode: card.publicCode, title, benefitType, value: benefitType === "GIFT" ? null : value, expiry: expiresAt, theme, openUrl }),
      });
      const deliveryId = requireAcceptedEmail(delivery);
      await completeEmailSend(emailReference);
      const sentAt = new Date();
      await prisma.$transaction([
        prisma.marketingPromoCard.update({ where: { id: card.id }, data: { sentAt } }),
        prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", sentAt, deliveryId } }),
      ]);
      sent += 1;
    } catch (error) {
      if (reserved) await refundEmailSend(emailReference).catch(() => null);
      await prisma.marketingPromoCard.delete({ where: { id: card.id } }).catch(() => null);
      if (actionId) await prisma.marketingAction.update({ where: { id: actionId }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Falha no envio" } }).catch(() => null);
      failed += 1;
      if (error instanceof InsufficientEmailAllowanceError) break;
    }
  }

  return NextResponse.json({ success: sent > 0, sent, failed, skipped, eligible: candidates.length, campaignId });
}

function recoveryEmail(input: { customerName: string; restaurantName: string; message: string; cardUrl: string; publicCode: string; title: string; benefitType: string; value: number | null; expiry: Date; theme: ReturnType<typeof getMarketingCardTheme>; openUrl: string }) {
  const expiry = new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(input.expiry);
  return `<div style="font-family:Arial,sans-serif;background:#F4EEE5;padding:32px 14px;color:#17120D"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #E1D0B8;border-radius:28px;overflow:hidden"><div style="padding:32px"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:800">${escapeHtml(input.restaurantName)}</p><h1 style="font-size:30px;line-height:1.08;margin:14px 0">Queremos recebê-lo melhor.</h1><p style="font-size:15px;line-height:1.75;color:#62584E">Olá ${escapeHtml(input.customerName)},</p><p style="font-size:15px;line-height:1.75;color:#62584E">Lamentamos que a sua última experiência não tenha correspondido às expectativas. Obrigado por nos ter dado esse feedback — queremos ter a oportunidade de fazer melhor.</p><p style="font-size:15px;line-height:1.75;color:#62584E">${escapeHtml(input.message)}</p><p style="font-size:15px;line-height:1.75;color:#62584E;font-weight:700">${escapeHtml(marketingBenefitSentence(input.benefitType, input.value))}</p><a href="${input.cardUrl}" style="display:block;margin-top:24px;padding:24px;border-radius:22px;background:${input.theme.background};color:${input.theme.foreground};text-decoration:none;box-shadow:0 18px 40px rgba(48,32,18,.16)"><span style="display:block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${input.theme.accent};font-weight:800">Cartão digital · ${escapeHtml(input.restaurantName)}</span><span style="display:block;margin-top:18px;font-size:27px;line-height:1.05;font-weight:800">${escapeHtml(input.title)}</span><span style="display:block;margin-top:18px;font-size:32px;font-weight:900;color:${input.theme.accent}">${escapeHtml(marketingBenefitValue(input.benefitType, input.value))}</span><span style="display:block;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);font-family:monospace;font-size:14px;letter-spacing:2px">${escapeHtml(input.publicCode)}</span></a><p style="font-size:11px;line-height:1.6;color:#8A7C6D">Cartão de utilização única, válido até ${expiry}. Apresente o número no restaurante.</p><a href="${input.cardUrl}" style="display:inline-block;margin-top:10px;background:#17120D;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:800">Abrir cartão digital</a><p style="margin-top:28px;font-size:11px;line-height:1.6;color:#918579">Mensagem única de acompanhamento ao feedback que partilhou com ${escapeHtml(input.restaurantName)}. Enviada através do MesaLink.</p>${marketingTrackingPixel(input.openUrl)}</div></div></div>`;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
