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
      <main className="min-h-screen bg-[#020617] p-6 text-white">
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
    <main className="relative min-h-screen overflow-hidden bg-[#020617] p-4 text-white lg:p-8">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
        <div className="absolute right-[-160px] top-[360px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="absolute bottom-[-160px] left-[-160px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        <header className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-6 shadow-[0_0_55px_rgba(34,211,238,0.08)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <Link
                href={`/restaurants/${id}`}
                className="text-sm font-bold text-slate-400 hover:text-white"
              >
                ← Voltar ao dashboard
              </Link>

              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                MesaLink OS · Floor Control
              </p>

              <h1 className="mt-3 text-5xl font-black tracking-[-0.05em]">
                Mesas
              </h1>

              <p className="mt-3 text-slate-400">{restaurant.name}</p>
            </div>

            <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200">
              Gestão da sala
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Total de mesas" value={restaurant.tables.length} />
          <StatCard label="Lugares" value={totalCapacity} />
          <StatCard label="Livres agora" value={freeTables} tone="green" />
          <StatCard label="Reservadas" value={reservedTables} tone="yellow" />
          <StatCard label="Sentadas" value={seatedTables} tone="blue" />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
          <form
            action={createTable}
            className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-6 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
              Nova mesa
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Adicionar mesa
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Crie mesas com número e capacidade para o sistema atribuir
              reservas automaticamente.
            </p>

            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Número da mesa
                </span>

                <input
                  name="number"
                  type="number"
                  placeholder="Ex: 1"
                  className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Capacidade
                </span>

                <input
                  name="capacity"
                  type="number"
                  placeholder="Ex: 4"
                  className="h-12 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  required
                />
              </label>

              <button className="h-12 w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 font-black text-white shadow-[0_0_35px_rgba(34,211,238,0.22)] transition hover:scale-[1.02]">
                Adicionar Mesa
              </button>
            </div>
          </form>

          <section className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-6 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Sala
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Mapa de mesas
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 text-xs font-bold">
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
                    className={`group relative overflow-hidden rounded-[30px] border p-5 transition duration-300 hover:-translate-y-1 ${
                      status === "FREE"
                        ? "border-green-400/20 bg-green-400/10"
                        : status === "CONFIRMED"
                        ? "border-yellow-400/20 bg-yellow-400/10"
                        : status === "SEATED"
                        ? "border-cyan-400/20 bg-cyan-400/10"
                        : "border-slate-400/20 bg-white/[0.04]"
                    }`}
                  >
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                      <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>

                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-5xl font-black tracking-[-0.05em]">
                          Mesa {table.number}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
                          {table.capacity} lugares
                        </p>
                      </div>

                      <StatusDot status={status} />
                    </div>

                    <div className="relative mt-5">
                      <StatusLabel status={status} />

                      {table.currentReservation && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-[#020617]/60 p-4">
                          <p className="font-black">
                            {table.currentReservation.customerName}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
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
                <p className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-5 text-slate-400">
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
      ? "text-cyan-300"
      : "text-cyan-300";

  return (
    <div className="rounded-[24px] border border-cyan-300/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "FREE"
      ? "bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.9)]"
      : status === "CONFIRMED"
      ? "bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.9)]"
      : status === "SEATED"
      ? "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]"
      : "bg-slate-400";

  return <span className={`h-5 w-5 rounded-full ${color}`} />;
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
      ? "border-green-400/20 bg-green-400/10 text-green-300"
      : status === "CONFIRMED"
      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
      : status === "SEATED"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
      : "border-slate-400/20 bg-slate-400/10 text-slate-300";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-black ${className}`}>
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
      ? "bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]"
      : color === "yellow"
      ? "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]"
      : "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]";

  return (
    <div className="flex items-center gap-2 text-slate-400">
      <span className={`h-2.5 w-2.5 rounded-full ${bg}`} />
      {label}
    </div>
  );
}