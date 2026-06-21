import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import RestaurantSidebar from "@/components/RestaurantSidebar";

function isLunch(date: Date) {
  return date.getHours() < 17;
}

async function updateReservationStatus(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));
  const status = String(formData.get("status"));

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  redirect(`/restaurants/${restaurantId}/reservations`);
}

function getApprovalReasonLabel(reason: string | null) {
  const labels: Record<string, string> = {
    LARGE_GROUP: "Grupo grande",
    TABLE_MERGE: "Junção de mesas",
    CAPACITY_LIMIT: "Limite de capacidade",
  };

  return reason ? labels[reason] ?? reason : null;
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  const startOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startOffset);

  const days: Date[] = [];

  for (let i = 0; i < 42; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }

  return {
    days,
    firstDay,
    lastDay,
  };
}

export default async function ReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ month?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const { id } = await params;
  const query = searchParams ? await searchParams : {};

    const currentDate = query.month ? new Date(`${query.month}-01`) : new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { days } = getMonthDays(year, month);

  const calendarStart = days[0];
  const calendarEnd = days[days.length - 1];

  const previousMonth = monthKey(new Date(year, month - 1, 1));
  const nextMonth = monthKey(new Date(year, month + 1, 1));
  const thisMonth = monthKey(new Date());

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: true,
      reservations: {
        where: {
          date: {
            gte: calendarStart,
            lte: calendarEnd,
          },
          status: {
            notIn: ["CANCELLED", "REJECTED"],
          },
        },
        include: {
          table: true,
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado.
      </main>
    );
  }

  const totalCapacity =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? restaurant.totalCapacity
      : restaurant.tables.reduce((total, table) => total + table.capacity, 0);

  const reservationsByDay = new Map<
    string,
    typeof restaurant.reservations
  >();

  for (const reservation of restaurant.reservations) {
    const key = dateKey(new Date(reservation.date));

    if (!reservationsByDay.has(key)) {
      reservationsByDay.set(key, []);
    }

    reservationsByDay.get(key)?.push(reservation);
  }

  const pendingReservations = restaurant.reservations.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const monthName = currentDate.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
  active="Reservas"
/>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
      Reservas
    </p>

    <h1 className="mt-2 text-4xl font-semibold capitalize tracking-[-0.065em] sm:text-5xl">
      {monthName}
    </h1>
  </div>

  <div className="flex items-center gap-2 rounded-full border border-[#E1D0B8] bg-white p-1.5 shadow-[0_14px_40px_rgba(80,55,30,0.05)]">
    <Link
      href={`/restaurants/${id}/reservations?month=${previousMonth}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF9F0] text-lg font-semibold transition hover:bg-[#EFE5D6]"
    >
      ←
    </Link>

    <Link
      href={`/restaurants/${id}/reservations?month=${thisMonth}`}
      className="flex h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition hover:bg-[#FFF9F0]"
    >
      Hoje
    </Link>

    <Link
      href={`/restaurants/${id}/reservations?month=${nextMonth}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF9F0] text-lg font-semibold transition hover:bg-[#EFE5D6]"
    >
      →
    </Link>

    <div className="mx-1 h-7 w-px bg-[#E1D0B8]" />

    <Link
      href={`/restaurants/${id}/reservations/new`}
      className="flex h-10 items-center justify-center rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
    >
      + Nova reserva
    </Link>
  </div>
</header>

          {pendingReservations.length > 0 && (
            <section className="mt-6 rounded-[28px] border border-[#D8C5A5] bg-[#FFF9F0] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <SectionLabel>Aprovações</SectionLabel>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">
                    Reservas que precisam de decisão
                  </h2>
                </div>

                <span className="w-fit rounded-full bg-[#16120E] px-4 py-2 text-sm font-semibold text-white">
                  {pendingReservations.length} pendente
                  {pendingReservations.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                {pendingReservations.slice(0, 6).map((reservation) => (
                  <PendingApproval
                    key={reservation.id}
                    restaurantId={id}
                    reservation={reservation}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 rounded-[32px] border border-[#E1D0B8] bg-white p-5 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

              <div className="flex flex-wrap gap-4 text-sm text-[#6B6258]">
                <LegendDot color="bg-[#ECF7EC]" label="Baixa ocupação" />
                <LegendDot color="bg-[#FFF1D0]" label="Média" />
                <LegendDot color="bg-[#FFF0EA]" label="Alta" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 border-y border-l border-[#E8DCCB] text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6258]">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                <div key={day} className="border-r border-[#E8DCCB] px-3 py-3">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-l border-[#E8DCCB]">
              {days.map((day, index) => {
                const key = dateKey(day);
                const dayReservations = reservationsByDay.get(key) ?? [];
                const dayGuests = dayReservations.reduce(
                  (total, reservation) => total + reservation.guests,
                  0,
                );

                const lunchGuests = dayReservations
                  .filter((reservation) => isLunch(new Date(reservation.date)))
                  .reduce((total, reservation) => total + reservation.guests, 0);

                const dinnerGuests = dayReservations
                  .filter((reservation) => !isLunch(new Date(reservation.date)))
                  .reduce((total, reservation) => total + reservation.guests, 0);

                const pendingCount = dayReservations.filter(
                  (reservation) => reservation.status === "PENDING",
                ).length;

                const occupancy =
                  totalCapacity > 0
                    ? Math.round((dayGuests / totalCapacity) * 100)
                    : 0;

                const isCurrentMonth = day.getMonth() === month;
                const isTodayDate = key === dateKey(new Date());

                return (
                  <CalendarDay
  key={`${key}-${day.getMonth()}-${day.getDate()}`}
                    restaurantId={id}
                    date={day}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isTodayDate}
                    lunchGuests={lunchGuests}
                    dinnerGuests={dinnerGuests}
                    reservations={dayReservations.length}
                    pending={pendingCount}
                    occupancy={occupancy}
                  />
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function CalendarDay({
  restaurantId,
  date,
  isCurrentMonth,
  isToday,
  lunchGuests,
  dinnerGuests,
  reservations,
  pending,
  occupancy,
}: {
  restaurantId: string;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  lunchGuests: number;
  dinnerGuests: number;
  reservations: number;
  pending: number;
  occupancy: number;
}) {
  const key = dateKey(date);

  const hasActivity = reservations > 0 || lunchGuests > 0 || dinnerGuests > 0;

  const occupancyBar =
    occupancy >= 90
      ? "bg-[#A14E36]"
      : occupancy >= 60
        ? "bg-[#C8A56A]"
        : "bg-[#3F6A4D]";

  return (
    <a
      href={`/restaurants/${restaurantId}/day?day=${key}`}
      className={`min-h-[118px] border-b border-r border-[#E8DCCB] p-3 transition hover:bg-white ${
        isCurrentMonth ? "bg-[#FFFDF8]" : "bg-[#F3EEE6] opacity-45"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={
            isToday
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#16120E] text-xs font-semibold text-white"
              : "text-sm font-semibold text-[#6B6258]"
          }
        >
          {date.getDate()}
        </span>

        {pending > 0 && (
          <span className="rounded-full bg-[#FFF1D0] px-2 py-1 text-[10px] font-semibold text-[#9B6F3B]">
            {pending}
          </span>
        )}
      </div>

      {hasActivity ? (
        <div className="mt-4 space-y-2">
          <CompactService label="Almoço" value={lunchGuests} />
          <CompactService label="Jantar" value={dinnerGuests} />

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E8DCCB]">
            <div
              className={`h-full rounded-full ${occupancyBar}`}
              style={{ width: `${Math.min(occupancy, 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 h-1.5 rounded-full bg-[#E8DCCB]/60" />
      )}
    </a>
  );
}

function CompactService({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#F7F0E7] px-2.5 py-1.5 text-xs">
      <span className="text-[#6B6258]">{label}</span>
      <span className="font-semibold text-[#16120E]">{value}</span>
    </div>
  );
}

function PendingApproval({
  restaurantId,
  reservation,
}: {
  restaurantId: string;
  reservation: {
    id: string;
    customerName: string;
    guests: number;
    date: Date | string;
    approvalReason?: string | null;
  };
}) {
  const reason = getApprovalReasonLabel(reservation.approvalReason ?? null);

  return (
    <div className="rounded-2xl border border-[#E8DCCB] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{reservation.customerName}</p>
          <p className="mt-1 text-xs text-[#6B6258]">
            {new Date(reservation.date).toLocaleDateString("pt-PT")} ·{" "}
            {new Date(reservation.date).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · {reservation.guests} pessoas
          </p>

          {reason && (
            <span className="mt-2 inline-flex rounded-full bg-[#FFF1D0] px-2.5 py-1 text-[10px] font-semibold text-[#9B6F3B]">
              {reason}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <StatusIconButton
            restaurantId={restaurantId}
            reservationId={reservation.id}
            status="CONFIRMED"
            label="✓"
            variant="primary"
          />
          <StatusIconButton
            restaurantId={restaurantId}
            reservationId={reservation.id}
            status="REJECTED"
            label="×"
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
}

function StatusIconButton({
  restaurantId,
  reservationId,
  status,
  label,
  variant,
}: {
  restaurantId: string;
  reservationId: string;
  status: string;
  label: string;
  variant: "primary" | "danger";
}) {
  const className =
    variant === "primary"
      ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118]"
      : "flex h-8 w-8 items-center justify-center rounded-full border border-[#E7B7A8] bg-[#FFF0EA] text-sm font-semibold text-[#A14E36] transition hover:bg-white";

  return (
    <form action={updateReservationStatus}>
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{label}</button>
    </form>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}


function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
      {children}
    </p>
  );
}