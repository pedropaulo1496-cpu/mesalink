"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import PhoneField from "@/components/PhoneField";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  address: string | null;
  websiteHeroImage: string | null;
  websiteLogoImage: string | null;
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

type ReservationOffer = {
  code: string;
  title: string;
  description: string | null;
  benefit: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  minSpend: string | null;
  terms: string | null;
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
  "h-12 w-full rounded-[15px] border border-[#DED0BC] bg-[#FCFAF7] px-4 text-sm font-medium text-[#17120D] outline-none transition placeholder:text-[#A49788] focus:border-[#A97C42] focus:bg-white focus:ring-4 focus:ring-[#D7B267]/15";

function generateTimesFromRange(range: string | null) {
  if (!range || !range.includes("-")) return [];
  const [start, end] = range.split("-").map((value) => value.trim());
  if (!start || !end) return [];
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return [];

  const times: string[] = [];
  let currentMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  if (endMinutes <= currentMinutes) endMinutes += 24 * 60;

  while (currentMinutes <= endMinutes) {
    const normalizedMinutes = currentMinutes % (24 * 60);
    times.push(`${String(Math.floor(normalizedMinutes / 60)).padStart(2, "0")}:${String(normalizedMinutes % 60).padStart(2, "0")}`);
    currentMinutes += 30;
  }
  return times;
}

function getAvailableHoursForDay(restaurant: Restaurant, selectedDay: string) {
  const [year, month, day] = selectedDay.split("-").map(Number);
  const weekdayKey = weekdayKeys[new Date(year, month - 1, day).getDay()];
  const open = Boolean(restaurant[`${weekdayKey}Open`]);
  const hours = [
    ...generateTimesFromRange(restaurant[`${weekdayKey}Lunch`]),
    ...generateTimesFromRange(restaurant[`${weekdayKey}Dinner`]),
  ];
  return !open && hours.length === 0 ? [] : [...new Set(hours)];
}

function isTableAvailable(date: Date, reservations: Reservation[]) {
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 2);
  return !reservations.some((reservation) => {
    if (["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"].includes(reservation.status || "")) return false;
    const reservationStart = new Date(reservation.date);
    const reservationEnd = new Date(reservationStart);
    reservationEnd.setHours(reservationEnd.getHours() + 2);
    return date < reservationEnd && endDate > reservationStart;
  });
}

function findTableCombination(tables: Table[], guests: number) {
  const sortedTables = [...tables].sort((a, b) => a.capacity - b.capacity);
  const selected: Table[] = [];
  let totalCapacity = 0;
  for (const table of sortedTables) {
    selected.push(table);
    totalCapacity += table.capacity;
    if (totalCapacity >= guests) return { tables: selected, totalCapacity };
  }
  return null;
}

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function ReserveForm({
  restaurant,
  error,
  marketingToken,
  offer,
  offerUnavailable,
  createPublicReservation,
}: {
  restaurant: Restaurant;
  error?: string;
  marketingToken?: string;
  offer?: ReservationOffer;
  offerUnavailable?: boolean;
  createPublicReservation: (formData: FormData) => void;
}) {
  const t = useTranslations("publicFlows.reserve");
  const locale = useLocale();
  const today = localDateValue(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [selectedHour, setSelectedHour] = useState("");
  const [guests, setGuests] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasSubmittedRef = useRef(false);

  const quickDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return { value: localDateValue(date), date };
  }), []);

  const availableHours = useMemo(
    () => getAvailableHoursForDay(restaurant, selectedDay),
    [restaurant, selectedDay],
  );
  const resolvedHour = availableHours.includes(selectedHour) ? selectedHour : availableHours[0] ?? "";
  const selectedDateValue = resolvedHour ? `${selectedDay}T${resolvedHour}` : "";
  const isCapacityMode = restaurant.reservationMode === "CAPACITY";

  const freeTables = useMemo(() => {
    if (!resolvedHour) return [];
    const date = new Date(`${selectedDay}T${resolvedHour}:00`);
    return restaurant.tables.filter((table) => isTableAvailable(date, table.reservations));
  }, [restaurant.tables, selectedDay, resolvedHour]);
  const availableTables = useMemo(() => freeTables.filter((table) => table.capacity >= guests), [freeTables, guests]);
  const tableCombination = useMemo(() => {
    if (isCapacityMode || availableTables.length > 0) return null;
    return findTableCombination(freeTables, guests);
  }, [availableTables.length, freeTables, guests, isCapacityMode]);
  const isPendingRequest = !isCapacityMode && availableTables.length === 0 && !!tableCombination;
  const tableIdToSubmit = isPendingRequest
    ? tableCombination?.tables[0]?.id ?? ""
    : isCapacityMode ? "" : availableTables[0]?.id ?? "";
  const canSubmit = Boolean(resolvedHour && (isCapacityMode || tableIdToSubmit));

  const selectedDate = dateFromValue(selectedDay);
  const friendlySelectedDate = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(selectedDate);
  const fullSelectedDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(selectedDate);

  if (!restaurant.onlineReservationsEnabled) {
    return <PublicShell restaurant={restaurant}>
      <div className="rounded-[26px] border border-[#E2D3BC] bg-white p-7 text-center shadow-[0_20px_70px_rgba(60,42,24,.08)] sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#F4E7D4] text-[#9B6F3B]"><CalendarDays size={21} /></span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em]">{t("unavailable.title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6D6258]">{t("unavailable.text")}</p>
      </div>
    </PublicShell>;
  }

  return (
    <main className="min-h-screen bg-[#F1EBE2] text-[#17120D]">
      <div className="mx-auto min-h-screen max-w-[1240px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
        <header className="mb-3 flex h-11 items-center justify-between px-2 sm:mb-5">
          <span className="font-serif text-xl font-bold tracking-[-0.04em]"><span className="text-[#B48645]">Mesa</span>Link</span>
          <LanguageSwitcher />
        </header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid overflow-hidden rounded-[28px] border border-[#DCCBB2] bg-white shadow-[0_30px_90px_rgba(69,48,28,.1)] lg:min-h-[760px] lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]"
        >
          <RestaurantPanel restaurant={restaurant} t={t} />

          <section className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
            <div className="mx-auto max-w-3xl">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#A27438]">{t("badge")}</p>
                  <h1 className="mt-1.5 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] sm:text-3xl">{t("subtitle")}</h1>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#EDF6EC] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#46704A] sm:inline-flex"><ShieldCheck size={13} /> {t("chips.quickConfirmation")}</span>
              </div>

              {offer && <OfferCard offer={offer} t={t} />}
              {(offerUnavailable || error === "offer" || error === "offer_owner") && <Alert tone="red" title={error === "offer_owner" ? t("offer.ownerErrorTitle") : t("offer.unavailableTitle")} text={error === "offer_owner" ? t("offer.ownerErrorText") : t("offer.unavailableText")} />}
              {error === "conflict" && <Alert tone="red" title={t("errors.conflict.title")} text={t("errors.conflict.text")} />}
              {error === "past" && <Alert tone="red" title={t("errors.past.title")} text={t("errors.past.text")} />}
              {error === "capacity" && <Alert tone="red" title={t("errors.capacity.title")} text={t("errors.capacity.text")} />}
              {error === "email" && <Alert tone="red" title={t("errors.email.title")} text={t("errors.email.text")} />}

              <div className="rounded-[22px] border border-[#E4D7C6] bg-[#FBF8F4] p-3.5 sm:p-5">
                <PickerHeading icon={<CalendarDays size={16} />} title={t("steps.when")} value={fullSelectedDate} />
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {quickDays.map(({ value, date }) => {
                    const selected = value === selectedDay;
                    return <button key={value} type="button" onClick={() => { setSelectedDay(value); setSelectedHour(""); }} className={`min-w-[66px] rounded-[16px] border px-2 py-2.5 text-center transition ${selected ? "border-[#17120D] bg-[#17120D] text-white shadow-[0_8px_20px_rgba(23,18,13,.18)]" : "border-[#E2D5C3] bg-white text-[#655B50] hover:border-[#B8915D]"}`}>
                      <span className={`block text-[8px] font-black uppercase tracking-[0.12em] ${selected ? "text-[#D8B772]" : "text-[#9B8770]"}`}>{new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date).replace(".", "")}</span>
                      <span className="mt-1 block text-lg font-bold leading-none">{date.getDate()}</span>
                    </button>;
                  })}
                  <label className={`relative grid min-w-[70px] cursor-pointer place-items-center rounded-[16px] border border-dashed px-2 py-2.5 text-center transition ${!quickDays.some((day) => day.value === selectedDay) ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#CDBA9E] bg-[#F7F0E6] text-[#8B6B43]"}`}>
                    <CalendarDays size={16} />
                    <span className="mt-1 text-[8px] font-black uppercase tracking-[0.08em]">{t("otherDate")}</span>
                    <input aria-label={t("steps.when")} type="date" min={today} value={selectedDay} onChange={(event) => { setSelectedDay(event.target.value); setSelectedHour(""); }} className="absolute inset-0 cursor-pointer opacity-0" />
                  </label>
                </div>

                <div className="my-4 h-px bg-[#E8DDCF]" />

                <PickerHeading icon={<Clock3 size={16} />} title={t("steps.time")} value={resolvedHour || "—"} />
                {availableHours.length === 0 ? <div className="mt-3 rounded-[15px] border border-[#E7B7A8] bg-[#FFF0EA] px-4 py-3 text-xs font-semibold text-[#A14E36]">{t("closedDay")}</div> : <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {availableHours.map((hour) => {
                    const selected = resolvedHour === hour;
                    return <button key={hour} type="button" onClick={() => setSelectedHour(hour)} className={`h-10 min-w-[72px] rounded-full border px-4 text-xs font-bold transition ${selected ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#DED0BC] bg-white text-[#655B50] hover:border-[#A97C42]"}`}>{hour}</button>;
                  })}
                </div>}

                <div className="my-4 h-px bg-[#E8DDCF]" />

                <div className="flex items-center justify-between gap-4">
                  <PickerHeading icon={<UsersRound size={16} />} title={t("steps.guests")} value="" />
                  <div className="flex h-11 items-center rounded-full border border-[#DCCBB3] bg-white p-1 shadow-sm">
                    <button type="button" onClick={() => setGuests((current) => Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-full text-[#765C3A] transition hover:bg-[#F3E9DA]" aria-label="-"><Minus size={15} /></button>
                    <label className="relative min-w-[66px] text-center text-sm font-black"><span>{guests}</span><input name="guestsPicker" type="number" min="1" max="500" value={guests} onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))} className="absolute inset-0 w-full opacity-0" aria-label={t("steps.guests")} /></label>
                    <button type="button" onClick={() => setGuests((current) => Math.min(500, current + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-[#17120D] text-white transition hover:bg-[#2A2118]" aria-label="+"><Plus size={15} /></button>
                  </div>
                </div>
              </div>

              {!isCapacityMode && resolvedHour && availableTables.length === 0 && !tableCombination && <Alert tone="red" title={t("noTables.title")} text={t("noTables.text", { guests })} />}
              {tableCombination && <Alert tone="yellow" title={t("pendingApproval.title")} text={t("pendingApproval.text", { guests })} />}

              <form action={createPublicReservation} onSubmit={(event) => {
                if (hasSubmittedRef.current) { event.preventDefault(); return; }
                hasSubmittedRef.current = true;
                setIsSubmitting(true);
              }} className="mt-5">
                <input type="hidden" name="slug" value={restaurant.slug} />
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                {marketingToken && <input type="hidden" name="marketingToken" value={marketingToken} />}
                {offer && <input type="hidden" name="offerCode" value={offer.code} />}
                <input type="hidden" name="date" value={selectedDateValue} />
                <input type="hidden" name="guests" value={guests} />
                <input type="hidden" name="reservationMode" value={restaurant.reservationMode} />
                {!isCapacityMode && <input type="hidden" name="tableId" value={tableIdToSubmit} />}
                <input type="hidden" name="status" value={isPendingRequest ? "PENDING" : "CONFIRMED"} />

                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#A27438]">{t("steps.details")}</p><p className="mt-1 text-xs text-[#786D61]">{t("consent")}</p></div>
                  <span className="hidden items-center gap-1 text-[9px] font-bold text-[#4E744F] sm:flex"><ShieldCheck size={13} /> {t("chips.onlineBooking")}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CompactField label={t("fields.name")}>
                    <input name="customerName" type="text" autoComplete="name" defaultValue={offer?.customerName || ""} placeholder={t("fields.namePlaceholder")} className={inputClass} required />
                  </CompactField>
                  <CompactField label={t("fields.phone")}>
                    <PhoneField name="phone" defaultValue={offer?.customerPhone || ""} required placeholder={t("fields.phonePlaceholder")} />
                  </CompactField>
                  <CompactField label={t("fields.email")} wide>
                    <input name="email" type="email" autoComplete="email" defaultValue={offer?.customerEmail || ""} placeholder={t("fields.emailPlaceholder")} className={inputClass} required />
                  </CompactField>
                </div>
                <details className="group mt-3 rounded-[15px] border border-[#E4D7C6] bg-[#FBF8F4]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[10px] font-bold text-[#786D61] [&::-webkit-details-marker]:hidden"><span>{t("fields.birthDate")} · {t("birthDateOptionalLabel")}</span><ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
                  <div className="border-t border-[#E8DDCF] p-3"><input name="birthDate" type="date" className={inputClass} /><p className="mt-2 px-1 text-[9px] leading-4 text-[#8F8275]">{t("birthDateNote")}</p></div>
                </details>

                <div className="sticky bottom-3 z-20 mt-5 rounded-[21px] border border-white/10 bg-[#17120D] p-2.5 text-white shadow-[0_18px_45px_rgba(23,18,13,.28)] sm:static sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 px-2 sm:mb-0 sm:justify-start">
                    <div><p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#D7B267]">{friendlySelectedDate}</p><p className="mt-0.5 text-sm font-bold">{resolvedHour || "—"} · {t("guestCount", { count: guests })}</p></div>
                    {offer && <span className="rounded-full bg-[#D7B267] px-2.5 py-1 text-[9px] font-black text-[#17120D]">{offer.benefit}</span>}
                  </div>
                  <button type="submit" disabled={!canSubmit || isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[#D7B267] px-6 text-sm font-black text-[#17120D] transition hover:bg-[#E4C47F] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 sm:w-auto sm:min-w-[210px]">{isSubmitting ? t("submitProcessing") : isPendingRequest ? t("submitRequest") : t("submitConfirm")} {!isSubmitting && <Check size={16} />}</button>
                </div>
                <div className="mt-2 text-center"><a href="https://mesalink.pt" aria-label="Visitar MesaLink" className="inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold text-[#8B7863] transition hover:bg-[#F5EBDD] hover:text-[#17120D]">{t("poweredBy")}</a></div>
              </form>
            </div>
          </section>
        </motion.div>
      </div>
    </main>
  );
}

function PublicShell({ restaurant, children }: { restaurant: Restaurant; children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#F1EBE2] px-4 py-6 text-[#17120D]"><div className="mx-auto max-w-xl"><div className="mb-5 flex items-center justify-between"><span className="font-serif text-xl font-bold"><span className="text-[#B48645]">Mesa</span>Link</span><LanguageSwitcher /></div><div className="mb-5 text-center"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A27438]">Reserva online</p><p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{restaurant.name}</p></div>{children}</div></main>;
}

function RestaurantPanel({ restaurant, t }: { restaurant: Restaurant; t: ReturnType<typeof useTranslations> }) {
  const image = restaurant.websiteHeroImage;
  return <aside className="relative min-h-[230px] overflow-hidden bg-[#17120D] text-white lg:min-h-full">
    {image && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />}
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,6,.12),rgba(15,10,6,.93))] lg:bg-[linear-gradient(180deg,rgba(15,10,6,.12),rgba(15,10,6,.96))]" />
    <div className="relative flex min-h-[230px] flex-col justify-between p-5 sm:p-7 lg:min-h-full lg:p-8">
      <div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.16em] backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#8DD08B]" /> {t("chips.onlineBooking")}</span>{restaurant.websiteLogoImage && <span className="h-12 w-12 rounded-full border-2 border-white/30 bg-white bg-cover bg-center shadow-lg" style={{ backgroundImage: `url(${restaurant.websiteLogoImage})` }} />}</div>
      <div>
        <div className="mb-4 h-px w-10 bg-[#D7B267]" />
        <h2 className="max-w-[290px] text-[2.15rem] font-semibold leading-[.95] tracking-[-0.06em] sm:text-[2.6rem]">{restaurant.name}</h2>
        {restaurant.address && <p className="mt-4 flex max-w-[290px] items-start gap-2 text-[11px] leading-5 text-white/65"><MapPin size={14} className="mt-0.5 shrink-0 text-[#D7B267]" /> {restaurant.address}</p>}
        <div className="mt-5 hidden gap-2 lg:flex"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[9px] font-bold text-white/70"><Clock3 size={12} className="text-[#D7B267]" /> {t("chips.quickConfirmation")}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-2 text-[9px] font-bold text-white/70"><Sparkles size={12} className="text-[#D7B267]" /> MesaLink</span></div>
      </div>
    </div>
  </aside>;
}

function PickerHeading({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[#704F2C]"><span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#F1E5D3]">{icon}</span><h2 className="text-sm font-bold text-[#17120D]">{title}</h2></div>{value && <span className="truncate text-[10px] font-semibold capitalize text-[#8B7D6E]">{value}</span>}</div>;
}

function CompactField({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.12em] text-[#786A5C]">{label}</span>{children}</label>;
}

function OfferCard({ offer, t }: { offer: ReservationOffer; t: ReturnType<typeof useTranslations> }) {
  return <div className="mb-4 flex items-center justify-between gap-4 rounded-[18px] border border-[#D6B772] bg-[#FFF6DF] p-3.5"><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#916326]">{t("offer.eyebrow")}</p><p className="mt-1 truncate text-sm font-bold">{offer.title}</p><p className="mt-1 text-[10px] leading-4 text-[#6D5D4A]">{t("offer.appliedOnBooking", { benefit: offer.benefit })}</p></div><div className="shrink-0 rounded-[14px] bg-[#17120D] px-4 py-3 text-center text-white"><p className="text-lg font-black text-[#D7B267]">{offer.benefit}</p><p className="mt-0.5 font-mono text-[7px] tracking-[0.1em] text-white/55">{offer.code}</p></div></div>;
}

function Alert({ tone, title, text }: { tone: "red" | "yellow"; title: string; text: string }) {
  const classes = tone === "red" ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#98472F]" : "border-[#DFC890] bg-[#FFF6DF] text-[#846027]";
  return <div className={`mt-4 rounded-[16px] border px-4 py-3 ${classes}`}><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[10px] leading-4 opacity-80">{text}</p></div>;
}
