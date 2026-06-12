import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import FloorPlanEditor from "./FloorPlanEditor";

async function createTables(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const startNumber = Number(formData.get("startNumber") || 1);
  const quantity = Number(formData.get("quantity") || 1);
  const capacity = Number(formData.get("capacity") || 2);
  const shape = String(formData.get("shape") || "square");

  const safeQuantity = Math.max(1, Math.min(quantity, 60));
  const safeCapacity = Math.max(1, Math.min(capacity, 30));

  await prisma.table.createMany({
    data: Array.from({ length: safeQuantity }).map((_, index) => {
      const number = startNumber + index;
      const column = index % 6;
      const row = Math.floor(index / 6);

      return {
        restaurantId,
        number,
        capacity: safeCapacity,
        shape,
        x: 70 + column * 120,
        y: 80 + row * 110,
      };
    }),
    skipDuplicates: true,
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

async function saveFloorPlan(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const layout = String(formData.get("layout") || "[]");

  const tables = JSON.parse(layout) as {
    id: string;
    x: number;
    y: number;
    shape: string;
    mergeGroupId: string | null;
  }[];

  await prisma.$transaction(
    tables.map((table) =>
      prisma.table.updateMany({
        where: {
          id: table.id,
          restaurantId,
        },
        data: {
          x: Math.round(table.x),
          y: Math.round(table.y),
          shape: table.shape === "round" ? "round" : "square",
          mergeGroupId: table.mergeGroupId,
        },
      })
    )
  );

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

  const tablesWithStatus = restaurant.tables.map((table, index) => {
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

    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      x: table.x ?? 70 + (index % 6) * 120,
      y: table.y ?? 80 + Math.floor(index / 6) * 110,
      shape: table.shape ?? "square",
      mergeGroupId: table.mergeGroupId ?? null,
      currentStatus: activeReservation?.status ?? "FREE",
      currentReservation: activeReservation
        ? {
            customerName: activeReservation.customerName,
            guests: activeReservation.guests,
            date: activeReservation.date,
          }
        : null,
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

  const nextTableNumber =
    restaurant.tables.length > 0
      ? Math.max(...restaurant.tables.map((table) => table.number)) + 1
      : 1;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] p-4 text-white lg:p-8">
      <Background />

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
                Mapa da sala
              </h1>

              <p className="mt-3 text-slate-400">{restaurant.name}</p>
            </div>

            <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200">
              Arraste · Clique para redonda · Aproxime para juntar
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

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <form
              action={createTables}
              className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-6 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Criar em massa
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Adicionar mesas
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Crie várias mesas de uma vez e organize-as depois no mapa.
              </p>

              <input type="hidden" name="restaurantId" value={restaurant.id} />

              <div className="mt-6 space-y-4">
                <Field label="Primeiro número">
                  <input
                    name="startNumber"
                    type="number"
                    defaultValue={nextTableNumber}
                    className="input-ai h-12"
                    required
                  />
                </Field>

                <Field label="Quantidade de mesas">
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="60"
                    defaultValue={6}
                    className="input-ai h-12"
                    required
                  />
                </Field>

                <Field label="Capacidade por mesa">
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    max="30"
                    defaultValue={2}
                    className="input-ai h-12"
                    required
                  />
                </Field>

                <Field label="Formato inicial">
                  <select name="shape" defaultValue="square" className="input-ai h-12">
                    <option value="square">Quadrada</option>
                    <option value="round">Redonda</option>
                  </select>
                </Field>

                <button className="h-12 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 font-black text-black shadow-[0_0_40px_rgba(96,165,250,0.3)] transition hover:opacity-90">
                  Criar mesas
                </button>
              </div>
            </form>

            <div className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                Como usar
              </p>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                <p>• Arraste uma mesa para mudar a posição.</p>
                <p>• Clique numa mesa para alternar entre quadrada e redonda.</p>
                <p>• Aproxime duas mesas para elas colarem em grupo.</p>
                <p>• Clique em guardar para gravar o mapa da sala.</p>
              </div>
            </div>
          </aside>

          <FloorPlanEditor
            restaurantId={restaurant.id}
            tables={tablesWithStatus}
            saveFloorPlan={saveFloorPlan}
          />
        </section>
      </div>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px]" />
      <div className="absolute right-[-160px] top-[360px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px]" />
      <div className="absolute bottom-[-160px] left-[-160px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-[100px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.14),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>
      {children}
    </label>
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
