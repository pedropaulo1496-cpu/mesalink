import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Resend } from "resend";
import ReserveForm from "./ReserveForm";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  await prisma.$executeRaw`
    INSERT INTO "Reservation"
      (
        "id",
        "restaurantId",
        "customerId",
        "customerName",
        "phone",
        "email",
        "guests",
        "date",
        "status",
        "approvalReason",
        "tableId",
        "source",
        "createdAt"
      )
    VALUES
      (
        gen_random_uuid()::text,
        ${restaurant.id},
        ${customer.id},
        ${customerName},
        ${phone},
        ${email},
        ${guests},
        ${date},
        ${status},
        ${approvalReason},
        ${tableIdValue || null},
        'PUBLIC',
        NOW()
      )
  `;

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
      await resend.emails.send({
        from: "MesaLink <info@mesalink.pt>",
        to: email,
        subject:
          status === "PENDING"
            ? `Pedido de reserva recebido - ${restaurant.name}`
            : `Reserva confirmada - ${restaurant.name}`,
        html: `
          <div style="margin:0;background:#F5EFE6;padding:32px;font-family:Arial,sans-serif;color:#16120E;line-height:1.5;">
            <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E1D0B8;border-radius:24px;padding:28px;">
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#9B6F3B;">MesaLink</p>
              <h1 style="margin:0;font-size:28px;line-height:1.1;color:#16120E;">
                ${
                  status === "PENDING"
                    ? "Pedido de reserva recebido"
                    : "Reserva confirmada"
                }
              </h1>
              <p style="margin:18px 0 0;color:#6B6258;">Olá ${customerName},</p>
              <p style="margin:10px 0 0;color:#6B6258;">
                ${
                  status === "PENDING"
                    ? "Recebemos o seu pedido de reserva. O restaurante irá confirmar ou recusar em breve."
                    : "A sua reserva foi confirmada com sucesso."
                }
              </p>
              <div style="margin:24px 0;padding:18px;border:1px solid #E1D0B8;border-radius:18px;background:#FFF9F0;">
                <p><strong>Restaurante:</strong> ${restaurant.name}</p>
                <p><strong>Data:</strong> ${date.toLocaleDateString("pt-PT")}</p>
                <p><strong>Hora:</strong> ${date.toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
                <p><strong>Pessoas:</strong> ${guests}</p>
                <p><strong>Estado:</strong> ${
                  status === "PENDING" ? "Pendente de aprovação" : "Confirmada"
                }</p>
              </div>
              <p style="font-size:12px;color:#9B8F82;">Este email foi enviado automaticamente pelo MesaLink.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Erro ao enviar email de reserva:", error);
    }
  }

  redirect(
    `/reserve/${slug}/success?name=${encodeURIComponent(
      customerName,
    )}&guests=${guests}&date=${encodeURIComponent(
      date.toISOString(),
    )}&status=${status}`,
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