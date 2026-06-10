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
    PENDING: "bg-yellow-500/15 text-yellow-300",
    CONFIRMED: "bg-blue-500/15 text-blue-300",
    SEATED: "bg-green-500/15 text-green-300",
    FINISHED: "bg-white/10 text-[#a99a82]",
    NO_SHOW: "bg-orange-500/15 text-orange-300",
    CANCELLED: "bg-red-500/15 text-red-300",
    REJECTED: "bg-red-500/15 text-red-300",
  };

  return classes[status] ?? "bg-white/10 text-[#a99a82]";
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
      <main className="min-h-screen bg-[#070504] p-10 text-[#fff7ea]">
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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-7xl space-y-8 px-8 py-8">
        <header className="flex flex-col justify-between gap-6 border-b border-[#f0c36a]/10 pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm font-bold text-[#a99a82] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <h1 className="mt-6 text-5xl font-black tracking-tight">
              Reservas
            </h1>

            <p className="mt-2 text-[#a99a82]">{restaurant.name}</p>
          </div>

          <Link
            href={`/restaurants/${id}/reservations/new`}
            className="rounded-full bg-[#f0c36a] px-6 py-3 font-black text-black shadow-lg hover:bg-[#ffd982]"
          >
            + Nova Reserva
          </Link>
        </header>

        {error === "conflict" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 font-bold text-red-300">
            Esta mesa já tem uma reserva nesse período de 2 horas.
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Total" value={allReservations.length} />
          <StatCard label="Pendentes" value={pendingCount} />
          <StatCard label="Confirmadas" value={confirmedCount} />
          <StatCard label="A mostrar" value={reservations.length} />
        </section>

        <section className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-5 shadow-2xl">
          <form className="flex flex-col gap-3 md:flex-row">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Procurar por nome ou telefone..."
              className="h-12 flex-1 rounded-full border border-[#f0c36a]/10 bg-black/25 px-5 text-[#fff7ea] outline-none placeholder:text-[#a99a82] focus:border-[#f0c36a]/40"
            />

            {status && <input type="hidden" name="status" value={status} />}

            <button className="h-12 rounded-full bg-[#f0c36a] px-6 font-black text-black hover:bg-[#ffd982]">
              Procurar
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
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
                      ? "rounded-full bg-[#f0c36a] px-4 py-2 text-sm font-black text-black"
                      : "rounded-full border border-[#f0c36a]/10 bg-black/20 px-4 py-2 text-sm font-bold text-[#d6c7ad] hover:border-[#f0c36a]/40 hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] shadow-2xl">
          <div className="grid grid-cols-[90px_1.4fr_0.8fr_0.6fr_0.8fr_1fr] gap-4 border-b border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-sm font-bold text-[#a99a82]">
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
                className="grid grid-cols-[90px_1.4fr_0.8fr_0.6fr_0.8fr_1fr] items-center gap-4 border-b border-[#f0c36a]/10 px-5 py-4 last:border-b-0 hover:bg-black/20"
              >
                <div className="font-black text-[#f0c36a]">
                  {new Date(reservation.date).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <div>
                  <p className="font-bold text-[#fff7ea]">
                    {reservation.customerName}
                  </p>
                  <p className="text-sm text-[#a99a82]">{reservation.phone}</p>
                </div>

                <div className="text-[#d6c7ad]">
                  Mesa {reservation.tableNumber}
                </div>

                <div className="font-bold">{reservation.guests}</div>

                <div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                      reservation.status
                    )}`}
                  >
                    {statusLabel(reservation.status)}
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <a
                    href={`https://wa.me/351${reservation.phone}?text=${encodeURIComponent(
                      `Olá ${reservation.customerName}, a sua reserva na ${restaurant.name} está confirmada para ${new Date(
                        reservation.date
                      ).toLocaleString("pt-PT")} para ${
                        reservation.guests
                      } pessoas. Obrigado!`
                    )}`}
                    target="_blank"
                    className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-300"
                  >
                    WhatsApp
                  </a>

                  <ReservationActions
                    restaurantId={restaurant.id}
                    reservationId={reservation.id}
                    status={reservation.status}
                  />
                </div>
              </div>
            ))}

            {reservations.length === 0 && (
              <p className="p-6 text-[#a99a82]">
                Não existem reservas para esta pesquisa.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
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
            ? "rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300"
            : "rounded-full bg-[#f0c36a] px-3 py-2 text-xs font-black text-black"
        }
      >
        {label}
      </button>
    </form>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <p className="text-sm text-[#a99a82]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}