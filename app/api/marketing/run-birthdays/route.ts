import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  return runBirthdays();
}

export async function POST() {
  return runBirthdays();
}

async function runBirthdays() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();

    const customers = await prisma.customer.findMany({
      where: {
        marketingOptIn: true,
        birthDate: {
          not: null,
        },
        email: {
          not: null,
        },
      },
      include: {
        reservations: {
          orderBy: {
            date: "desc",
          },
          take: 1,
          include: {
            restaurant: true,
          },
        },
      },
    });

    let emailsSent = 0;
    let created = 0;
    let skipped = 0;

    for (const customer of customers) {
      if (!customer.birthDate) continue;

      const birthMonth = new Date(customer.birthDate).getMonth();

      if (birthMonth !== currentMonth) continue;

      const lastReservation = customer.reservations[0];
      const restaurant = lastReservation?.restaurant;

      if (!restaurant) {
        skipped++;
        continue;
      }

      const existingAction = await prisma.marketingAction.findFirst({
        where: {
          customerId: customer.id,
          restaurantId: restaurant.id,
          type: "BIRTHDAY",
          status: {
            in: ["SENT", "OPENED", "CLICKED"],
          },
        },
      });

      if (existingAction) {
        skipped++;
        continue;
      }

      await prisma.marketingAction.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          type: "BIRTHDAY",
          status: "SENT",
          sentAt: new Date(),
          estimatedRevenue: 0,
        },
      });

      created++;

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const reserveUrl = `${baseUrl}/reserve/${restaurant.slug}`;

      await resend.emails.send({
        from: "MesaLink <info@mesalink.pt>",
        to: customer.email!,
        subject: `${customer.name}, feliz aniversário`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
              <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;margin:0;">
                ${restaurant.name}
              </p>

              <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
                Feliz aniversário, ${customer.name}.
              </h1>

              <p style="font-size:15px;line-height:1.6;color:#6B6258;margin:0;">
  Toda a equipa deseja-lhe um excelente dia. Esperamos recebê-lo novamente muito em breve.
</p>

              ${restaurant.birthdayOffer
  ? `
    <div style="margin-top:16px;padding:16px;border-radius:16px;background:#FFF9F0;border:1px solid #E1D0B8;">
      <strong>Oferta especial 🎁</strong>
      <p style="margin-top:8px;">
        ${restaurant.birthdayOffer}
      </p>
    </div>
  `
  : ""}

              <a href="${reserveUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;">
                Reservar mesa
              </a>

              <p style="margin-top:28px;font-size:12px;line-height:1.5;color:#8A7C6D;">
                Recebeu este email porque aceitou receber comunicações deste restaurante.
              </p>
            </div>
          </div>
        `,
      });

      emailsSent++;
    }

    return NextResponse.json({
      success: true,
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
      { status: 500 },
    );
  }
}