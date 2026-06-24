import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.formData();

    const restaurantId = String(body.get("restaurantId"));
    const segment = String(body.get("segment"));
    const tag = String(body.get("tag") || "").trim();
    const subject = String(body.get("subject"));
    const message = String(body.get("message"));

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
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
    const reserveUrl = `${baseUrl}/reserve/${restaurant.slug}`;

    for (const customer of customers) {
      try {
        await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: customer.email!,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
                <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;margin:0;">
                  ${restaurant.name}
                </p>

                <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
                  ${subject}
                </h1>

                <p style="font-size:15px;line-height:1.8;color:#6B6258;white-space:pre-line;">
                  ${message}
                </p>

                <a
                  href="${reserveUrl}"
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
              </div>
            </div>
          `,
        });

        await prisma.marketingAction.create({
          data: {
            restaurantId,
            customerId: customer.id,
            type: "MANUAL_CAMPAIGN",
            status: "SENT",
            sentAt: new Date(),
            estimatedRevenue: 0,
          },
        });

        emailsSent++;
      } catch (error) {
        console.error(error);
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