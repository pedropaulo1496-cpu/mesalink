import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth";
import { AI_CREDIT_COSTS, hasGrowthAccess, InsufficientAiCreditsError, refundAiCredits, spendAiCredits } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";

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
    const currentMonth = today.getMonth();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
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
    let insufficientCredits = false;

    for (const customer of customers) {
      if (!customer.birthDate || !customer.email || new Date(customer.birthDate).getMonth() !== currentMonth) continue;
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
          createdAt: { gte: monthStart },
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
      const creditReference = `marketing_birthday:${action.id}`;
      let creditCharged = false;

      try {
        await spendAiCredits({
          userId: owner.id,
          amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
          feature: "REVENUE_EMAIL",
          description: `Email de aniversário para ${customer.name}`,
          reference: creditReference,
        });
        creditCharged = true;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);
        const delivery = await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: customer.email,
          subject: `${cleanSubject(customer.name)}, feliz aniversário`,
          html: `<div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #E1D0B8;border-radius:28px;padding:32px"><p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700">${escapeHtml(restaurant.name)}</p><h1 style="font-size:30px;line-height:1.1;color:#16120E">Feliz aniversário, ${escapeHtml(customer.name)}.</h1><p style="font-size:15px;line-height:1.6;color:#6B6258">Toda a equipa deseja-lhe um excelente dia. Esperamos recebê-lo novamente muito em breve.</p>${restaurant.birthdayOffer ? `<div style="margin-top:16px;padding:16px;border-radius:16px;background:#FFF9F0;border:1px solid #E1D0B8"><strong>Oferta especial</strong><p>${escapeHtml(restaurant.birthdayOffer)}</p></div>` : ""}<a href="${clickUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Reservar mesa</a><p style="margin-top:28px;font-size:12px;color:#8A7C6D">Recebeu este email porque aceitou receber comunicações deste restaurante.</p>${marketingTrackingPixel(openUrl)}</div></div>`,
        });
        await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", sentAt: new Date(), deliveryId: delivery.data?.id || null, failureReason: null } });
        emailsSent += 1;
      } catch (error) {
        if (creditCharged) await refundAiCredits({
          userId: owner.id,
          amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
          feature: "REVENUE_EMAIL",
          description: `Crédito devolvido: email de aniversário para ${customer.name} não enviado`,
          reference: creditReference,
        });
        await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" } });
        if (error instanceof InsufficientAiCreditsError) insufficientCredits = true;
      }
    }

    return NextResponse.json({ success: !insufficientCredits, customersFound: customers.length, created, emailsSent, skipped, ...(insufficientCredits ? { error: "Saldo insuficiente. Cada email de aniversário custa 1 crédito.", code: "INSUFFICIENT_AI_CREDITS" } : {}) }, { status: insufficientCredits && emailsSent === 0 ? 402 : 200 });
  } catch (error) {
    console.error("Birthday automation failed", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

function cleanSubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
