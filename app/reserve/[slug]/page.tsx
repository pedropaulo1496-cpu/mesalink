import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Resend } from "resend";
import ReserveForm from "./ReserveForm";

const resend = new Resend(process.env.RESEND_API_KEY);

async function createPublicReservation(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug"));
  const restaurantId = String(formData.get("restaurantId"));
  const tableIdValue = String(formData.get("tableId") ?? "");
  const customerName = String(formData.get("customerName"));
  const phone = String(formData.get("phone"));
  const email = String(formData.get("email") ?? "");
  const guests = Number(formData.get("guests"));
  const date = new Date(String(formData.get("date")));
  const reservationMode = String(formData.get("reservationMode") ?? "TABLES");

  const now = new Date();

  if (date < now) {
    redirect(`/reserve/${slug}?error=past`);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    notFound();
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
      0
    );

    const totalCapacity = restaurant.totalCapacity ?? 0;

    if (totalCapacity > 0 && bookedGuests + guests > totalCapacity) {
      status = "PENDING";
      approvalReason = "CAPACITY_LIMIT";
    }
  }

  const customer = await prisma.customer.upsert({
    where: {
      phone,
    },
    update: {
      name: customerName,
      email: email || null,
    },
    create: {
      name: customerName,
      phone,
      email: email || null,
    },
  });

  await prisma.reservation.create({
    data: {
      restaurantId: restaurant.id,
      customerId: customer.id,
      customerName,
      phone,
      email: email || null,
      guests,
      date,
      status,
      approvalReason,
      tableId: tableIdValue || null,
    },
  });

  const shouldSendEmail =
    restaurant.plan === "PRO" &&
    Boolean(email) &&
    Boolean(process.env.RESEND_API_KEY);

  if (shouldSendEmail) {
    try {
      const emailResult = await resend.emails.send({
        from: "MesaLink <info@mesalink.pt>",
        to: email,
        subject:
          status === "PENDING"
            ? `Pedido de reserva recebido - ${restaurant.name}`
            : `Reserva confirmada - ${restaurant.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
            <h1>
              ${
                status === "PENDING"
                  ? "Pedido de reserva recebido"
                  : "Reserva confirmada"
              }
            </h1>

            <p>Olá ${customerName},</p>

            <p>
              ${
                status === "PENDING"
                  ? "Recebemos o seu pedido de reserva. O restaurante irá confirmar ou recusar em breve."
                  : "A sua reserva foi confirmada com sucesso."
              }
            </p>

            <div style="margin: 24px 0; padding: 16px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
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

            <p style="font-size: 13px; color: #666;">
              Este email foi enviado automaticamente pelo MesaLink.
            </p>
          </div>
        `,
      });

      console.log("Email enviado:", emailResult);
    } catch (error) {
      console.error(
        "Erro ao enviar email de reserva:",
        JSON.stringify(error, null, 2)
      );
    }
  }

  redirect(
    `/reserve/${slug}/success?name=${encodeURIComponent(
      customerName
    )}&guests=${guests}&date=${encodeURIComponent(
      date.toISOString()
    )}&status=${status}`
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

  if (!restaurant) {
    notFound();
  }

  return (
    <ReserveForm
      restaurant={restaurant}
      error={error}
      createPublicReservation={createPublicReservation}
    />
  );
}