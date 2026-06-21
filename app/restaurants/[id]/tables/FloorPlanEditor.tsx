"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
  roomId?: string | null;
};

type Room = {
  id: string;
  name: string;
};

const MAP_WIDTH = 1400;
const MAP_HEIGHT = 840;
const TABLE_SIZE = 120;

export default function FloorPlanEditor({
  restaurantId,
  rooms,
  tables,
  reservations,
  saveFloorPlan,
  assignReservationToTable,
  unassignReservation,
  createRoom,
  moveTableToRoom,
  deleteTable,
}: {
  restaurantId: string;
  rooms: Room[];
  tables: FloorTable[];
  reservations: FloorReservation[];
  saveFloorPlan: (formData: FormData) => void;
  assignReservationToTable: (formData: FormData) => void;
  unassignReservation: (formData: FormData) => void;
  createRoom: (formData: FormData) => void;
  moveTableToRoom: (formData: FormData) => void;
  deleteTable: (formData: FormData) => void;
}) {
  const safeRooms = rooms.length > 0 ? rooms : [{ id: "main", name: "Sala principal" }];
  const [activeRoomId, setActiveRoomId] = useState(safeRooms[0].id);
  const [items, setItems] = useState(tables);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableToDelete, setTableToDelete] = useState<FloorTable | null>(null);
  const [, startTransition] = useTransition();

  const [dragging, setDragging] = useState<
    | {
        type: "table";
        id: string;
        offsetX: number;
        offsetY: number;
        startX: number;
        startY: number;
        moved: boolean;
      }
    | {
        type: "group";
        groupId: string;
        startX: number;
        startY: number;
        moved: boolean;
        originals: { id: string; x: number; y: number }[];
      }
    | null
  >(null);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const activeRoomTables = items.filter((table) =>
    table.roomId ? table.roomId === activeRoomId : activeRoomId === safeRooms[0].id,
  );

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === selectedReservationId,
  );

  const selectedTable = items.find((table) => table.id === selectedTableId);

  function confirmDeleteTable() {
    if (!tableToDelete) return;

    const formData = new FormData();
    formData.set("restaurantId", restaurantId);
    formData.set("tableId", tableToDelete.id);

    setItems((current) =>
      current.filter((table) => table.id !== tableToDelete.id),
    );

    setSelectedTableId("");
    setTableToDelete(null);

    startTransition(() => {
      deleteTable(formData);
    });
  }

  const groupedTables = useMemo(
    () => activeRoomTables.filter((table) => table.mergeGroupId),
    [activeRoomTables],
  );

  const assignedReservations = reservations.filter((reservation) => reservation.tableId);

  const totalCapacity = activeRoomTables.reduce(
    (total, table) => total + table.capacity,
    0,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" || !selectedTable) return;

      setTableToDelete(selectedTable);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTable]);

  function updateTableLocally(updater: (current: FloorTable[]) => FloorTable[]) {
    setItems((current) => updater(current));
  }

  function getRelativePoint(event: React.PointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleTablePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    table: FloorTable,
  ) {
    event.preventDefault();

    const point = getRelativePoint(event);

    setDragging({
      type: "table",
      id: table.id,
      offsetX: point.x - table.x,
      offsetY: point.y - table.y,
      startX: point.x,
      startY: point.y,
      moved: false,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleGroupPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    groupId: string,
  ) {
    event.preventDefault();

    const point = getRelativePoint(event);
    const groupTables = activeRoomTables.filter(
      (table) => table.mergeGroupId === groupId,
    );

    setDragging({
      type: "group",
      groupId,
      startX: point.x,
      startY: point.y,
      moved: false,
      originals: groupTables.map((table) => ({
        id: table.id,
        x: table.x,
        y: table.y,
      })),
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;

    const point = getRelativePoint(event);

    if (dragging.type === "table") {
      const distance = Math.hypot(
        point.x - dragging.startX,
        point.y - dragging.startY,
      );

      setDragging((current) =>
        current && current.type === "table"
          ? { ...current, moved: current.moved || distance > 6 }
          : current,
      );

      const nextX = Math.max(
        24,
        Math.min(point.x - dragging.offsetX, MAP_WIDTH - TABLE_SIZE - 24),
      );

      const nextY = Math.max(
        24,
        Math.min(point.y - dragging.offsetY, MAP_HEIGHT - TABLE_SIZE - 24),
      );

      updateTableLocally((current) =>
        current.map((table) =>
          table.id === dragging.id ? { ...table, x: nextX, y: nextY } : table,
        ),
      );

      return;
    }

    const deltaX = point.x - dragging.startX;
    const deltaY = point.y - dragging.startY;
    const distance = Math.hypot(deltaX, deltaY);

    setDragging((current) =>
      current && current.type === "group"
        ? { ...current, moved: current.moved || distance > 6 }
        : current,
    );

    updateTableLocally((current) =>
      current.map((table) => {
        const original = dragging.originals.find((item) => item.id === table.id);
        if (!original) return table;

        return {
          ...table,
          x: Math.max(24, Math.min(original.x + deltaX, MAP_WIDTH - TABLE_SIZE - 24)),
          y: Math.max(24, Math.min(original.y + deltaY, MAP_HEIGHT - TABLE_SIZE - 24)),
        };
      }),
    );
  }

  function handlePointerUp() {
    if (!dragging) return;

    if (dragging.type === "group") {
      if (!dragging.moved) {
        const firstTable = activeRoomTables.find(
          (table) => table.mergeGroupId === dragging.groupId,
        );
        if (firstTable) setSelectedTableId(firstTable.id);
      }

      setDragging(null);
      return;
    }

    const active = activeRoomTables.find((table) => table.id === dragging.id);

    if (!active) {
      setDragging(null);
      return;
    }

    if (!dragging.moved) {
      setSelectedTableId(active.id);

      if (!selectedReservationId) {
        updateTableLocally((current) =>
          current.map((table) =>
            table.id === active.id
              ? { ...table, shape: table.shape === "round" ? "square" : "round" }
              : table,
          ),
        );
      }

      setDragging(null);
      return;
    }

    const nearest = activeRoomTables
      .filter((table) => table.id !== active.id)
      .map((table) => ({
        table,
        distance: Math.hypot(table.x - active.x, table.y - active.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest && nearest.distance < 140) {
      const groupId =
        nearest.table.mergeGroupId ||
        active.mergeGroupId ||
        `group-${nearest.table.id}`;

      updateTableLocally((current) =>
        current.map((table) => {
          if (table.id === nearest.table.id) {
            return { ...table, mergeGroupId: groupId };
          }

          if (table.id === active.id) {
            return {
              ...table,
              x: nearest.table.x + TABLE_SIZE + 12,
              y: nearest.table.y,
              mergeGroupId: groupId,
            };
          }

          return table;
        }),
      );
    }

    setDragging(null);
  }

  function separateGroups() {
    updateTableLocally((current) =>
      current.map((table) =>
        table.roomId === activeRoomId || (!table.roomId && activeRoomId === safeRooms[0].id)
          ? { ...table, mergeGroupId: null }
          : table,
      ),
    );
  }

  function splitOneTable(tableId: string) {
    updateTableLocally((current) =>
      current.map((table) =>
        table.id === tableId ? { ...table, mergeGroupId: null } : table,
      ),
    );
  }


  function moveSelectedTableToRoom(roomId: string) {
    if (!selectedTable) return;

    const formData = new FormData();
    formData.set("restaurantId", restaurantId);
    formData.set("tableId", selectedTable.id);
    formData.set("roomId", roomId);

    setItems((current) =>
      current.map((table) =>
        table.id === selectedTable.id
          ? { ...table, roomId, mergeGroupId: null }
          : table,
      ),
    );

    setActiveRoomId(roomId);
    setSelectedTableId("");

    startTransition(() => {
      moveTableToRoom(formData);
    });
  }

  const layoutValue = JSON.stringify(
    items.map((table) => ({
      id: table.id,
      x: table.x,
      y: table.y,
      shape: table.shape,
      mergeGroupId: table.mergeGroupId,
    })),
  );

  function renderTables() {
    const renderedGroups = new Set<string>();

    return activeRoomTables.map((table) => {
      if (table.mergeGroupId) {
        if (renderedGroups.has(table.mergeGroupId)) return null;

        const groupTables = activeRoomTables
          .filter((item) => item.mergeGroupId === table.mergeGroupId)
          .sort((a, b) => a.number - b.number);

        renderedGroups.add(table.mergeGroupId);

        const minX = Math.min(...groupTables.map((item) => item.x));
        const minY = Math.min(...groupTables.map((item) => item.y));
        const capacity = groupTables.reduce((total, item) => total + item.capacity, 0);
        const groupReservations = groupTables.flatMap((item) => item.reservationsToday);
        const isSelected = groupTables.some((item) => item.id === selectedTableId);

        return (
          <button
            key={table.mergeGroupId}
            type="button"
            onPointerDown={(event) =>
              handleGroupPointerDown(event, table.mergeGroupId!)
            }
            onPointerUp={handlePointerUp}
            className={`absolute flex flex-col items-center justify-center rounded-[36px] border-2 border-dashed text-center shadow-[0_16px_34px_rgba(80,55,30,0.12)] transition ${
              isSelected
                ? "border-[#16120E] bg-[#EFE5D6] ring-4 ring-[#16120E]/10"
                : "border-[#F59E0B] bg-[#FFF7E6]"
            }`}
            style={{
              left: minX,
              top: minY,
              width: TABLE_SIZE * groupTables.length + 18,
              height: TABLE_SIZE,
            }}
          >
            <p className="text-2xl font-semibold text-[#16120E]">
              {groupTables.map((item) => item.number).join(" + ")}
            </p>
            <p className="text-xs text-[#6B6258]">{capacity} lugares</p>

            {groupReservations[0] && (
              <div className="mt-2 max-w-[80%] rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#16120E] shadow-sm">
                {groupReservations[0].customerName.split(" ")[0]} ·{" "}
                {groupReservations[0].startTime}
              </div>
            )}
          </button>
        );
      }

      const isSelected = selectedTableId === table.id;

      const statusClass = isSelected
        ? "border-[#16120E] bg-[#EFE5D6] ring-4 ring-[#16120E]/10"
        : table.currentStatus === "FREE"
          ? "border-[#DCC9AE] bg-[#F7F4EE]"
          : table.currentStatus === "CONFIRMED"
            ? "border-[#FACC15] bg-[#FFF1D0]"
            : table.currentStatus === "SEATED"
              ? "border-[#86A969] bg-[#ECF7EC]"
              : "border-[#DCC9AE] bg-white";

      const reservation = table.reservationsToday[0];

      return (
        <div
          key={table.id}
          onPointerDown={(event) => handleTablePointerDown(event, table)}
          onPointerUp={handlePointerUp}
          onDoubleClick={() => splitOneTable(table.id)}
          className={`absolute flex h-[120px] w-[120px] touch-none select-none flex-col items-center justify-center border-2 text-center shadow-[0_16px_34px_rgba(80,55,30,0.1)] transition ${
            table.shape === "round" ? "rounded-full" : "rounded-[32px]"
          } ${statusClass}`}
          style={{ left: table.x, top: table.y }}
        >
          <span className="absolute right-3 top-2 text-[11px] text-[#9B6F3B]">
            ⋮⋮
          </span>

          <p className="text-2xl font-semibold leading-none text-[#16120E]">
            {table.number}
          </p>

          <p className="mt-1 text-[11px] text-[#6B6258]">
            {table.capacity} lugares
          </p>

          {reservation && (
            <div className="mt-2 max-w-[92px] rounded-full bg-white px-2 py-1 text-[10px] font-semibold leading-tight text-[#16120E] shadow-sm">
              <span className="block truncate">
                {reservation.customerName.split(" ")[0]}
              </span>
              <span className="block text-[9px] text-[#6B6258]">
                {reservation.startTime}
              </span>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <section className="rounded-[34px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Reservas de hoje
          </p>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {reservations.map((reservation) => (
              <button
                key={reservation.id}
                type="button"
                onClick={() => {
                  setSelectedReservationId(reservation.id);
                  setSelectedTableId(reservation.tableId || "");
                }}
                className={`min-w-[210px] rounded-2xl border px-4 py-3 text-left transition ${
                  selectedReservationId === reservation.id
                    ? "border-[#16120E] bg-white ring-2 ring-[#16120E]"
                    : "border-[#E8DCCB] bg-white hover:border-[#C8A56A]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {reservation.customerName}
                    </p>
                    <p className="mt-1 text-xs text-[#6B6258]">
                      {reservation.startTime} · {reservation.guests} pessoas
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      reservation.tableId
                        ? "bg-[#ECF7EC] text-[#3F6A4D]"
                        : "bg-[#FFF1D0] text-[#9B6F3B]"
                    }`}
                  >
                    {reservation.tableId ? "Mesa" : "Sem"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form
          action={assignReservationToTable}
          className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4"
        >
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="reservationId" value={selectedReservationId} />
          <input type="hidden" name="tableId" value={selectedTableId} />

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Associação rápida
          </p>

          <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
            <MiniBox
              title={selectedReservation?.customerName || "Reserva"}
              subtitle={
                selectedReservation
                  ? `${selectedReservation.startTime} · ${selectedReservation.guests} pessoas`
                  : "Escolha reserva"
              }
            />

            <span className="text-xl text-[#9B6F3B]">→</span>

            <MiniBox
              title={selectedTable ? `Mesa ${selectedTable.number}` : "Mesa"}
              subtitle={
                selectedTable
                  ? `${selectedTable.capacity} lugares`
                  : "Clique mapa"
              }
            />
          </div>

          <button
            disabled={!selectedReservationId || !selectedTableId}
            className="mt-3 h-10 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:bg-[#B8B1A8]"
          >
            Associar
          </button>
        </form>
      </div>

      <div className="mt-4 rounded-[28px] border border-[#E1D0B8] bg-[#FFFDF8] p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {safeRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id);
                  setSelectedTableId("");
                }}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeRoomId === room.id
                    ? "border-[#16120E] bg-[#16120E] text-white"
                    : "border-[#E1D0B8] bg-white text-[#16120E] hover:bg-[#FFF9F0]"
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          <form action={createRoom} className="flex flex-wrap gap-2">
            <input type="hidden" name="restaurantId" value={restaurantId} />

            <input
              name="name"
              placeholder="Nova sala"
              className="h-10 rounded-full border border-[#E1D0B8] bg-white px-4 text-sm outline-none"
            />

            <button className="h-10 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">
              + Sala
            </button>
          </form>
        </div>

        {selectedTable && (
          <div className="mt-4 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
                  Mesa selecionada
                </p>

                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                  Mesa {selectedTable.number}
                </h3>

                <p className="mt-1 text-sm text-[#6B6258]">
                  {selectedTable.capacity} lugares ·{" "}
                  {selectedTable.shape === "round" ? "Redonda" : "Quadrada"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-full border border-[#E1D0B8] bg-white px-3 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
                    Sala
                  </span>

                  <select
                    value={selectedTable.roomId ?? safeRooms[0].id}
                    onChange={(event) => moveSelectedTableToRoom(event.target.value)}
                    className="h-8 rounded-full bg-transparent text-sm font-semibold text-[#16120E] outline-none"
                  >
                    {safeRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => splitOneTable(selectedTable.id)}
                  className="h-10 rounded-full border border-[#E1D0B8] bg-white px-4 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFFDF8]"
                >
                  Separar
                </button>

                <button
                  type="button"
                  onClick={() => setTableToDelete(selectedTable)}
                  className="h-10 rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-4 text-sm font-semibold text-[#A14E36] transition hover:bg-[#FFE7DE]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        
      <div className="mt-5 overflow-hidden rounded-[30px] border border-[#E8DCCB] bg-[#FFFDF8]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8DCCB] px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B6258]">
            <LegendDot color="bg-[#F7F4EE]" label="Livre" />
            <LegendDot color="bg-[#FACC15]" label="Reservada" />
            <LegendDot color="bg-[#86A969]" label="Sentada" />
            <LegendDot color="bg-[#16120E]" label="Selecionada" />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden grid-cols-4 divide-x divide-[#E1D0B8] rounded-2xl border border-[#E1D0B8] bg-white text-center text-xs md:grid">
              <MapStat value={activeRoomTables.length} label="Mesas" />
              <MapStat value={groupedTables.length} label="Grupos" />
              <MapStat value={totalCapacity} label="Lugares" />
              <MapStat value={assignedReservations.length} label="Associadas" />
            </div>

            <button
              type="button"
              onClick={separateGroups}
              className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold text-[#16120E] transition hover:bg-white"
            >
              Separar grupos
            </button>

            <form action={saveFloorPlan}>
              <input type="hidden" name="restaurantId" value={restaurantId} />
              <input type="hidden" name="layout" value={layoutValue} />

              <button className="rounded-full bg-[#16120E] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#2A2118]">
                Guardar layout
              </button>
            </form>
          </div>
        </div>

        <div className="relative h-[74vh] min-h-[760px] overflow-auto">
          <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            className="relative mx-auto"
            style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(200,165,106,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(200,165,106,0.07)_1px,transparent_1px)] bg-[size:42px_42px]" />

            <ZoneLabel className="left-6 top-6">
              {safeRooms.find((room) => room.id === activeRoomId)?.name ??
                "Sala principal"}
            </ZoneLabel>

            <ZoneLabel className="bottom-6 right-6">Cozinha</ZoneLabel>

            {renderTables()}

            {activeRoomTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <div>
                  <p className="text-2xl font-semibold text-[#16120E]">
                    Sem mesas nesta sala
                  </p>
                  <p className="mt-2 text-sm text-[#6B6258]">
                    Selecione uma mesa noutra sala e mova para aqui.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {assignedReservations.length > 0 && (
        <div className="mt-4 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Associadas
          </p>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {assignedReservations.map((reservation) => {
              const table = items.find((item) => item.id === reservation.tableId);

              return (
                <form
                  key={reservation.id}
                  action={unassignReservation}
                  className="flex min-w-[230px] items-center justify-between gap-3 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3"
                >
                  <input type="hidden" name="restaurantId" value={restaurantId} />
                  <input type="hidden" name="reservationId" value={reservation.id} />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {reservation.customerName}
                    </p>
                    <p className="mt-1 text-xs text-[#6B6258]">
                      {reservation.startTime} ·{" "}
                      {table ? `Mesa ${table.number}` : "Mesa"}
                    </p>
                  </div>

                  <button className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36]">
                    Remover
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      )}
      {tableToDelete && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
        Confirmar eliminação
      </p>

      <h3 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[#16120E]">
        Eliminar mesa {tableToDelete.number}?
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#6B6258]">
        A mesa será removida da sala. Reservas associadas ficam sem mesa.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setTableToDelete(null)}
          className="h-11 flex-1 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#16120E]"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={confirmDeleteTable}
          className="h-11 flex-1 rounded-full bg-[#A14E36] text-sm font-semibold text-white"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
)}
    </section>
  );
}

function MiniBox({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-[#E8DCCB] bg-white px-3 py-2">
      <p className="truncate text-sm font-semibold">{title}</p>
      <p className="mt-0.5 truncate text-xs text-[#6B6258]">{subtitle}</p>
    </div>
  );
}

function MapStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 py-2">
      <p className="text-base font-semibold text-[#16120E]">{value}</p>
      <p className="text-[11px] text-[#6B6258]">{label}</p>
    </div>
  );
}

function ZoneLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-xs font-semibold text-[#6B6258] shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3.5 w-3.5 rounded-full border border-[#DCC9AE] ${color}`}
      />
      <span>{label}</span>
    </div>
  );
}