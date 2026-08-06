import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";

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

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Hoje";
  if (target.getTime() === tomorrow.getTime()) return "Amanhã";

  const label = target.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function UpcomingReservationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: { include: { reservations: true } },
      reservations: true,
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado.
      </main>
    );
  }

  const tableReservations = restaurant.tables.flatMap((table) =>
    table.reservations.map((reservation) => ({
      ...reservation,
      tableNumber: table.number,
    })),
  );

  const directReservations = restaurant.reservations.map((reservation) => ({
    ...reservation,
    tableNumber: null as number | null,
  }));

  const allReservations = [...tableReservations, ...directReservations].filter(
    (reservation, index, array) =>
      array.findIndex((item) => item.id === reservation.id) === index,
  );

  const inactiveStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];
  const now = new Date();

  const upcomingReservations = allReservations
    .filter((reservation) => !inactiveStatuses.includes(String(reservation.status)))
    .filter((reservation) => new Date(reservation.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groups: { key: string; label: string; reservations: typeof upcomingReservations }[] = [];
  const groupIndexByKey = new Map<string, number>();

  for (const reservation of upcomingReservations) {
    const date = new Date(reservation.date);
    const key = dayKey(date);

    if (!groupIndexByKey.has(key)) {
      groupIndexByKey.set(key, groups.length);
      groups.push({ key, label: formatDayLabel(date), reservations: [] });
    }

    groups[groupIndexByKey.get(key)!].reservations.push(reservation);
  }

  const totalGuests = upcomingReservations.reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="Reservas" />

        <section className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                Reservas
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                Próximas reservas
              </h1>

              <p className="mt-3 text-sm text-[#6B6258]">
                {upcomingReservations.length} reserva
                {upcomingReservations.length === 1 ? "" : "s"} · {totalGuests} pax no total
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/reservations`}
              className="flex h-11 w-fit items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold transition hover:bg-[#FFF9F0]"
            >
              Ver calendário
            </Link>
          </header>

          <section className="mt-6 flex flex-col gap-6">
            {groups.length === 0 ? (
              <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 text-sm text-[#6B6258] shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
                Ainda não há próximas reservas.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key}>
                  <SectionLabel>{group.label}</SectionLabel>

                  <div className="mt-3 overflow-hidden rounded-[28px] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
                    {group.reservations.map((reservation) => (
                      <ReservationRow key={reservation.id} reservation={reservation} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function ReservationRow({ reservation }: { reservation: any }) {
  return (
    <details className="group border-b border-[#E8DCCB] last:border-b-0">
      <summary className="grid cursor-pointer list-none grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-4 transition hover:bg-[#FFF9F0] sm:grid-cols-[70px_1fr_auto_auto] sm:gap-4">
        <p className="font-semibold">
          {new Date(reservation.date).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <div className="min-w-0">
          <p className="truncate font-semibold">{reservation.customerName}</p>
          <p className="mt-0.5 text-xs text-[#6B6258]">
            {reservation.tableNumber ? `Mesa ${reservation.tableNumber}` : "Sem mesa"}
          </p>
        </div>

        <span
          className={`hidden rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-block ${getStatusClass(
            String(reservation.status),
          )}`}
        >
          {getStatusLabel(String(reservation.status))}
        </span>

        <p className="text-right text-sm font-bold text-[#9B6F3B]">
          {reservation.guests} pax
        </p>
      </summary>

      <div className="grid gap-2 border-t border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3 text-xs text-[#6B6258] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-[#16120E]">Telemóvel</p>
          <p className="mt-1">{reservation.phone || "Sem telemóvel"}</p>
        </div>

        <div>
          <p className="font-semibold text-[#16120E]">Email</p>
          <p className="mt-1 break-all">{reservation.email || "Sem email"}</p>
        </div>
      </div>
    </details>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
      {children}
    </p>
  );
}
