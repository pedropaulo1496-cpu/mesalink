import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AI_CREDIT_COSTS, hasGrowthAccess, InsufficientAiCreditsError, refundAiCredits, spendAiCredits } from "@/lib/ai-billing";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";

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
      const creditReference = `marketing_recovery:${action.id}`;
      let creditCharged = false;

      try {
        await spendAiCredits({
          userId: user!.id,
          amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
          feature: "REVENUE_EMAIL",
          description: `Email automático de recuperação para ${customer.name}`,
          reference: creditReference,
        });
        creditCharged = true;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);

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
                  restaurant.recoveryOffer
                    ? `
                      <div style="margin-top:16px;padding:16px;border-radius:16px;background:#FFF9F0;border:1px solid #E1D0B8;">
                        <strong>Oferta exclusiva 🍷</strong>
                        <p style="margin-top:8px;">
                          ${escapeHtml(restaurant.recoveryOffer)}
                        </p>
                      </div>
                    `
                    : ""
                }

                <a href="${clickUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;">
                  Reservar mesa
                </a>

                <p style="margin-top:28px;font-size:12px;line-height:1.5;color:#8A7C6D;">
                  Recebeu este email porque aceitou receber comunicações deste restaurante.
                </p>
                ${marketingTrackingPixel(openUrl)}
              </div>
            </div>
          `,
        });

        await prisma.marketingAction.update({
          where: { id: action.id },
          data: { status: "SENT", deliveryId: delivery.data?.id || null, failureReason: null, sentAt: new Date(), nextFollowUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        });
        emailsSent++;
      } catch (error) {
        console.error("Erro ao enviar email de recuperação:", error);
        if (creditCharged) {
          await refundAiCredits({
            userId: user!.id,
            amount: AI_CREDIT_COSTS.REVENUE_EMAIL,
            feature: "REVENUE_EMAIL",
            description: `Crédito devolvido: email automático para ${customer.name} não enviado`,
            reference: creditReference,
          });
        }
        await prisma.marketingAction.update({
          where: { id: action.id },
          data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" },
        });
        if (error instanceof InsufficientAiCreditsError) {
          return NextResponse.json({ success: false, error: "Saldo insuficiente. Cada email automático custa 1 crédito.", code: "INSUFFICIENT_AI_CREDITS", required: error.required, available: error.available, emailsSent }, { status: 402 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      customersFound: customers.length,
      created,
      emailsSent,
      skipped,
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
