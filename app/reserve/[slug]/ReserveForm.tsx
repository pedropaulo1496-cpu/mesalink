"use client";

import { useEffect, useMemo, useState } from "react";

type Reservation = {
  id: string;
  date: Date | string;
  status: string | null;
};

type Table = {
  id: string;
  number: number;
  capacity: number;
  reservations: Reservation[];
};

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  reservationMode: string;
  totalCapacity: number | null;
  onlineReservationsEnabled: boolean;

  mondayOpen: boolean;
  mondayLunch: string | null;
  mondayDinner: string | null;

  tuesdayOpen: boolean;
  tuesdayLunch: string | null;
  tuesdayDinner: string | null;

  wednesdayOpen: boolean;
  wednesdayLunch: string | null;
  wednesdayDinner: string | null;

  thursdayOpen: boolean;
  thursdayLunch: string | null;
  thursdayDinner: string | null;

  fridayOpen: boolean;
  fridayLunch: string | null;
  fridayDinner: string | null;

  saturdayOpen: boolean;
  saturdayLunch: string | null;
  saturdayDinner: string | null;

  sundayOpen: boolean;
  sundayLunch: string | null;
  sundayDinner: string | null;

  tables: Table[];
};

const weekdayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function generateTimesFromRange(range: string | null) {
  if (!range || !range.includes("-")) return [];

  const [start, end] = range.split("-").map((value) => value.trim());

  if (!start || !end) return [];

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return [];
  }

  const times: string[] = [];

  let currentMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;

  if (endMinutes <= currentMinutes) {
    endMinutes += 24 * 60;
  }

  while (currentMinutes <= endMinutes) {
    const normalizedMinutes = currentMinutes % (24 * 60);
    const hour = Math.floor(normalizedMinutes / 60);
    const minute = normalizedMinutes % 60;

    times.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );

    currentMinutes += 30;
  }

  return times;
}

function getAvailableHoursForDay(restaurant: Restaurant, selectedDay: string) {
  const date = new Date(`${selectedDay}T12:00:00`);
  const weekdayKey = weekdayKeys[date.getDay()];

  const open = restaurant[`${weekdayKey}Open`];
  const lunch = restaurant[`${weekdayKey}Lunch`];
  const dinner = restaurant[`${weekdayKey}Dinner`];

  if (!open) return [];

  return [
    ...generateTimesFromRange(lunch),
    ...generateTimesFromRange(dinner),
  ];
}

function isTableAvailable(date: Date, reservations: Reservation[]) {
  const startDate = date;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  return !reservations.some((reservation) => {
    if (reservation.status === "CANCELLED") return false;
    if (reservation.status === "FINISHED") return false;
    if (reservation.status === "REJECTED") return false;
    if (reservation.status === "NO_SHOW") return false;

    const reservationStart = new Date(reservation.date);
    const reservationEnd = new Date(reservationStart);
    reservationEnd.setHours(reservationEnd.getHours() + 2);

    return startDate < reservationEnd && endDate > reservationStart;
  });
}

function findTableCombination(tables: Table[], guests: number) {
  const sortedTables = [...tables].sort((a, b) => a.capacity - b.capacity);

  const selected: Table[] = [];
  let totalCapacity = 0;

  for (const table of sortedTables) {
    selected.push(table);
    totalCapacity += table.capacity;

    if (totalCapacity >= guests) {
      return {
        tables: selected,
        totalCapacity,
      };
    }
  }

  return null;
}

function getTodayDateValue() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ReserveForm({
  restaurant,
  error,
  createPublicReservation,
}: {
  restaurant: Restaurant;
  error?: string;
  createPublicReservation: (formData: FormData) => void;
}) {
  const today = getTodayDateValue();

  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [guests, setGuests] = useState(2);

  const availableHours = useMemo(() => {
    return getAvailableHoursForDay(restaurant, selectedDay);
  }, [restaurant, selectedDay]);

  useEffect(() => {
    if (!availableHours.includes(selectedHour)) {
      setSelectedHour(availableHours[0] ?? "");
    }
  }, [availableHours, selectedHour]);

  const selectedDateValue =
    selectedHour ? `${selectedDay}T${selectedHour}` : "";

  const isCapacityMode = restaurant.reservationMode === "CAPACITY";

  const freeTables = useMemo(() => {
    if (!selectedHour) return [];

    const date = new Date(`${selectedDay}T${selectedHour}:00`);

    return restaurant.tables.filter((table) =>
      isTableAvailable(date, table.reservations)
    );
  }, [restaurant.tables, selectedDay, selectedHour]);

  const availableTables = useMemo(() => {
    return freeTables.filter((table) => table.capacity >= guests);
  }, [freeTables, guests]);

  const tableCombination = useMemo(() => {
    if (isCapacityMode) return null;
    if (availableTables.length > 0) return null;

    return findTableCombination(freeTables, guests);
  }, [availableTables.length, freeTables, guests, isCapacityMode]);

  useEffect(() => {
    if (isCapacityMode) {
      setSelectedTableId("");
      return;
    }

    if (
      selectedTableId &&
      availableTables.some((table) => table.id === selectedTableId)
    ) {
      return;
    }

    setSelectedTableId(availableTables[0]?.id ?? "");
  }, [availableTables, selectedTableId, isCapacityMode]);

  const isPendingRequest =
    !isCapacityMode && availableTables.length === 0 && !!tableCombination;

  const tableIdToSubmit = isPendingRequest
    ? tableCombination?.tables[0]?.id ?? ""
    : selectedTableId;

  const canSubmit =
    !!selectedHour && (isCapacityMode || !!tableIdToSubmit);

  if (!restaurant.onlineReservationsEnabled) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] px-6 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
              Reservas online
            </p>

            <h1 className="mt-4 text-4xl font-black">
              {restaurant.name}
            </h1>

            <div className="mt-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
              <h2 className="text-2xl font-black text-yellow-300">
                Reservas indisponíveis
              </h2>

              <p className="mt-3 text-[#d6d6d6]">
                Este restaurante não está a aceitar reservas online neste momento.
              </p>
            </div>

            <p className="mt-8 text-xs text-[#7d7d7d]">
              Powered by MesaLink
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
            Reserva online
          </p>

          <h1 className="mt-4 text-5xl font-black tracking-tight">
            {restaurant.name}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-[#9e9e9e]">
            Reserve a sua mesa em menos de 30 segundos.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6 md:p-8">
            {error === "conflict" && (
              <Alert
                tone="red"
                title="Horário indisponível"
                text="Essa mesa já tem uma reserva nesse período. Escolha outro horário."
              />
            )}

            {error === "past" && (
              <Alert
                tone="red"
                title="Data inválida"
                text="Não é possível fazer reservas para datas ou horas no passado."
              />
            )}

            {error === "capacity" && (
              <Alert
                tone="red"
                title="Sem capacidade"
                text="O restaurante não tem capacidade disponível para esse horário."
              />
            )}

            <div className="space-y-8">
              <div>
                <StepTitle number="1" title="Escolha o dia" />

                <input
                  type="date"
                  min={today}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="mt-4 h-14 w-full rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none focus:border-[#f0c36a]"
                />
              </div>

              <div>
                <StepTitle number="2" title="Escolha a hora" />

                {availableHours.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-300">
                    O restaurante está fechado neste dia.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {availableHours.map((hour) => {
                      const isSelected = selectedHour === hour;

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => setSelectedHour(hour)}
                          className={
                            isSelected
                              ? "h-12 rounded-full bg-[#f0c36a] font-black text-black"
                              : "h-12 rounded-full border border-[#2b2b2b] bg-[#111111] font-bold text-[#d6d6d6] hover:border-[#f0c36a]"
                          }
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <StepTitle number="3" title="Número de pessoas" />

                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((value) => {
                    const isSelected = guests === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGuests(value)}
                        className={
                          isSelected
                            ? "h-12 rounded-full bg-[#f0c36a] font-black text-black"
                            : "h-12 rounded-full border border-[#2b2b2b] bg-[#111111] font-bold text-[#d6d6d6] hover:border-[#f0c36a]"
                        }
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-[#9e9e9e]">
                    Outro número
                  </label>

                  <input
                    name="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    placeholder="Número de pessoas"
                    className="h-14 w-full rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none focus:border-[#f0c36a]"
                    required
                  />
                </div>
              </div>

              {!isCapacityMode && selectedHour && availableTables.length === 0 && !tableCombination && (
                <Alert
                  tone="red"
                  title="Sem mesas disponíveis"
                  text={`Não há mesas disponíveis para ${guests} pessoas neste horário.`}
                />
              )}

              {tableCombination && (
                <Alert
                  tone="yellow"
                  title="Pedido sujeito a aprovação"
                  text={`Para ${guests} pessoas, o restaurante poderá juntar mesas. O pedido ficará pendente de confirmação.`}
                />
              )}

              {isCapacityMode && (
                <Alert
                  tone="blue"
                  title="Reserva por capacidade"
                  text="O restaurante gere as mesas internamente. Basta escolher dia, hora e número de pessoas."
                />
              )}

              <form action={createPublicReservation} className="space-y-4">
                <input type="hidden" name="slug" value={restaurant.slug} />
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="date" value={selectedDateValue} />
                <input type="hidden" name="guests" value={guests} />
                <input
                  type="hidden"
                  name="reservationMode"
                  value={restaurant.reservationMode}
                />

                {!isCapacityMode && (
                  <input type="hidden" name="tableId" value={tableIdToSubmit} />
                )}

                <input
                  type="hidden"
                  name="status"
                  value={isPendingRequest ? "PENDING" : "CONFIRMED"}
                />

                <div className="border-t border-[#2b2b2b] pt-8">
                  <StepTitle number="4" title="Os seus dados" />

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      name="customerName"
                      type="text"
                      placeholder="Nome"
                      className="h-14 rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none placeholder:text-[#6f6f6f] focus:border-[#f0c36a]"
                      required
                    />

                    <input
                      name="phone"
                      type="text"
                      placeholder="Telefone"
                      className="h-14 rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none placeholder:text-[#6f6f6f] focus:border-[#f0c36a]"
                      required
                    />

                    <input
  name="email"
  type="email"
  placeholder="Email"
  className="h-14 rounded-2xl border border-[#2b2b2b] bg-[#111111] px-4 text-white outline-none placeholder:text-[#6f6f6f] focus:border-[#f0c36a]"
  required
/>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-6 h-14 w-full rounded-full bg-[#f0c36a] text-base font-black text-black hover:bg-[#ffd982] disabled:cursor-not-allowed disabled:bg-[#3a3a3a] disabled:text-[#8a8a8a]"
                  >
                    {isPendingRequest ? "Enviar pedido" : "Confirmar reserva"}
                  </button>

                  <p className="mt-4 text-center text-xs text-[#7d7d7d]">
                    Ao reservar, aceita ser contactado sobre esta reserva.
                  </p>
                </div>
              </form>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
              Resumo
            </p>

            <div className="mt-6 space-y-4">
              <SummaryItem label="Restaurante" value={restaurant.name} />
              <SummaryItem label="Dia" value={new Date(selectedDay).toLocaleDateString("pt-PT")} />
              <SummaryItem label="Hora" value={selectedHour || "Escolha uma hora"} />
              <SummaryItem label="Pessoas" value={`${guests} pessoa${guests === 1 ? "" : "s"}`} />
              <SummaryItem
                label="Estado"
                value={isPendingRequest ? "Sujeito a aprovação" : "Confirmação imediata"}
                highlight
              />
            </div>

            <div className="mt-8 rounded-3xl border border-[#2b2b2b] bg-[#111111] p-5">
              <p className="font-black">
                {isPendingRequest ? "Pedido pendente" : "Reserva direta"}
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[#9e9e9e]">
                {isPendingRequest
                  ? "O restaurante irá confirmar ou recusar o pedido."
                  : "Se houver disponibilidade, a reserva fica confirmada no momento."}
              </p>
            </div>

            <p className="mt-8 text-center text-xs text-[#6f6f6f]">
              Powered by MesaLink
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StepTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0c36a] text-sm font-black text-black">
        {number}
      </span>

      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#2b2b2b] bg-[#111111] p-4">
      <p className="text-sm text-[#9e9e9e]">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 font-black text-[#f0c36a]"
            : "mt-1 font-black text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Alert({
  tone,
  title,
  text,
}: {
  tone: "red" | "yellow" | "blue";
  title: string;
  text: string;
}) {
  const classes =
    tone === "red"
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : tone === "yellow"
      ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
      : "border-blue-500/20 bg-blue-500/10 text-blue-300";

  return (
    <div className={`rounded-2xl border p-5 ${classes}`}>
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </div>
  );
}