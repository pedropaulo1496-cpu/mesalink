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

  if (!session?.user?.email) {
    redirect("/login");
  }

  const hasAccess = await canAccessApp(session.user.email);

  if (!hasAccess) {
    redirect("/trial-expired");
  }

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        include: {
          reservations: true,
        },
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

  const reservationsToday = allReservations.filter((reservation) => {
    const reservationDate = new Date(reservation.date);

    return (
      reservationDate.getDate() === today.getDate() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getFullYear() === today.getFullYear() &&
      reservation.status !== "CANCELLED" &&
      reservation.status !== "REJECTED" &&
      reservation.status !== "NO_SHOW"
    );
  });

  const guestsToday = reservationsToday.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const occupiedTables = new Set(
    reservationsToday
      .filter((reservation) => reservation.tableId)
      .map((reservation) => reservation.tableId)
  ).size;

  const occupancyRate =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? Math.round((guestsToday / restaurant.totalCapacity) * 100)
      : restaurant.tables.length > 0
      ? Math.round((occupiedTables / restaurant.tables.length) * 100)
      : 0;

  const totalCustomers = await prisma.customer.count({
    where: {
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
  });

  const nextReservations = allReservations
    .filter((reservation) => {
      const reservationDate = new Date(reservation.date);

      return (
        reservationDate >= new Date() &&
        reservation.status !== "CANCELLED" &&
        reservation.status !== "REJECTED" &&
        reservation.status !== "NO_SHOW"
      );
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/" className="text-2xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                MesaLink OS · Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {restaurant.name}
              </h1>

              <p className="mt-3 text-slate-400">
                {restaurant.address || "Central inteligente de reservas"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <DashboardLink href={`/restaurants/${id}/day`}>
                Serviço do dia
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/reservations`}>
                Reservas
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/calendar`}>
                Calendário
              </DashboardLink>
              <DashboardLink href={`/reserve/${restaurant.slug}`}>
                Página pública
              </DashboardLink>
              <DashboardLink href="/billing">Billing</DashboardLink>
              <SignOutButton />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard label="Mesas" value={restaurant.tables.length} />
          <StatCard label="Clientes" value={totalCustomers} />
          <StatCard label="Reservas" value={allReservations.length} />
          <StatCard label="Hoje" value={reservationsToday.length} highlighted />
          <StatCard label="Pessoas hoje" value={guestsToday} />
          <OccupancyCard value={occupancyRate} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                    AI Insight
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                    O seu link público está pronto para receber reservas.
                  </h2>

                  <p className="mt-3 text-slate-400">
                    Use no Google Maps, Instagram, TikTok, WhatsApp, QR Codes e website.
                  </p>
                </div>

                <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-xs font-black text-green-200">
                  Online
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <div className="flex-1 overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4 text-sm text-slate-300">
                  <p className="truncate">{publicUrl}</p>
                </div>

                <CopyButton text={publicUrl} />
              </div>
            </div>

            <div className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Quick Actions
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Gestão do restaurante
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ActionLink href={`/restaurants/${id}/day`} title="⚡ Serviço do dia" />
                <ActionLink href={`/restaurants/${id}/reservations`} title="📅 Gerir Reservas" />
                <ActionLink href={`/restaurants/${id}/calendar`} title="🗓️ Calendário" />
                <ActionLink href={`/restaurants/${id}/customers`} title="👥 Clientes" />
                <ActionLink href={`/restaurants/${id}/tables`} title="🪑 Mesas" />
                <ActionLink href={`/restaurants/${id}/qr`} title="▦ QR Code" />
                <ActionLink href={`/restaurants/${id}/settings`} title="⚙️ Configurações" />
                <ActionLink href="/billing" title="💳 Billing" />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Live Agenda
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Próximas reservas
            </h2>

            <div className="mt-6 space-y-3">
              {nextReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/70 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">
                        {reservation.customerName}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {reservation.tableNumber
                          ? `Mesa ${reservation.tableNumber}`
                          : "Sem mesa atribuída"}{" "}
                        · {reservation.guests} pessoas
                      </p>

                      <span className="mt-3 inline-block rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                        {reservation.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {new Date(reservation.date).toLocaleDateString("pt-PT")}
                      </p>

                      <p className="mt-1 text-xl font-black text-cyan-300">
                        {new Date(reservation.date).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {nextReservations.length === 0 && (
                <p className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-5 text-slate-400">
                  Ainda não há próximas reservas.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Reservation Settings
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <InfoItem
              label="Modo"
              value={
                restaurant.reservationMode === "TABLES"
                  ? "Por Mesas"
                  : "Por Capacidade"
              }
            />

            <InfoItem
              label="Capacidade"
              value={
                restaurant.totalCapacity
                  ? `${restaurant.totalCapacity} lugares`
                  : "Não definida"
              }
            />

            <InfoItem
              label="Aprovação manual"
              value={
                restaurant.manualApprovalGuests
                  ? `A partir de ${restaurant.manualApprovalGuests} pessoas`
                  : "Automática"
              }
            />

            <InfoItem
              label="Reservas online"
              value={restaurant.onlineReservationsEnabled ? "Ativas" : "Desativadas"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-[24px] border border-violet-300/20 bg-violet-400/10 p-5 shadow-[0_0_36px_rgba(167,139,250,0.12)]"
          : "rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl"
      }
    >
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-cyan-300">{value}</p>
    </div>
  );
}

function OccupancyCard({ value }: { value: number }) {
  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-xs font-bold text-slate-400">Ocupação</p>

      <p className="mt-2 text-2xl font-black text-cyan-300">{value}%</p>

      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
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
      className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-300/50 hover:text-white"
    >
      {children}
    </Link>
  );
}

function ActionLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-5 font-black text-white transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-400/10"
    >
      {title}
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}