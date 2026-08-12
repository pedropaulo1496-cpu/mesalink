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
  let databasePromotionId: string | null = null;
  try {
    const coupon = await stripe.coupons.create({
      name: `MesaLink ${input.percentOff}% · ${target.email}`,
      percent_off: input.percentOff,
      duration: input.duration.toLowerCase() as "once" | "repeating" | "forever",
      ...(durationMonths ? { duration_in_months: durationMonths } : {}),
      redeem_by: Math.floor(expiresAt.getTime() / 1000),
      metadata: { targetUserId: target.id, createdById: input.createdById, source: "MESALINK_BACKOFFICE" },
    });
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

    const delivery = await resend.emails.send({
      from: "MesaLink <noreply@mesalink.pt>",
      to: target.email,
      subject: `Oferta MesaLink: ${input.percentOff}% de desconto`,
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
      data: { status: "SENT", sentAt: new Date(), emailDeliveryId: deliveryId },
    });
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
  return `<div style="font-family:Arial,sans-serif;background:#F4ECDF;padding:32px 14px;color:#17130F"><div style="max-width:600px;margin:auto;background:#fff;border:1px solid #DCC9AA;border-radius:30px;overflow:hidden"><div style="background:#17130F;padding:28px 34px;color:#fff"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D7B267;font-weight:800">MesaLink</p><h1 style="margin:12px 0 0;font-size:32px">Uma oferta para fazer o restaurante crescer.</h1></div><div style="padding:34px"><p style="font-size:16px;line-height:1.7">Olá ${escapeHtml(input.name)},</p><p style="font-size:16px;line-height:1.7;color:#62584E">Preparámos um código exclusivo de <strong>${input.percentOff}% de desconto</strong>, válido ${validity}.</p><div style="margin:28px 0;padding:24px;border:1px dashed #B78B49;border-radius:20px;text-align:center;background:#FFF9F0"><p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8A6130">Código promocional</p><strong style="font-size:28px;letter-spacing:2px">${escapeHtml(input.code)}</strong></div>${input.note ? `<p style="font-size:14px;line-height:1.7;color:#62584E">${escapeHtml(input.note)}</p>` : ""}<a href="${baseUrl}/billing" style="display:inline-block;background:#17130F;color:white;text-decoration:none;padding:15px 24px;border-radius:999px;font-weight:800">Escolher plano MesaLink</a><p style="margin-top:24px;font-size:12px;line-height:1.6;color:#8A7C6D">Utilização única. Pode aplicar o código no checkout até ${input.expiresAt.toLocaleDateString("pt-PT")}.</p></div></div></div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
