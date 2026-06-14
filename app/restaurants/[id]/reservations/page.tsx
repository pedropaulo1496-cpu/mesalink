import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReservationsPage({
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
      reservations: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado.
      </main>
    );
  }

  const now = new Date();

  const activeReservations = restaurant.reservations.filter(
    (reservation) =>
      !["CANCELLED", "REJECTED", "NO_SHOW"].includes(
        String(reservation.status)
      )
  );

  const upcomingReservations = activeReservations.filter(
    (reservation) => new Date(reservation.date) >= now
  );

  const pastReservations = activeReservations.filter(
    (reservation) => new Date(reservation.date) < now
  );

  const pendingReservations = restaurant.reservations.filter(
    (reservation) => reservation.status === "PENDING"
  );

const publicReservations = restaurant.reservations.filter((reservation) => {
  const item = reservation as typeof reservation & { source?: string };
  return item.source === "PUBLIC";
});
  const totalGuests = activeReservations.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const reservationsToShow = restaurant.reservations.slice(0, 80);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-6 border-b border-cyan-300/10 pb-8 lg:flex-row lg:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm font-bold text-slate-400 hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              MesaLink OS · Reservations
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em]">
              Reservas
            </h1>

            <p className="mt-2 text-slate-400">{restaurant.name}</p>
          </div>

          <Link
            href={`/restaurants/${id}/reservations/new`}
            className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 py-3 font-black text-black shadow-[0_0_50px_rgba(96,165,250,0.35)] hover:opacity-90"
          >
            + Nova reserva
          </Link>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={restaurant.reservations.length} />
          <StatCard label="Futuras" value={upcomingReservations.length} />
          <StatCard label="Pendentes" value={pendingReservations.length} tone="yellow" />
          <StatCard label="Online" value={publicReservations.length} tone="blue" />
          <StatCard label="Pessoas" value={totalGuests} tone="violet" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] shadow-[0_0_70px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
            <div className="border-b border-white/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Últimas reservas
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                Histórico e próximas reservas
              </h2>
            </div>

            <div>
              {reservationsToShow.map((reservation) => (
                <ReservationRow key={reservation.id} reservation={reservation} />
              ))}

              {reservationsToShow.length === 0 && (
                <div className="p-8 text-sm text-slate-400">
                  Ainda não há reservas. Comece por criar uma reserva manual ou
                  partilhar o link público.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <InfoCard
              title="Próxima reserva"
              text={
                upcomingReservations[0]
                  ? `${upcomingReservations[0].customerName} · ${upcomingReservations[0].guests} pessoas`
                  : "Sem próximas reservas."
              }
            />

            <InfoCard
              title="Reservas pendentes"
              text={
                pendingReservations.length > 0
                  ? `${pendingReservations.length} reserva(s) precisam de resposta.`
                  : "Não existem reservas pendentes."
              }
            />

            <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
              <h3 className="text-2xl font-black tracking-[-0.04em]">
                Ações rápidas
              </h3>

              <div className="mt-5 grid gap-3">
                <SideLink href={`/restaurants/${id}/reservations/new`}>
                  + Criar reserva manual
                </SideLink>
                <SideLink href={`/restaurants/${id}/calendar`}>
                  Ver calendário
                </SideLink>
                <SideLink href={`/restaurants/${id}/day`}>
                  Serviço de hoje
                </SideLink>
                <SideLink href={`/reserve/${restaurant.slug}`}>
                  Página pública
                </SideLink>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
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
    source?: string;
    phone: string;
    email: string | null;
  };
}) {
  const date = new Date(reservation.date);

  const status = String(reservation.status);

  const statusStyle =
    status === "PENDING"
      ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-300"
      : status === "CONFIRMED"
      ? "border-green-300/20 bg-green-400/10 text-green-300"
      : status === "CANCELLED"
      ? "border-red-300/20 bg-red-400/10 text-red-300"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-300";

  return (
    <div className="grid gap-4 border-b border-white/10 p-5 last:border-b-0 md:grid-cols-[120px_1fr_auto] md:items-center">
      <div>
        <p className="text-2xl font-black text-cyan-300">
          {date.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {date.toLocaleDateString("pt-PT")}
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-black text-white">{reservation.customerName}</p>

          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
            {(reservation as typeof reservation & { source?: string }).source === "PUBLIC"
  ? "Online"
  : "Manual"}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-400">
          {reservation.guests} pessoas · {reservation.phone}
          {reservation.email ? ` · ${reservation.email}` : ""}
        </p>
      </div>

      <span
        className={`w-fit rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusStyle}`}
      >
        {status}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "yellow" | "blue" | "violet";
}) {
  const color =
    tone === "yellow"
      ? "text-yellow-300"
      : tone === "blue"
      ? "text-blue-300"
      : tone === "violet"
      ? "text-violet-300"
      : "text-cyan-300";

  return (
    <div className="rounded-[1.5rem] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function SideLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-cyan-300/10 bg-black/25 p-4 text-sm font-black text-white hover:border-cyan-300/40 hover:bg-cyan-400/10"
    >
      <span>{children}</span>
      <span className="text-cyan-300">→</span>
    </Link>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}