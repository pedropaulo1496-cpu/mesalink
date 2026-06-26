import DayPicker from "./DayPicker";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { sendReviewEmail } from "@/lib/send-review-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isLunch(date: Date) {
  return date.getHours() < 17;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmada",
    SEATED: "Sentado",
    FINISHED: "Finalizada",
    NO_SHOW: "No-show",
    CANCELLED: "Cancelada",
    REJECTED: "Recusada",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: "bg-[#FFF1D0] text-[#9B6F3B]",
    CONFIRMED: "bg-[#ECF7EC] text-[#3F6A4D]",
    SEATED: "bg-[#EFE5D6] text-[#16120E]",
    FINISHED: "bg-[#F3EEE6] text-[#6B6258]",
    NO_SHOW: "bg-[#FFF0EA] text-[#A14E36]",
    CANCELLED: "bg-[#FFF0EA] text-[#A14E36]",
    REJECTED: "bg-[#FFF0EA] text-[#A14E36]",
  };

  return classes[status] ?? "bg-[#F3EEE6] text-[#6B6258]";
}

function getApprovalReasonLabel(reason: string | null) {
  const labels: Record<string, string> = {
    LARGE_GROUP: "Grupo grande",
    TABLE_MERGE: "Junção de mesas",
    CAPACITY_LIMIT: "Limite de capacidade",
  };

  return reason ? labels[reason] ?? reason : null;
}

async function updateReservationStatus(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));
  const status = String(formData.get("status"));
  const day = String(formData.get("day"));

 const reservation = await prisma.reservation.update({
  where: { id: reservationId },
  data: { status },
  include: {
    restaurant: true,
    customer: true,
  },
});

if (status === "FINISHED" && reservation.customerId) {
  const currentCustomer = await prisma.customer.findUnique({
    where: {
      id: reservation.customerId,
    },
  });

  if (currentCustomer) {
    const previousVipTier = currentCustomer.vipTier;

    const totalVisits = (currentCustomer.totalVisits ?? 0) + 1;

    let vipTier: string | null = null;

    if (totalVisits >= 50) {
      vipTier = "PLATINUM";
    } else if (totalVisits >= 20) {
      vipTier = "GOLD";
    } else if (totalVisits >= 10) {
      vipTier = "SILVER";
    } else if (totalVisits >= 5) {
      vipTier = "BRONZE";
    }

    const upgradedVipTier =
      vipTier &&
      vipTier !== previousVipTier;

    await prisma.customer.update({
      where: {
        id: reservation.customerId,
      },
      data: {
        lastVisitAt: new Date(),
        lastReservationAt: reservation.date,
        visitCount: totalVisits,
        totalVisits,
        vipTier,
      },
    });

    if (
  upgradedVipTier &&
  currentCustomer.email &&
  reservation.restaurant &&
  process.env.RESEND_API_KEY
) {

  const vipBenefit =
  vipTier === "PLATINUM"
    ? reservation.restaurant.platinumVipOffer
    : vipTier === "GOLD"
      ? reservation.restaurant.goldVipOffer
      : vipTier === "SILVER"
        ? reservation.restaurant.silverVipOffer
        : reservation.restaurant.bronzeVipOffer;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const reserveUrl = `${baseUrl}/reserve/${reservation.restaurant.slug}`;

  await resend.emails.send({
    from: "MesaLink <noreply@mesalink.pt>",
    to: currentCustomer.email,
    subject: `${currentCustomer.name}, atingiu o nível ${vipTier}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
          <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;margin:0;">
            ${reservation.restaurant.name}
          </p>

          <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
            Parabéns, ${currentCustomer.name}.
          </h1>

          <p style="font-size:15px;line-height:1.8;color:#6B6258;margin:0;">
            Acabou de atingir o nível <strong>${vipTier}</strong> no nosso Clube VIP.
          </p>

          ${
            vipBenefit
              ? `
                <div style="margin-top:20px;padding:18px;border-radius:18px;background:#FFF9F0;border:1px solid #E1D0B8;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#9B6F3B;text-transform:uppercase;letter-spacing:1.5px;">
                    Benefício VIP
                  </p>

                  <p style="margin:10px 0 0;font-size:15px;line-height:1.6;color:#16120E;">
                    ${vipBenefit}
                  </p>
                </div>
              `
              : ""
          }

          <a
            href="${reserveUrl}"
            style="display:inline-block;margin-top:24px;background:#16120E;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;"
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
    restaurantId: reservation.restaurant.id,
    customerId: currentCustomer.id,
    type: "VIP_UPGRADE",
    status: "SENT",
    sentAt: new Date(),
    estimatedRevenue: 0,
  },
});
}
  }
}

  if (
    status === "FINISHED" &&
    reservation.email &&
    reservation.restaurant
  ) {
    await sendReviewEmail({
      to: reservation.email,
      customerName: reservation.customerName,
      restaurantName: reservation.restaurant.name,
      reservationId: reservation.id,
    });
  }

  redirect(`/restaurants/${restaurantId}/day?day=${day}`);
}

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { id } = await params;
  const { day } = await searchParams;

  const selectedDay =
    day ??
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(new Date().getDate()).padStart(2, "0")}`;

  const dayStart = new Date(selectedDay);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(selectedDay);
  dayEnd.setHours(23, 59, 59, 999);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { tables: true },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado
      </main>
    );
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: id,
      date: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["CANCELLED", "REJECTED"] },
    },
    include: { table: true },
    orderBy: { date: "asc" },
  });

  const lunchReservations = reservations.filter((reservation) =>
    isLunch(new Date(reservation.date)),
  );

  const dinnerReservations = reservations.filter(
    (reservation) => !isLunch(new Date(reservation.date)),
  );

  const totalGuests = reservations.reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const seatedReservations = reservations.filter(
    (reservation) => reservation.status === "SEATED",
  );

  const totalCapacity =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? restaurant.totalCapacity
      : restaurant.tables.reduce((total, table) => total + table.capacity, 0);

  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalGuests / totalCapacity) * 100) : 0;

  const occupancyColor =
    occupancyRate >= 90
      ? "bg-[#A14E36]"
      : occupancyRate >= 70
        ? "bg-[#C8A56A]"
        : "bg-[#3F6A4D]";

  const estimatedRevenue = totalGuests * 35;

  const formattedDate = new Date(selectedDay).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  function ReservationRow({
    reservation,
  }: {
    reservation: (typeof reservations)[number];
  }) {
    const reasonLabel = getApprovalReasonLabel(reservation.approvalReason);
    const status = String(reservation.status);

    return (
      <div className="grid gap-3 border-b border-[#E8DCCB] px-4 py-3 last:border-b-0 lg:grid-cols-[72px_1fr_auto] lg:items-center">
        <div>
          <p className="text-lg font-semibold">
            {new Date(reservation.date).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{reservation.customerName}</p>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                status,
              )}`}
            >
              {getStatusLabel(status)}
            </span>

            {reasonLabel && (
              <span className="rounded-full bg-[#FFF1D0] px-2.5 py-1 text-[10px] font-semibold text-[#9B6F3B]">
                {reasonLabel}
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs text-[#6B6258]">
            {reservation.guests} pessoas
            {reservation.table
              ? ` · Mesa ${reservation.table.number}`
              : " · Sem mesa"}
            {reservation.source === "PUBLIC" ? " · Online" : " · Manual"}
            {reservation.notes ? ` · ${reservation.notes}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {reservation.status === "PENDING" && (
            <>
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="CONFIRMED"
                label="Aprovar"
                variant="primary"
              />
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="REJECTED"
                label="Recusar"
                variant="danger"
              />
            </>
          )}

          {reservation.status === "CONFIRMED" && (
            <>
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="SEATED"
                label="Sentar"
                variant="primary"
              />
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="NO_SHOW"
                label="No-show"
                variant="outline"
              />
            </>
          )}

          {reservation.status === "SEATED" && (
  <div className="flex flex-col items-start gap-1 lg:items-end">
    <StatusButton
      restaurantId={id}
      reservationId={reservation.id}
      day={selectedDay}
      status="FINISHED"
      label="Finalizar"
      variant="primary"
    />

    {reservation.email && (
      <p className="max-w-[220px] text-right text-[11px] leading-4 text-[#7A6F62]">
        Ao finalizar, o cliente recebe automaticamente um pedido de avaliação.
      </p>
    )}
  </div>
)}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
  active="Serviço do dia"
/>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                Serviço do dia
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                {restaurant.name}
              </h1>

              <p className="mt-3 text-sm capitalize text-[#6B6258]">
                {formattedDate}
              </p>
            </div>

            <DayPicker restaurantId={id} selectedDay={selectedDay} />
          </header>

          <section className="mt-6 rounded-[32px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="grid gap-4 sm:grid-cols-4">
                <CompactMetric label="Covers" value={totalGuests} sub={`${totalCapacity || 0} lugares`} />
                <CompactMetric label="Sentados" value={seatedReservations.length} sub="em sala" />
                <CompactMetric label="Pendentes" value={pendingReservations.length} sub="aprovação" />
                <CompactMetric label="Receita" value={`${estimatedRevenue}€`} sub="estimada" />
              </div>

              <div className="min-w-[220px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B6258]">Ocupação</span>
                  <span className="font-semibold">{occupancyRate}%</span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
                  <div
                    className={`h-full rounded-full ${occupancyColor}`}
                    style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {pendingReservations.length > 0 && (
            <section className="mt-6 rounded-[28px] border border-[#D8C5A5] bg-[#FFF9F0] p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <SectionLabel>Ação necessária</SectionLabel>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">
                    Reservas pendentes
                  </h2>
                </div>

                <span className="rounded-full bg-[#16120E] px-4 py-2 text-sm font-semibold text-white">
                  {pendingReservations.length} pendente
                  {pendingReservations.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-[22px] border border-[#E8DCCB] bg-white">
                {pendingReservations.map((reservation) => (
                  <ReservationRow key={reservation.id} reservation={reservation} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ServiceSection
              title="Almoço"
              label={`${lunchReservations.length} reservas`}
            >
              {lunchReservations.length > 0 ? (
                lunchReservations.map((reservation) => (
                  <ReservationRow key={reservation.id} reservation={reservation} />
                ))
              ) : (
                <EmptyState text="Sem reservas ao almoço." />
              )}
            </ServiceSection>

            <ServiceSection
              title="Jantar"
              label={`${dinnerReservations.length} reservas`}
            >
              {dinnerReservations.length > 0 ? (
                dinnerReservations.map((reservation) => (
                  <ReservationRow key={reservation.id} reservation={reservation} />
                ))
              ) : (
                <EmptyState text="Sem reservas ao jantar." />
              )}
            </ServiceSection>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusButton({
  restaurantId,
  reservationId,
  day,
  status,
  label,
  variant,
}: {
  restaurantId: string;
  reservationId: string;
  day: string;
  status: string;
  label: string;
  variant: "primary" | "danger" | "outline";
}) {
  const className =
    variant === "primary"
      ? "rounded-full bg-[#16120E] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2A2118]"
      : variant === "danger"
        ? "rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1.5 text-xs font-semibold text-[#A14E36] transition hover:bg-white"
        : "rounded-full border border-[#C8A56A] bg-[#FFF9F0] px-3 py-1.5 text-xs font-semibold text-[#16120E] transition hover:bg-white";

  return (
    <form action={updateReservationStatus}>
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="day" value={day} />
      <button className={className}>{label}</button>
    </form>
  );
}

function CompactMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.055em]">{value}</p>
      <p className="mt-1 text-xs text-[#6B6258]">{sub}</p>
    </div>
  );
}

function ServiceSection({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <SectionLabel>Serviço</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">
            {title}
          </h2>
        </div>

        <span className="rounded-full bg-[#EFE5D6] px-3 py-1.5 text-xs font-semibold text-[#9B6F3B]">
          {label}
        </span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#E8DCCB] bg-[#FFF9F0]">
        {children}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="p-5 text-sm text-[#6B6258]">{text}</p>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
      {children}
    </p>
  );
}
