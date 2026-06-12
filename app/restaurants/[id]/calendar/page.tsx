import Link from "next/link";
import { prisma } from "@/lib/prisma";

function getMonthDays(year: number, month: number) {
  const days = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

function isLunch(date: Date) {
  return date.getHours() < 17;
}

function formatDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { id } = await params;
  const { year, month } = await searchParams;

  const today = new Date();

  const selectedYear = year ? Number(year) : today.getFullYear();
  const selectedMonth = month ? Number(month) : today.getMonth();

  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 1);

  const previousMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const nextMonth = new Date(selectedYear, selectedMonth + 1, 1);

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      reservations: true,
      tables: {
        include: {
          reservations: true,
        },
      },
    },
  });

  if (!restaurant) {
    return <div className="p-10">Restaurante não encontrado</div>;
  }

  const tableReservations = restaurant.tables.flatMap(
  (table: {
    number: number;
    reservations: {
      id: string;
      customerName: string;
      phone: string;
      email: string | null;
      date: Date;
      guests: number;
      status: string;
      approvalReason: string | null;
      restaurantId: string | null;
      tableId: string | null;
      customerId: string | null;
      createdAt: Date;
    }[];
  }) =>
    table.reservations.map((reservation) => ({
      ...reservation,
      tableNumber: table.number,
    }))
);

  const directReservations = restaurant.reservations.map(
  (reservation: {
    id: string;
    customerName: string;
    phone: string;
    email: string | null;
    date: Date;
    guests: number;
    status: string;
    approvalReason: string | null;
    restaurantId: string | null;
    tableId: string | null;
    customerId: string | null;
    createdAt: Date;
  }) => ({
    ...reservation,
    tableNumber: null as number | null,
  })
);

  const allReservations = [...tableReservations, ...directReservations].filter(
    (reservation, index, array) =>
      array.findIndex((item) => item.id === reservation.id) === index
  );

  const monthReservations = allReservations.filter((reservation) => {
    const date = new Date(reservation.date);

    return (
      date >= monthStart &&
      date < monthEnd &&
      reservation.status !== "CANCELLED" &&
      reservation.status !== "REJECTED" &&
      reservation.status !== "NO_SHOW"
    );
  });

  const totalGuests = monthReservations.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const pendingReservations = monthReservations.filter(
    (reservation) => reservation.status === "PENDING"
  );

  const days = getMonthDays(selectedYear, selectedMonth);

  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const emptyDays = Array.from({ length: firstDayOfWeek });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] p-4 text-white lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-6 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm text-[#9e9e9e] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
  MesaLink OS · Calendar
</p>

<h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">
  Calendário
</h1>

            <p className="mt-2 text-[#9e9e9e]">{restaurant.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/restaurants/${id}/calendar?year=${previousMonth.getFullYear()}&month=${previousMonth.getMonth()}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2b2b2b] bg-[#181818] text-[#f0c36a] hover:border-[#f0c36a]"
            >
              ←
            </Link>

            <div className="rounded-full border border-[#2b2b2b] bg-[#181818] px-7 py-3 font-black text-[#f0c36a]">
              {monthStart.toLocaleDateString("pt-PT", {
                month: "long",
                year: "numeric",
              })}
            </div>

            <Link
              href={`/restaurants/${id}/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth()}`}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2b2b2b] bg-[#181818] text-[#f0c36a] hover:border-[#f0c36a]"
            >
              →
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Reservas no mês" value={monthReservations.length} />
          <StatCard label="Pessoas no mês" value={totalGuests} />
          <StatCard label="Pendentes" value={pendingReservations.length} />
          <StatCard
            label="Modo"
            value={
              restaurant.reservationMode === "CAPACITY"
                ? "Capacidade"
                : "Mesas"
            }
          />
        </section>

<section className="grid gap-3 md:hidden">
  {days.map((day) => {
    const isToday =
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear();

    const dayReservations = monthReservations.filter((reservation) => {
      const reservationDate = new Date(reservation.date);

      return (
        reservationDate.getDate() === day.getDate() &&
        reservationDate.getMonth() === day.getMonth() &&
        reservationDate.getFullYear() === day.getFullYear()
      );
    });

    const lunchGuests = dayReservations
      .filter((reservation) => isLunch(new Date(reservation.date)))
      .reduce((total, reservation) => total + reservation.guests, 0);

    const dinnerGuests = dayReservations
      .filter((reservation) => !isLunch(new Date(reservation.date)))
      .reduce((total, reservation) => total + reservation.guests, 0);

    const totalDayGuests = lunchGuests + dinnerGuests;

    return (
      <Link
        key={day.toISOString()}
        href={`/restaurants/${id}/day?day=${formatDay(day)}`}
        className={
          isToday
            ? "rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 shadow-[0_0_35px_rgba(34,211,238,0.16)]"
            : "rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-4"
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              {day.toLocaleDateString("pt-PT", { weekday: "short" })}
            </p>
            <p className="mt-1 text-2xl font-black text-white">
              {day.getDate()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xl font-black text-cyan-300">
              {totalDayGuests}p
            </p>
            <p className="text-xs text-slate-400">
              {dayReservations.length} reservas
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <CalendarMeal label="Almoço" value={lunchGuests} active={lunchGuests > 0} />
          <CalendarMeal label="Jantar" value={dinnerGuests} active={dinnerGuests > 0} />
        </div>
      </Link>
    );
  })}
</section>

        <section className="hidden overflow-hidden rounded-[34px] border border-cyan-300/10 bg-white/[0.04] shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl md:block">
          <div className="grid grid-cols-7 border-b border-[#2b2b2b] bg-[#141414]">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-black uppercase tracking-widest text-[#9e9e9e]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {emptyDays.map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-32 border-r border-b border-[#2b2b2b] bg-[#111111]"
              />
            ))}

            {days.map((day) => {
              const isToday =
                day.getDate() === today.getDate() &&
                day.getMonth() === today.getMonth() &&
                day.getFullYear() === today.getFullYear();

              const dayReservations = monthReservations.filter((reservation) => {
                const reservationDate = new Date(reservation.date);

                return (
                  reservationDate.getDate() === day.getDate() &&
                  reservationDate.getMonth() === day.getMonth() &&
                  reservationDate.getFullYear() === day.getFullYear()
                );
              });

              const lunchGuests = dayReservations
                .filter((reservation) => isLunch(new Date(reservation.date)))
                .reduce((total, reservation) => total + reservation.guests, 0);

              const dinnerGuests = dayReservations
                .filter((reservation) => !isLunch(new Date(reservation.date)))
                .reduce((total, reservation) => total + reservation.guests, 0);

              const totalDayGuests = lunchGuests + dinnerGuests;
              const pendingCount = dayReservations.filter(
                (reservation) => reservation.status === "PENDING"
              ).length;

              return (
                <Link
                  key={day.toISOString()}
                  href={`/restaurants/${id}/day?day=${formatDay(day)}`}
                  className="group min-h-[140px] border-r border-b border-cyan-300/10 bg-[#020617]/60 p-3 transition hover:bg-cyan-400/5 hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={
                        isToday
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 text-sm font-black text-black"
                          : "text-sm font-black text-white"
                      }
                    >
                      {day.getDate()}
                    </span>

                    {totalDayGuests > 0 && (
                      <span className="rounded-full bg-[#f0c36a]/15 px-2 py-1 text-xs font-bold text-[#f0c36a]">
                        {totalDayGuests}p
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <CalendarMeal
                      label="Almoço"
                      value={lunchGuests}
                      active={lunchGuests > 0}
                    />

                    <CalendarMeal
                      label="Jantar"
                      value={dinnerGuests}
                      active={dinnerGuests > 0}
                    />

                    {pendingCount > 0 && (
                      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 font-bold text-yellow-300">
                        {pendingCount} pendente
                        {pendingCount > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function CalendarMeal({
  label,
  value,
  active,
}: {
  label: string;
  value: number;
  active: boolean;
}) {
  return (
    <div
      className={
        active
          ? "flex justify-between rounded-lg border border-cyan-300/10 bg-cyan-400/10 px-2 py-1 text-cyan-100"
          : "flex justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-slate-500"
      }
    >
      <span>{label}</span>
      <strong>{value}p</strong>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-xs font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-cyan-300">
        {value}
      </p>
    </div>
  );
}