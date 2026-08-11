import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { completeEmailSend, InsufficientEmailAllowanceError, refundEmailSend, reserveEmailSend } from "@/lib/email-billing";
import { requireAcceptedEmail } from "@/lib/email-delivery";
import { createMarketingTrackingToken, getMarketingTrackingUrls, marketingTrackingPixel } from "@/lib/marketing-tracking";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
    const body = await request.formData();

    const restaurantId = String(body.get("restaurantId"));
    const segment = String(body.get("segment"));
    const tag = String(body.get("tag") || "").trim();
    const subject = cleanText(body.get("subject"), 120).replace(/[\r\n]+/g, " ");
    const message = cleanText(body.get("message"), 5000);
    if (!subject || !message) return NextResponse.json({ success: false, error: "Assunto e mensagem são obrigatórios." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
    if (!user) return NextResponse.json({ success: false, error: "Não autenticado." }, { status: 401 });
    if (!hasGrowthAccess(user.subscription)) return NextResponse.json({ success: false, error: "As campanhas estão disponíveis no plano Growth." }, { status: 403 });

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, userId: user.id },
    });

    if (!restaurant) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

   const baseWhere = {
  restaurantId,
  marketingOptIn: true,
  email: {
    not: null,
  },
};

    let customers = [];

    if (segment === "ALL") {
      customers = await prisma.customer.findMany({
        where: baseWhere,
      });
    }

    if (segment === "VIP") {
      customers = await prisma.customer.findMany({
        where: {
          ...baseWhere,
          vipTier: {
            not: null,
          },
        },
      });
    }

    if (
      segment === "BRONZE" ||
      segment === "SILVER" ||
      segment === "GOLD" ||
      segment === "PLATINUM"
    ) {
      customers = await prisma.customer.findMany({
        where: {
          ...baseWhere,
          vipTier: segment,
        },
      });
    }

    if (segment === "TAG" && tag) {
      customers = await prisma.customer.findMany({
        where: {
          ...baseWhere,
          tags: {
            has: tag,
          },
        },
      });
    }

    if (segment === "INACTIVE") {
      customers = await prisma.customer.findMany({
        where: {
          ...baseWhere,
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
      });
    }

    if (segment === "BIRTHDAYS") {
      const currentMonth = new Date().getMonth();

      const birthdayCustomers = await prisma.customer.findMany({
        where: {
          ...baseWhere,
          birthDate: {
            not: null,
          },
        },
      });

      customers = birthdayCustomers.filter(
        (customer) =>
          customer.birthDate &&
          new Date(customer.birthDate).getMonth() === currentMonth,
      );
    }

    let emailsSent = 0;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    for (const customer of customers) {
      const action = await prisma.marketingAction.create({
        data: {
          restaurantId,
          customerId: customer.id,
          type: "MANUAL_CAMPAIGN",
          status: "QUEUED",
          sentAt: new Date(),
          estimatedRevenue: 0,
          channel: "EMAIL",
          trackingToken: createMarketingTrackingToken(),
        },
      });
      const emailReference = `email:marketing_campaign:${action.id}`;
      let emailReserved = false;
      try {
        const allowance = await reserveEmailSend({
          userId: user.id,
          restaurantId,
          category: "MANUAL_CAMPAIGN",
          reference: emailReference,
        });
        if (!allowance.canSend) throw new Error("Email already reserved");
        emailReserved = true;
        const { clickUrl, openUrl } = getMarketingTrackingUrls(baseUrl, action.trackingToken!);
        const delivery = await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: customer.email!,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
                <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;margin:0;">
                  ${escapeHtml(restaurant.name)}
                </p>

                <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
                  ${escapeHtml(subject)}
                </h1>

                <p style="font-size:15px;line-height:1.8;color:#6B6258;white-space:pre-line;">
                  ${escapeHtml(message)}
                </p>

                <a
                  href="${clickUrl}"
                  style="
                    display:inline-block;
                    margin-top:24px;
                    background:#16120E;
                    color:white;
                    text-decoration:none;
                    padding:14px 22px;
                    border-radius:999px;
                    font-weight:700;
                    font-size:14px;
                  "
                >
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
        const deliveryId = requireAcceptedEmail(delivery);

        await completeEmailSend(emailReference);
        await prisma.marketingAction.update({
          where: { id: action.id },
          data: { status: "SENT", sentAt: new Date(), deliveryId, failureReason: null },
        });

        emailsSent++;
      } catch (error) {
        console.error(error);
        if (emailReserved) await refundEmailSend(emailReference);
        await prisma.marketingAction.update({ where: { id: action.id }, data: { status: "FAILED", failureReason: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed" } });
        if (error instanceof InsufficientEmailAllowanceError) {
          return NextResponse.redirect(new URL(`/restaurants/${restaurantId}/marketing?campaignError=emails&emailsSent=${emailsSent}`, request.url), 303);
        }
      }
    }

    return NextResponse.redirect(
      new URL(
        `/restaurants/${restaurantId}/marketing?campaignSent=1&emailsSent=${emailsSent}`,
        request.url,
      ),
      303,
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}

function cleanText(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}
