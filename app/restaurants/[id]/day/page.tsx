import DayPicker from "./DayPicker";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function isLunch(date: Date) {
  return date.getHours() < 17;
}

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

function getApprovalReasonLabel(reason: string | null) {
  const labels: Record<string, string> = {
    LARGE_GROUP: "Grupo grande",
    TABLE_MERGE: "Junção de mesas",
    CAPACITY_LIMIT: "Limite de capacidade",
  };

  return reason ? labels[reason] ?? reason : null;
}

async function updateReservationStatus(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));
  const status = String(formData.get("status"));
  const day = String(formData.get("day"));

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status },
  });

  redirect(`/restaurants/${restaurantId}/day?day=${day}`);
}

export default async function DayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { id } = await params;
  const { day } = await searchParams;

  const selectedDay =
    day ??
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(new Date().getDate()).padStart(2, "0")}`;

  const dayStart = new Date(selectedDay);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(selectedDay);
  dayEnd.setHours(23, 59, 59, 999);

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

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: id,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        notIn: ["CANCELLED", "REJECTED"],
      },
    },
    include: {
      table: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const lunchReservations = reservations.filter((reservation) =>
    isLunch(new Date(reservation.date))
  );

  const dinnerReservations = reservations.filter(
    (reservation) => !isLunch(new Date(reservation.date))
  );

  const totalGuests = reservations.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === "PENDING"
  );

  const seatedReservations = reservations.filter(
    (reservation) => reservation.status === "SEATED"
  );

  const pendingGuests = pendingReservations.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const nextReservation = reservations.find(
    (reservation) =>
      ["PENDING", "CONFIRMED"].includes(reservation.status) &&
      new Date(reservation.date) >= new Date()
  );

  const formattedDate = new Date(selectedDay).toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  function ReservationCard({
  reservation,
}: {
  reservation: (typeof reservations)[number];
}) {
  const reasonLabel = getApprovalReasonLabel(reservation.approvalReason);

  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] px-4 py-3">
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
              <p className="truncate text-xs text-slate-400">
                {reservation.guests} pessoas ·{" "}
                {reservation.table ? `Mesa ${reservation.table.number}` : "Sem mesa"}
              </p>
            </div>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(
            reservation.status
          )}`}
        >
          {getStatusLabel(reservation.status)}
        </span>
      </div>

      {reasonLabel && (
        <p className="mt-2 text-xs font-bold text-violet-200">
          ⚠️ {reasonLabel}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {reservation.status === "PENDING" && (
          <>
            <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="CONFIRMED" label="Aprovar" variant="primary" />
            <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="REJECTED" label="Recusar" variant="red" />
          </>
        )}

        {reservation.status === "CONFIRMED" && (
          <>
            <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="SEATED" label="Check-in" variant="primary" />
            <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="NO_SHOW" label="No-show" variant="orange" />
            <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="CANCELLED" label="Cancelar" variant="red" />
          </>
        )}

        {reservation.status === "SEATED" && (
          <StatusButton restaurantId={id} reservationId={reservation.id} day={selectedDay} status="FINISHED" label="Finalizar" variant="primary" />
        )}
      </div>
    </div>
  );
}

  function StatusButton({
    restaurantId,
    reservationId,
    day,
    status,
    label,
    variant,
  }: {
    restaurantId: string;
    reservationId: string;
    day: string;
    status: string;
    label: string;
    variant: "primary" | "red" | "orange";
  }) {
    const className =
      variant === "primary"
        ? "rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-2 text-xs font-black text-black shadow-[0_0_28px_rgba(34,211,238,0.22)] hover:opacity-90"
        : variant === "red"
        ? "rounded-full border border-red-300/30 bg-red-400/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-400/20"
        : "rounded-full border border-orange-300/30 bg-orange-400/10 px-4 py-2 text-xs font-bold text-orange-200 hover:bg-orange-400/20";

    return (
      <form action={updateReservationStatus}>
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <input type="hidden" name="reservationId" value={reservationId} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="day" value={day} />
        <button className={className}>{label}</button>
      </form>
    );
  }

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
                href={`/restaurants/${id}/calendar`}
                className="text-sm font-bold text-slate-400 hover:text-white"
              >
                ← Voltar ao calendário
              </Link>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                MesaLink OS · Live Service
              </p>

              <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Serviço do dia
              </h1>

              <p className="mt-3 text-slate-400">
                {restaurant.name} · {formattedDate}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-3">
              <DayPicker restaurantId={id} selectedDay={selectedDay} />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatBox label="Reservas" value={reservations.length} />
          <StatBox label="Pessoas" value={totalGuests} />
          <StatBox label="Sentados" value={seatedReservations.length} />
          <StatBox label="Pendentes" value={pendingReservations.length} highlighted />
          <StatBox label="Data" value={new Date(selectedDay).toLocaleDateString("pt-PT")} />
        </section>

        {nextReservation && (
          <section className="rounded-[32px] border border-cyan-300/20 bg-cyan-400/10 p-5 shadow-[0_0_60px_rgba(34,211,238,0.12)]">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Próxima entrada
            </p>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-black text-cyan-200">
                  {new Date(nextReservation.date).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="mt-2 text-xl font-black">{nextReservation.customerName}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {nextReservation.guests} pessoas ·{" "}
                  {nextReservation.table ? `Mesa ${nextReservation.table.number}` : "Sem mesa"}
                </p>
              </div>

              <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(nextReservation.status)}`}>
                {getStatusLabel(nextReservation.status)}
              </span>
            </div>
          </section>
        )}

        {pendingReservations.length > 0 && (
          <ServiceSection
            title="Pendentes"
            label={`${pendingReservations.length} reservas · ${pendingGuests} pessoas`}
            warning
          >
            {pendingReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </ServiceSection>
        )}

        <ServiceSection title="Almoço" label={`${lunchReservations.length} reservas`}>
          {lunchReservations.length > 0 ? (
            lunchReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <EmptyState text="Sem reservas ao almoço." />
          )}
        </ServiceSection>

        <ServiceSection title="Jantar" label={`${dinnerReservations.length} reservas`}>
          {dinnerReservations.length > 0 ? (
            dinnerReservations.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <EmptyState text="Sem reservas ao jantar." />
          )}
        </ServiceSection>
      </div>
    </main>
  );
}

function ServiceSection({
  title,
  label,
  warning,
  children,
}: {
  title: string;
  label: string;
  warning?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        warning
          ? "rounded-[32px] border border-yellow-300/20 bg-yellow-400/10 p-4 shadow-[0_0_55px_rgba(250,204,21,0.12)] lg:p-6"
          : "rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-4 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6"
      }
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Serviço
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">
            {title}
          </h2>
        </div>

        <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
          {label}
        </span>
      </div>

      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-5 text-slate-400">
      {text}
    </p>
  );
}

function StatBox({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: number | string;
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

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}