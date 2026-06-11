import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const customers = await prisma.customer.findMany({
    where: {
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
    include: {
      reservations: {
        where: {
          restaurantId: id,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const totalReservations = customers.reduce(
    (total, customer) => total + customer.reservations.length,
    0
  );

  const totalNoShows = customers.reduce(
    (total, customer) =>
      total +
      customer.reservations.filter(
        (reservation) => reservation.status === "NO_SHOW"
      ).length,
    0
  );

  const totalGuests = customers.reduce(
    (total, customer) =>
      total +
      customer.reservations.reduce(
        (sum, reservation) => sum + reservation.guests,
        0
      ),
    0
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute right-[-160px] top-[360px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href={`/restaurants/${id}`}
                className="text-sm font-bold text-slate-400 hover:text-white"
              >
                ← Voltar ao dashboard
              </Link>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                MesaLink OS · CRM
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Clientes
              </h1>

              <p className="mt-3 text-slate-400">{restaurant.name}</p>
            </div>

            <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200">
              CRM inteligente
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Clientes" value={customers.length} />
          <StatCard label="Reservas" value={totalReservations} />
          <StatCard label="Pessoas" value={totalGuests} highlighted />
          <StatCard label="No-shows" value={totalNoShows} danger />
        </section>

        <section className="grid gap-4 lg:hidden">
          {customers.map((customer) => {
            const totalCustomerReservations = customer.reservations.length;

            const noShows = customer.reservations.filter(
              (reservation) => reservation.status === "NO_SHOW"
            ).length;

            const customerGuests = customer.reservations.reduce(
              (total, reservation) => total + reservation.guests,
              0
            );

            const lastReservation = customer.reservations[0];

            return (
              <CustomerCard
                key={customer.id}
                name={customer.name}
                phone={customer.phone}
                reservations={totalCustomerReservations}
                noShows={noShows}
                guests={customerGuests}
                lastVisit={
                  lastReservation
                    ? new Date(lastReservation.date).toLocaleDateString("pt-PT")
                    : "-"
                }
              />
            );
          })}

          {customers.length === 0 && (
            <EmptyState text="Ainda não existem clientes." />
          )}
        </section>

        <section className="hidden overflow-hidden rounded-[32px] border border-cyan-300/10 bg-white/[0.04] shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:block">
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr_1fr] gap-4 border-b border-cyan-300/10 bg-[#020617]/50 px-5 py-4 text-sm font-bold text-slate-400">
            <div>Cliente</div>
            <div>Telefone</div>
            <div>Reservas</div>
            <div>No-shows</div>
            <div>Pessoas</div>
            <div>Última visita</div>
          </div>

          <div>
            {customers.map((customer) => {
              const totalCustomerReservations = customer.reservations.length;

              const noShows = customer.reservations.filter(
                (reservation) => reservation.status === "NO_SHOW"
              ).length;

              const customerGuests = customer.reservations.reduce(
                (total, reservation) => total + reservation.guests,
                0
              );

              const lastReservation = customer.reservations[0];

              return (
                <div
                  key={customer.id}
                  className="grid grid-cols-[1.4fr_1fr_0.7fr_0.7fr_0.8fr_1fr] items-center gap-4 border-b border-cyan-300/10 px-5 py-4 last:border-b-0 hover:bg-white/[0.03]"
                >
                  <div>
                    <p className="font-black text-white">{customer.name}</p>

                    {totalCustomerReservations >= 5 && (
                      <span className="mt-2 inline-block rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-200">
                        Cliente frequente
                      </span>
                    )}
                  </div>

                  <div className="text-slate-300">{customer.phone}</div>

                  <div className="font-black text-cyan-300">
                    {totalCustomerReservations}
                  </div>

                  <div
                    className={
                      noShows > 0
                        ? "font-black text-orange-300"
                        : "font-black text-slate-500"
                    }
                  >
                    {noShows}
                  </div>

                  <div className="font-black text-white">{customerGuests}</div>

                  <div className="text-slate-400">
                    {lastReservation
                      ? new Date(lastReservation.date).toLocaleDateString(
                          "pt-PT"
                        )
                      : "-"}
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <p className="p-6 text-slate-400">
                Ainda não existem clientes.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function CustomerCard({
  name,
  phone,
  reservations,
  noShows,
  guests,
  lastVisit,
}: {
  name: string;
  phone: string;
  reservations: number;
  noShows: number;
  guests: number;
  lastVisit: string;
}) {
  const isFrequent = reservations >= 5;

  return (
    <div className="rounded-[28px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_40px_rgba(34,211,238,0.06)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xl font-black text-white">{name}</p>
          <p className="mt-1 text-sm text-slate-400">{phone}</p>
        </div>

        {isFrequent && (
          <span className="shrink-0 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-black text-violet-200">
            VIP
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniInfo label="Reservas" value={String(reservations)} />
        <MiniInfo label="Pessoas" value={String(guests)} />
        <MiniInfo label="No-shows" value={String(noShows)} danger={noShows > 0} />
        <MiniInfo label="Última visita" value={lastVisit} />
      </div>

      <div className="mt-5 flex gap-2">
        <a
          href={`https://wa.me/351${phone}`}
          target="_blank"
          className="rounded-full border border-green-300/20 bg-green-400/10 px-4 py-2 text-xs font-black text-green-200"
        >
          WhatsApp
        </a>

        <span className="rounded-full border border-cyan-300/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300">
          Histórico
        </span>
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={
          danger
            ? "mt-1 font-black text-orange-300"
            : "mt-1 font-black text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-5 text-slate-400">
      {text}
    </p>
  );
}

function StatCard({
  label,
  value,
  highlighted,
  danger,
}: {
  label: string;
  value: number;
  highlighted?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={
        danger
          ? "rounded-[24px] border border-orange-300/20 bg-orange-400/10 p-5 shadow-[0_0_36px_rgba(251,146,60,0.12)]"
          : highlighted
          ? "rounded-[24px] border border-violet-300/20 bg-violet-400/10 p-5 shadow-[0_0_36px_rgba(167,139,250,0.12)]"
          : "rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl"
      }
    >
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p
        className={
          danger
            ? "mt-2 text-2xl font-black text-orange-300"
            : "mt-2 text-2xl font-black text-cyan-300"
        }
      >
        {value}
      </p>
    </div>
  );
}