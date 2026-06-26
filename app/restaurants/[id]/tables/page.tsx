import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import FloorPlanEditor from "./FloorPlanEditor";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";
import RestaurantSidebar from "@/components/RestaurantSidebar";

async function createTables(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const startNumber = Number(formData.get("startNumber") || 1);
  const quantity = Number(formData.get("quantity") || 1);
  const capacity = Number(formData.get("capacity") || 2);
  const shape = String(formData.get("shape") || "square");
  const roomId = String(formData.get("roomId") || "");

  const safeQuantity = Math.max(1, Math.min(quantity, 60));
  const safeCapacity = Math.max(1, Math.min(capacity, 30));
  const safeShape = shape === "round" ? "round" : "square";

  await prisma.$transaction(
    Array.from({ length: safeQuantity }).map((_, index) => {
      const number = startNumber + index;
      const column = index % 8;
      const row = Math.floor(index / 8);

      return prisma.$executeRaw`
        INSERT INTO "Table"
  ("id", "number", "capacity", "restaurantId", "roomId", "shape", "x", "y", "createdAt")
VALUES
  (
    gen_random_uuid()::text,
    ${number},
    ${safeCapacity},
    ${restaurantId},
    ${roomId || null},
    ${safeShape},
    ${180 + column * 126},
    ${130 + row * 122},
    NOW()
  )
      `;
    }),
  );

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
      prisma.$executeRaw`
        UPDATE "Table"
        SET
          "x" = ${Math.round(table.x)},
          "y" = ${Math.round(table.y)},
          "shape" = ${table.shape === "round" ? "round" : "square"},
          "mergeGroupId" = ${table.mergeGroupId}
        WHERE
          "id" = ${table.id}
          AND "restaurantId" = ${restaurantId}
      `,
    ),
  );

  redirect(`/restaurants/${restaurantId}/tables`);
}

async function assignReservationToTable(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));
  const tableId = String(formData.get("tableId"));

  await prisma.reservation.updateMany({
    where: { id: reservationId, restaurantId },
    data: { tableId, status: "CONFIRMED" },
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

async function unassignReservation(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationId = String(formData.get("reservationId"));

  await prisma.reservation.updateMany({
    where: { id: reservationId, restaurantId },
    data: { tableId: null },
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

export default async function TablesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
  floorRooms: {
    include: {
      tables: {
        include: { reservations: true },
        orderBy: { number: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
  tables: {
    include: { reservations: true },
    orderBy: { number: "asc" },
  },
  reservations: {
    orderBy: { date: "asc" },
  },
},
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado.
      </main>
    );
  }

  const now = new Date();
  const today = new Date();

  function isToday(date: Date | string) {
    const reservationDate = new Date(date);

    return (
      reservationDate.getDate() === today.getDate() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getFullYear() === today.getFullYear()
    );
  }

  const inactiveStatuses = ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"];

  const todayReservations = restaurant.reservations
    .filter((reservation) => isToday(reservation.date))
    .filter((reservation) => !inactiveStatuses.includes(String(reservation.status)))
    .map((reservation) => {
      const start = new Date(reservation.date);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 120);

      return {
        id: reservation.id,
        customerName: reservation.customerName,
        guests: reservation.guests,
        date: reservation.date,
        tableId: reservation.tableId,
        status: reservation.status,
        durationMinutes: 120,
        startTime: start.toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        endTime: end.toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

  const tablesWithStatus = restaurant.tables.map((table, index) => {
    const tableWithFloorPlan = table as typeof table & {
      x?: number | null;
      y?: number | null;
      shape?: string | null;
      mergeGroupId?: string | null;
    };

    const tableTodayReservations = todayReservations.filter(
      (reservation) => reservation.tableId === table.id,
    );

    const activeReservation = tableTodayReservations.find((reservation) => {
      const start = new Date(reservation.date);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + reservation.durationMinutes);

      return now >= start && now < end;
    });

    return {
  id: table.id,
  number: table.number,
  capacity: table.capacity,
  roomId: table.roomId,
  x: tableWithFloorPlan.x ?? 180 + (index % 8) * 126,
  y: tableWithFloorPlan.y ?? 130 + Math.floor(index / 8) * 122,
  shape: tableWithFloorPlan.shape ?? "square",
  mergeGroupId: tableWithFloorPlan.mergeGroupId ?? null,
  currentStatus: activeReservation?.status ?? "FREE",
  reservationsToday: tableTodayReservations,
};
  });

  const freeTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "FREE",
  ).length;

  const reservedTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "CONFIRMED",
  ).length;

  const seatedTables = tablesWithStatus.filter(
    (table) => table.currentStatus === "SEATED",
  ).length;

  const totalCapacity = restaurant.tables.reduce(
    (total, table) => total + table.capacity,
    0,
  );

  const nextTableNumber =
    restaurant.tables.length > 0
      ? Math.max(...restaurant.tables.map((table) => table.number)) + 1
      : 1;

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
  active="Sala & Mesas"
/>

        <section className="min-w-0 px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                Sala
              </p>

              <h1 className="mt-1 text-4xl font-black tracking-[-0.07em] sm:text-5xl">
                Mapa de mesas
              </h1>

              <p className="mt-2 text-sm font-semibold text-[#6B6258]">
                {restaurant.name} · {restaurant.tables.length} mesas ·{" "}
                {totalCapacity} lugares
              </p>
            </div>

            <form
              action={createTables}
              className="flex flex-wrap items-end gap-2 rounded-[24px] border border-[#E1D0B8] bg-white/90 p-2.5 shadow-[0_14px_44px_rgba(80,55,30,0.045)]"
            >
              <input type="hidden" name="restaurantId" value={restaurant.id} />

              <MiniField label="Início">
                <input
                  name="startNumber"
                  type="number"
                  defaultValue={nextTableNumber}
                  className="h-10 w-20 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-sm font-semibold outline-none"
                  required
                />
              </MiniField>

              <MiniField label="Qtd.">
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="60"
                  defaultValue={6}
                  className="h-10 w-20 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-sm font-semibold outline-none"
                  required
                />
              </MiniField>

              <MiniField label="Cap.">
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={2}
                  className="h-10 w-20 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-sm font-semibold outline-none"
                  required
                />
              </MiniField>

              <MiniField label="Formato">
                <select
                  name="shape"
                  defaultValue="square"
                  className="h-10 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-sm font-semibold outline-none"
                >
                  <option value="square">Quadrada</option>
                  <option value="round">Redonda</option>
                </select>
              </MiniField>

              <MiniField label="Sala">
  <select
    name="roomId"
    className="h-10 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-3 text-sm font-semibold outline-none"
  >
    {restaurant.floorRooms.map((room) => (
      <option key={room.id} value={room.id}>
        {room.name}
      </option>
    ))}
  </select>
</MiniField>

              <button className="h-10 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
                Criar
              </button>
            </form>
          </header>

          <div className="mt-4">
            <FloorPlanEditor
  restaurantId={restaurant.id}
  rooms={restaurant.floorRooms}
  tables={tablesWithStatus}
  reservations={todayReservations}
  saveFloorPlan={saveFloorPlan}
  assignReservationToTable={assignReservationToTable}
  unassignReservation={unassignReservation}
  createRoom={createRoom}
  moveTableToRoom={moveTableToRoom}
  deleteTable={deleteTable}
/>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "yellow" | "dark";
}) {
  const dot =
    tone === "green"
      ? "bg-[#86A969]"
      : tone === "yellow"
        ? "bg-[#FACC15]"
        : tone === "dark"
          ? "bg-[#16120E]"
          : "bg-[#DCC9AE]";

  return (
    <div className="flex items-center justify-between rounded-[22px] border border-[#E1D0B8] bg-white px-4 py-3 shadow-[0_14px_44px_rgba(80,55,30,0.035)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.055em]">
          {value}
        </p>
      </div>

      <span className={`h-3.5 w-3.5 rounded-full ${dot}`} />
    </div>
  );
}


async function createRoom(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "Nova sala").trim();

  await prisma.floorRoom.create({
    data: { restaurantId, name },
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

async function moveTableToRoom(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const tableId = String(formData.get("tableId"));
  const roomId = String(formData.get("roomId"));

  await prisma.table.update({
    where: { id: tableId },
    data: { roomId, mergeGroupId: null },
  });

  redirect(`/restaurants/${restaurantId}/tables`);
}

async function deleteTable(formData: FormData) {
  "use server";

  const tableId = String(formData.get("tableId"));

  await prisma.reservation.updateMany({
    where: { tableId },
    data: { tableId: null },
  });

  await prisma.table.delete({
    where: { id: tableId },
  });
}
