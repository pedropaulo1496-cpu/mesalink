import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { getMarketingCardTheme } from "@/lib/marketing-card-themes";
import { prisma } from "@/lib/prisma";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { createBenefitCardCode } from "@/lib/referrals";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const restaurantId = typeof body?.restaurantId === "string" ? body.restaurantId : "";
  if (!restaurantId) return NextResponse.json({ success: false, error: "Restaurante em falta." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
  if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ success: false, error: "As automações de aniversário estão disponíveis no plano Growth." }, { status: 403 });
  const restaurant = await prisma.restaurant.findFirst({ where: { id: restaurantId, userId: user.id }, select: { id: true } });
  if (!restaurant) return NextResponse.json({ success: false, error: "Restaurante não encontrado." }, { status: 404 });

  return runBirthdays(restaurantId);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }
  return runBirthdays(null);
}

async function runBirthdays(restaurantId: string | null) {
  try {
    const today = new Date();
    const oneYearAgo = new Date(today.getTime() - 330 * 24 * 60 * 60 * 1000);
    const customers = await prisma.customer.findMany({
      where: {
        ...(restaurantId ? { restaurantId } : {}),
        marketingOptIn: true,
        birthDate: { not: null },
        email: { not: null },
      },
      include: { restaurant: { include: { user: { include: { subscription: true } } } } },
      take: 5000,
    });

    let emailsSent = 0;
    let created = 0;
    let skipped = 0;
    let insufficientAllowance = false;

    for (const customer of customers) {
      if (!customer.birthDate || !customer.email || !birthdayWithinNextDays(customer.birthDate, today, 7)) continue;
      const restaurant = customer.restaurant;
      const owner = restaurant?.user;
      if (!restaurant || !customer.restaurantId || !owner || !hasGrowthAccess(owner.subscription)) {
        skipped += 1;
        continue;
      }

      const existingAction = await prisma.marketingAction.findFirst({
        where: {
          customerId: customer.id,
          restaurantId: customer.restaurantId,
          type: "BIRTHDAY",
          createdAt: { gte: oneYearAgo },
          status: { in: ["QUEUED", "SENT", "OPENED", "CLICKED", "BOOKED"] },
        },
      });
      if (existingAction) {
        skipped += 1;
        continue;
      }

      const action = await prisma.marketingAction.create({
        data: {
          restaurantId: customer.restaurantId,
          customerId: customer.id,
          type: "BIRTHDAY",
          status: "QUEUED",
          sentAt: new Date(),
          estimatedRevenue: 0,
          channel: "EMAIL",
          trackingToken: createMarketingTrackingToken(),
        },
      });
      created += 1;
      const emailReference = `email:marketing_birthday:${action.id}`;
      let emailReserved = false;
      let promoCard: { id: string; publicCode: string } | null = null;

      try {
        const allowance = await reserveEmailSend({
          userId: owner.id,
          restaurantId: customer.restaurantId,
          category: "BIRTHDAY",
          reference: emailReference,
        });
        if (!allowance.canSend) throw new Error("Email already reserved");
        emailReserved = true;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);
        promoCard = restaurant.birthdayOffer ? await prisma.marketingPromoCard.create({
          data: {
            publicCode: createBenefitCardCode(), restaurantId: customer.restaurantId, customerId: customer.id,
            campaignId: action.id, title: "O seu presente de aniversário", description: restaurant.birthdayOffer,
            benefitType: "GIFT", template: "GOLD", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }) : null;
        const cardUrl = promoCard ? `${clickUrl}?offer=${encodeURIComponent(promoCard.publicCode)}` : null;
        const delivery = await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: customer.email,
          subject: `Um pequeno presente de aniversário do ${cleanSubject(restaurant.name)}`,
          html: birthdayEmailHtml({ restaurantName: restaurant.name, customerName: customer.name, offer: restaurant.birthdayOffer, clickUrl, openUrl, cardUrl, publicCode: promoCard?.publicCode || null }),
        });
        const deliveryId = requireAcceptedEmail(delivery);
        await completeEmailSend(emailReference);
        const sentAt = new Date();
        await prisma.$transaction([
          prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", sentAt, deliveryId, failureReason: null } }),
          ...(promoCard ? [prisma.marketingPromoCard.update({ where: { id: promoCard.id }, data: { sentAt } })] : []),
        ]);
        emailsSent += 1;
      } catch (error) {
        if (emailReserved) await refundEmailSend(emailReference);
        if (promoCard) await prisma.marketingPromoCard.delete({ where: { id: promoCard.id } }).catch(() => null);
        await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" } });
        if (error instanceof InsufficientEmailAllowanceError) insufficientAllowance = true;
      }
    }

    return NextResponse.json({ success: !insufficientAllowance, customersFound: customers.length, created, emailsSent, skipped, ...(insufficientAllowance ? { error: "Os emails incluídos terminaram e não existem créditos AI. Cada crédito disponibiliza mais 75 emails.", code: "INSUFFICIENT_EMAIL_ALLOWANCE" } : {}) }, { status: insufficientAllowance && emailsSent === 0 ? 402 : 200 });
  } catch (error) {
    console.error("Birthday automation failed", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

function cleanSubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function birthdayWithinNextDays(birthDate: Date, today: Date, days: number) {
  const birthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (birthday < new Date(today.getFullYear(), today.getMonth(), today.getDate())) birthday.setFullYear(today.getFullYear() + 1);
  const difference = birthday.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return difference >= 0 && difference <= days * 24 * 60 * 60 * 1000;
}

function birthdayEmailHtml(input: { restaurantName: string; customerName: string; offer: string | null; clickUrl: string; openUrl: string; cardUrl: string | null; publicCode: string | null }) {
  const theme = getMarketingCardTheme("GOLD");
  const card = input.offer && input.cardUrl && input.publicCode ? `<a href="${input.cardUrl}" style="display:block;margin-top:24px;padding:24px;border-radius:22px;background:${theme.background};color:${theme.foreground};text-decoration:none;box-shadow:0 18px 40px rgba(48,32,18,.16)"><span style="display:block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${theme.accent};font-weight:800">Cartão digital · ${escapeHtml(input.restaurantName)}</span><span style="display:block;margin-top:18px;font-size:27px;line-height:1.05;font-weight:800">O seu presente de aniversário</span><span style="display:block;margin-top:12px;font-size:15px;line-height:1.5;color:${theme.muted}">${escapeHtml(input.offer)}</span><span style="display:block;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);font-family:monospace;font-size:14px;letter-spacing:2px">${escapeHtml(input.publicCode)}</span></a><p style="font-size:11px;line-height:1.6;color:#8A7C6D">Cartão individual de utilização única, válido durante 30 dias.</p>` : "";
  return `<div style="font-family:Arial,sans-serif;background:#F4EEE5;padding:32px 14px"><div style="max-width:600px;margin:auto;border-radius:30px;overflow:hidden;background:#fff;border:1px solid #E1D0B8"><div style="background:#17120D;padding:34px;color:#fff"><p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#D7B267;font-weight:800">${escapeHtml(input.restaurantName)}</p><h1 style="margin:18px 0 0;font-family:Georgia,serif;font-size:37px;line-height:1.05">Há dias que merecem ser celebrados à mesa.</h1></div><div style="padding:34px"><p style="margin:0;font-size:17px;line-height:1.75;color:#5F554B">Olá ${escapeHtml(input.customerName)},</p><p style="font-size:17px;line-height:1.75;color:#5F554B">O seu aniversário aproxima-se e toda a equipa gostaria de fazer parte da celebração. Será um prazer voltar a recebê-lo.</p>${card}<a href="${input.cardUrl || input.clickUrl}" style="display:inline-block;margin-top:26px;background:#17120D;color:#fff;text-decoration:none;padding:15px 24px;border-radius:999px;font-weight:800">${input.cardUrl ? "Abrir presente digital" : "Reservar a celebração"}</a><p style="margin-top:30px;font-size:11px;line-height:1.6;color:#918579">Recebeu este email porque aceitou comunicações deste restaurante. O envio é gerido automaticamente pelo MesaLink.</p>${marketingTrackingPixel(input.openUrl)}</div></div></div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
