import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { getLocale, getTranslations } from "next-intl/server";

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

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

  const t = await getTranslations("dashboardOverview.calendar");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";

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
        {t("notFound")}
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

  const monthLabel = monthStart.toLocaleDateString(intlLocale, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="calendar" />
        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-7 lg:pt-7">
          <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[32px] border border-[#E1D0B8] bg-white p-5 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/restaurants/${id}`}
                className="inline-flex text-sm font-semibold text-[#6B6258] transition hover:text-[#16120E]"
              >
                {t("backToDashboard")}
              </Link>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
                {t("eyebrow")}
              </p>

              <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                {t("title")}
              </h1>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.name}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href={`/restaurants/${id}/reservations/new`}
                className="flex h-12 items-center justify-center rounded-full bg-[#C8A56A] px-5 text-sm font-black text-[#17120D] shadow-[0_12px_30px_rgba(200,165,106,0.24)] transition hover:bg-[#D7B267]"
              >
                + {t("newReservation")}
              </Link>

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
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label={t("stats.reservationsMonth")} value={monthReservations.length} />
          <StatCard label={t("stats.guestsMonth")} value={totalGuests} />
          <StatCard label={t("stats.pending")} value={pendingReservations.length} />
          <StatCard
            label={t("stats.mode")}
            value={restaurant.reservationMode === "CAPACITY" ? t("stats.modeCapacity") : t("stats.modeTables")}
          />
        </section>

        <section className="grid gap-3 md:hidden">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
              {t("mobile.sectionLabel")}
            </p>
            <p className="text-xs font-semibold text-[#6B6258]">
              {t("mobile.hint")}
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
                      {day.toLocaleDateString(intlLocale, { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-[#16120E]">
                      {day.getDate()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-[-0.05em] text-[#9B6F3B]">
                      {totalDayGuests}{t("guestUnit")}
                    </p>
                    <p className="text-xs font-semibold text-[#6B6258]">
                      {t("reservationsCount", { count: dayReservations.length })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <CalendarMeal label={t("meal.lunch")} value={lunchGuests} unit={t("guestUnit")} active={lunchGuests > 0} />
                  <CalendarMeal label={t("meal.dinner")} value={dinnerGuests} unit={t("guestUnit")} active={dinnerGuests > 0} />
                </div>

                {pendingCount > 0 && (
                  <div className="mt-3 rounded-2xl border border-[#E5C46D] bg-[#FFF8E2] px-3 py-2 text-xs font-black text-[#9B6F3B]">
                    {t("pendingCount", { count: pendingCount })}
                  </div>
                )}
              </Link>
            );
          })}
        </section>

        <section className="hidden overflow-hidden rounded-[32px] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)] md:block">
          <div className="grid grid-cols-7 border-b border-[#E1D0B8] bg-[#FFF9F0]">
            {(
              [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ] as const
            ).map((day) => (
              <div
                key={day}
                className="p-4 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#6B6258]"
              >
                {t(`weekdaysShort.${day}`)}
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
                        {totalDayGuests}{t("guestUnit")}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <CalendarMeal
                      label={t("meal.lunch")}
                      value={lunchGuests}
                      unit={t("guestUnit")}
                      active={lunchGuests > 0}
                    />

                    <CalendarMeal
                      label={t("meal.dinner")}
                      value={dinnerGuests}
                      unit={t("guestUnit")}
                      active={dinnerGuests > 0}
                    />

                    {pendingCount > 0 && (
                      <div className="rounded-xl border border-[#E5C46D] bg-[#FFF8E2] px-2 py-1 font-bold text-[#9B6F3B]">
                        {t("pendingCount", { count: pendingCount })}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
          </div>
          <BottomNav id={id} />
        </section>
      </div>
    </main>
  );
}

function CalendarMeal({
  label,
  value,
  unit,
  active,
}: {
  label: string;
  value: number;
  unit: string;
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
        {value}{unit}
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
