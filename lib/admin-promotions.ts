import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

type PromotionDuration = "ONCE" | "REPEATING" | "FOREVER";

export async function createAndSendAdminPromotion(input: {
  targetUserId: string;
  createdById: string;
  requestId?: string;
  percentOff: number;
  duration: PromotionDuration;
  durationMonths?: number;
  expiresInDays?: number;
  requestedCode?: string;
  note?: string;
  sendEmail?: boolean;
}) {
  const target = await prisma.user.findUnique({
    where: { id: input.targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      subscription: { select: { stripeCustomerId: true } },
      restaurants: { select: { name: true }, take: 1 },
    },
  });
  if (!target) throw new Error("Cliente não encontrado.");
  if (!Number.isInteger(input.percentOff) || input.percentOff < 1 || input.percentOff > 100) {
    throw new Error("A percentagem de desconto deve estar entre 1% e 100%.");
  }

  const durationMonths = input.duration === "REPEATING"
    ? Math.max(1, Math.min(24, Math.round(input.durationMonths || 1)))
    : undefined;
  const expiryDays = Math.max(1, Math.min(365, Math.round(input.expiresInDays || 30)));
  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000);
  const requested = String(input.requestedCode || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
  const code = requested || `MESA-${randomBytes(4).toString("hex").toUpperCase()}`;

  const existingCode = await prisma.adminPromotion.count({ where: { code } });
  if (existingCode) throw new Error("Este código promocional já existe.");

  let promotionCodeId: string | null = null;
  let couponId: string | null = null;
  let databasePromotionId: string | null = null;
  try {
    const coupon = await stripe.coupons.create({
      // Stripe limits coupon names to 40 characters. Keep customer identity in
      // metadata, where the full value is safe, instead of the visible name.
      name: `MesaLink ${input.percentOff}% · oferta HQ`.slice(0, 40),
      percent_off: input.percentOff,
      duration: input.duration.toLowerCase() as "once" | "repeating" | "forever",
      ...(durationMonths ? { duration_in_months: durationMonths } : {}),
      redeem_by: Math.floor(expiresAt.getTime() / 1000),
      metadata: { targetUserId: target.id, createdById: input.createdById, source: "MESALINK_BACKOFFICE" },
    });
    couponId = coupon.id;
    const promotionCode = await stripe.promotionCodes.create({
      code,
      promotion: { type: "coupon", coupon: coupon.id },
      ...(target.subscription?.stripeCustomerId ? { customer: target.subscription.stripeCustomerId } : {}),
      max_redemptions: 1,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      metadata: { targetUserId: target.id, createdById: input.createdById },
    });
    promotionCodeId = promotionCode.id;

    const promotion = await prisma.adminPromotion.create({
      data: {
        targetUserId: target.id,
        createdById: input.createdById,
        requestId: input.requestId,
        code,
        percentOff: input.percentOff,
        duration: input.duration,
        durationMonths,
        expiresAt,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promotionCode.id,
      },
    });
    databasePromotionId = promotion.id;

    // Requests proposed by a commercial are deliberately handed back to that
    // commercial. The customer only receives the code when the commercial
    // decides to share it; direct HQ promotions keep the normal email flow.
    if (input.sendEmail === false) return promotion;

    try {
      const delivery = await resend.emails.send({
        from: "Equipa MesaLink <info@mesalink.pt>",
        to: target.email,
        replyTo: "info@mesalink.pt",
        subject: "Atualização da sua mensalidade MesaLink",
        text: promotionEmailText({
          name: target.name || target.restaurants[0]?.name || "Olá",
          code,
          percentOff: input.percentOff,
          duration: input.duration,
          durationMonths,
          expiresAt,
          note: input.note,
        }),
        html: promotionEmailHtml({
          name: target.name || target.restaurants[0]?.name || "Olá",
          code,
          percentOff: input.percentOff,
          duration: input.duration,
          durationMonths,
          expiresAt,
          note: input.note,
        }),
      });
      const deliveryId = requireAcceptedEmail(delivery);
      return await prisma.adminPromotion.update({
        where: { id: promotion.id },
        data: { status: "SENT", sentAt: new Date(), emailDeliveryId: deliveryId, failureReason: null },
      });
    } catch (emailError) {
      // The Stripe code remains valid and visible in HQ even if email delivery
      // has a temporary issue. Approval must not destroy a valid promotion.
      return await prisma.adminPromotion.update({
        where: { id: promotion.id },
        data: {
          status: "EMAIL_FAILED",
          failureReason: emailError instanceof Error ? emailError.message.slice(0, 500) : "Falha no envio do email.",
        },
      });
    }
  } catch (error) {
    if (promotionCodeId) {
      await stripe.promotionCodes.update(promotionCodeId, { active: false }).catch(() => null);
    }
    if (databasePromotionId) {
      await prisma.adminPromotion.update({
        where: { id: databasePromotionId },
        data: {
          status: "FAILED",
          failureReason: error instanceof Error ? error.message.slice(0, 500) : "Falha no envio",
        },
      }).catch(() => null);
    } else if (couponId) {
      await stripe.coupons.del(couponId).catch(() => null);
    }
    throw error;
  }
}

function promotionEmailHtml(input: {
  name: string;
  code: string;
  percentOff: number;
  duration: PromotionDuration;
  durationMonths?: number;
  expiresAt: Date;
  note?: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "");
  const validity = input.duration === "FOREVER"
    ? "em todas as mensalidades enquanto o plano se mantiver ativo"
    : input.duration === "REPEATING"
      ? `durante ${input.durationMonths} ${input.durationMonths === 1 ? "mês" : "meses"}`
      : "na primeira cobrança";
  return `<div style="font-family:Arial,sans-serif;color:#201A15;line-height:1.65"><p>Olá ${escapeHtml(input.name)},</p><p>A equipa MesaLink atribuiu à sua conta uma condição especial para a mensalidade: <strong>${input.percentOff}% de desconto</strong>, válido ${validity}.</p><p>O código a utilizar é:</p><p style="font-size:20px;font-weight:700;letter-spacing:1px">${escapeHtml(input.code)}</p>${input.note ? `<p>${escapeHtml(input.note)}</p>` : ""}<p>Pode aplicá-lo na área de faturação até ${input.expiresAt.toLocaleDateString("pt-PT")}:</p><p><a href="${baseUrl}/billing">Abrir faturação MesaLink</a></p><p>Se precisar de ajuda, basta responder a este email.</p><p>Cumprimentos,<br>Equipa MesaLink<br><a href="mailto:info@mesalink.pt">info@mesalink.pt</a></p></div>`;
}

function promotionEmailText(input: {
  name: string;
  code: string;
  percentOff: number;
  duration: PromotionDuration;
  durationMonths?: number;
  expiresAt: Date;
  note?: string;
}) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt").replace(/\/+$/, "");
  const validity = input.duration === "FOREVER"
    ? "em todas as mensalidades enquanto o plano se mantiver ativo"
    : input.duration === "REPEATING"
      ? `durante ${input.durationMonths} ${input.durationMonths === 1 ? "mês" : "meses"}`
      : "na primeira cobrança";
  return `Olá ${input.name},\n\nA equipa MesaLink atribuiu à sua conta uma condição especial para a mensalidade: ${input.percentOff}% de desconto, válido ${validity}.\n\nCódigo: ${input.code}\n${input.note ? `\n${input.note}\n` : ""}\nPode aplicá-lo na área de faturação até ${input.expiresAt.toLocaleDateString("pt-PT")}:\n${baseUrl}/billing\n\nSe precisar de ajuda, basta responder a este email.\n\nCumprimentos,\nEquipa MesaLink\ninfo@mesalink.pt`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
