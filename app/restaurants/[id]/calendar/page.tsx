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

  const tableReservations = restaurant.tables.flatMap((table) =>
    table.reservations.map((reservation) => ({
      ...reservation,
      tableNumber: table.number,
    }))
  );

  const directReservations = restaurant.reservations.map((reservation) => ({
    ...reservation,
    tableNumber: null as number | null,
  }));

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
    <main className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-6 border-b border-[#2b2b2b] pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm text-[#9e9e9e] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
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

        <section className="overflow-hidden rounded-[2rem] border border-[#2b2b2b] bg-[#181818]">
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
                  className="group min-h-32 border-r border-b border-[#2b2b2b] bg-[#181818] p-3 transition hover:bg-[#1f1f1f]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={
                        isToday
                          ? "flex h-8 w-8 items-center justify-center rounded-full bg-[#f0c36a] text-sm font-black text-black"
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
          ? "flex justify-between rounded-lg bg-black/40 px-2 py-1 text-[#d6d6d6]"
          : "flex justify-between rounded-lg bg-black/20 px-2 py-1 text-[#5f5f5f]"
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
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#181818] p-6">
      <p className="text-sm text-[#9e9e9e]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}