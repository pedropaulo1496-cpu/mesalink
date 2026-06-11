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

  return [...generateTimesFromRange(lunch), ...generateTimesFromRange(dinner)];
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
      <main className="relative min-h-screen overflow-hidden bg-[#020617] px-6 py-10 text-white">
        <PublicBackground />
        

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl"
        >
          <div className="rounded-[36px] border border-cyan-300/10 bg-white/[0.04] p-8 text-center shadow-[0_0_70px_rgba(34,211,238,0.12)] backdrop-blur-xl">
            <Badge>Reserva online</Badge>

            <motion.h1
              animate={{
                textShadow: [
                  "0 0 0px rgba(34,211,238,0)",
                  "0 0 35px rgba(34,211,238,0.35)",
                  "0 0 0px rgba(34,211,238,0)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="mt-5 text-4xl font-black tracking-[-0.05em]"
            >
              {restaurant.name}
            </motion.h1>

            <div className="mt-8 rounded-3xl border border-yellow-300/20 bg-yellow-400/10 p-6">
              <h2 className="text-2xl font-black text-yellow-200">
                Reservas indisponíveis
              </h2>

              <p className="mt-3 text-slate-300">
                Este restaurante não está a aceitar reservas online neste momento.
              </p>
            </div>

            <p className="mt-8 text-xs text-slate-500">Powered by MesaLink</p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-5 py-8 text-white">
      <PublicBackground />
      

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 mx-auto max-w-5xl"
      >
        <motion.header
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <Badge>MesaLink AI</Badge>

          <motion.h1
            animate={{
              textShadow: [
                "0 0 0px rgba(34,211,238,0)",
                "0 0 38px rgba(34,211,238,0.38)",
                "0 0 0px rgba(34,211,238,0)",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.06em]"
          >
            {restaurant.name}
          </motion.h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            A próxima geração das reservas para restaurantes.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Chip tone="cyan">⚡ Confirmação rápida</Chip>
            <Chip tone="violet">🤖 Powered by AI</Chip>
            <Chip tone="green">🍽️ Reserva online</Chip>
          </div>
        </motion.header>

        <div className="mx-auto max-w-4xl">
          <motion.section
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="rounded-[36px] border border-cyan-300/10 bg-white/[0.04] p-5 shadow-[0_0_70px_rgba(34,211,238,0.1)] backdrop-blur-xl md:p-8"
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
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.25 }}
              >
                <StepTitle number="1" title="📅 Quando?" />

                <input
                  type="date"
                  min={today}
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="mt-4 h-14 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none focus:border-cyan-300/40"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.35 }}
              >
                <StepTitle number="2" title="🕒 A que horas?" />

                {availableHours.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-5 text-red-200">
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
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedHour(hour)}
                          className={
                            isSelected
                              ? "h-12 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-black shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                              : "h-12 rounded-full border border-cyan-300/10 bg-[#020617]/70 font-bold text-slate-300 hover:border-cyan-300/40"
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
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.45 }}
              >
                <StepTitle number="3" title="👥 Quantas pessoas?" />

                <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((value) => {
                    const isSelected = guests === value;

                    return (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setGuests(value)}
                        className={
                          isSelected
                            ? "h-12 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 font-black text-black shadow-[0_0_30px_rgba(34,211,238,0.25)]"
                            : "h-12 rounded-full border border-cyan-300/10 bg-[#020617]/70 font-bold text-slate-300 hover:border-cyan-300/40"
                        }
                      >
                        {value}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-slate-400">
                    Outro número
                  </label>

                  <input
                    name="guests"
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    placeholder="Número de pessoas"
                    className="h-14 w-full rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
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
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.55 }}
                  className="border-t border-cyan-300/10 pt-8"
                >
                  <StepTitle number="4" title="✨ Quase terminado" />

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      name="customerName"
                      type="text"
                      placeholder="Nome"
                      className="h-14 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                      required
                    />

                    <input
                      name="phone"
                      type="text"
                      placeholder="Telefone"
                      className="h-14 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                      required
                    />

                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      className="h-14 rounded-2xl border border-cyan-300/10 bg-[#020617]/70 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40 md:col-span-2"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 0 45px rgba(34,211,238,0.45)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-6 h-14 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    {isPendingRequest ? "Enviar pedido" : "Confirmar reserva"}
                  </motion.button>

                  <p className="mt-4 text-center text-xs text-slate-500">
  Ao reservar, aceita ser contactado sobre esta reserva.
</p>

<p className="mt-8 text-center text-xs font-medium text-slate-600">
  Powered by MesaLink
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

function PublicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <motion.div
        animate={{ scale: [1, 1.15, 1], y: [0, 35, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 45, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-150px] top-[300px] h-[350px] w-[350px] rounded-full bg-violet-500/20 blur-[120px]"
      />
      <motion.div
        animate={{ opacity: [0.1, 0.28, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute bottom-[-180px] left-[-120px] h-[350px] w-[350px] rounded-full bg-blue-500/15 blur-[120px]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,#020617,#050816_40%,#020617)]" />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      animate={{
        boxShadow: [
          "0 0 0px rgba(34,211,238,0)",
          "0 0 30px rgba(34,211,238,0.25)",
          "0 0 0px rgba(34,211,238,0)",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity }}
      className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200"
    >
      {children}
    </motion.span>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "cyan" | "violet" | "green";
}) {
  const className =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-400/10 text-cyan-200"
      : tone === "violet"
      ? "border-violet-300/20 bg-violet-400/10 text-violet-200"
      : "border-emerald-300/20 bg-emerald-400/10 text-emerald-200";

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`rounded-full border px-4 py-2 text-xs font-black ${className}`}
    >
      {children}
    </motion.span>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        animate={{
          scale: [1, 1.08, 1],
          boxShadow: [
            "0 0 0px rgba(34,211,238,0)",
            "0 0 24px rgba(34,211,238,0.35)",
            "0 0 0px rgba(34,211,238,0)",
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 text-sm font-black text-black"
      >
        {number}
      </motion.span>

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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-cyan-300/10 bg-[#020617]/70 p-4"
    >
      <p className="text-sm text-slate-400">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 font-black text-cyan-300"
            : "mt-1 font-black text-white"
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
      ? "border-red-300/20 bg-red-400/10 text-red-200"
      : tone === "yellow"
      ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-200"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${classes}`}
    >
      <p className="font-black">{title}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </motion.div>
  );
}
