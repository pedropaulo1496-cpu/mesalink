import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { notFound, redirect } from "next/navigation";
import { Resend } from "resend";
import { getLocale, getTranslations } from "next-intl/server";
import ReserveForm from "./ReserveForm";

const resend = new Resend(process.env.RESEND_API_KEY);

const emailDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

async function createPublicReservation(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") || "");
  const restaurantId = String(formData.get("restaurantId") || "");
  const tableIdValue = String(formData.get("tableId") ?? "");
  const customerName = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const birthDateValue = String(formData.get("birthDate") || "").trim();
  const guests = Number(formData.get("guests"));
  const date = new Date(String(formData.get("date")));
  const reservationMode = String(formData.get("reservationMode") ?? "TABLES");

  if (!customerName || !phone || !email) {
    redirect(`/reserve/${slug}?error=missing`);
  }

  if (!isValidEmail(email)) {
    redirect(`/reserve/${slug}?error=email`);
  }

  const birthDate = birthDateValue
    ? new Date(`${birthDateValue}T12:00:00`)
    : null;

  if (date < new Date()) {
    redirect(`/reserve/${slug}?error=past`);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      user: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!restaurant) notFound();

  const subscription = restaurant.user?.subscription;
  const plan = String(subscription?.plan || restaurant.plan || "").toUpperCase();

  const isTrialActive =
    subscription?.status === "TRIAL" &&
    subscription.trialEndsAt &&
    new Date() <= subscription.trialEndsAt;

  const isPaidPlan =
    subscription?.status === "ACTIVE" &&
    ["ESSENTIALS", "GROWTH", "PRO"].includes(plan);

  const isUnlimited = isTrialActive || isPaidPlan;

  if (!isUnlimited) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfNextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      1,
    );

    const coversThisMonthResult = await prisma.$queryRaw<
      { total: bigint | null }[]
    >`
      SELECT COALESCE(SUM("guests"), 0)::bigint as total
      FROM "Reservation"
      WHERE "restaurantId" = ${restaurant.id}
        AND "source" = 'PUBLIC'
        AND "createdAt" >= ${startOfMonth}
        AND "createdAt" < ${startOfNextMonth}
    `;

    const coversThisMonth = Number(coversThisMonthResult[0]?.total || 0);

    if (coversThisMonth + guests > 100) {
      redirect(`/reserve/${slug}?error=free_limit`);
    }
  }

  let status = String(formData.get("status") ?? "CONFIRMED");
  let approvalReason: string | null = null;

  if (
    restaurant.manualApprovalGuests &&
    guests >= restaurant.manualApprovalGuests
  ) {
    status = "PENDING";
    approvalReason = "LARGE_GROUP";
  }

  if (status === "PENDING" && !approvalReason) {
    approvalReason = "TABLE_MERGE";
  }

  const startDate = date;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  if (reservationMode === "TABLES" && tableIdValue) {
    const conflictingReservation = await prisma.reservation.findFirst({
      where: {
        tableId: tableIdValue,
        status: {
          notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
        },
        date: {
          gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
          lt: endDate,
        },
      },
    });

    if (conflictingReservation) {
      redirect(`/reserve/${slug}?error=conflict`);
    }
  }

  if (reservationMode === "CAPACITY") {
    const reservationsInPeriod = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        status: {
          notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
        },
        date: {
          gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
          lt: endDate,
        },
      },
    });

    const bookedGuests = reservationsInPeriod.reduce(
      (total, reservation) => total + reservation.guests,
      0,
    );

    const totalCapacity = restaurant.totalCapacity ?? 0;

    if (totalCapacity > 0 && bookedGuests + guests > totalCapacity) {
      status = "PENDING";
      approvalReason = "CAPACITY_LIMIT";
    }
  }

  let customer = await prisma.customer.findFirst({
    where: {
      restaurantId: restaurant.id,
      OR: [{ email }, { phone }],
    },
  });

  if (customer) {
    customer = await prisma.customer.update({
      where: {
        id: customer.id,
      },
      data: {
        name: customerName,
        phone,
        email,
        birthDate: birthDate || customer.birthDate,
        marketingOptIn: true,
        marketingJoinedAt: customer.marketingJoinedAt || new Date(),
        lastReservationAt: date,
        lastVisitAt: date,
        source: customer.source || "PUBLIC_RESERVATION",
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        restaurantId: restaurant.id,
        name: customerName,
        phone,
        email,
        birthDate,
        marketingOptIn: true,
        marketingJoinedAt: new Date(),
        lastReservationAt: date,
        lastVisitAt: date,
        source: "PUBLIC_RESERVATION",
      },
    });
  }

  // Mesmo cliente + mesmo restaurante + exata mesma data/hora já reservada.
  // Cobre duplo-clique / reenvio do formulário: em vez de criar uma 2ª linha,
  // reaproveita-se a reserva existente (ou revive-se se tinha sido cancelada).
  const existingReservation = await prisma.reservation.findFirst({
    where: {
      restaurantId: restaurant.id,
      customerId: customer.id,
      date,
    },
    orderBy: { createdAt: "desc" },
  });

  let finalReservation: { id: string; guests: number; status: string };
  let alreadyBooked = false;

  if (existingReservation && !["CANCELLED", "REJECTED"].includes(existingReservation.status)) {
    // Reserva idêntica já ativa: não criar nada, só avisar o cliente.
    finalReservation = existingReservation;
    alreadyBooked = true;
  } else if (existingReservation) {
    // Havia uma reserva cancelada/rejeitada nesse exato slot: revive-se com os dados novos.
    finalReservation = await prisma.reservation.update({
      where: { id: existingReservation.id },
      data: {
        customerName,
        phone,
        email,
        guests,
        status,
        approvalReason,
        tableId: tableIdValue || null,
        source: "PUBLIC",
      },
    });
  } else {
    try {
      finalReservation = await prisma.reservation.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          customerName,
          phone,
          email,
          guests,
          date,
          status,
          approvalReason,
          tableId: tableIdValue || null,
          source: "PUBLIC",
        },
      });
    } catch (err) {
      // Corrida verdadeira: dois pedidos em paralelo passaram a verificação acima.
      // O constraint único da base de dados rejeitou este; usar o que ganhou a corrida.
      const raceWinner = await prisma.reservation.findFirst({
        where: { restaurantId: restaurant.id, customerId: customer.id, date },
        orderBy: { createdAt: "desc" },
      });

      if (!raceWinner) throw err;
      finalReservation = raceWinner;
      alreadyBooked = true;
    }
  }

  // Se a reserva já existia e estava ativa, não repetir efeitos secundários
  // (conversão de marketing, email de confirmação) — só avisar o cliente.
  if (!alreadyBooked) {
    await prisma.marketingAction.updateMany({
      where: {
        customerId: customer.id,
        restaurantId: restaurant.id,
        status: {
          in: ["SENT", "OPENED", "CLICKED"],
        },
        type: {
          in: ["INACTIVE_RECOVERY", "BIRTHDAY"],
        },
      },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        estimatedRevenue: guests * (restaurant.averageTicket ?? 25),
      },
    });

    const shouldSendEmail =
      ["ESSENTIALS", "GROWTH", "PRO"].includes(plan) &&
      Boolean(email) &&
      Boolean(process.env.RESEND_API_KEY);

    if (shouldSendEmail) {
      try {
        const locale = await getLocale();
        const emailT = await getTranslations("publicFlows.reserve.email");
        const intlLocale = emailDateLocales[locale] ?? "pt-PT";

        const isPending = status === "PENDING";

        const subject = isPending
          ? emailT("subjectPending", { restaurantName: restaurant.name })
          : emailT("subjectConfirmed", { restaurantName: restaurant.name });

        const heading = isPending
          ? emailT("headingPending")
          : emailT("headingConfirmed");

        const bodyText = isPending
          ? emailT("bodyPending")
          : emailT("bodyConfirmed");

        const statusText = isPending
          ? emailT("statusPending")
          : emailT("statusConfirmed");

        await resend.emails.send({
          from: "MesaLink <noreply@mesalink.pt>",
          to: email,
          subject,
          html: `
            <div style="margin:0;background:#F5EFE6;padding:32px;font-family:Arial,sans-serif;color:#16120E;line-height:1.5;">
              <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E1D0B8;border-radius:24px;padding:28px;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#9B6F3B;">MesaLink</p>
                <h1 style="margin:0;font-size:28px;line-height:1.1;color:#16120E;">
                  ${heading}
                </h1>
                <p style="margin:18px 0 0;color:#6B6258;">${emailT("greeting", { customerName })}</p>
                <p style="margin:10px 0 0;color:#6B6258;">
                  ${bodyText}
                </p>
                <div style="margin:24px 0;padding:18px;border:1px solid #E1D0B8;border-radius:18px;background:#FFF9F0;">
                  <p><strong>${emailT("labelRestaurant")}</strong> ${restaurant.name}</p>
                  <p><strong>${emailT("labelDate")}</strong> ${date.toLocaleDateString(intlLocale)}</p>
                  <p><strong>${emailT("labelTime")}</strong> ${date.toLocaleTimeString(intlLocale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</p>
                  <p><strong>${emailT("labelGuests")}</strong> ${guests}</p>
                  <p><strong>${emailT("labelStatus")}</strong> ${statusText}</p>
                </div>
                <p style="font-size:12px;color:#9B8F82;">${emailT("footerNote")}</p>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error("Erro ao enviar email de reserva:", error);
      }
    }
  }

  redirect(
    `/reserve/${slug}/success?name=${encodeURIComponent(
      customerName,
    )}&guests=${finalReservation.guests}&date=${encodeURIComponent(
      date.toISOString(),
    )}&status=${finalReservation.status}${alreadyBooked ? "&already=1" : ""}`,
  );
}

export default async function PublicReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      tables: {
        include: { reservations: true },
        orderBy: { number: "asc" },
      },
    },
  });

  if (!restaurant) notFound();

  return (
    <ReserveForm
      restaurant={restaurant}
      error={error}
      createPublicReservation={createPublicReservation}
    />
  );
}