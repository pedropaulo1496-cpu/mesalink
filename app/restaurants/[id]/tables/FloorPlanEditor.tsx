"use client";

import { useMemo, useRef, useState } from "react";

type FloorTable = {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  shape: string;
  mergeGroupId: string | null;
  currentStatus: string;
  currentReservation: {
    customerName: string;
    guests: number;
    date: Date | string;
  } | null;
};

export default function FloorPlanEditor({
  restaurantId,
  tables,
  saveFloorPlan,
}: {
  restaurantId: string;
  tables: FloorTable[];
  saveFloorPlan: (formData: FormData) => void;
}) {
  const [items, setItems] = useState(tables);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const groupedTables = useMemo(() => {
    return items.filter((table) => table.mergeGroupId);
  }, [items]);

  function getRelativePoint(event: React.PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    table: FloorTable
  ) {
    const point = getRelativePoint(event);

    setDragging({
      id: table.id,
      offsetX: point.x - table.x,
      offsetY: point.y - table.y,
      startX: point.x,
      startY: point.y,
      moved: false,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;

    const point = getRelativePoint(event);
    const distance = Math.hypot(point.x - dragging.startX, point.y - dragging.startY);

    setDragging((current) =>
      current ? { ...current, moved: current.moved || distance > 6 } : current
    );

    const nextX = Math.max(20, Math.min(point.x - dragging.offsetX, 790));
    const nextY = Math.max(20, Math.min(point.y - dragging.offsetY, 470));

    setItems((current) =>
      current.map((table) =>
        table.id === dragging.id ? { ...table, x: nextX, y: nextY } : table
      )
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;

    const active = items.find((table) => table.id === dragging.id);

    if (!active) {
      setDragging(null);
      return;
    }

    if (!dragging.moved) {
      setItems((current) =>
        current.map((table) =>
          table.id === active.id
            ? {
                ...table,
                shape: table.shape === "round" ? "square" : "round",
              }
            : table
        )
      );

      setDragging(null);
      return;
    }

    const nearest = items
      .filter((table) => table.id !== active.id)
      .map((table) => ({
        table,
        distance: Math.hypot(table.x - active.x, table.y - active.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest && nearest.distance < 85) {
      const groupId =
        nearest.table.mergeGroupId || active.mergeGroupId || `group-${nearest.table.id}`;

      setItems((current) =>
        current.map((table) => {
          if (table.id === nearest.table.id) {
            return { ...table, mergeGroupId: groupId };
          }

          if (table.id === active.id) {
            return {
              ...table,
              x: nearest.table.x + 72,
              y: nearest.table.y,
              mergeGroupId: groupId,
            };
          }

          return table;
        })
      );
    }

    setDragging(null);
  }

  function separateGroups() {
    setItems((current) =>
      current.map((table) => ({
        ...table,
        mergeGroupId: null,
      }))
    );
  }

  const layoutValue = JSON.stringify(
    items.map((table) => ({
      id: table.id,
      x: table.x,
      y: table.y,
      shape: table.shape,
      mergeGroupId: table.mergeGroupId,
    }))
  );

  return (
    <section className="rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl lg:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Sala
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Floor plan
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {items.length} mesas · {groupedTables.length} mesas em grupos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={separateGroups}
            className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300/50"
          >
            Separar grupos
          </button>

          <form action={saveFloorPlan}>
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="layout" value={layoutValue} />

            <button className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-2 text-xs font-black text-black shadow-[0_0_35px_rgba(96,165,250,0.3)] hover:opacity-90">
              Guardar layout
            </button>
          </form>
        </div>
      </div>

      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        className="relative h-[560px] overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#020617]/80"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="absolute left-5 top-5 rounded-full border border-cyan-300/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-500">
          Entrada
        </div>

        <div className="absolute bottom-5 right-5 rounded-full border border-cyan-300/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-500">
          Bar / Cozinha
        </div>

        {items.map((table) => (
          <div
            key={table.id}
            onPointerDown={(event) => handlePointerDown(event, table)}
            onPointerUp={handlePointerUp}
            className={`absolute flex h-[72px] w-[72px] touch-none select-none flex-col items-center justify-center border text-center shadow-[0_0_28px_rgba(34,211,238,0.12)] transition ${
              table.shape === "round" ? "rounded-full" : "rounded-2xl"
            } ${
              table.currentStatus === "FREE"
                ? "border-green-300/25 bg-green-400/15"
                : table.currentStatus === "CONFIRMED"
                ? "border-yellow-300/25 bg-yellow-400/15"
                : table.currentStatus === "SEATED"
                ? "border-cyan-300/25 bg-cyan-400/15"
                : "border-slate-300/20 bg-white/10"
            } ${
              table.mergeGroupId
                ? "ring-2 ring-violet-300/50"
                : ""
            }`}
            style={{
              left: table.x,
              top: table.y,
            }}
          >
            <p className="text-base font-black text-white">M{table.number}</p>
            <p className="text-[10px] font-bold text-slate-300">
              {table.capacity} pax
            </p>

            {table.currentReservation && (
              <div className="absolute -bottom-8 left-1/2 w-32 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-[#020617] px-2 py-1 text-[10px] font-bold text-cyan-200">
                {table.currentReservation.customerName}
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-2xl font-black text-white">Sem mesas</p>
              <p className="mt-2 text-sm text-slate-400">
                Crie mesas em massa e comece a desenhar a sala.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
