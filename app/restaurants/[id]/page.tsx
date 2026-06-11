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
    <main className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-white">
      <style>
        {`
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-18px) scale(1.04); }
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: .35; transform: scale(1); }
            50% { opacity: .8; transform: scale(1.12); }
          }

          @keyframes scan {
            0% { transform: translateX(-120%); opacity: 0; }
            30% { opacity: .8; }
            100% { transform: translateX(120%); opacity: 0; }
          }

          @keyframes orbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .float-slow { animation: floatSlow 6s ease-in-out infinite; }
          .pulse-glow { animation: pulseGlow 4s ease-in-out infinite; }
          .scan-line { animation: scan 4.5s ease-in-out infinite; }
          .orbit { animation: orbit 18s linear infinite; }
        `}
      </style>

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px] pulse-glow" />
        <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/20 blur-[100px] float-slow" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/20 blur-[100px] pulse-glow" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="relative overflow-hidden rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.1)] backdrop-blur-xl lg:p-8">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-cyan-300/10 to-transparent scan-line" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link href="/" className="text-3xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <div className="mt-8 inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  MesaLink OS · Dashboard
                </p>
              </div>

              <h1 className="mt-5 text-5xl font-black leading-[0.88] tracking-[-0.06em] sm:text-6xl">
                {restaurant.name}
              </h1>

              <p className="mt-3 text-lg text-slate-400">
                {restaurant.address || "Central inteligente de reservas"}
              </p>
            </div>

            <div className="hidden lg:block">
              <div className="relative h-40 w-48">
                <div className="absolute inset-0 rounded-full border border-cyan-300/20 orbit" />
                <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-violet-300/20 bg-violet-400/10 shadow-[0_0_50px_rgba(167,139,250,0.3)]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                    AI
                  </p>
                  <p className="text-sm font-black text-white">ONLINE</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:hidden">
              <DashboardLink href={`/restaurants/${id}/day`} icon="⚡">
                Serviço
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/reservations`} icon="📅">
                Reservas
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/calendar`} icon="🗓️">
                Calendário
              </DashboardLink>
              <DashboardLink href={`/reserve/${restaurant.slug}`} icon="🌐">
                Público
              </DashboardLink>
              <DashboardLink href="/billing" icon="💳">
                Billing
              </DashboardLink>
              <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-red-200">
                <SignOutButton />
              </div>
            </div>

            <div className="hidden flex-wrap gap-2 lg:flex">
              <DashboardLink href={`/restaurants/${id}/day`} icon="⚡">
                Serviço do dia
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/reservations`} icon="📅">
                Reservas
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/calendar`} icon="🗓️">
                Calendário
              </DashboardLink>
              <DashboardLink href={`/reserve/${restaurant.slug}`} icon="🌐">
                Página pública
              </DashboardLink>
              <DashboardLink href="/billing" icon="💳">
                Billing
              </DashboardLink>
              <SignOutButton />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Resumo de hoje
            </p>
          </div>

          <div className="rounded-full border border-cyan-300/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300">
            {today.toLocaleDateString("pt-PT")}
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard icon="🪑" label="Mesas" value={restaurant.tables.length} />
          <StatCard icon="👥" label="Clientes" value={totalCustomers} />
          <StatCard icon="📅" label="Reservas" value={allReservations.length} />
          <StatCard icon="✅" label="Hoje" value={reservationsToday.length} highlighted />
          <StatCard icon="🧍" label="Pessoas hoje" value={guestsToday} yellow />
          <OccupancyCard value={occupancyRate} />
        </section>

        <section className="rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Link público
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
  Receba reservas 24/7
</h2>

<p className="mt-3 text-slate-400">
  Partilhe no Google Maps, Instagram, WhatsApp, website e QR Codes.
</p>

<div className="mt-6 flex flex-col gap-3 md:flex-row">
  <div className="flex-1 overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4 text-sm text-slate-300">
    <p className="truncate">{publicUrl}</p>
  </div>

  <CopyButton text={publicUrl} />
</div>

<p className="mt-3 text-xs text-slate-400">
  Escreva{" "}
  <span className="font-semibold text-cyan-300">
    "Google Business Profile"
  </span>{" "}
  no Google, entre no perfil do restaurante e cole este link no botão de reservas.
</p>
            </div>

            <div className="relative mx-auto hidden h-44 w-44 lg:block">
              <div className="absolute inset-0 rounded-full border border-cyan-300/20 orbit" />
              <div className="absolute inset-8 rounded-full bg-cyan-400/10 blur-xl pulse-glow" />
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                🌐
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Quick Actions
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Gestão do restaurante
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ActionLink href={`/restaurants/${id}/day`} title="Serviço do dia" icon="⚡" />
              <ActionLink href={`/restaurants/${id}/reservations`} title="Gerir Reservas" icon="📅" />
              <ActionLink href={`/restaurants/${id}/calendar`} title="Calendário" icon="🗓️" />
              <ActionLink href={`/restaurants/${id}/customers`} title="Clientes" icon="👥" />
              <ActionLink href={`/restaurants/${id}/tables`} title="Mesas" icon="🪑" />
              <ActionLink href={`/restaurants/${id}/qr`} title="QR Code" icon="▦" />
              <ActionLink href={`/restaurants/${id}/settings`} title="Configurações" icon="⚙️" />
              <ActionLink href="/billing" title="Billing" icon="💳" />
            </div>
          </div>

          <div className="rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
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

        <section className="rounded-[34px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-8">
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

      <BottomNav id={id} />
    </main>
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
        <Link href={`/restaurants/${id}/customers`}>
          <p className="text-xl">👥</p>
          Clientes
        </Link>
        <Link href={`/restaurants/${id}/settings`}>
          <p className="text-xl">☰</p>
          Mais
        </Link>
      </div>
    </nav>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlighted,
  yellow,
}: {
  icon: string;
  label: string;
  value: number;
  highlighted?: boolean;
  yellow?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-[24px] border border-green-300/20 bg-green-400/10 p-5 shadow-[0_0_36px_rgba(74,222,128,0.12)]"
          : yellow
          ? "rounded-[24px] border border-yellow-300/20 bg-yellow-400/10 p-5 shadow-[0_0_36px_rgba(250,204,21,0.12)]"
          : "rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl"
      }
    >
      <p className="text-2xl">{icon}</p>
      <p className="mt-3 text-sm font-black text-white">{label}</p>
      <p className={yellow ? "mt-3 text-4xl font-black text-yellow-300" : "mt-3 text-4xl font-black text-cyan-300"}>
        {value}
      </p>
    </div>
  );
}

function OccupancyCard({ value }: { value: number }) {
  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-2xl">◔</p>
      <p className="mt-3 text-sm font-black text-white">Ocupação</p>
      <p className="mt-3 text-4xl font-black text-cyan-300">{value}%</p>

      <div className="mt-5 h-2 rounded-full bg-white/10">
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
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-cyan-300/20 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-200 hover:border-cyan-300/50 hover:text-white"
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}

function ActionLink({
  href,
  title,
  icon,
}: {
  href: string;
  title: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-5 font-black text-white transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-400/10"
    >
      <span>
        <span className="mr-3 text-xl">{icon}</span>
        {title}
      </span>

      <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300">
        →
      </span>
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