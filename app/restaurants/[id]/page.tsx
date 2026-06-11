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

  const isToday = (date: Date | string) => {
    const reservationDate = new Date(date);

    return (
      reservationDate.getDate() === today.getDate() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getFullYear() === today.getFullYear()
    );
  };

  const activeStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];

  const activeReservations = allReservations.filter(
    (reservation) => !activeStatuses.includes(String(reservation.status))
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

  const nextReservations = activeReservations
    .filter((reservation) => new Date(reservation.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6);

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] pb-24 text-white">
      <Background />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/" className="text-2xl font-black">
                Mesa
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Link
                </span>
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-black leading-none tracking-[-0.05em] sm:text-5xl">
                  {restaurant.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
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
              <DashboardLink href={`/restaurants/${id}/reservations/new`}>
                Nova reserva
              </DashboardLink>
              <DashboardLink href={`/restaurants/${id}/day`}>
                Serviço do dia
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

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Reservas hoje" value={reservationsToday.length} />
          <StatCard label="Pessoas hoje" value={guestsToday} />
          <StatCard label="Confirmadas" value={confirmedToday.length} />
          <StatCard label="Pendentes" value={pendingToday.length} urgent={pendingToday.length > 0} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Hoje
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  Próximas reservas
                </h2>
              </div>

              <Link
                href={`/restaurants/${id}/reservations`}
                className="text-sm font-black text-cyan-300 hover:text-cyan-200"
              >
                Ver todas →
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {nextReservations.map((reservation) => (
                <ReservationRow key={reservation.id} reservation={reservation} />
              ))}

              {nextReservations.length === 0 && (
                <div className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-5 text-sm text-slate-400">
                  Ainda não há próximas reservas.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Link público
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Receba reservas 24/7
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use este link no Google Maps, Instagram, website e QR Code.
              </p>

              <div className="mt-5 space-y-3">
                <div className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4 text-sm text-slate-300">
                  <p className="truncate">{publicUrl}</p>
                </div>

                <CopyButton text={publicUrl} />
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Escreva{" "}
                <span className="font-semibold text-cyan-300">
                  "Google Business Profile"
                </span>{" "}
                no Google, entre no perfil do restaurante e cole este link no
                botão de reservas.
              </p>
            </div>

            <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Ações rápidas
              </p>

              <div className="mt-5 grid gap-3">
                <ActionLink href={`/restaurants/${id}/customers`}>
                  Clientes
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/tables`}>
                  Mesas
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/qr`}>
                  QR Code
                </ActionLink>
                <ActionLink href={`/restaurants/${id}/settings`}>
                  Configurações
                </ActionLink>
                <ActionLink href="/billing">Billing</ActionLink>
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
      <div className="absolute left-1/2 top-[-180px] h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
      <div className="absolute right-[-160px] top-[360px] h-[330px] w-[330px] rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="absolute bottom-[-160px] left-[-160px] h-[330px] w-[330px] rounded-full bg-blue-500/16 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.13),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
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

function StatCard({
  label,
  value,
  urgent,
}: {
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 backdrop-blur-xl ${
        urgent
          ? "border-yellow-300/20 bg-yellow-400/10"
          : "border-cyan-300/10 bg-white/[0.04]"
      }`}
    >
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p
        className={`mt-3 text-4xl font-black ${
          urgent ? "text-yellow-300" : "text-cyan-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ReservationRow({
  reservation,
}: {
  reservation: {
    customerName: string;
    guests: number;
    date: Date | string;
    status: string | null;
    tableNumber: number | null;
  };
}) {
  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-white">{reservation.customerName}</p>

          <p className="mt-1 text-sm text-slate-400">
            {reservation.tableNumber
              ? `Mesa ${reservation.tableNumber}`
              : "Sem mesa"}{" "}
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
      className="flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4 font-black text-white transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
    >
      <span>{children}</span>
      <span className="text-cyan-300">→</span>
    </Link>
  );
}
