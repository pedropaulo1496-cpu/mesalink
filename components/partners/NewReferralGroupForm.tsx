"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Crosshair, ExternalLink, Handshake, ImageIcon, MapPin, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { REFERRAL_ACCESSIBILITY_TAGS, REFERRAL_DIETARY_TAGS, REFERRAL_OCCASION_TAGS, REFERRAL_REQUIREMENT_TAGS } from "@/lib/referral-tags";

const compactInputClass = "input-premium partner-compact-input";

export type PartnerRestaurant = {
  id: string;
  name: string;
  isDemo: boolean;
  cuisine: string;
  address: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  highlights: string[];
  menuUrl: string;
  menuSections: Array<{ title: string; items: string[] }>;
  averageTicket: number;
  latitude: number | null;
  longitude: number | null;
  commissionType: "PER_PERSON" | "TOTAL";
  commissionAmount: number;
  defaultDailyCapacity: number;
  dailyAvailability: Array<{ date: string; capacity: number; reserved: number }>;
  reservedByDay: Record<string, number>;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePriceLevel: number | null;
  googleMapsUrl: string;
  googleBusinessConnected: boolean;
  negotiationStatus: string | null;
  negotiationType: "PER_PERSON" | "TOTAL" | null;
  negotiationAmount: number | null;
};

export default function NewReferralGroupForm({ restaurants, publishingEnabled = true }: { restaurants: PartnerRestaurant[]; publishingEnabled?: boolean }) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [query, setQuery] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);
  const [adults, setAdults] = useState(6);
  const [children, setChildren] = useState(0);
  const [desiredDate, setDesiredDate] = useState("");
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<"loading" | "ready" | "denied" | "unsupported">("loading");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const guests = adults + children;
  const cuisines = useMemo(() => [...new Set(restaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))].sort(), [restaurants]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const matches = restaurants.filter((restaurant) => {
      const remaining = remainingCapacity(restaurant, desiredDate);
      return remaining >= guests
        && (cuisineFilter === "ALL" || restaurant.cuisine === cuisineFilter)
        && (!normalizedLocation || restaurant.address.toLowerCase().includes(normalizedLocation))
        && (!normalized || `${restaurant.name} ${restaurant.cuisine} ${restaurant.description} ${restaurant.highlights.join(" ")}`.toLowerCase().includes(normalized));
    });
    if (!currentPosition) return matches;
    return [...matches].sort((a, b) => distanceTo(a, currentPosition) - distanceTo(b, currentPosition));
  }, [restaurants, query, cuisineFilter, locationFilter, currentPosition, desiredDate, guests]);
  const selectedRestaurant = filtered.find((restaurant) => restaurant.id === selectedRestaurantId) || null;

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setLocationState("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => { setCurrentPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationState("ready"); },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  function requestLocation() {
    if (!("geolocation" in navigator)) return setLocationState("unsupported");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => { setCurrentPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocationState("ready"); },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 0 },
    );
  }

  function toggleRequirement(value: string) {
    setRequirements((items) => items.includes(value) ? items.filter((item) => item !== value) : items.length < 5 ? [...items, value] : items);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    if (!publishingEnabled) return setMessage("Adiciona e valida primeiro o IBAN para receberes as comissões.");
    if (!selectedRestaurant) return setMessage("Escolhe um restaurante disponível.");
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await fetch("/api/partner-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.id,
          desiredDate,
          adults,
          children,
          guests,
          occasion: form.get("occasion"),
          accessibility: form.get("accessibility"),
          dietary: form.get("dietary"),
          cuisineTypes: [selectedRestaurant.cuisine],
          requirements,
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          customerEmail: form.get("customerEmail"),
        }),
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || "Não foi possível confirmar a reserva.");
      setSuccess(true);
      setMessage(`Reserva ${data.publicCode} confirmada no ${data.restaurantName}.`);
      setTimeout(() => window.location.assign("/partners/app?tab=history"), 1400);
    } catch {
      setMessage("Não foi possível confirmar a reserva.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
      {!publishingEnabled && <div className="rounded-[18px] border border-[#D8C29E] bg-[#FFF7E8] px-4 py-3 text-xs font-semibold text-[#795D38] xl:col-span-2">Podes explorar os restaurantes. Para confirmares uma reserva e receberes a comissão, adiciona primeiro o IBAN.</div>}
      <div className="space-y-3">
        <section className="rounded-[20px] border border-[#E1D0B8] bg-white p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]"><ShieldCheck size={14} /> Dados da reserva</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Nome do cliente"><input name="customerName" required maxLength={100} placeholder="Nome da reserva" className={compactInputClass} /></Field>
            <Field label="Telemóvel"><input name="customerPhone" required maxLength={30} placeholder="+351 9…" className={compactInputClass} /></Field>
            <Field label="Email"><input name="customerEmail" type="email" maxLength={160} placeholder="Opcional" className={compactInputClass} /></Field>
            <Field label="Data e hora"><input value={desiredDate} onChange={(event) => setDesiredDate(event.target.value)} name="desiredDate" type="datetime-local" required className={compactInputClass} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Adultos"><input value={adults} onChange={(event) => setAdults(Math.max(1, Number(event.target.value)))} type="number" min="1" max="200" className={compactInputClass} /></Field><Field label="Crianças"><input value={children} onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))} type="number" min="0" max="199" className={compactInputClass} /></Field></div>
            <Field label="Ocasião"><select name="occasion" className={compactInputClass}>{REFERRAL_OCCASION_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Acessibilidade"><select name="accessibility" className={compactInputClass}>{REFERRAL_ACCESSIBILITY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Alimentação"><select name="dietary" className={compactInputClass}>{REFERRAL_DIETARY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">{REFERRAL_REQUIREMENT_TAGS.map((tag) => { const active = requirements.includes(tag); return <button key={tag} type="button" onClick={() => toggleRequirement(tag)} className={`rounded-full border px-3 py-1.5 text-[9px] font-bold ${active ? "border-[#8A6130] bg-[#FFF0D3] text-[#69491F]" : "border-[#DCC9AC] bg-white text-[#6E563A]"}`}>{active && <Check size={9} className="mr-1 inline" />}{tag}</button>; })}</div>
        </section>

        <section className="rounded-[20px] border border-[#E1D0B8] bg-white p-3.5 sm:p-4">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Disponíveis agora</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Escolhe um restaurante</h2></div><span className="rounded-full bg-[#F1E6D5] px-3 py-1 text-[10px] font-bold text-[#795D38]">{filtered.length} opções</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
            <label className="relative block"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7E6E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou especialidade" className={compactInputClass} style={{ paddingLeft: "2.25rem" }} /></label>
            <select value={cuisineFilter} onChange={(event) => setCuisineFilter(event.target.value)} className={compactInputClass}><option value="ALL">Todas as cozinhas</option>{cuisines.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <label className="relative block"><MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7E6E]" /><input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Zona ou cidade" className={compactInputClass} style={{ paddingLeft: "2.25rem" }} /></label>
            <button type="button" onClick={requestLocation} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#D8C6A9] bg-white px-3 text-[10px] font-bold text-[#715536]"><Crosshair size={13} />{locationState === "ready" ? "Distância ativa" : locationState === "loading" ? "A localizar…" : "Perto de mim"}</button>
          </div>
          {!desiredDate && <p className="mt-2 text-[10px] font-semibold text-[#8A6130]">Escolhe a data e o número de pessoas para veres a disponibilidade exata.</p>}
          <div className="mt-3 space-y-2">
            {filtered.map((restaurant) => {
              const selected = restaurant.id === selectedRestaurantId;
              const distance = currentPosition ? distanceTo(restaurant, currentPosition) : null;
              const gross = restaurant.commissionType === "PER_PERSON" ? restaurant.commissionAmount * guests : restaurant.commissionAmount;
              const perPerson = gross / Math.max(1, guests);
              return <article key={restaurant.id} className={`relative rounded-[17px] border p-2.5 transition ${selected ? "border-[#9E733D] bg-[#FFF7E9] ring-1 ring-[#C8A56A]/25" : "border-[#E1D0B8] bg-[#FFFDFC] hover:border-[#C8A56A]"}`}>
                <button type="button" aria-pressed={selected} onClick={() => setSelectedRestaurantId(restaurant.id)} className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border ${selected ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#D3BE9C] bg-white text-transparent"}`}><Check size={15} /></button>
                <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-2.5 pr-11 sm:grid-cols-[64px_minmax(0,1fr)_150px] sm:gap-3">
                  {restaurant.heroImage ? <div className="h-14 rounded-[12px] bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.heroImage})` }} /> : <div className="grid h-14 place-items-center rounded-[12px] bg-[#EADCC7] text-[#9B7D57]"><ImageIcon size={17} /></div>}
                  <div className="min-w-0"><div className="flex flex-wrap items-start gap-1.5"><p className="line-clamp-2 break-words text-sm font-semibold leading-4">{restaurant.name}</p>{restaurant.googleBusinessConnected && <span className="rounded-full bg-[#EAF4E8] px-1.5 py-0.5 text-[7px] font-black text-[#456846]">GOOGLE</span>}{restaurant.isDemo && <span className="rounded-full bg-[#FFF2D5] px-1.5 py-0.5 text-[7px] font-black text-[#805D2B]">DEMO</span>}</div><div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="text-[#80613D]">{restaurant.cuisine}</span>{restaurant.googleRating != null && <span className="text-[#A36D19]">★ {restaurant.googleRating.toFixed(1)} <span className="font-normal text-[#8A7863]">({restaurant.googleReviewCount || 0})</span></span>}{restaurant.googlePriceLevel != null && <span className="tracking-[0.08em] text-[#4F6C4D]">{"€".repeat(Math.min(4, Math.max(1, restaurant.googlePriceLevel)))}</span>}</div><p className="mt-1 flex items-center gap-1 text-[10px] text-[#6B6258]"><MapPin size={11} className="shrink-0 text-[#9B6F3B]" />{distance !== null && Number.isFinite(distance) ? <strong className="shrink-0 text-[#4F6C4D]">{formatDistance(distance)} ·</strong> : null}<span className="line-clamp-1">{restaurant.address || "Portugal"}</span></p></div>
                  <div className="col-start-2 text-left sm:col-start-auto sm:text-right"><p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8A7863]">Comissão</p><p className="mt-0.5 text-sm font-bold text-[#704E27]">{money(perPerson)} / pessoa</p><p className="text-[9px] text-[#8A7863]">{money(gross)} total</p>{desiredDate && <p className="mt-0.5 text-[8px] font-bold text-[#4F6C4D]">{remainingCapacity(restaurant, desiredDate)} lugares livres</p>}</div>
                </div>
                <details className="group mt-2 border-t border-[#EEE3D3] pt-2"><summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><UtensilsCrossed size={12} /> Mini-perfil, fotografias e menu</span><span className="transition group-open:rotate-180">⌄</span></summary><div className="mt-2 rounded-xl bg-white p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] leading-4 text-[#6B6258]">{restaurant.description}</p>{restaurant.googleBusinessConnected && <span className="rounded-full bg-[#EAF4E8] px-2.5 py-1 text-[8px] font-black uppercase text-[#456846]">Perfil Google Maps integrado</span>}</div>{restaurant.galleryImages.length > 0 && <div className="mt-2 grid grid-cols-3 gap-2">{restaurant.galleryImages.slice(0, 3).map((image) => <div key={image} className="h-14 rounded-xl bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />)}</div>}<div className="mt-3 flex flex-wrap gap-3">{restaurant.menuUrl && <a href={restaurant.menuUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#7B572B]">Abrir menu <ExternalLink size={12} /></a>}{restaurant.googleMapsUrl && <a href={restaurant.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#4F6C4D]">Abrir no Google Maps <ExternalLink size={12} /></a>}</div></div></details>
                {!restaurant.isDemo && <CommissionNegotiation restaurant={restaurant} />}
              </article>;
            })}
            {filtered.length === 0 && <div className="rounded-[20px] border border-dashed border-[#D6C3A5] p-6 text-center text-xs text-[#6B6258]">Não existem restaurantes com capacidade para esta data e tamanho de grupo.</div>}
          </div>
        </section>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-[20px] border border-[#2C2117] bg-[#17120D] p-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D7B267]">Reserva imediata</p>
          {selectedRestaurant ? <><p className="mt-2 text-lg font-semibold">{selectedRestaurant.name}</p><p className="mt-1 text-xs text-white/55">{guests} pessoas · {selectedRestaurant.cuisine}</p><div className="mt-3 border-t border-white/10 pt-3"><MoneyRow label="Comissão / pessoa" value={money((selectedRestaurant.commissionType === "PER_PERSON" ? selectedRestaurant.commissionAmount * guests : selectedRestaurant.commissionAmount) / guests)} /><MoneyRow label="Comissão total" value={money(selectedRestaurant.commissionType === "PER_PERSON" ? selectedRestaurant.commissionAmount * guests : selectedRestaurant.commissionAmount)} strong /></div></> : <p className="mt-2 text-xs leading-5 text-white/55">Escolhe um restaurante para veres a comissão e confirmares.</p>}
          <p className="mt-3 text-[9px] leading-4 text-white/45">O restaurante já definiu a comissão e autorizou a reserva automática. Ao valor aplicam-se impostos, comissão MesaLink e taxas de processamento.</p>
        </div>
        {message && <div className={`rounded-[18px] border p-3 text-xs font-semibold ${success ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</div>}
        <button disabled={!publishingEnabled || loading || !selectedRestaurant || !desiredDate} className="h-12 w-full rounded-full bg-[#C8A56A] px-5 text-xs font-black text-[#17120D] shadow-[0_14px_35px_rgba(156,112,51,0.18)] disabled:cursor-not-allowed disabled:opacity-45">{!publishingEnabled ? "Adicionar IBAN" : loading ? "A confirmar…" : "Confirmar reserva"}</button>
      </aside>
    </form>
  );
}

function CommissionNegotiation({ restaurant }: { restaurant: PartnerRestaurant }) {
  const [commissionType, setCommissionType] = useState<"PER_PERSON" | "TOTAL">(restaurant.negotiationType || restaurant.commissionType);
  const [amount, setAmount] = useState(String(restaurant.negotiationAmount || restaurant.commissionAmount));
  const [status, setStatus] = useState(restaurant.negotiationStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/partners/commission-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId: restaurant.id, commissionType, commissionAmount: Number(amount) }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível enviar o pedido.");
    setStatus("PENDING");
    setMessage("Pedido enviado ao restaurante.");
  }

  return <details className="group mt-2 border-t border-[#EEE3D3] pt-2">
    <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><Handshake size={12} /> Pedir outra comissão {status === "PENDING" ? "· pendente" : status === "ACCEPTED" ? "· aceite" : ""}</span><span className="transition group-open:rotate-180">⌄</span></summary>
    <div className="mt-2 grid gap-2 rounded-xl bg-white p-2.5 sm:grid-cols-[130px_90px_auto]">
      <select value={commissionType} onChange={(event) => setCommissionType(event.target.value as "PER_PERSON" | "TOTAL")} className="input-premium h-9 text-xs"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total</option></select>
      <input value={amount} onChange={(event) => setAmount(event.target.value)} onKeyDown={(event) => event.key === "Enter" && event.preventDefault()} type="number" min="0.5" max="1000" step="0.01" aria-label="Nova comissão" className="input-premium h-9 text-xs" />
      <button type="button" onClick={sendRequest} disabled={loading} className="h-9 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white disabled:opacity-50">{loading ? "A enviar…" : status === "PENDING" ? "Atualizar pedido" : "Enviar pedido"}</button>
      {message && <p className="text-[9px] font-semibold text-[#4F6C4D] sm:col-span-3">{message}</p>}
    </div>
  </details>;
}

function remainingCapacity(restaurant: PartnerRestaurant, desiredDate: string) {
  if (!desiredDate) return restaurant.defaultDailyCapacity;
  const key = desiredDate.slice(0, 10);
  const override = restaurant.dailyAvailability.find((item) => item.date === key);
  const capacity = override?.capacity ?? restaurant.defaultDailyCapacity;
  const reserved = override?.reserved ?? restaurant.reservedByDay[key] ?? 0;
  return Math.max(0, capacity - reserved);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#655A4E]">{label}</span>{children}</label>;
}

function MoneyRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 text-xs ${strong ? "mt-2 border-t border-white/10 pt-2 font-bold text-[#E8C985]" : ""}`}><span>{label}</span><span>{value}</span></div>;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function distanceTo(restaurant: Pick<PartnerRestaurant, "latitude" | "longitude">, position: { latitude: number; longitude: number }) {
  if (restaurant.latitude == null || restaurant.longitude == null) return Number.POSITIVE_INFINITY;
  const radius = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(restaurant.latitude - position.latitude);
  const longitudeDelta = toRadians(restaurant.longitude - position.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(toRadians(position.latitude)) * Math.cos(toRadians(restaurant.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distance: number) {
  if (distance < 1) return `${Math.max(50, Math.round(distance * 1000 / 50) * 50)} m`;
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
}
