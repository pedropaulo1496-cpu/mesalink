import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function updateReservationStatus(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));
  const status = String(formData.get("status"));

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  redirect(`/restaurants/${restaurantId}/reservations`);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmada",
    SEATED: "Check-in",
    FINISHED: "Finalizada",
    NO_SHOW: "No-show",
    CANCELLED: "Cancelada",
    REJECTED: "Recusada",
  };

  return labels[status] ?? status;
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    PENDING: "border-yellow-300/30 bg-yellow-400/10 text-yellow-200",
    CONFIRMED: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
    SEATED: "border-green-300/30 bg-green-400/10 text-green-200",
    FINISHED: "border-slate-300/30 bg-slate-400/10 text-slate-300",
    NO_SHOW: "border-orange-300/30 bg-orange-400/10 text-orange-200",
    CANCELLED: "border-red-300/30 bg-red-400/10 text-red-200",
    REJECTED: "border-red-300/30 bg-red-400/10 text-red-200",
  };

  return classes[status] ?? "border-slate-300/30 bg-slate-400/10 text-slate-300";
}

export default async function ReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; error?: string }>;
}) {
  const { id } = await params;
  const { status, q, error } = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        include: {
          reservations: true,
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const allReservations = restaurant.tables
    .flatMap((table) =>
      table.reservations.map((reservation) => ({
        ...reservation,
        tableNumber: table.number,
      }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredByStatus = status
    ? allReservations.filter((reservation) => reservation.status === status)
    : allReservations;

  const search = q?.toLowerCase().trim() ?? "";

  const reservations = search
    ? filteredByStatus.filter((reservation) => {
        return (
          reservation.customerName.toLowerCase().includes(search) ||
          reservation.phone.toLowerCase().includes(search)
        );
      })
    : filteredByStatus;

  const filters = [
    { label: "Todas", value: "" },
    { label: "Pendentes", value: "PENDING" },
    { label: "Confirmadas", value: "CONFIRMED" },
    { label: "Check-in", value: "SEATED" },
    { label: "Finalizadas", value: "FINISHED" },
    { label: "Canceladas", value: "CANCELLED" },
    { label: "Recusadas", value: "REJECTED" },
  ];

  const pendingCount = allReservations.filter(
    (reservation) => reservation.status === "PENDING"
  ).length;

  const confirmedCount = allReservations.filter(
    (reservation) => reservation.status === "CONFIRMED"
  ).length;

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
                MesaLink OS · Reservations
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Reservas
              </h1>

              <p className="mt-3 text-slate-400">{restaurant.name}</p>
            </div>

            <Link
              href={`/restaurants/${id}/reservations/new`}
              className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 py-3 text-center font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.25)] hover:opacity-90"
            >
              + Nova Reserva
            </Link>
          </div>
        </header>

        {error === "conflict" && (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 font-bold text-red-200">
            Esta mesa já tem uma reserva nesse período de 2 horas.
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total" value={allReservations.length} />
          <StatCard label="Pendentes" value={pendingCount} highlighted />
          <StatCard label="Confirmadas" value={confirmedCount} />
          <StatCard label="A mostrar" value={reservations.length} />
        </section>

        <section className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-4 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-5">
          <form className="flex flex-col gap-3 md:flex-row">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Procurar por nome ou telefone..."
              className="h-12 flex-1 rounded-full border border-cyan-300/10 bg-[#020617]/70 px-5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
            />

            {status && <input type="hidden" name="status" value={status} />}

            <button className="h-12 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 font-black text-black hover:opacity-90">
              Procurar
            </button>
          </form>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
            {filters.map((filter) => {
              const query = new URLSearchParams();

              if (filter.value) query.set("status", filter.value);
              if (q) query.set("q", q);

              const active =
                status === filter.value || (!status && filter.value === "");

              return (
                <Link
                  key={filter.label}
                  href={`/restaurants/${id}/reservations${
                    query.toString() ? `?${query.toString()}` : ""
                  }`}
                  className={
                    active
                      ? "shrink-0 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-sm font-black text-black"
                      : "shrink-0 rounded-full border border-cyan-300/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-300/40 hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:hidden">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              reservation={reservation}
            />
          ))}

          {reservations.length === 0 && (
            <EmptyState text="Não existem reservas para esta pesquisa." />
          )}
        </section>

        <section className="hidden overflow-hidden rounded-[32px] border border-cyan-300/10 bg-white/[0.04] shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:block">
          <div className="grid grid-cols-[90px_1.4fr_0.8fr_0.6fr_0.8fr_1fr] gap-4 border-b border-cyan-300/10 bg-[#020617]/50 px-5 py-4 text-sm font-bold text-slate-400">
            <div>Hora</div>
            <div>Cliente</div>
            <div>Mesa</div>
            <div>Pessoas</div>
            <div>Estado</div>
            <div className="text-right">Ações</div>
          </div>

          <div>
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="grid grid-cols-[90px_1.4fr_0.8fr_0.6fr_0.8fr_1fr] items-center gap-4 border-b border-cyan-300/10 px-5 py-4 last:border-b-0 hover:bg-white/[0.03]"
              >
                <div className="font-black text-cyan-300">
                  {new Date(reservation.date).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <div>
                  <p className="font-bold text-white">
                    {reservation.customerName}
                  </p>
                  <p className="text-sm text-slate-400">{reservation.phone}</p>
                </div>

                <div className="text-slate-300">Mesa {reservation.tableNumber}</div>

                <div className="font-bold">{reservation.guests}</div>

                <div>
                  <StatusPill status={reservation.status} />
                </div>

                <div className="flex justify-end gap-2">
                  <WhatsAppButton
                    restaurantName={restaurant.name}
                    reservation={reservation}
                  />

                  <ReservationActions
                    restaurantId={restaurant.id}
                    reservationId={reservation.id}
                    status={reservation.status}
                  />
                </div>
              </div>
            ))}

            {reservations.length === 0 && (
              <p className="p-6 text-slate-400">
                Não existem reservas para esta pesquisa.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ReservationCard({
  restaurantId,
  restaurantName,
  reservation,
}: {
  restaurantId: string;
  restaurantName: string;
  reservation: {
    id: string;
    date: Date;
    customerName: string;
    phone: string;
    guests: number;
    status: string;
    tableNumber: number;
  };
}) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-black text-cyan-300">
              {new Date(reservation.date).toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <div className="min-w-0">
              <p className="truncate font-black text-white">
                {reservation.customerName}
              </p>
              <p className="truncate text-sm text-slate-400">
                {reservation.phone}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <CompactInfo value={`Mesa ${reservation.tableNumber}`} />
            <CompactInfo value={`${reservation.guests} pax`} />
            <StatusPill status={reservation.status} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <WhatsAppButton
          restaurantName={restaurantName}
          reservation={reservation}
        />

        <ReservationActions
          restaurantId={restaurantId}
          reservationId={reservation.id}
          status={reservation.status}
        />
      </div>
    </div>
  );
}

function WhatsAppButton({
  restaurantName,
  reservation,
}: {
  restaurantName: string;
  reservation: {
    customerName: string;
    date: Date;
    guests: number;
    phone: string;
  };
}) {
  return (
    <a
      href={`https://wa.me/351${reservation.phone}?text=${encodeURIComponent(
        `Olá ${reservation.customerName}, a sua reserva na ${restaurantName} está confirmada para ${new Date(
          reservation.date
        ).toLocaleString("pt-PT")} para ${
          reservation.guests
        } pessoas. Obrigado!`
      )}`}
      target="_blank"
      className="rounded-full border border-green-300/20 bg-green-400/10 px-4 py-2 text-xs font-black text-green-200"
    >
      WhatsApp
    </a>
  );
}

function ReservationActions({
  restaurantId,
  reservationId,
  status,
}: {
  restaurantId: string;
  reservationId: string;
  status: string;
}) {
  if (status === "PENDING") {
    return (
      <>
        <SmallStatusButton
          restaurantId={restaurantId}
          reservationId={reservationId}
          status="CONFIRMED"
          label="Aprovar"
        />

        <SmallStatusButton
          restaurantId={restaurantId}
          reservationId={reservationId}
          status="REJECTED"
          label="Recusar"
          danger
        />
      </>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <>
        <SmallStatusButton
          restaurantId={restaurantId}
          reservationId={reservationId}
          status="SEATED"
          label="Check-in"
        />

        <SmallStatusButton
          restaurantId={restaurantId}
          reservationId={reservationId}
          status="CANCELLED"
          label="Cancelar"
          danger
        />
      </>
    );
  }

  if (status === "SEATED") {
    return (
      <SmallStatusButton
        restaurantId={restaurantId}
        reservationId={reservationId}
        status="FINISHED"
        label="Finalizar"
      />
    );
  }

  return null;
}

function SmallStatusButton({
  restaurantId,
  reservationId,
  status,
  label,
  danger,
}: {
  restaurantId: string;
  reservationId: string;
  status: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <form action={updateReservationStatus}>
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="reservationId" value={reservationId} />
      <input type="hidden" name="status" value={status} />

      <button
        className={
          danger
            ? "rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-200"
            : "rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-2 text-xs font-black text-black"
        }
      >
        {label}
      </button>
    </form>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${statusClass(
        status
      )}`}
    >
      {statusLabel(status)}
    </span>
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

function CompactInfo({ value }: { value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-white">
      {value}
    </div>
  );
}