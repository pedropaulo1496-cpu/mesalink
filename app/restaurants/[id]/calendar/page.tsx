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
    "0",
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
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado
      </main>
    );
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
      })),
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
    }),
  );

  const allReservations = [...tableReservations, ...directReservations].filter(
    (reservation, index, array) =>
      array.findIndex((item) => item.id === reservation.id) === index,
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
    0,
  );

  const pendingReservations = monthReservations.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const days = getMonthDays(selectedYear, selectedMonth);
  const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const emptyDays = Array.from({ length: firstDayOfWeek });

  const monthLabel = monthStart.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5EFE6] px-4 py-5 pb-24 text-[#16120E] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[32px] border border-[#E1D0B8] bg-white p-5 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/restaurants/${id}`}
                className="inline-flex text-sm font-semibold text-[#6B6258] transition hover:text-[#16120E]"
              >
                ← Voltar ao dashboard
              </Link>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
                MesaLink · Calendário
              </p>

              <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                Calendário
              </h1>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.name}
              </p>
            </div>

            <div className="grid grid-cols-[48px_1fr_48px] items-center gap-2 sm:flex sm:gap-3">
              <Link
                href={`/restaurants/${id}/calendar?year=${previousMonth.getFullYear()}&month=${previousMonth.getMonth()}`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-lg font-black text-[#9B6F3B] transition hover:border-[#C8A56A] hover:bg-white"
              >
                ←
              </Link>

              <div className="flex h-12 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#16120E] px-4 text-center text-sm font-semibold capitalize text-white sm:px-7 sm:text-base">
                {monthLabel}
              </div>

              <Link
                href={`/restaurants/${id}/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth()}`}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-lg font-black text-[#9B6F3B] transition hover:border-[#C8A56A] hover:bg-white"
              >
                →
              </Link>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Reservas no mês" value={monthReservations.length} />
          <StatCard label="Pessoas no mês" value={totalGuests} />
          <StatCard label="Pendentes" value={pendingReservations.length} />
          <StatCard
            label="Modo"
            value={restaurant.reservationMode === "CAPACITY" ? "Capacidade" : "Mesas"}
          />
        </section>

        <section className="grid gap-3 md:hidden">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
              Dias do mês
            </p>
            <p className="text-xs font-semibold text-[#6B6258]">
              Toca num dia para abrir
            </p>
          </div>

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
              (reservation) => reservation.status === "PENDING",
            ).length;

            return (
              <Link
                key={day.toISOString()}
                href={`/restaurants/${id}/day?day=${formatDay(day)}`}
                className={
                  isToday
                    ? "rounded-[28px] border border-[#C8A56A] bg-[#FFF3D8] p-4 shadow-[0_20px_55px_rgba(80,55,30,0.09)]"
                    : "rounded-[28px] border border-[#E1D0B8] bg-white p-4 shadow-[0_14px_40px_rgba(80,55,30,0.045)]"
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
                      {day.toLocaleDateString("pt-PT", { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-[#16120E]">
                      {day.getDate()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-[#9B6F3B]">
                      {totalDayGuests}p
                    </p>
                    <p className="text-xs font-semibold text-[#6B6258]">
                      {dayReservations.length} reservas
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CalendarMeal label="Almoço" value={lunchGuests} active={lunchGuests > 0} />
                  <CalendarMeal label="Jantar" value={dinnerGuests} active={dinnerGuests > 0} />
                </div>

                {pendingCount > 0 && (
                  <div className="mt-3 rounded-2xl border border-[#E5C46D] bg-[#FFF8E2] px-3 py-2 text-xs font-black text-[#9B6F3B]">
                    {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                  </div>
                )}
              </Link>
            );
          })}
        </section>

        <section className="hidden overflow-hidden rounded-[32px] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)] md:block">
          <div className="grid grid-cols-7 border-b border-[#E1D0B8] bg-[#FFF9F0]">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="p-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#6B6258]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {emptyDays.map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-36 border-r border-b border-[#E8DCCB] bg-[#FBF5EC]"
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
                (reservation) => reservation.status === "PENDING",
              ).length;

              return (
                <Link
                  key={day.toISOString()}
                  href={`/restaurants/${id}/day?day=${formatDay(day)}`}
                  className={
                    isToday
                      ? "group min-h-[150px] border-r border-b border-[#D8AE62] bg-[#FFF3D8] p-3 transition hover:bg-[#FFF8EC]"
                      : "group min-h-[150px] border-r border-b border-[#E8DCCB] bg-white p-3 transition hover:bg-[#FFF9F0]"
                  }
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={
                        isToday
                          ? "flex h-9 w-9 items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white"
                          : "flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF9F0] text-sm font-semibold text-[#16120E]"
                      }
                    >
                      {day.getDate()}
                    </span>

                    {totalDayGuests > 0 && (
                      <span className="rounded-full bg-[#EFE5D6] px-2 py-1 text-xs font-bold text-[#9B6F3B]">
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
                      <div className="rounded-xl border border-[#E5C46D] bg-[#FFF8E2] px-2 py-1 font-bold text-[#9B6F3B]">
                        {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
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
          ? "flex justify-between rounded-xl border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-2 text-xs font-bold text-[#16120E]"
          : "flex justify-between rounded-xl border border-[#E8DCCB] bg-white px-3 py-2 text-xs font-bold text-[#B0A396]"
      }
    >
      <span>{label}</span>
      <strong className={active ? "text-[#9B6F3B]" : "text-[#B0A396]"}>
        {value}p
      </strong>
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
    <div className="rounded-[24px] border border-[#E1D0B8] bg-white p-4 shadow-[0_14px_40px_rgba(80,55,30,0.045)] sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6258]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#9B6F3B] sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
function BottomNav({ id }: { id: string }) {
  const items = [
    { href: `/restaurants/${id}`, icon: "⌂", label: "Dash" },
    { href: `/restaurants/${id}/day`, icon: "⚡", label: "Hoje" },
    { href: `/restaurants/${id}/calendar`, icon: "📅", label: "Calend." },
    { href: `/restaurants/${id}/pos`, icon: "💳", label: "POS" },
    { href: `/restaurants/${id}/ordering`, icon: "📲", label: "QR" },
    { href: `/restaurants/${id}/tables`, icon: "▦", label: "Sala" },
    { href: `/restaurants/${id}/settings`, icon: "⚙️", label: "Def." },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/95 px-1.5 py-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-7">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[#6B6258] active:bg-[#FFF9F0] active:text-[#16120E]"
          >
            <span className="text-[20px] leading-none">{item.icon}</span>
            <span className="text-[9px] font-black leading-none">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}