import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

async function createTable(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const number = Number(formData.get("number"));
  const capacity = Number(formData.get("capacity"));

  await prisma.table.create({
    data: {
      restaurantId,
      number,
      capacity,
    },
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

export default async function TablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        include: {
          reservations: true,
        },
        orderBy: {
          number: "asc",
        },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] p-10 text-white">
        Restaurante não encontrado.
      </main>
    );
  }

  const now = new Date();

  const tablesWithStatus = restaurant.tables.map((table) => {
    const activeReservation = table.reservations.find((reservation) => {
      const start = new Date(reservation.date);
      const end = new Date(start);
      end.setHours(end.getHours() + 2);

      return (
        reservation.status !== "CANCELLED" &&
        reservation.status !== "FINISHED" &&
        reservation.status !== "REJECTED" &&
        reservation.status !== "NO_SHOW" &&
        now >= start &&
        now < end
      );
    });

    if (!activeReservation) {
      return {
        ...table,
        currentStatus: "FREE",
        currentReservation: null,
      };
    }

    return {
      ...table,
      currentStatus: activeReservation.status,
      currentReservation: activeReservation,
    };
  });

  const freeTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "FREE"
  ).length;

  const reservedTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "CONFIRMED"
  ).length;

  const seatedTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "SEATED"
  ).length;

  const totalCapacity = restaurant.tables.reduce(
    (total, table) => total + table.capacity,
    0
  );

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-6 border-b border-[#2b2b2b] pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm text-[#9e9e9e] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Mesas
            </h1>

            <p className="mt-2 text-[#9e9e9e]">{restaurant.name}</p>
          </div>

          <div className="rounded-full border border-[#2b2b2b] bg-[#181818] px-5 py-3 text-sm font-bold text-[#f0c36a]">
            Gestão da sala
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatCard label="Total de mesas" value={restaurant.tables.length} />
          <StatCard label="Lugares" value={totalCapacity} />
          <StatCard label="Livres agora" value={freeTables} tone="green" />
          <StatCard label="Reservadas" value={reservedTables} tone="yellow" />
          <StatCard label="Sentadas" value={seatedTables} tone="blue" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <form
            action={createTable}
            className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
              Nova mesa
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Adicionar mesa
            </h2>

            <p className="mt-2 text-sm text-[#9e9e9e]">
              Crie mesas com número e capacidade para o sistema atribuir reservas.
            </p>

            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#d6d6d6]">
                  Número da mesa
                </span>

                <input
                  name="number"
                  type="number"
                  placeholder="Ex: 1"
                  className="h-12 w-full rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none focus:border-[#f0c36a]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-[#d6d6d6]">
                  Capacidade
                </span>

                <input
                  name="capacity"
                  type="number"
                  placeholder="Ex: 4"
                  className="h-12 w-full rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none focus:border-[#f0c36a]"
                  required
                />
              </label>

              <button className="h-12 w-full rounded-full bg-[#f0c36a] font-bold text-black hover:bg-[#ffd982]">
                Adicionar Mesa
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                  Sala
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Mapa de mesas
                </h2>
              </div>

              <div className="flex gap-3 text-xs font-bold">
                <Legend color="green" label="Livre" />
                <Legend color="yellow" label="Reservada" />
                <Legend color="blue" label="Sentado" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tablesWithStatus.map((table) => {
                const status = table.currentStatus;

                return (
                  <div
                    key={table.id}
                    className={`rounded-3xl border p-5 transition hover:-translate-y-1 ${
                      status === "FREE"
                        ? "border-green-500/20 bg-green-500/10"
                        : status === "CONFIRMED"
                        ? "border-yellow-500/20 bg-yellow-500/10"
                        : status === "SEATED"
                        ? "border-blue-500/20 bg-blue-500/10"
                        : "border-[#2b2b2b] bg-[#111111]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-black">
                          Mesa {table.number}
                        </p>

                        <p className="mt-1 text-sm text-[#9e9e9e]">
                          {table.capacity} lugares
                        </p>
                      </div>

                      <StatusDot status={status} />
                    </div>

                    <div className="mt-5">
                      <StatusLabel status={status} />

                      {table.currentReservation && (
                        <div className="mt-4 rounded-2xl bg-black/25 p-4">
                          <p className="font-bold">
                            {table.currentReservation.customerName}
                          </p>

                          <p className="mt-1 text-sm text-[#9e9e9e]">
                            {table.currentReservation.guests} pessoas ·{" "}
                            {new Date(
                              table.currentReservation.date
                            ).toLocaleTimeString("pt-PT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {restaurant.tables.length === 0 && (
                <p className="rounded-2xl border border-[#2b2b2b] bg-[#111111] p-5 text-[#9e9e9e]">
                  Ainda não há mesas.
                </p>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "yellow" | "blue";
}) {
  const color =
    tone === "green"
      ? "text-green-300"
      : tone === "yellow"
      ? "text-yellow-300"
      : tone === "blue"
      ? "text-blue-300"
      : "text-[#f0c36a]";

  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#181818] p-6">
      <p className="text-sm text-[#9e9e9e]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "FREE"
      ? "bg-green-400"
      : status === "CONFIRMED"
      ? "bg-yellow-400"
      : status === "SEATED"
      ? "bg-blue-400"
      : "bg-zinc-400";

  return <span className={`h-4 w-4 rounded-full ${color}`} />;
}

function StatusLabel({ status }: { status: string }) {
  const label =
    status === "FREE"
      ? "Livre"
      : status === "CONFIRMED"
      ? "Reservada"
      : status === "SEATED"
      ? "Cliente sentado"
      : status;

  const className =
    status === "FREE"
      ? "border-green-500/20 bg-green-500/10 text-green-300"
      : status === "CONFIRMED"
      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
      : status === "SEATED"
      ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-bold ${className}`}>
      {label}
    </span>
  );
}

function Legend({
  color,
  label,
}: {
  color: "green" | "yellow" | "blue";
  label: string;
}) {
  const bg =
    color === "green"
      ? "bg-green-400"
      : color === "yellow"
      ? "bg-yellow-400"
      : "bg-blue-400";

  return (
    <div className="flex items-center gap-2 text-[#9e9e9e]">
      <span className={`h-2.5 w-2.5 rounded-full ${bg}`} />
      {label}
    </div>
  );
}