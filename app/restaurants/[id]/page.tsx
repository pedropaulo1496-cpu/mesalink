import CopyButton from "@/components/CopyButton";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/trial-expired");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        include: { reservations: true },
      },
      reservations: true,
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const hasConfiguredHours = [
    restaurant.mondayLunch,
    restaurant.mondayDinner,
    restaurant.tuesdayLunch,
    restaurant.tuesdayDinner,
    restaurant.wednesdayLunch,
    restaurant.wednesdayDinner,
    restaurant.thursdayLunch,
    restaurant.thursdayDinner,
    restaurant.fridayLunch,
    restaurant.fridayDinner,
    restaurant.saturdayLunch,
    restaurant.saturdayDinner,
    restaurant.sundayLunch,
    restaurant.sundayDinner,
  ].some(Boolean);

  if (!hasConfiguredHours) {
    redirect(`/restaurants/${id}/settings?setup=true`);
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

  const today = new Date();

  const isToday = (date: Date | string) => {
    const reservationDate = new Date(date);

    return (
      reservationDate.getDate() === today.getDate() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getFullYear() === today.getFullYear()
    );
  };

  const inactiveStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];

  const activeReservations = allReservations.filter(
    (reservation) => !inactiveStatuses.includes(String(reservation.status))
  );

  const reservationsToday = activeReservations.filter((reservation) =>
    isToday(reservation.date)
  );

  const confirmedToday = reservationsToday.filter(
    (reservation) => reservation.status === "CONFIRMED"
  );

  const pendingToday = reservationsToday.filter(
    (reservation) => reservation.status === "PENDING"
  );

  const guestsToday = reservationsToday.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const totalCapacity =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? restaurant.totalCapacity
      : restaurant.tables.reduce((total, table) => total + table.capacity, 0);

  const occupancyRate =
    totalCapacity > 0 ? Math.round((guestsToday / totalCapacity) * 100) : 0;

  const todayReservationsList = reservationsToday
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const nextReservations = activeReservations
    .filter((reservation) => new Date(reservation.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const listToShow =
    todayReservationsList.length > 0 ? todayReservationsList : nextReservations;

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="text-2xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black leading-none tracking-[-0.04em] sm:text-4xl">
                  {restaurant.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                    restaurant.onlineReservationsEnabled
                      ? "border-green-300/20 bg-green-400/10 text-green-300"
                      : "border-red-300/20 bg-red-400/10 text-red-300"
                  }`}
                >
                  {restaurant.onlineReservationsEnabled ? "Online" : "Offline"}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {restaurant.address || "Dashboard operacional do restaurante"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <PrimaryLink href={`/restaurants/${id}/reservations/new`}>
                + Nova reserva
              </PrimaryLink>
              <DashboardLink href={`/restaurants/${id}/day`}>
                Serviço
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/reservations`}>
                Reservas
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/calendar`}>
                Calendário
              </DashboardLink>
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  {todayReservationsList.length > 0 ? "Hoje" : "Agenda"}
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  {todayReservationsList.length > 0
                    ? "Reservas de hoje"
                    : "Próximas reservas"}
                </h2>
              </div>

              <Link
                href={`/restaurants/${id}/reservations`}
                className="text-sm font-black text-cyan-300 hover:text-cyan-200"
              >
                Ver todas →
              </Link>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <MiniMetric
                label="Reservas"
                value={reservationsToday.length}
                sub={`${confirmedToday.length} confirmadas`}
                tone="cyan"
              />

              <MiniMetric
                label="Pessoas"
                value={guestsToday}
                sub="previstas"
                tone="blue"
              />

              <MiniMetric
                label="Ocupação"
                value={`${occupancyRate}%`}
                sub={totalCapacity > 0 ? `${guestsToday}/${totalCapacity} lugares` : "sem capacidade"}
                tone="violet"
              />

              {pendingToday.length > 0 && (
                <MiniMetric
                  label="Pendentes"
                  value={pendingToday.length}
                  sub="precisa atenção"
                  tone="yellow"
                />
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-cyan-300/10 bg-[#020617]/50">
              {listToShow.map((reservation, index) => (
                <ReservationLine
                  key={reservation.id}
                  reservation={reservation}
                  isNext={todayReservationsList.length > 0 && index === 0}
                  showDate={todayReservationsList.length === 0}
                />
              ))}

              {listToShow.length === 0 && (
                <div className="p-5 text-sm text-slate-400">
                  Ainda não há reservas. Partilhe o link público para começar a
                  receber reservas online.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Link público
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Reservas 24/7
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use este link no Google Maps, Instagram, website e QR Code.
              </p>

              <div className="mt-4 space-y-3">
                <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-3 text-sm text-slate-300">
                  <p className="truncate">{publicUrl}</p>
                </div>

                <CopyButton text={publicUrl} />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Procure por{" "}
                <span className="font-semibold text-cyan-300">
                  Google Business Profile
                </span>{" "}
                e cole este link no botão de reservas.
              </p>
            </div>

            <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Ações rápidas
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ActionLink href={`/restaurants/${id}/tables`}>
                  Sala
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/qr`}>
                  QR Code
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/customers`}>
                  Clientes
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/settings`}>
                  Definições
                </ActionLink>
                <ActionLink href="/billing">Billing</ActionLink>
                <ActionLink href={`/reserve/${restaurant.slug}`}>
                  Público
                </ActionLink>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/18 blur-[110px]" />
      <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/16 blur-[100px]" />
      <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/12 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.12),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function BottomNav({ id }: { id: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-cyan-300/10 bg-[#020617]/90 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-400">
        <Link href={`/restaurants/${id}`} className="text-cyan-300">
          <p className="text-xl">⌂</p>
          Dashboard
        </Link>
        <Link href={`/restaurants/${id}/day`}>
          <p className="text-xl">⚡</p>
          Hoje
        </Link>
        <Link href={`/restaurants/${id}/reservations`}>
          <p className="text-xl">📅</p>
          Reservas
        </Link>
        <Link href={`/restaurants/${id}/tables`}>
          <p className="text-xl">▦</p>
          Sala
        </Link>
        <Link href={`/restaurants/${id}/settings`}>
          <p className="text-xl">☰</p>
          Mais
        </Link>
      </div>
    </nav>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-2.5 text-sm font-black text-black shadow-[0_0_40px_rgba(96,165,250,0.3)] transition hover:opacity-90"
    >
      {children}
    </Link>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white"
    >
      {children}
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number | string;
  sub: string;
  tone: "cyan" | "blue" | "violet" | "yellow";
}) {
  const toneClass =
    tone === "yellow"
      ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-300"
      : tone === "blue"
      ? "border-blue-300/20 bg-blue-400/10 text-blue-300"
      : tone === "violet"
      ? "border-violet-300/20 bg-violet-400/10 text-violet-300"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-300";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black leading-none">{value}</p>
        </div>

        <p className="pb-0.5 text-right text-[10px] font-bold text-slate-500">
          {sub}
        </p>
      </div>
    </div>
  );
}

function ReservationLine({
  reservation,
  isNext,
  showDate,
}: {
  reservation: {
    customerName: string;
    guests: number;
    date: Date | string;
    status: string | null;
    tableNumber: number | null;
  };
  isNext: boolean;
  showDate: boolean;
}) {
  const status = String(reservation.status);

  const statusLabel =
    status === "PENDING"
      ? "Pendente"
      : status === "CONFIRMED"
      ? "Confirmada"
      : status === "SEATED"
      ? "Sentada"
      : status;

  const dotClass =
    status === "PENDING"
      ? "bg-yellow-300"
      : status === "CONFIRMED"
      ? "bg-green-300"
      : status === "SEATED"
      ? "bg-cyan-300"
      : "bg-slate-400";

  return (
    <div className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border-b border-cyan-300/10 px-4 py-3 last:border-b-0">
      <div>
        <p className="text-lg font-black text-cyan-300">
          {new Date(reservation.date).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {showDate && (
          <p className="mt-0.5 text-[10px] font-bold text-slate-500">
            {new Date(reservation.date).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {isNext && (
            <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-orange-300">
              Próxima
            </span>
          )}

          <p className="truncate font-black text-white">
            {reservation.customerName}
          </p>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          {reservation.tableNumber ? `Mesa ${reservation.tableNumber}` : "Sem mesa"} ·{" "}
          {reservation.guests} pessoas
        </p>
      </div>

      <div className="hidden items-center gap-2 text-right sm:flex">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-bold text-slate-400">{statusLabel}</span>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-3.5 text-sm font-black text-white transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
    >
      <span>{children}</span>
      <span className="text-cyan-300">→</span>
    </Link>
  );
}
