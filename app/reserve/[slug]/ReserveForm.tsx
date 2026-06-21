"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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

const inputClass =
  "h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

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
  const [year, month, day] = selectedDay.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdayKey = weekdayKeys[date.getDay()];

  const open = Boolean(restaurant[`${weekdayKey}Open`]);
  const lunch = restaurant[`${weekdayKey}Lunch`];
  const dinner = restaurant[`${weekdayKey}Dinner`];

  const hours = [
    ...generateTimesFromRange(lunch),
    ...generateTimesFromRange(dinner),
  ];

  if (!open && hours.length === 0) {
    return [];
  }

  return hours;
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
      return { tables: selected, totalCapacity };
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

  const selectedDateValue = selectedHour ? `${selectedDay}T${selectedHour}` : "";
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

  const canSubmit = !!selectedHour && (isCapacityMode || !!tableIdToSubmit);

  if (!restaurant.onlineReservationsEnabled) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] px-6 py-10 text-[#16120E]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl"
        >
          <div className="rounded-[36px] border border-[#E1D0B8] bg-white p-8 text-center shadow-[0_22px_70px_rgba(80,55,30,0.08)]">
            <Badge>Reserva online</Badge>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em]">
              {restaurant.name}
            </h1>

            <div className="mt-8 rounded-3xl border border-[#D8C5A5] bg-[#FFF1D0] p-6">
              <h2 className="text-2xl font-semibold text-[#9B6F3B]">
                Reservas indisponíveis
              </h2>

              <p className="mt-3 text-[#6B6258]">
                Este restaurante não está a aceitar reservas online neste momento.
              </p>
            </div>

            <p className="mt-8 text-xs text-[#9B8F82]">Powered by MesaLink</p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] px-5 py-8 text-[#16120E]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-5xl"
      >
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-8 text-center"
        >
          <Badge>Reserva online</Badge>

          <h1 className="mt-5 text-5xl font-semibold leading-[0.95] tracking-[-0.065em]">
            {restaurant.name}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#6B6258]">
            Escolha o dia, hora e número de pessoas. A reserva fica registada em segundos.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Chip>Confirmação rápida</Chip>
            <Chip>Reserva online</Chip>
            <Chip>MesaLink</Chip>
          </div>
        </motion.header>

        <div className="mx-auto max-w-4xl">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="rounded-[36px] border border-[#E1D0B8] bg-white p-5 shadow-[0_22px_70px_rgba(80,55,30,0.08)] md:p-8"
          >
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
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                <StepTitle number="1" title="Quando?" />

                <input
                  type="date"
                  min={today}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`${inputClass} mt-4`}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.2 }}
              >
                <StepTitle number="2" title="A que horas?" />

                {availableHours.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-5 text-[#A14E36]">
                    O restaurante está fechado neste dia.
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {availableHours.map((hour) => {
                      const isSelected = selectedHour === hour;

                      return (
                        <motion.button
                          key={hour}
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedHour(hour)}
                          className={
                            isSelected
                              ? "h-12 rounded-full bg-[#16120E] font-semibold text-white"
                              : "h-12 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] font-semibold text-[#6B6258] hover:border-[#C8A56A] hover:bg-white hover:text-[#16120E]"
                          }
                        >
                          {hour}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
              >
                <StepTitle number="3" title="Quantas pessoas?" />

                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((value) => {
                    const isSelected = guests === value;

                    return (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setGuests(value)}
                        className={
                          isSelected
                            ? "h-12 rounded-full bg-[#16120E] font-semibold text-white"
                            : "h-12 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] font-semibold text-[#6B6258] hover:border-[#C8A56A] hover:bg-white hover:text-[#16120E]"
                        }
                      >
                        {value}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-[#6B6258]">
                    Outro número
                  </label>

                  <input
                    name="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    placeholder="Número de pessoas"
                    className={inputClass}
                    required
                  />
                </div>
              </motion.div>

              {!isCapacityMode &&
                selectedHour &&
                availableTables.length === 0 &&
                !tableCombination && (
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

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.3 }}
                  className="border-t border-[#E1D0B8] pt-8"
                >
                  <StepTitle number="4" title="Dados da reserva" />

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      name="customerName"
                      type="text"
                      placeholder="Nome"
                      className={inputClass}
                      required
                    />

                    <input
                      name="phone"
                      type="text"
                      placeholder="Telefone"
                      className={inputClass}
                      required
                    />

                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      className={`${inputClass} md:col-span-2`}
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-6 h-14 w-full rounded-full bg-[#16120E] text-base font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:bg-[#D8CFC2] disabled:text-[#9B8F82]"
                  >
                    {isPendingRequest ? "Enviar pedido" : "Confirmar reserva"}
                  </motion.button>

                  <p className="mt-4 text-center text-xs text-[#9B8F82]">
                    Ao reservar, aceita ser contactado sobre esta reserva.
                  </p>

                  <p className="mt-8 text-center text-xs font-medium text-[#9B8F82]">
                    Powered by <span className="text-[#6B6258]">MesaLink</span>
                  </p>
                </motion.div>
              </form>
            </div>
          </motion.section>
        </div>
      </motion.div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]"
    >
      {children}
    </motion.span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      whileHover={{ scale: 1.03 }}
      className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold text-[#6B6258]"
    >
      {children}
    </motion.span>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white">
        {number}
      </span>

      <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
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
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4"
    >
      <p className="text-sm text-[#6B6258]">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 font-semibold text-[#9B6F3B]"
            : "mt-1 font-semibold text-[#16120E]"
        }
      >
        {value}
      </p>
    </motion.div>
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
      ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]"
      : tone === "yellow"
      ? "border-[#D8C5A5] bg-[#FFF1D0] text-[#9B6F3B]"
      : "border-[#BFD9C1] bg-[#ECF7EC] text-[#3F6A4D]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${classes}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </motion.div>
  );
}
