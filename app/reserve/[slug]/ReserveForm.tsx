"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  CalendarDays,
  BellRing,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Gift,
  MapPin,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Phone,
  UsersRound,
  ArrowRight,
} from "lucide-react";
import PhoneField from "@/components/PhoneField";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { noShowDepositForReservation, reservationServiceFee, type NoShowRule } from "@/lib/reservation-commerce";

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
  phone: string | null;
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
  timeBlocks: Array<{ day: string; time: string }>;
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

type DiningExperience = {
  id: string;
  title: string;
  summary: string;
  details: string | null;
  servicePeriods: string[];
  scheduleType: "FLEXIBLE" | "FIXED" | string;
  paymentMode: "AT_RESTAURANT" | "DEPOSIT" | "PREPAID" | string;
  depositPerPerson: number | null;
  startsAt: string | null;
  pricePerPerson: number;
  capacityRemaining: number;
  addOns: { id: string; name: string; description: string | null; price: number; perGuest: boolean }[];
};

type NearbyRestaurant = {
  name: string;
  slug: string;
  address: string | null;
  cuisine: string | null;
  image: string | null;
  distanceKm: number;
  url: string;
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
  const blocked = new Set(restaurant.timeBlocks.filter((block) => block.day === selectedDay).map((block) => block.time));
  return !open && hours.length === 0 ? [] : [...new Set(hours)].filter((time) => !blocked.has(time));
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

function servicePeriodForHour(hour: string) {
  const value = Number(hour.split(":")[0]);
  return Number.isFinite(value) && value < 17 ? "LUNCH" : "DINNER";
}

function reservationAlertVisitorId() {
  const storageKey = "mesalink_public_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const generated = typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

function reservationAlertSource() {
  const source = new URLSearchParams(window.location.search).get("utm_source")?.toLowerCase() || "";
  if (source.includes("google")) return "google_maps";
  if (source.includes("instagram")) return "instagram";
  if (source.includes("facebook")) return "facebook";
  const referrer = document.referrer.toLowerCase();
  if (referrer.includes("google.")) return "google_maps";
  if (referrer.includes("instagram.")) return "instagram";
  if (referrer.includes("facebook.")) return "facebook";
  return referrer ? "website" : "direct";
}

export default function ReserveForm({
  restaurant,
  error,
  marketingToken,
  offer,
  offerUnavailable,
  experiences,
  noShowRule,
  initialDate,
  initialTime,
  initialGuests,
  nearbyReferralToken,
  referredFrom,
  createPublicReservation,
}: {
  restaurant: Restaurant;
  error?: string;
  marketingToken?: string;
  offer?: ReservationOffer;
  offerUnavailable?: boolean;
  experiences: DiningExperience[];
  noShowRule: NoShowRule;
  initialDate?: string;
  initialTime?: string;
  initialGuests?: number;
  nearbyReferralToken?: string;
  referredFrom?: string;
  createPublicReservation: (formData: FormData) => void;
}) {
  const t = useTranslations("publicFlows.reserve");
  const locale = useLocale();
  const today = localDateValue(new Date());
  const [selectedDay, setSelectedDay] = useState(initialDate || today);
  const [selectedHour, setSelectedHour] = useState(initialTime || "");
  const [guests, setGuests] = useState(initialGuests || 2);
  const [selectedExperienceId, setSelectedExperienceId] = useState("");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertStatus, setAlertStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const hasSubmittedRef = useRef(false);

  async function notifyRestaurant() {
    if (alertStatus === "sending" || alertStatus === "sent") return;
    setAlertStatus("sending");
    try {
      const response = await fetch("/api/public/reservation-unavailable-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: restaurant.slug,
          visitorId: reservationAlertVisitorId(),
          source: reservationAlertSource(),
        }),
      });
      if (!response.ok) throw new Error("Unable to send alert");
      setAlertStatus("sent");
    } catch {
      setAlertStatus("error");
    }
  }

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
  const bookableExperiences = nearbyReferralToken ? [] : experiences;
  const requestedExperience = bookableExperiences.find((experience) => experience.id === selectedExperienceId) || null;
  const fixedExperience = requestedExperience?.scheduleType === "FIXED" ? requestedExperience : null;
  const experienceDate = fixedExperience?.startsAt ? new Date(fixedExperience.startsAt) : null;
  const experienceDay = experienceDate ? localDateValue(experienceDate) : "";
  const experienceHour = experienceDate ? `${String(experienceDate.getHours()).padStart(2, "0")}:${String(experienceDate.getMinutes()).padStart(2, "0")}` : "";
  const normalResolvedHour = availableHours.includes(selectedHour) ? selectedHour : availableHours[0] ?? "";
  const resolvedHour = fixedExperience ? experienceHour : normalResolvedHour;
  const selectedExperience = requestedExperience && (
    requestedExperience.scheduleType === "FIXED"
    || requestedExperience.servicePeriods.includes(servicePeriodForHour(resolvedHour))
  ) ? requestedExperience : null;
  const effectiveSelectedDay = fixedExperience ? experienceDay : selectedDay;
  const selectedDateValue = resolvedHour ? `${effectiveSelectedDay}T${resolvedHour}` : "";
  const isCapacityMode = restaurant.reservationMode === "CAPACITY" || selectedExperience?.scheduleType === "FIXED";
  const availableExperiences = bookableExperiences.filter((experience) => experience.scheduleType === "FIXED" || experience.servicePeriods.includes(servicePeriodForHour(normalResolvedHour)));

  const freeTables = (() => {
    if (!resolvedHour) return [];
    const date = new Date(`${effectiveSelectedDay}T${resolvedHour}:00`);
    return restaurant.tables.filter((table) => isTableAvailable(date, table.reservations));
  })();
  const availableTables = freeTables.filter((table) => table.capacity >= guests);
  const tableCombination = (() => {
    if (isCapacityMode || availableTables.length > 0) return null;
    return findTableCombination(freeTables, guests);
  })();
  const isPendingRequest = !isCapacityMode && availableTables.length === 0 && !!tableCombination;
  const tableIdToSubmit = isPendingRequest
    ? tableCombination?.tables[0]?.id ?? ""
    : isCapacityMode ? "" : availableTables[0]?.id ?? "";
  const canSubmit = Boolean(resolvedHour && (isCapacityMode || tableIdToSubmit) && nearbyRestaurants.length === 0);

  const selectedDate = dateFromValue(effectiveSelectedDay);
  const friendlySelectedDate = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(selectedDate);
  const fullSelectedDate = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(selectedDate);
  const selectedAddOns = selectedExperience?.addOns.filter((addOn) => selectedAddOnIds.includes(addOn.id)) || [];
  const experienceBase = selectedExperience ? selectedExperience.pricePerPerson * guests : 0;
  const experienceAddOns = selectedAddOns.reduce((sum, addOn) => sum + addOn.price * (addOn.perGuest ? guests : 1), 0);
  const experienceSubtotal = experienceBase + experienceAddOns;
  const experienceFee = selectedExperience?.paymentMode === "PREPAID" ? reservationServiceFee(experienceSubtotal) : 0;
  const experienceTotal = experienceSubtotal + experienceFee;
  const menuDepositBase = selectedExperience?.paymentMode === "DEPOSIT" ? (selectedExperience.depositPerPerson || 0) * guests : 0;
  const menuDepositFee = menuDepositBase > 0 ? reservationServiceFee(menuDepositBase) : 0;
  const menuDepositTotal = menuDepositBase + menuDepositFee;
  const depositQuote = !nearbyReferralToken && !selectedExperience && selectedDateValue
    ? noShowDepositForReservation(noShowRule, new Date(`${selectedDateValue}:00`), guests)
    : null;
  const requiresPayment = selectedExperience?.paymentMode === "PREPAID" || menuDepositBase > 0 || Boolean(depositQuote);

  useEffect(() => {
    if (!selectedDateValue || selectedExperience || nearbyReferralToken) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setNearbyLoading(true);
      try {
        const selected = new Date(`${selectedDateValue}:00`);
        const query = new URLSearchParams({ slug: restaurant.slug, date: selected.toISOString(), day: effectiveSelectedDay, time: resolvedHour, guests: String(guests) });
        const response = await fetch(`/api/public/nearby-restaurants?${query.toString()}`, { signal: controller.signal });
        const data = response.ok ? await response.json() : { restaurants: [] };
        setNearbyRestaurants(Array.isArray(data.restaurants) ? data.restaurants : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setNearbyRestaurants([]);
      } finally {
        if (!controller.signal.aborted) setNearbyLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [effectiveSelectedDay, guests, nearbyReferralToken, restaurant.slug, resolvedHour, selectedDateValue, selectedExperience]);

  if (!restaurant.onlineReservationsEnabled) {
    return <PublicShell restaurant={restaurant}>
      <div className="overflow-hidden rounded-[28px] border border-[#DDC9AC] bg-white text-left shadow-[0_24px_80px_rgba(60,42,24,.1)]">
        <div className="bg-[#17120D] px-6 py-7 text-white sm:px-9 sm:py-9">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[#D7B267] text-[#17120D]"><CalendarDays size={21} /></span>
          <p className="mt-6 text-[9px] font-black uppercase tracking-[0.24em] text-[#D7B267]">{restaurant.name}</p>
          <h1 className="mt-2 max-w-lg text-3xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-4xl">{t("unavailable.title")}</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">{t("unavailable.text")}</p>
        </div>
        <div className="p-5 sm:p-7">
          {alertStatus === "sent" ? (
            <div className="flex items-start gap-3 rounded-[18px] border border-[#BFD8C0] bg-[#EFF8EF] p-4 text-[#315B36]">
              <Check size={19} className="mt-0.5 shrink-0" />
              <div><strong className="block text-sm">{t("unavailable.notified")}</strong><span className="mt-1 block text-xs leading-5 opacity-75">{t("unavailable.notifiedText")}</span></div>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <button type="button" onClick={notifyRestaurant} disabled={alertStatus === "sending"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white transition hover:bg-[#2B2118] disabled:cursor-wait disabled:opacity-70">
                {alertStatus === "sending" ? <LoaderCircle size={17} className="animate-spin" /> : <BellRing size={17} />}
                {alertStatus === "sending" ? t("unavailable.notifying") : t("unavailable.notify")}
              </button>
              {restaurant.phone && <a href={`tel:${restaurant.phone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#DCC7A9] px-5 text-sm font-bold text-[#6E512E] transition hover:bg-[#FBF5EB]"><Phone size={16} />{t("unavailable.contact")}</a>}
            </div>
          )}
          {alertStatus === "error" && <p className="mt-3 text-center text-xs font-semibold text-[#A24835]">{t("unavailable.notifyError")}</p>}
          <p className="mt-4 text-center text-[11px] leading-5 text-[#8B7D6E]">{t("unavailable.privacy")}</p>
        </div>
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
              {error === "blocked" && <Alert tone="red" title="Horário indisponível" text="O restaurante bloqueou novas reservas nesta hora apenas para este dia. Escolhe outro horário." />}
              {error === "email" && <Alert tone="red" title={t("errors.email.title")} text={t("errors.email.text")} />}
              {error === "payment" && <Alert tone="red" title="Pagamento não concluído" text="A reserva ainda não foi confirmada. Tenta novamente ou escolhe uma reserva normal." />}
              {error === "experience" && <Alert tone="red" title="Menu indisponível" text="Entretanto este menu ficou indisponível para esta data ou serviço." />}
              {error === "referral" && <Alert tone="red" title="Esta sugestão já não está disponível" text="A disponibilidade ou as condições mudaram entretanto. Volta ao restaurante anterior e escolhe outra sugestão." />}
              {nearbyReferralToken && <div className="mb-4 rounded-[20px] border border-[#BFD8C0] bg-[#EFF8EF] p-4 text-[#315B36]"><p className="text-[9px] font-black uppercase tracking-[.18em]">Sugestão MesaLink Partners</p><p className="mt-1 text-sm font-bold">Mesa disponível em {restaurant.name}</p><p className="mt-1 text-[10px] leading-5 opacity-80">{referredFrom ? `${referredFrom} recomendou este restaurante porque não tinha mesa para o horário escolhido.` : "Chegaste aqui através de outro restaurante MesaLink."} A reserva continua a ser feita diretamente e sem custos adicionais para ti.</p></div>}

              {bookableExperiences.length > 0 && <section className="mb-4 overflow-hidden rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0]"><div className="flex flex-wrap items-end justify-between gap-2 px-4 pb-3 pt-4 sm:px-5"><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-[#A27438]">Escolhe a experiência</p><h2 className="mt-1 text-xl font-semibold tracking-[-.04em]">Mesa simples ou menu completo.</h2></div><span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#776957]">Valores reais por pessoa</span></div><div className="flex gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5"><MenuChoiceCard active={!selectedExperience} title="Só reservar mesa" price={null} meta="Sem menu · consumo à carta" summary="Escolhe a data, a hora e o número de pessoas." onClick={() => { setSelectedExperienceId(""); setSelectedAddOnIds([]); }}/>{availableExperiences.map((experience) => { const starts = experience.startsAt ? new Date(experience.startsAt) : null; const period = experience.servicePeriods.length === 1 ? experience.servicePeriods[0] === "LUNCH" ? "Só almoços" : "Só jantares" : "Almoço e jantar"; const payment = experience.paymentMode === "PREPAID" ? "Pagamento total na reserva" : experience.paymentMode === "DEPOSIT" ? `${formatMoney(experience.depositPerPerson || 0)} entrada / pessoa` : "Sem entrada"; return <MenuChoiceCard key={experience.id} active={selectedExperience?.id === experience.id} title={experience.title} price={experience.pricePerPerson} meta={`${starts ? `${starts.toLocaleDateString(locale, { day: "numeric", month: "short" })} · ${starts.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}` : period} · ${payment}`} summary={experience.summary} onClick={() => { setNearbyRestaurants([]); setSelectedExperienceId(experience.id); setSelectedAddOnIds([]); setGuests((current) => Math.min(current, experience.capacityRemaining)); }}/>; })}</div></section>}

              <div className="rounded-[22px] border border-[#E4D7C6] bg-[#FBF8F4] p-3.5 sm:p-5">
                {selectedExperience && <div className="mb-4 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top_right,#6A4725_0,#2A1C12_46%,#17120D_100%)] text-white shadow-[0_16px_36px_rgba(35,24,14,.16)]"><div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[.2em] text-[#E1BD6B]">Menu selecionado</p><h2 className="mt-2 text-2xl font-semibold leading-none tracking-[-.05em]">{selectedExperience.title}</h2><p className="mt-2 text-xs leading-5 text-white/60">{selectedExperience.summary}</p></div><TicketBadge /></div><div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4"><div><strong className="text-2xl text-[#E1BD6B]">{formatMoney(selectedExperience.pricePerPerson)}</strong><span className="ml-1 text-[10px] text-white/45">/ pessoa</span></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75">{selectedExperience.paymentMode === "PREPAID" ? "Pago na reserva" : selectedExperience.paymentMode === "DEPOSIT" ? `${formatMoney(selectedExperience.depositPerPerson || 0)} entrada / pessoa` : "Sem entrada"}</span></div></div>{selectedExperience.details && <details className="group border-t border-white/10 bg-black/10"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#E9CF94] [&::-webkit-details-marker]:hidden"><span>Ver tudo o que está incluído</span><ChevronDown size={14} className="transition group-open:rotate-180"/></summary><p className="whitespace-pre-line border-t border-white/10 px-4 py-4 text-[11px] leading-5 text-white/68">{selectedExperience.details}</p></details>}</div>}
                {selectedExperience?.scheduleType !== "FIXED" && <>
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
                </div>}</>}

                <div className="my-4 h-px bg-[#E8DDCF]" />

                <div className="flex items-center justify-between gap-4">
                  <PickerHeading icon={<UsersRound size={16} />} title={t("steps.guests")} value="" />
                  <div className="flex h-11 items-center rounded-full border border-[#DCCBB3] bg-white p-1 shadow-sm">
                    <button type="button" onClick={() => setGuests((current) => Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-full text-[#765C3A] transition hover:bg-[#F3E9DA]" aria-label="-"><Minus size={15} /></button>
                    <label className="relative min-w-[66px] text-center text-sm font-black"><span>{guests}</span><input name="guestsPicker" type="number" min="1" max={selectedExperience?.capacityRemaining || 500} value={guests} onChange={(event) => setGuests(Math.min(selectedExperience?.capacityRemaining || 500, Math.max(1, Number(event.target.value) || 1)))} className="absolute inset-0 w-full opacity-0" aria-label={t("steps.guests")} /></label>
                    <button type="button" onClick={() => setGuests((current) => Math.min(selectedExperience?.capacityRemaining || 500, current + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-[#17120D] text-white transition hover:bg-[#2A2118]" aria-label="+"><Plus size={15} /></button>
                  </div>
                </div>
              </div>

              {selectedExperience?.addOns.length ? <section className="mt-3 rounded-[20px] border border-[#E4D7C6] bg-white p-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#A27438]">Extras opcionais do menu</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{selectedExperience.addOns.map((addOn) => { const selected = selectedAddOnIds.includes(addOn.id); return <label key={addOn.id} className={`flex cursor-pointer items-center gap-3 rounded-[16px] border p-3 transition ${selected ? "border-[#A97C42] bg-[#FFF8EC]" : "border-[#E6D9C8]"}`}><input type="checkbox" checked={selected} onChange={() => setSelectedAddOnIds((current) => current.includes(addOn.id) ? current.filter((id) => id !== addOn.id) : [...current, addOn.id])} className="h-4 w-4 accent-[#17120D]"/><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{addOn.name}</span><span className="block text-[10px] text-[#817568]">{formatMoney(addOn.price)}{addOn.perGuest ? " / pessoa" : ""}</span></span></label>; })}</div></section> : null}
              {(selectedExperience || depositQuote) && <section className="mt-3 grid gap-3 rounded-[18px] border border-[#C9B080] bg-[#FFF3D8] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#9B6F3B]"><CreditCard size={16}/></span><div><p className="text-sm font-bold">{selectedExperience?.paymentMode === "PREPAID" ? `Pagar agora: ${formatMoney(experienceTotal)}` : selectedExperience?.paymentMode === "DEPOSIT" ? `Entrada agora: ${formatMoney(menuDepositTotal)}` : depositQuote ? `Depósito: ${formatMoney(depositQuote.totalAmount)}` : `Sem entrada · paga no restaurante`}</p><p className="mt-1 text-[11px] leading-5 text-[#766550]">{selectedExperience?.paymentMode === "PREPAID" ? `Menu e extras: ${formatMoney(experienceSubtotal)}. Serviço MesaLink: ${formatMoney(experienceFee)}.` : selectedExperience?.paymentMode === "DEPOSIT" ? `${formatMoney(menuDepositBase)} de entrada para o restaurante + ${formatMoney(menuDepositFee)} de serviço. Restante do menu no restaurante: ${formatMoney(Math.max(0, experienceSubtotal - menuDepositBase))}.` : depositQuote ? `O depósito de ${formatMoney(depositQuote.baseAmount)} é descontado na conta final; a taxa de serviço é ${formatMoney(depositQuote.serviceFee)}.` : `Valor real do menu para ${guests} pessoa(s): ${formatMoney(experienceSubtotal)}. Não é pedido cartão nem depósito.`}</p></div>{selectedExperience && <div className="rounded-[14px] bg-white px-3 py-2 text-right"><p className="text-[8px] font-black uppercase tracking-[.12em] text-[#96703F]">Total do menu</p><strong className="mt-0.5 block text-base">{formatMoney(experienceSubtotal)}</strong></div>}</section>}

              {!isCapacityMode && resolvedHour && availableTables.length === 0 && !tableCombination && <Alert tone="red" title={t("noTables.title")} text={t("noTables.text", { guests })} />}
              {tableCombination && <Alert tone="yellow" title={t("pendingApproval.title")} text={t("pendingApproval.text", { guests })} />}
              {(nearbyLoading || nearbyRestaurants.length > 0) && !nearbyReferralToken && <section className="mt-4 overflow-hidden rounded-[22px] border border-[#CDBA98] bg-[#FFF8EA]"><div className="px-4 pb-3 pt-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9B6F3B]">MesaLink Partners por perto</p><h3 className="mt-1 text-lg font-semibold">{nearbyLoading ? "A procurar mesas próximas…" : "Aqui está cheio, mas encontrámos mesa perto."}</h3><p className="mt-1 text-[10px] leading-5 text-[#75695D]">Mantemos a mesma data, hora e número de pessoas.</p></div>{nearbyRestaurants.length > 0 && <div className="grid gap-2 border-t border-[#E4D5BD] p-3">{nearbyRestaurants.map((nearby) => <Link key={nearby.slug} href={nearby.url} className="group grid grid-cols-[54px_minmax(0,1fr)_32px] items-center gap-3 rounded-[17px] border border-[#E1D3BF] bg-white p-2.5 transition hover:border-[#A97C42] hover:shadow-md"><span className="h-14 rounded-[13px] bg-[#EFE4D3] bg-cover bg-center" style={nearby.image ? { backgroundImage: `url(${nearby.image})` } : undefined} /><span className="min-w-0"><strong className="block truncate text-sm">{nearby.name}</strong><span className="mt-1 block truncate text-[9px] text-[#7C7063]">{nearby.cuisine || "Restaurante"} · {nearby.distanceKm} km{nearby.address ? ` · ${nearby.address}` : ""}</span><span className="mt-1.5 block text-[9px] font-black text-[#4F7653]">Disponibilidade confirmada agora</span></span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#17120D] text-white transition group-hover:translate-x-0.5"><ArrowRight size={13} /></span></Link>)}</div>}</section>}

              <form action={createPublicReservation} onSubmit={(event) => {
                if (hasSubmittedRef.current) { event.preventDefault(); return; }
                hasSubmittedRef.current = true;
                setIsSubmitting(true);
              }} className="mt-5">
                <input type="hidden" name="slug" value={restaurant.slug} />
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                {marketingToken && <input type="hidden" name="marketingToken" value={marketingToken} />}
                {offer && <input type="hidden" name="offerCode" value={offer.code} />}
                {nearbyReferralToken && <input type="hidden" name="nearbyReferralToken" value={nearbyReferralToken} />}
                {selectedExperience && <input type="hidden" name="experienceId" value={selectedExperience.id} />}
                {selectedAddOnIds.map((id) => <input key={id} type="hidden" name="addOnIds" value={id} />)}
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
                    <div><p className="text-[8px] font-black uppercase tracking-[0.15em] text-[#D7B267]">{friendlySelectedDate}</p><p className="mt-0.5 text-sm font-bold">{resolvedHour || "—"} · {t("guestCount", { count: guests })}{selectedExperience ? ` · menu ${formatMoney(experienceSubtotal)}` : depositQuote ? ` · depósito ${formatMoney(depositQuote.totalAmount)}` : ""}</p></div>
                    {offer && <span className="rounded-full bg-[#D7B267] px-2.5 py-1 text-[9px] font-black text-[#17120D]">{offer.benefit}</span>}
                  </div>
                  <button type="submit" disabled={!canSubmit || isSubmitting} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[#D7B267] px-6 text-sm font-black text-[#17120D] transition hover:bg-[#E4C47F] disabled:cursor-not-allowed disabled:bg-white/12 disabled:text-white/35 sm:w-auto sm:min-w-[210px]">{isSubmitting ? t("submitProcessing") : selectedExperience?.paymentMode === "DEPOSIT" ? `Pagar entrada · ${formatMoney(menuDepositTotal)}` : requiresPayment ? "Continuar para pagamento" : isPendingRequest ? t("submitRequest") : t("submitConfirm")} {!isSubmitting && <Check size={16} />}</button>
                </div>
                <div className="mt-2 text-center"><Link href="/" aria-label="Visitar MesaLink" className="inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold text-[#8B7863] transition hover:bg-[#F5EBDD] hover:text-[#17120D]">{t("poweredBy")}</Link></div>
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

function TicketBadge() {
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-[#D7B267]"><Gift size={17}/></span>;
}

function MenuChoiceCard({ active, title, price, meta, summary, onClick }: { active: boolean; title: string; price: number | null; meta: string; summary: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`relative min-w-[248px] max-w-[248px] overflow-hidden rounded-[20px] border p-4 text-left transition sm:min-w-[270px] sm:max-w-[270px] ${active ? "border-[#17120D] bg-[#17120D] text-white shadow-[0_12px_30px_rgba(35,24,14,.18)]" : "border-[#E0CFB8] bg-white text-[#17120D] hover:-translate-y-0.5 hover:border-[#B88B4E]"}`}>
    <span className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border ${active ? "border-[#D7B267] bg-[#D7B267] text-[#17120D]" : "border-[#D8C8B4] bg-[#FFF9F0] text-transparent"}`}><Check size={13}/></span>
    <span className={`grid h-9 w-9 place-items-center rounded-[13px] ${active ? "bg-white/10 text-[#D7B267]" : "bg-[#F4E8D7] text-[#9B6F3B]"}`}>{price == null ? <CalendarDays size={16}/> : <Gift size={16}/>}</span>
    <div className="mt-4 pr-6"><p className="truncate text-base font-bold">{title}</p><p className={`mt-1 line-clamp-2 min-h-8 text-[10px] leading-4 ${active ? "text-white/55" : "text-[#796D60]"}`}>{summary}</p></div>
    <div className={`mt-4 border-t pt-3 ${active ? "border-white/10" : "border-[#EEE3D4]"}`}><div className="flex items-end justify-between gap-2">{price == null ? <strong className={`text-sm ${active ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>À carta</strong> : <div><strong className={`text-xl ${active ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{formatMoney(price)}</strong><span className={`ml-1 text-[9px] ${active ? "text-white/40" : "text-[#938676]"}`}>/pessoa</span></div>}</div><p className={`mt-2 truncate text-[9px] font-semibold ${active ? "text-white/48" : "text-[#86796A]"}`}>{meta}</p></div>
  </button>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
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
