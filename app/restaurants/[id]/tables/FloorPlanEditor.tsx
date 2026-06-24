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

const MAP_WIDTH = 1520;
const MAP_HEIGHT = 900;
const TABLE_SIZE = 94;
const GROUP_GAP = 10;
const GRID_SIZE = 24;
const MAGNET_DISTANCE = 10;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function snap(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function getStatusMeta(status: string, selected?: boolean) {
  if (selected) {
    return {
      card: "border-[#11100F] bg-[#11100F] text-white shadow-[0_28px_65px_rgba(17,16,15,0.24)] ring-4 ring-[#C8A56A]/25",
      dot: "bg-[#C8A56A]",
      text: "text-white/70",
      chair: "border-[#C8A56A]/55 bg-[#2B2722]",
    };
  }

  if (status === "SEATED") {
    return {
      card: "border-[#7FA56D] bg-[linear-gradient(145deg,#F1FAEF,#FFFFFF)] text-[#11100F] shadow-[0_18px_42px_rgba(127,165,109,0.16)]",
      dot: "bg-[#7FA56D]",
      text: "text-[#607A58]",
      chair: "border-[#BFD6B5] bg-[#F5FBF2]",
    };
  }

  if (status === "CONFIRMED") {
    return {
      card: "border-[#D8AE62] bg-[linear-gradient(145deg,#FFF5DE,#FFFFFF)] text-[#11100F] shadow-[0_18px_42px_rgba(216,174,98,0.16)]",
      dot: "bg-[#D8AE62]",
      text: "text-[#8A6A34]",
      chair: "border-[#E9D1A3] bg-[#FFF8EC]",
    };
  }

  return {
    card: "border-[#E2D3BD] bg-[linear-gradient(145deg,#FFFFFF,#FBF5EC)] text-[#11100F] shadow-[0_18px_42px_rgba(80,55,30,0.10)]",
    dot: "bg-[#D9C7AA]",
    text: "text-[#7D746A]",
    chair: "border-[#E5D5BE] bg-[#FFF8EC]",
  };
}

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
  const safeRooms =
    rooms.length > 0 ? rooms : [{ id: "main", name: "Sala principal" }];

  const [activeRoomId, setActiveRoomId] = useState(safeRooms[0].id);
  const [items, setItems] = useState(tables);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tableToDelete, setTableToDelete] = useState<FloorTable | null>(null);
  const [showReservations, setShowReservations] = useState(true);
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
    table.roomId
      ? table.roomId === activeRoomId
      : activeRoomId === safeRooms[0].id,
  );

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === selectedReservationId,
  );

  const selectedTable = items.find((table) => table.id === selectedTableId);

  const assignedReservations = reservations.filter(
    (reservation) => reservation.tableId,
  );

  const unassignedReservations = reservations.filter(
    (reservation) => !reservation.tableId,
  );

  const groupedTables = useMemo(
    () => activeRoomTables.filter((table) => table.mergeGroupId),
    [activeRoomTables],
  );

  const totalCapacity = activeRoomTables.reduce(
    (total, table) => total + table.capacity,
    0,
  );

  const freeTables = activeRoomTables.filter(
    (table) => table.currentStatus === "FREE",
  ).length;

  const reservedTables = activeRoomTables.filter(
    (table) => table.currentStatus === "CONFIRMED",
  ).length;

  const seatedTables = activeRoomTables.filter(
    (table) => table.currentStatus === "SEATED",
  ).length;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTableId("");
        setSelectedReservationId("");
      }

      if (event.key !== "Delete" || !selectedTable) return;
      setTableToDelete(selectedTable);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTable]);

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

    startTransition(() => deleteTable(formData));
  }

  function getRelativePoint(event: React.PointerEvent<HTMLElement>) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function updateTableLocally(updater: (current: FloorTable[]) => FloorTable[]) {
    setItems((current) => updater(current));
  }

  function getRoomTablesFromList(current: FloorTable[]) {
    return current.filter((table) =>
      table.roomId
        ? table.roomId === activeRoomId
        : activeRoomId === safeRooms[0].id,
    );
  }

  function getTableGroup(current: FloorTable[], table: FloorTable) {
    if (!table.mergeGroupId) return [table];

    return current
      .filter((item) => item.mergeGroupId === table.mergeGroupId)
      .sort((a, b) => a.number - b.number);
  }

  function getGroupBounds(group: FloorTable[]) {
    const minX = Math.min(...group.map((table) => table.x));
    const maxX = Math.max(...group.map((table) => table.x + TABLE_SIZE));
    const minY = Math.min(...group.map((table) => table.y));
    const maxY = Math.max(...group.map((table) => table.y + TABLE_SIZE));

    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }

  function distanceBetweenGroups(a: FloorTable[], b: FloorTable[]) {
    const first = getGroupBounds(a);
    const second = getGroupBounds(b);

    const gapX = Math.max(
      0,
      Math.max(second.minX - first.maxX, first.minX - second.maxX),
    );

    const gapY = Math.max(
      0,
      Math.max(second.minY - first.maxY, first.minY - second.maxY),
    );

    return Math.hypot(gapX, gapY);
  }

  function handleTablePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    table: FloorTable,
  ) {
    event.preventDefault();

    const point = getRelativePoint(event);

    setSelectedTableId(table.id);

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
          ? { ...current, moved: current.moved || distance > 4 }
          : current,
      );

      const nextX = clamp(
        point.x - dragging.offsetX,
        24,
        MAP_WIDTH - TABLE_SIZE - 24,
      );
      const nextY = clamp(
        point.y - dragging.offsetY,
        24,
        MAP_HEIGHT - TABLE_SIZE - 24,
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
        ? { ...current, moved: current.moved || distance > 4 }
        : current,
    );

    updateTableLocally((current) =>
      current.map((table) => {
        const original = dragging.originals.find((item) => item.id === table.id);
        if (!original) return table;

        return {
          ...table,
          x: clamp(original.x + deltaX, 24, MAP_WIDTH - TABLE_SIZE - 24),
          y: clamp(original.y + deltaY, 24, MAP_HEIGHT - TABLE_SIZE - 24),
        };
      }),
    );
  }

  function normalizeGroupLayout(current: FloorTable[], groupId: string) {
    const group = current
      .filter((table) => table.mergeGroupId === groupId)
      .sort((a, b) => a.number - b.number);

    if (group.length <= 1) return current;

    const baseX = Math.min(...group.map((table) => table.x));
    const baseY = Math.round(
      group.reduce((sum, table) => sum + table.y, 0) / group.length,
    );

    return current.map((table) => {
      const index = group.findIndex((item) => item.id === table.id);
      if (index === -1) return table;

      return {
        ...table,
        x: clamp(
          snap(baseX + index * (TABLE_SIZE + GROUP_GAP)),
          24,
          MAP_WIDTH - TABLE_SIZE - 24,
        ),
        y: clamp(snap(baseY), 24, MAP_HEIGHT - TABLE_SIZE - 24),
      };
    });
  }

  function magnetizeTable(tableId: string) {
    updateTableLocally((current) => {
      const active = current.find((table) => table.id === tableId);
      if (!active) return current;

      const roomTables = getRoomTablesFromList(current);
      const activeGroup = getTableGroup(current, active);
      const activeIds = new Set(activeGroup.map((table) => table.id));

      const candidates = roomTables
        .filter((table) => !activeIds.has(table.id))
        .map((table) => {
          const candidateGroup = getTableGroup(current, table);
          return {
            table,
            group: candidateGroup,
            distance: distanceBetweenGroups(activeGroup, candidateGroup),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      let next = current.map((table) =>
        activeIds.has(table.id)
          ? { ...table, x: snap(table.x), y: snap(table.y) }
          : table,
      );

      const nearest = candidates[0];

      if (!nearest || nearest.distance > MAGNET_DISTANCE || selectedReservationId) {
        const groupId = active.mergeGroupId;
        return groupId ? normalizeGroupLayout(next, groupId) : next;
      }

      const groupId =
        nearest.table.mergeGroupId ||
        active.mergeGroupId ||
        `group-${nearest.table.id}`;

      const mergeIds = new Set([
        ...activeGroup.map((table) => table.id),
        ...nearest.group.map((table) => table.id),
      ]);

      next = next.map((table) =>
        mergeIds.has(table.id) ? { ...table, mergeGroupId: groupId } : table,
      );

      return normalizeGroupLayout(next, groupId);
    });
  }

  function magnetizeGroup(groupId: string) {
    updateTableLocally((current) => {
      const roomTables = getRoomTablesFromList(current);
      const activeGroup = roomTables
        .filter((table) => table.mergeGroupId === groupId)
        .sort((a, b) => a.number - b.number);

      if (activeGroup.length === 0) return current;

      const activeIds = new Set(activeGroup.map((table) => table.id));

      const candidates = roomTables
        .filter((table) => !activeIds.has(table.id))
        .map((table) => {
          const candidateGroup = getTableGroup(current, table);
          return {
            table,
            group: candidateGroup,
            distance: distanceBetweenGroups(activeGroup, candidateGroup),
          };
        })
        .sort((a, b) => a.distance - b.distance);

      let next = normalizeGroupLayout(current, groupId);
      const nearest = candidates[0];

      if (!nearest || nearest.distance > MAGNET_DISTANCE || selectedReservationId) {
        return next;
      }

      const nextGroupId = nearest.table.mergeGroupId || groupId;

      const mergeIds = new Set([
        ...activeGroup.map((table) => table.id),
        ...nearest.group.map((table) => table.id),
      ]);

      next = next.map((table) =>
        mergeIds.has(table.id) ? { ...table, mergeGroupId: nextGroupId } : table,
      );

      return normalizeGroupLayout(next, nextGroupId);
    });
  }

  function handlePointerUp() {
    if (!dragging) return;

    if (dragging.type === "group") {
      if (dragging.moved) {
        magnetizeGroup(dragging.groupId);
      }

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
      setDragging(null);
      return;
    }

    magnetizeTable(active.id);
    setDragging(null);
  }

  function separateGroups() {
    updateTableLocally((current) =>
      current.map((table) =>
        table.roomId === activeRoomId ||
        (!table.roomId && activeRoomId === safeRooms[0].id)
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

  function toggleShape(tableId: string) {
    updateTableLocally((current) =>
      current.map((table) =>
        table.id === tableId
          ? { ...table, shape: table.shape === "round" ? "square" : "round" }
          : table,
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

    startTransition(() => moveTableToRoom(formData));
  }

  function assignSelected() {
    if (!selectedReservationId || !selectedTableId) return;

    const formData = new FormData();
    formData.set("restaurantId", restaurantId);
    formData.set("reservationId", selectedReservationId);
    formData.set("tableId", selectedTableId);

    startTransition(() => assignReservationToTable(formData));
  }

  const layoutValue = JSON.stringify(
    items.map((table) => ({
      id: table.id,
      x: Math.round(table.x),
      y: Math.round(table.y),
      shape: table.shape,
      mergeGroupId: table.mergeGroupId,
    })),
  );

  function renderSingleTable(table: FloorTable, groupMode = false) {
    const isSelected = selectedTableId === table.id;
    const reservation = table.reservationsToday[0];
    const status = getStatusMeta(table.currentStatus, isSelected);

    return (
      <div
        key={table.id}
        onPointerDown={(event) => handleTablePointerDown(event, table)}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => toggleShape(table.id)}
        className={`absolute flex touch-none select-none flex-col items-center justify-center border text-center transition will-change-transform hover:-translate-y-0.5 ${
          table.shape === "round" ? "rounded-full" : "rounded-[26px]"
        } ${status.card}`}
        style={{
          left: groupMode ? undefined : table.x,
          top: groupMode ? undefined : table.y,
          width: TABLE_SIZE,
          height: TABLE_SIZE,
          position: groupMode ? "relative" : "absolute",
        }}
      >
        {!groupMode && (
          <>
            <Chair position="top" round={table.shape === "round"} tone={status.chair} />
            <Chair position="bottom" round={table.shape === "round"} tone={status.chair} />
            <Chair position="left" round={table.shape === "round"} tone={status.chair} />
            <Chair position="right" round={table.shape === "round"} tone={status.chair} />
          </>
        )}

        <span className={`absolute left-3 top-3 h-2.5 w-2.5 rounded-full ${status.dot}`} />

        <p className="text-3xl font-black leading-none tracking-[-0.08em]">
          {table.number}
        </p>

        <p className={`mt-1 text-[10px] font-bold ${status.text}`}>
          {table.capacity} lugares
        </p>

        {reservation && (
          <div className="mt-2 max-w-[78px] rounded-full bg-white px-2 py-1 text-[10px] font-black leading-tight text-[#11100F] shadow-sm">
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
  }

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
        const capacity = groupTables.reduce(
          (total, item) => total + item.capacity,
          0,
        );
        const isSelected = groupTables.some((item) => item.id === selectedTableId);
        const width =
          groupTables.length * TABLE_SIZE + (groupTables.length - 1) * GROUP_GAP;

        return (
          <button
            key={table.mergeGroupId}
            type="button"
            onPointerDown={(event) =>
              handleGroupPointerDown(event, table.mergeGroupId!)
            }
            onPointerUp={handlePointerUp}
            className={`absolute rounded-[32px] border p-2 text-left transition will-change-transform ${
              isSelected
                ? "border-[#11100F] bg-[#11100F]/5 ring-4 ring-[#C8A56A]/20"
                : "border-[#E5D0A8] bg-white/35 hover:bg-white/55"
            }`}
            style={{
              left: minX,
              top: minY,
              width: width + 16,
              height: TABLE_SIZE + 16,
            }}
          >
            <div className="pointer-events-none absolute -top-3 left-5 rounded-full border border-[#E5D0A8] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#9B6F3B] shadow-sm">
              Grupo · {capacity} lugares
            </div>

            <div className="relative flex gap-[10px]">
              {groupTables.map((item) => renderSingleTable(item, true))}
            </div>
          </button>
        );
      }

      return renderSingleTable(table);
    });
  }

  return (
    <section className="overflow-hidden rounded-[34px] border border-[#E1D0B8] bg-white shadow-[0_30px_90px_rgba(80,55,30,0.12)]">
      <div className="grid min-h-[calc(100vh-190px)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#E8DCCB] bg-[#FFF9F0] p-3 text-[#16120E] xl:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B58A45]">
                Hoje
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                Reservas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowReservations((value) => !value)}
              className="rounded-full border border-[#E8DCCB] bg-white px-3 py-1 text-[10px] font-black uppercase text-[#6B6258] hover:bg-[#FFF9F0]"
            >
              {showReservations ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {showReservations && (
            <div className="mt-3 max-h-[250px] space-y-2 overflow-y-auto pr-1">
              {reservations.length === 0 ? (
                <EmptyState
                  title="Sem reservas"
                  text="As reservas de hoje aparecem aqui para associar a mesas."
                />
              ) : (
                reservations.map((reservation) => (
                  <button
                    key={reservation.id}
                    type="button"
                    onClick={() => {
                      setSelectedReservationId(reservation.id);
                      setSelectedTableId(reservation.tableId || "");
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedReservationId === reservation.id
                        ? "border-[#11100F] bg-[#11100F] text-white shadow-[0_18px_38px_rgba(17,16,15,0.16)]"
                        : "border-[#E8DCCB] bg-white text-[#16120E] hover:border-[#C8A56A] hover:bg-[#FFF9F0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {reservation.customerName}
                        </p>
                        <p
                          className={`mt-1 text-xs font-bold ${
                            selectedReservationId === reservation.id
                              ? "text-white/65"
                              : "text-[#6B6258]"
                          }`}
                        >
                          {reservation.startTime} · {reservation.guests} pessoas
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                          reservation.tableId
                            ? "bg-[#ECF7EC] text-[#3F6A4D]"
                            : "bg-[#FFF1D0] text-[#9B6F3B]"
                        }`}
                      >
                        {reservation.tableId ? "Mesa" : "Sem mesa"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {assignedReservations.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B58A45]">
                Associadas
              </p>

              <div className="mt-3 space-y-2">
                {assignedReservations.slice(0, 4).map((reservation) => {
                  const table = items.find(
                    (item) => item.id === reservation.tableId,
                  );

                  return (
                    <form
                      key={reservation.id}
                      action={unassignReservation}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8DCCB] bg-white px-3 py-2"
                    >
                      <input
                        type="hidden"
                        name="restaurantId"
                        value={restaurantId}
                      />
                      <input
                        type="hidden"
                        name="reservationId"
                        value={reservation.id}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xs font-black">
                          {reservation.customerName}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold text-[#6B6258]">
                          {reservation.startTime} ·{" "}
                          {table ? `Mesa ${table.number}` : "Mesa"}
                        </p>
                      </div>

                      <button className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-2 py-1 text-[10px] font-black text-[#A14E36]">
                        Remover
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 rounded-[22px] border border-[#E8DCCB] bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B58A45]">
              {selectedTable ? "Mesa selecionada" : "Resumo da sala"}
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-[#16120E]">
              {selectedTable
                ? `Mesa ${selectedTable.number}`
                : safeRooms.find((room) => room.id === activeRoomId)?.name ??
                  "Sala"}
            </h3>

            {!selectedTable ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <InspectorStat label="Mesas" value={activeRoomTables.length} />
                <InspectorStat label="Lugares" value={totalCapacity} />
                <InspectorStat
                  label="Por sentar"
                  value={unassignedReservations.length}
                />
                <InspectorStat label="Grupos" value={groupedTables.length} />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <InspectorStat
                    label="Lugares"
                    value={selectedTable.capacity}
                  />
                  <InspectorStat
                    label="Formato"
                    value={
                      selectedTable.shape === "round" ? "Redonda" : "Quadrada"
                    }
                  />
                </div>

                <label className="block rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
                    Sala
                  </span>

                  <select
                    value={selectedTable.roomId ?? safeRooms[0].id}
                    onChange={(event) =>
                      moveSelectedTableToRoom(event.target.value)
                    }
                    className="mt-2 h-9 w-full rounded-2xl border border-[#E8DCCB] bg-white px-3 text-xs font-black text-[#16120E] outline-none"
                  >
                    {safeRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleShape(selectedTable.id)}
                    className="h-9 rounded-full border border-[#E8DCCB] bg-[#FFF9F0] text-xs font-black text-[#16120E]"
                  >
                    ○ / □
                  </button>

                  <button
                    type="button"
                    onClick={() => splitOneTable(selectedTable.id)}
                    className="h-9 rounded-full border border-[#E8DCCB] bg-[#FFF9F0] text-xs font-black text-[#16120E]"
                  >
                    Separar
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-3">
                  <p className="text-sm font-black">Associar reserva</p>

                  <div className="mt-3 space-y-2">
                    <select
                      value={selectedReservationId}
                      onChange={(event) =>
                        setSelectedReservationId(event.target.value)
                      }
                      className="h-9 w-full rounded-2xl border border-[#E8DCCB] bg-white px-3 text-xs font-black text-[#16120E] outline-none"
                    >
                      <option value="">Escolher reserva</option>
                      {reservations.map((reservation) => (
                        <option key={reservation.id} value={reservation.id}>
                          {reservation.startTime} · {reservation.customerName} ·{" "}
                          {reservation.guests}p
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedReservationId || !selectedTableId}
                      onClick={assignSelected}
                      className="h-9 w-full rounded-full bg-[#11100F] text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-[#B8B1A8]"
                    >
                      Associar à mesa
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTableToDelete(selectedTable)}
                  className="h-9 w-full rounded-full border border-[#E7B7A8] bg-[#FFF0EA] text-sm font-black text-[#A14E36]"
                >
                  Eliminar mesa
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 bg-white">
          <div className="border-b border-[#E8DCCB] bg-white/90 p-3 text-[#16120E] backdrop-blur">
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {safeRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setActiveRoomId(room.id);
                      setSelectedTableId("");
                    }}
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                      activeRoomId === room.id
                        ? "bg-[#11100F] text-white shadow-[0_14px_30px_rgba(17,16,15,0.16)]"
                        : "border border-[#E8DCCB] bg-[#FFF9F0] text-[#6B6258] hover:bg-white hover:text-[#11100F]"
                    }`}
                  >
                    {room.name}
                  </button>
                ))}

                <form action={createRoom} className="flex gap-2">
                  <input
                    type="hidden"
                    name="restaurantId"
                    value={restaurantId}
                  />
                  <input
                    name="name"
                    placeholder="+ Nova sala"
                    className="h-9 w-32 rounded-full border border-[#E8DCCB] bg-[#FFF9F0] px-3 text-xs font-bold text-[#16120E] outline-none placeholder:text-[#9B8F82]"
                  />
                </form>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="grid grid-cols-4 divide-x divide-[#E8DCCB] rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] text-center">
                  <MapStat value={activeRoomTables.length} label="Mesas" />
                  <MapStat value={totalCapacity} label="Lugares" />
                  <MapStat
                    value={unassignedReservations.length}
                    label="Por sentar"
                  />
                  <MapStat value={groupedTables.length} label="Grupos" />
                </div>

                <button
                  type="button"
                  onClick={separateGroups}
                  className="h-9 rounded-full border border-[#E8DCCB] bg-[#FFF9F0] px-4 text-xs font-black text-[#16120E] transition hover:bg-white"
                >
                  Separar grupos
                </button>

                <form action={saveFloorPlan}>
                  <input
                    type="hidden"
                    name="restaurantId"
                    value={restaurantId}
                  />
                  <input type="hidden" name="layout" value={layoutValue} />

                  <button className="h-9 rounded-full bg-[#11100F] px-5 text-xs font-black text-white transition hover:bg-[#2A2118]">
                    Guardar layout
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-[#6B6258]">
              <LegendDot color="bg-[#D9C7AA]" label={`${freeTables} livres`} />
              <LegendDot
                color="bg-[#D8AE62]"
                label={`${reservedTables} reservadas`}
              />
              <LegendDot
                color="bg-[#7FA56D]"
                label={`${seatedTables} sentadas`}
              />
              <LegendDot color="bg-[#11100F]" label="selecionada" />
              <span className="hidden text-[#9B8F82] md:inline">
                Arrasta para mover. Aproxima para juntar. Duplo clique muda formato.
              </span>
            </div>
          </div>

          <div className="relative h-[76vh] min-h-[680px] overflow-auto bg-[#FBF6EC]">
            <div
              ref={stageRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative mx-auto"
              style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
            >
              <MapBackground />

              <ZoneLabel className="left-8 top-8">
                {safeRooms.find((room) => room.id === activeRoomId)?.name ??
                  "Sala principal"}
              </ZoneLabel>

              <ZoneLabel className="bottom-8 right-8">Cozinha</ZoneLabel>

              {renderTables()}

              {activeRoomTables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="rounded-[28px] border border-[#E8DCCB] bg-white p-8 shadow-[0_20px_60px_rgba(80,55,30,0.10)]">
                    <p className="text-2xl font-black tracking-[-0.05em] text-[#16120E]">
                      Sem mesas nesta sala
                    </p>
                    <p className="mt-2 text-sm font-bold text-[#6B6258]">
                      Cria mesas no topo da página ou move mesas de outra sala.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-[#E8DCCB] bg-[#FFF9F0] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B]">
              Confirmar eliminação
            </p>

            <h3 className="mt-3 text-3xl font-black tracking-[-0.06em] text-[#16120E]">
              Eliminar mesa {tableToDelete.number}?
            </h3>

            <p className="mt-3 text-sm font-bold leading-6 text-[#6B6258]">
              A mesa será removida da sala. Reservas associadas ficam sem mesa.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="h-11 flex-1 rounded-full border border-[#E8DCCB] bg-[#FFF9F0] text-sm font-black text-[#16120E]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteTable}
                className="h-11 flex-1 rounded-full bg-[#A14E36] text-sm font-black text-white"
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

function Chair({
  position,
  round,
  tone,
}: {
  position: "top" | "bottom" | "left" | "right";
  round: boolean;
  tone: string;
}) {
  const base = `pointer-events-none absolute border shadow-sm ${tone}`;

  if (position === "top") {
    return (
      <span
        className={`${base} ${
          round ? "h-3 w-9 rounded-full" : "h-3 w-10 rounded-full"
        } -top-2 left-1/2 -translate-x-1/2`}
      />
    );
  }

  if (position === "bottom") {
    return (
      <span
        className={`${base} ${
          round ? "h-3 w-9 rounded-full" : "h-3 w-10 rounded-full"
        } -bottom-2 left-1/2 -translate-x-1/2`}
      />
    );
  }

  if (position === "left") {
    return (
      <span
        className={`${base} ${
          round ? "h-9 w-3 rounded-full" : "h-10 w-3 rounded-full"
        } -left-2 top-1/2 -translate-y-1/2`}
      />
    );
  }

  return (
    <span
      className={`${base} ${
        round ? "h-9 w-3 rounded-full" : "h-10 w-3 rounded-full"
      } -right-2 top-1/2 -translate-y-1/2`}
    />
  );
}

function MapBackground() {
  return (
    <>
      {/* Base quente MesaLink */}
      <div className="absolute inset-0 bg-[#F3EBDD]" />

      {/* Lajes grandes de pedra clara */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(167,139,96,0.26)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,96,0.24)_1px,transparent_1px)] bg-[size:220px_220px]" />

      {/* Micro textura marmorizada / pedra */}
      <div className="absolute inset-0 opacity-[0.42] bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.75)_0,transparent_18%),radial-gradient(circle_at_72%_18%,rgba(196,151,82,0.12)_0,transparent_20%),radial-gradient(circle_at_42%_64%,rgba(255,255,255,0.62)_0,transparent_18%),radial-gradient(circle_at_82%_78%,rgba(196,151,82,0.11)_0,transparent_22%)]" />

      {/* Veios subtis da pedra */}
      <div className="absolute inset-0 opacity-[0.22] bg-[linear-gradient(115deg,transparent_0%,transparent_22%,rgba(129,104,70,0.22)_22.3%,transparent_22.8%,transparent_56%,rgba(129,104,70,0.16)_56.2%,transparent_56.8%,transparent_100%)]" />

      <div className="absolute inset-0 opacity-[0.16] bg-[linear-gradient(28deg,transparent_0%,transparent_36%,rgba(129,104,70,0.20)_36.2%,transparent_36.7%,transparent_72%,rgba(129,104,70,0.15)_72.2%,transparent_72.8%)]" />

      {/* Vignette premium para dar profundidade sem plantas */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.68),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.36),rgba(196,151,82,0.08))]" />

      {/* Luzes quentes MesaLink */}
      <div className="pointer-events-none absolute left-[8%] top-[10%] h-80 w-80 rounded-full bg-[#D3A04E]/10 blur-[90px]" />
      <div className="pointer-events-none absolute right-[8%] bottom-[10%] h-96 w-96 rounded-full bg-[#B58A45]/10 blur-[110px]" />

      {/* Parede/limite discreto da sala */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#D8C5A7]/35 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#D8C5A7]/28 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#D8C5A7]/26 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#D8C5A7]/18 to-transparent" />

      {/* Sombra fina nas juntas para parecer chão real */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.26)_1px,transparent_1px)] bg-[size:220px_220px]" />
    </>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E8DCCB] bg-white p-4 text-sm">
      <p className="font-black text-[#16120E]">{title}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-[#6B6258]">{text}</p>
    </div>
  );
}

function InspectorStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8DCCB] bg-white p-3">
      <p className="text-xl font-black tracking-[-0.05em] text-[#16120E]">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#6B6258]">
        {label}
      </p>
    </div>
  );
}

function MapStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[78px] px-3 py-2">
      <p className="text-base font-black leading-none text-[#16120E]">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-[#6B6258]">{label}</p>
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
      className={`absolute rounded-full border border-[#E8DCCB] bg-white/95 px-4 py-2 text-xs font-black text-[#6B6258] shadow-sm backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full border border-[#DCC9AE] ${color}`} />
      <span>{label}</span>
    </div>
  );
}
