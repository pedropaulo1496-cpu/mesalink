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
    PENDING: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    CONFIRMED: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    SEATED: "border-green-400/30 bg-green-400/10 text-green-300",
    FINISHED: "border-gray-400/30 bg-gray-400/10 text-gray-300",
    NO_SHOW: "border-orange-400/30 bg-orange-400/10 text-orange-300",
    CANCELLED: "border-red-400/30 bg-red-400/10 text-red-300",
    REJECTED: "border-red-400/30 bg-red-400/10 text-red-300",
  };

  return classes[status] ?? "border-gray-400/30 bg-gray-400/10 text-gray-300";
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
      <main className="min-h-screen bg-[#070504] p-10 text-[#fff7ea]">
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

  function ReservationRow({
    reservation,
  }: {
    reservation: (typeof reservations)[number];
  }) {
    const reasonLabel = getApprovalReasonLabel(reservation.approvalReason);

    return (
      <div className="grid grid-cols-1 items-center gap-3 rounded-xl border border-[#f0c36a]/10 bg-black/20 px-4 py-3 hover:bg-black/30 xl:grid-cols-[70px_1.3fr_80px_120px_130px_1fr]">
        <div className="text-lg font-black text-[#f0c36a]">
          {new Date(reservation.date).toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <div>
          <p className="font-bold text-[#fff7ea]">{reservation.customerName}</p>
          <p className="text-sm text-[#a99a82]">{reservation.phone}</p>
        </div>

        <div className="font-bold text-[#d6c7ad]">{reservation.guests} pax</div>

        <div className="text-[#d6c7ad]">
          {reservation.table ? `Mesa ${reservation.table.number}` : "Sem mesa"}
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
              reservation.status
            )}`}
          >
            {getStatusLabel(reservation.status)}
          </span>

          {reasonLabel && (
            <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300">
              {reasonLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
          {reservation.status === "PENDING" && (
            <>
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="CONFIRMED"
                label="Aprovar"
                variant="gold"
              />

              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="REJECTED"
                label="Recusar"
                variant="red"
              />
            </>
          )}

          {reservation.status === "CONFIRMED" && (
            <>
              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="SEATED"
                label="Check-in"
                variant="gold"
              />

              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="NO_SHOW"
                label="No-show"
                variant="orange"
              />

              <StatusButton
                restaurantId={id}
                reservationId={reservation.id}
                day={selectedDay}
                status="CANCELLED"
                label="Cancelar"
                variant="red"
              />
            </>
          )}

          {reservation.status === "SEATED" && (
            <StatusButton
              restaurantId={id}
              reservationId={reservation.id}
              day={selectedDay}
              status="FINISHED"
              label="Finalizar"
              variant="gold"
            />
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
    variant: "gold" | "red" | "orange";
  }) {
    const className =
      variant === "gold"
        ? "rounded-full bg-[#f0c36a] px-3 py-1.5 text-xs font-black text-black hover:bg-[#ffd982]"
        : variant === "red"
        ? "rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20"
        : "rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/20";

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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-7xl space-y-6 px-8 py-8">
        <header className="flex flex-col justify-between gap-6 border-b border-[#f0c36a]/10 pb-6 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}/calendar`}
              className="text-sm font-bold text-[#a99a82] hover:text-white"
            >
              ← Voltar ao calendário
            </Link>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Serviço do dia
            </h1>

            <p className="mt-2 text-[#a99a82]">{restaurant.name}</p>
          </div>

          <div className="rounded-2xl border border-[#f0c36a]/10 bg-[#15100b] p-3">
            <DayPicker restaurantId={id} selectedDay={selectedDay} />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatBox label="Reservas" value={reservations.length} />
          <StatBox label="Pessoas" value={totalGuests} />
          <StatBox label="Sentados" value={seatedReservations.length} />
          <StatBox label="Pendentes" value={pendingReservations.length} highlighted />
          <StatBox
            label="Data"
            value={new Date(selectedDay).toLocaleDateString("pt-PT")}
          />
        </section>

        {pendingReservations.length > 0 && (
          <ServiceSection
            title="Pendentes de aprovação"
            label={`${pendingReservations.length} reservas · ${pendingGuests} pessoas`}
            warning
          >
            {pendingReservations.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))}
          </ServiceSection>
        )}

        <ServiceSection
          title="Almoço"
          label={`${lunchReservations.length} reservas`}
        >
          {lunchReservations.length > 0 ? (
            lunchReservations.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <EmptyState text="Sem reservas ao almoço." />
          )}
        </ServiceSection>

        <ServiceSection
          title="Jantar"
          label={`${dinnerReservations.length} reservas`}
        >
          {dinnerReservations.length > 0 ? (
            dinnerReservations.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} />
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
          ? "rounded-[2rem] border border-[#f0c36a]/30 bg-[#2b1e05] p-5 shadow-2xl"
          : "rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-5 shadow-2xl"
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#f0c36a]">
            Serviço
          </p>

          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>

        <span className="rounded-full bg-[#f0c36a]/10 px-3 py-1 text-sm font-bold text-[#f0c36a]">
          {label}
        </span>
      </div>

      <div className="space-y-2">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-[#f0c36a]/10 bg-black/20 p-4 text-[#a99a82]">
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
          ? "rounded-[1.5rem] border border-[#f0c36a]/30 bg-[#2b1e05] p-5"
          : "rounded-[1.5rem] border border-[#f0c36a]/10 bg-[#15100b] p-5"
      }
    >
      <p className="text-sm text-[#a99a82]">{label}</p>

      <p className="mt-1 text-2xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}