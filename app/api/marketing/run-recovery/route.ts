import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { getMarketingCardTheme } from "@/lib/marketing-card-themes";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";
import { createBenefitCardCode } from "@/lib/referrals";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  return runRecovery(body?.restaurantId);
}

export async function GET(request: Request) {
  const restaurantId = new URL(request.url).searchParams.get("restaurantId");
  return runRecovery(restaurantId);
}

async function runRecovery(restaurantId: unknown) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
    }

    if (typeof restaurantId !== "string" || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurante em falta." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });
    if (!hasGrowthAccess(user?.subscription)) return NextResponse.json({ success: false, error: "As automações de recuperação estão disponíveis no plano Growth." }, { status: 403 });

    const restaurant = user
      ? await prisma.restaurant.findFirst({
          where: { id: restaurantId, userId: user.id },
          select: { id: true },
        })
      : null;

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurante não encontrado." },
        { status: 404 },
      );
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const customers = await prisma.customer.findMany({
      where: {
        restaurantId,
        marketingOptIn: true,
        email: {
          not: null,
        },
        OR: [
          {
            lastVisitAt: {
              lt: sixtyDaysAgo,
            },
          },
          {
            lastReservationAt: {
              lt: sixtyDaysAgo,
            },
          },
        ],
      },
      include: {
        restaurant: true,
      },
    });

    let created = 0;
    let emailsSent = 0;
    let skipped = 0;

    for (const customer of customers) {
      const restaurant = customer.restaurant;

      if (!restaurant || !customer.restaurantId || !customer.email) {
        skipped++;
        continue;
      }

      const existingAction = await prisma.marketingAction.findFirst({
        where: {
          customerId: customer.id,
          restaurantId: customer.restaurantId,
          type: "INACTIVE_RECOVERY",
          status: {
            in: ["QUEUED", "SENT", "OPENED", "CLICKED", "BOOKED"],
          },
        },
      });

      if (existingAction) {
        skipped++;
        continue;
      }

      const action = await prisma.marketingAction.create({
        data: {
          restaurantId: customer.restaurantId,
          customerId: customer.id,
          type: "INACTIVE_RECOVERY",
          status: "QUEUED",
          sentAt: new Date(),
          estimatedRevenue: Number(restaurant.averageTicket || 25),
          channel: "EMAIL",
          trackingToken: createMarketingTrackingToken(),
        },
      });

      created++;
      const emailReference = `email:marketing_recovery:${action.id}`;
      let emailReserved = false;
      let promoCard: { id: string; publicCode: string } | null = null;

      try {
        const allowance = await reserveEmailSend({
          userId: user!.id,
          restaurantId: customer.restaurantId,
          category: "REVENUE_RECOVERY",
          reference: emailReference,
        });
        if (!allowance.canSend) throw new Error("Email already reserved");
        emailReserved = true;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);
        promoCard = restaurant.recoveryOffer ? await prisma.marketingPromoCard.create({
          data: {
            publicCode: createBenefitCardCode(), restaurantId: customer.restaurantId, customerId: customer.id,
            campaignId: action.id, title: "Uma oferta para voltar", description: restaurant.recoveryOffer,
            benefitType: "GIFT", template: "FOREST", expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        }) : null;
        const cardUrl = promoCard ? `${clickUrl}?offer=${encodeURIComponent(promoCard.publicCode)}` : null;
        const theme = getMarketingCardTheme("FOREST");

        const delivery = await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: customer.email,
          subject: `${cleanSubject(customer.name)}, sentimos a sua falta`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
                <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;margin:0;">
                  ${escapeHtml(restaurant.name)}
                </p>

                <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
                  Já temos saudades suas.
                </h1>

                <p style="font-size:15px;line-height:1.6;color:#6B6258;margin:0;">
                  Olá ${escapeHtml(customer.name)}, já passou algum tempo desde a sua última visita.
                  Gostávamos muito de o voltar a receber em breve.
                </p>

                ${
                  restaurant.recoveryOffer && promoCard && cardUrl
                    ? `<a href="${cardUrl}" style="display:block;margin-top:22px;padding:22px;border-radius:22px;background:${theme.background};color:${theme.foreground};text-decoration:none;box-shadow:0 18px 40px rgba(48,32,18,.16)"><span style="display:block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${theme.accent};font-weight:800">Cartão digital · ${escapeHtml(restaurant.name)}</span><span style="display:block;margin-top:16px;font-size:26px;line-height:1.05;font-weight:800">Uma oferta para voltar</span><span style="display:block;margin-top:12px;font-size:15px;line-height:1.5;color:${theme.muted}">${escapeHtml(restaurant.recoveryOffer)}</span><span style="display:block;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.18);font-family:monospace;font-size:14px;letter-spacing:2px">${escapeHtml(promoCard.publicCode)}</span></a><p style="font-size:11px;line-height:1.6;color:#8A7C6D">Cartão individual de utilização única, válido durante 30 dias.</p>`
                    : ""
                }

                <a href="${cardUrl || clickUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;">
                  ${cardUrl ? "Abrir cartão digital" : "Reservar mesa"}
                </a>

                <p style="margin-top:28px;font-size:12px;line-height:1.5;color:#8A7C6D;">
                  Recebeu este email porque aceitou receber comunicações deste restaurante.
                </p>
                ${marketingTrackingPixel(openUrl)}
              </div>
            </div>
          `,
        });
        const deliveryId = requireAcceptedEmail(delivery);

        await completeEmailSend(emailReference);
        const sentAt = new Date();
        await prisma.$transaction([
          prisma.marketingAction.update({ where: { id: action.id }, data: { status: "SENT", deliveryId, failureReason: null, sentAt, nextFollowUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000) } }),
          ...(promoCard ? [prisma.marketingPromoCard.update({ where: { id: promoCard.id }, data: { sentAt } })] : []),
        ]);
        emailsSent++;
      } catch (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        if (emailReserved) await refundEmailSend(emailReference);
        if (promoCard) await prisma.marketingPromoCard.delete({ where: { id: promoCard.id } }).catch(() => null);
        await prisma.marketingAction.update({
          where: { id: action.id },
          data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" },
        });
        if (error instanceof InsufficientEmailAllowanceError) {
          return NextResponse.json({ success: false, error: "Os 1.000 emails incluídos terminaram e não existem créditos AI. Cada crédito disponibiliza mais 75 emails.", code: "INSUFFICIENT_EMAIL_ALLOWANCE", emailsRemaining: error.emailBalance, aiCredits: error.aiCredits, emailsSent }, { status: 402 });
        }
      }
    }

    const finalAllowance = await prisma.subscription.findUnique({
      where: { userId: user!.id },
      select: { emailBalance: true, aiCredits: true },
    });

    return NextResponse.json({
      success: true,
      customersFound: customers.length,
      created,
      emailsSent,
      skipped,
      emailsRemaining: finalAllowance?.emailBalance || 0,
      aiCredits: finalAllowance?.aiCredits || 0,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

function cleanSubject(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, 80);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
