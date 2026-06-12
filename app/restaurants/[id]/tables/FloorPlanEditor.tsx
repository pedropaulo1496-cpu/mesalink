"use client";

import { useMemo, useRef, useState } from "react";

type FloorReservation = {
  id: string;
  customerName: string;
  guests: number;
  date: Date | string;
  tableId: string | null;
  status: string | null;
  durationMinutes: number;
  startTime: string;
  endTime: string;
};

type FloorTable = {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  shape: string;
  mergeGroupId: string | null;
  currentStatus: string;
  reservationsToday: FloorReservation[];
};

const MAP_WIDTH = 1600;
const MAP_HEIGHT = 1000;
const TABLE_SIZE = 72;

export default function FloorPlanEditor({
  restaurantId,
  tables,
  reservations,
  saveFloorPlan,
  assignReservationToTable,
  unassignReservation,
}: {
  restaurantId: string;
  tables: FloorTable[];
  reservations: FloorReservation[];
  saveFloorPlan: (formData: FormData) => void;
  assignReservationToTable: (formData: FormData) => void;
  unassignReservation: (formData: FormData) => void;
}) {
  const [items, setItems] = useState(tables);
  const [zoom, setZoom] = useState(0.75);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === selectedReservationId
  );

  const selectedTable = items.find((table) => table.id === selectedTableId);

  const groupedTables = useMemo(() => {
    return items.filter((table) => table.mergeGroupId);
  }, [items]);

  function getRelativePoint(event: React.PointerEvent<HTMLDivElement>) {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (event.clientX - rect.left) / zoom,
      y: (event.clientY - rect.top) / zoom,
    };
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    table: FloorTable
  ) {
    event.preventDefault();

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
    const distance = Math.hypot(
      point.x - dragging.startX,
      point.y - dragging.startY
    );

    setDragging((current) =>
      current ? { ...current, moved: current.moved || distance > 6 } : current
    );

    const nextX = Math.max(
      20,
      Math.min(point.x - dragging.offsetX, MAP_WIDTH - TABLE_SIZE - 20)
    );

    const nextY = Math.max(
      20,
      Math.min(point.y - dragging.offsetY, MAP_HEIGHT - TABLE_SIZE - 20)
    );

    setItems((current) =>
      current.map((table) =>
        table.id === dragging.id ? { ...table, x: nextX, y: nextY } : table
      )
    );
  }

  function handlePointerUp() {
    if (!dragging) return;

    const active = items.find((table) => table.id === dragging.id);

    if (!active) {
      setDragging(null);
      return;
    }

    if (!dragging.moved) {
      if (selectedReservationId) {
        setSelectedTableId(active.id);
        setDragging(null);
        return;
      }

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

    if (nearest && nearest.distance < 90) {
      const groupId =
        nearest.table.mergeGroupId ||
        active.mergeGroupId ||
        `group-${nearest.table.id}`;

      setItems((current) =>
        current.map((table) => {
          if (table.id === nearest.table.id) {
            return { ...table, mergeGroupId: groupId };
          }

          if (table.id === active.id) {
            return {
              ...table,
              x: Math.min(nearest.table.x + TABLE_SIZE + 8, MAP_WIDTH - 120),
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

  function centerMap() {
    const viewport = viewportRef.current;

    if (!viewport) return;

    viewport.scrollTo({
      left: Math.max((MAP_WIDTH * zoom - viewport.clientWidth) / 2, 0),
      top: Math.max((MAP_HEIGHT * zoom - viewport.clientHeight) / 2, 0),
      behavior: "smooth",
    });
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
    <section className="min-w-0 rounded-[32px] border border-cyan-300/10 bg-white/[0.04] p-4 shadow-[0_0_55px_rgba(34,211,238,0.06)] backdrop-blur-xl sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
            Sala
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            Floor plan
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {items.length} mesas · {groupedTables.length} mesas em grupos
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border border-cyan-300/20 bg-white/[0.04] p-1">
            {[0.45, 0.6, 0.75, 1].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setZoom(value)}
                className={`rounded-full px-3 py-1 text-xs font-black transition ${
                  zoom === value
                    ? "bg-cyan-300 text-black"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {Math.round(value * 100)}%
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={centerMap}
            className="rounded-full border border-cyan-300/20 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-200 hover:border-cyan-300/50"
          >
            Centrar
          </button>

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

      <div className="mb-4 grid gap-3 xl:grid-cols-[1fr_240px]">
        <div className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Associar reserva
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_150px]">
            <select
              value={selectedReservationId}
              onChange={(event) => {
                const reservationId = event.target.value;
                const reservation = reservations.find(
                  (item) => item.id === reservationId
                );

                setSelectedReservationId(reservationId);
                setSelectedTableId("");
                setDurationMinutes(reservation?.durationMinutes ?? 120);
              }}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617] px-4 text-sm font-bold text-white outline-none"
            >
              <option value="">Escolher reserva de hoje</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.startTime} · {reservation.customerName} ·{" "}
                  {reservation.guests} pax
                  {reservation.tableId ? " · já associada" : ""}
                </option>
              ))}
            </select>

            <select
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className="h-11 rounded-2xl border border-cyan-300/10 bg-[#020617] px-4 text-sm font-bold text-white outline-none"
            >
              <option value={60}>1h</option>
              <option value={90}>1h30</option>
              <option value={120}>2h</option>
              <option value={150}>2h30</option>
              <option value={180}>3h</option>
              <option value={240}>4h</option>
            </select>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Depois de escolher a reserva, clique numa mesa no mapa. Pode haver
            várias reservas na mesma mesa ao longo do dia.
          </p>
        </div>

        <form
          action={assignReservationToTable}
          className="rounded-[24px] border border-cyan-300/10 bg-[#020617]/70 p-4"
        >
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="reservationId" value={selectedReservationId} />
          <input type="hidden" name="tableId" value={selectedTableId} />
          <input type="hidden" name="durationMinutes" value={durationMinutes} />

          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Destino
          </p>

          <p className="mt-2 text-sm font-bold text-white">
            {selectedReservation
              ? `${selectedReservation.customerName} → ${
                  selectedTable ? `Mesa ${selectedTable.number}` : "escolha mesa"
                }`
              : "Escolha reserva"}
          </p>

          <button
            disabled={!selectedReservationId || !selectedTableId}
            className="mt-4 h-11 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            Associar
          </button>
        </form>
      </div>

      <div className="relative w-full max-w-full overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#020617]/80">
        <div
          ref={viewportRef}
          className="floor-scroll h-[62vh] max-h-[680px] min-h-[420px] w-full overflow-auto overscroll-contain"
        >
          <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            className="relative"
            style={{
              width: MAP_WIDTH * zoom,
              height: MAP_HEIGHT * zoom,
            }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left overflow-hidden"
              style={{
                width: MAP_WIDTH,
                height: MAP_HEIGHT,
                transform: `scale(${zoom})`,
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

              <div className="absolute left-8 top-8 rounded-full border border-cyan-300/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-500">
                Entrada
              </div>

              <div className="absolute bottom-8 right-8 rounded-full border border-cyan-300/10 bg-black/30 px-3 py-1 text-xs font-bold text-slate-500">
                Bar / Cozinha
              </div>

              <div className="absolute left-[120px] top-[160px] h-[680px] w-[1px] bg-cyan-300/10" />
              <div className="absolute right-[220px] top-[120px] h-[760px] w-[1px] bg-violet-300/10" />
              <div className="absolute bottom-[180px] left-[160px] h-[1px] w-[1150px] bg-cyan-300/10" />

              {items.map((table) => (
                <div
                  key={table.id}
                  onPointerDown={(event) => handlePointerDown(event, table)}
                  onPointerUp={handlePointerUp}
                  className={`absolute flex h-[72px] w-[72px] touch-none select-none flex-col items-center justify-center border text-center shadow-[0_0_28px_rgba(34,211,238,0.12)] transition ${
                    table.shape === "round" ? "rounded-full" : "rounded-2xl"
                  } ${
                    selectedTableId === table.id
                      ? "border-violet-300 bg-violet-400/20 ring-4 ring-violet-300/30"
                      : table.currentStatus === "FREE"
                      ? "border-green-300/25 bg-green-400/15"
                      : table.currentStatus === "CONFIRMED"
                      ? "border-yellow-300/25 bg-yellow-400/15"
                      : table.currentStatus === "SEATED"
                      ? "border-cyan-300/25 bg-cyan-400/15"
                      : "border-slate-300/20 bg-white/10"
                  } ${table.mergeGroupId ? "ring-2 ring-violet-300/50" : ""}`}
                  style={{
                    left: table.x,
                    top: table.y,
                  }}
                >
                  <p className="text-base font-black text-white">
                    M{table.number}
                  </p>
                  <p className="text-[10px] font-bold text-slate-300">
                    {table.capacity} pax
                  </p>

                  {table.reservationsToday.length > 0 && (
                    <div className="absolute -bottom-16 left-1/2 w-36 -translate-x-1/2 space-y-1">
                      {table.reservationsToday.slice(0, 2).map((reservation) => (
                        <div
                          key={reservation.id}
                          className="rounded-full border border-cyan-300/20 bg-[#020617] px-2 py-1 text-[10px] font-bold text-cyan-100"
                        >
                          {reservation.startTime}-{reservation.endTime}
                        </div>
                      ))}

                      {table.reservationsToday.length > 2 && (
                        <div className="rounded-full border border-violet-300/20 bg-[#020617] px-2 py-1 text-[10px] font-bold text-violet-200">
                          +{table.reservationsToday.length - 2}
                        </div>
                      )}
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
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full border border-cyan-300/10 bg-black/40 px-3 py-1 text-[11px] font-bold text-slate-400 backdrop-blur">
          Navegue dentro deste retângulo · Zoom {Math.round(zoom * 100)}%
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        O mapa fica preso dentro da caixa. Use scroll horizontal/vertical dentro
        do retângulo para navegar pela sala.
      </p>

      {selectedReservation && selectedTable && (
        <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
          <p className="text-sm font-black text-white">
            Pronto para associar: {selectedReservation.customerName} à Mesa{" "}
            {selectedTable.number}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Duração: {durationMinutes} minutos. A hora de saída será calculada
            automaticamente.
          </p>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Reservas associadas
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {reservations
            .filter((reservation) => reservation.tableId)
            .map((reservation) => {
              const table = items.find((item) => item.id === reservation.tableId);

              return (
                <form
                  key={reservation.id}
                  action={unassignReservation}
                  className="rounded-2xl border border-cyan-300/10 bg-white/[0.03] p-3"
                >
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="reservationId" value={reservation.id} />

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">
                        {reservation.customerName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {reservation.startTime}-{reservation.endTime} ·{" "}
                        {table ? `Mesa ${table.number}` : "Mesa"}
                      </p>
                    </div>

                    <button className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-black text-red-300">
                      Remover
                    </button>
                  </div>
                </form>
              );
            })}

          {reservations.filter((reservation) => reservation.tableId).length === 0 && (
            <p className="text-sm text-slate-500">
              Ainda não há reservas associadas a mesas.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
