"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Crosshair, ExternalLink, ImageIcon, MapPin, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { REFERRAL_ACCESSIBILITY_TAGS, REFERRAL_CUISINE_TAGS, REFERRAL_DIETARY_TAGS, REFERRAL_OCCASION_TAGS, REFERRAL_REQUIREMENT_TAGS } from "@/lib/referral-tags";

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
};

export default function NewReferralGroupForm({
  restaurants,
  defaultCommissionType,
  defaultCommissionAmount,
  publishingEnabled = true,
}: {
  restaurants: PartnerRestaurant[];
  defaultCommissionType: string;
  defaultCommissionAmount: number;
  publishingEnabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [targetMode, setTargetMode] = useState<"ALL" | "FILTERED" | "SELECTED">("ALL");
  const [query, setQuery] = useState("");
  const [restaurantCuisineFilter, setRestaurantCuisineFilter] = useState("ALL");
  const [restaurantLocationFilter, setRestaurantLocationFilter] = useState("");
  const [requestedCuisines, setRequestedCuisines] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [adults, setAdults] = useState(6);
  const [children, setChildren] = useState(0);
  const [commissionType, setCommissionType] = useState(defaultCommissionType);
  const [commissionAmount, setCommissionAmount] = useState(defaultCommissionAmount || 1);
  const [currentPosition, setCurrentPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<"loading" | "ready" | "denied" | "unsupported">("loading");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const cuisines = useMemo(
    () => [...new Set(restaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))].sort(),
    [restaurants],
  );
  const demoCount = restaurants.filter((restaurant) => restaurant.isDemo).length;
  const realCount = restaurants.length - demoCount;
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const normalizedLocation = restaurantLocationFilter.trim().toLowerCase();
    const matches = restaurants.filter((restaurant) => {
      const matchesCuisine = restaurantCuisineFilter === "ALL" || restaurant.cuisine === restaurantCuisineFilter;
      const matchesLocation = !normalizedLocation || restaurant.address.toLowerCase().includes(normalizedLocation);
      const matchesQuery = !normalized || `${restaurant.name} ${restaurant.cuisine} ${restaurant.description} ${restaurant.highlights.join(" ")}`.toLowerCase().includes(normalized);
      return matchesCuisine && matchesLocation && matchesQuery;
    });
    if (!currentPosition) return matches;
    return [...matches].sort((a, b) => distanceTo(a, currentPosition) - distanceTo(b, currentPosition));
  }, [restaurants, query, restaurantCuisineFilter, restaurantLocationFilter, currentPosition]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setLocationState("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationState("ready");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  const guests = adults + children;
  const gross = commissionType === "PER_PERSON" ? guests * commissionAmount : commissionAmount;
  const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);

  function toggle(id: string) {
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    setTargetMode("SELECTED");
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) return setLocationState("unsupported");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationState("ready");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 0 },
    );
  }

  function toggleTag(value: string, values: string[], setValues: (next: string[]) => void, maximum: number) {
    if (values.includes(value)) setValues(values.filter((item) => item !== value));
    else if (values.length < maximum) setValues([...values, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!publishingEnabled) {
      setMessage("Adiciona e valida primeiro o IBAN para publicares este grupo.");
      return;
    }

    if (targetMode === "SELECTED" && selected.length === 0) {
      setMessage("Escolhe pelo menos um restaurante.");
      return;
    }

    if (requestedCuisines.length === 0) {
      setMessage("Escolhe pelo menos um tipo de cozinha para o grupo.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setLoading(true);

    try {
      const response = await fetch("/api/partner-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantIds: selected,
          targetMode,
          restaurantQuery: query,
          restaurantCuisine: restaurantCuisineFilter,
          restaurantLocation: restaurantLocationFilter,
          desiredDate: form.get("desiredDate"),
          alternativeDate: null,
          adults,
          children,
          guests,
          city: form.get("city"),
          area: form.get("area"),
          budgetPerPerson: form.get("budgetPerPerson"),
          occasion: form.get("occasion"),
          accessibility: form.get("accessibility"),
          dietary: form.get("dietary"),
          cuisineTypes: requestedCuisines,
          requirements,
          commissionType,
          commissionAmount,
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          customerEmail: form.get("customerEmail"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Não foi possível publicar o grupo.");
        return;
      }

      setSuccess(true);
      setMessage(`Grupo ${data.publicCode} publicado para ${data.restaurantCount} restaurante(s).`);
      setSelected([]);
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      setMessage("Não foi possível publicar o grupo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
      {!publishingEnabled && <div className="rounded-[18px] border border-[#D8C29E] bg-[#FFF7E8] px-4 py-3 text-xs font-semibold text-[#795D38] xl:col-span-2">Podes explorar os restaurantes. Para publicares um grupo, adiciona primeiro o IBAN.</div>}
      <div className="space-y-4">
        <div className="rounded-[20px] border border-[#E1D0B8] bg-white p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]"><ShieldCheck size={16} /> Contacto protegido</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">Dados do grupo</h2>
          <div className="mt-3 rounded-[18px] border border-[#D7E4D4] bg-[#F3FAF2] p-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4F6C4D]">Contacto protegido</p>
            <p className="mt-1 text-[11px] leading-4 text-[#587255]">O contacto só é revelado ao restaurante que aceitar.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3"><Field label="Nome do cliente"><input name="customerName" required maxLength={100} placeholder="Nome da reserva" className={compactInputClass} /></Field><Field label="Telemóvel"><input name="customerPhone" required maxLength={30} placeholder="+351 9…" className={compactInputClass} /></Field><Field label="Email"><input name="customerEmail" type="email" maxLength={160} placeholder="Opcional" className={compactInputClass} /></Field></div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Data e hora"><input name="desiredDate" type="datetime-local" required className={compactInputClass} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Adultos"><input value={adults} onChange={(event) => setAdults(Math.max(1, Number(event.target.value)))} type="number" min="1" max="200" required className={compactInputClass} /></Field><Field label="Crianças"><input value={children} onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))} type="number" min="0" max="199" required className={compactInputClass} /></Field></div>
            <Field label="Budget / pessoa"><input name="budgetPerPerson" type="number" min="1" step="0.01" placeholder="35" className={compactInputClass} /></Field>
            <Field label="Cidade *"><input name="city" required maxLength={100} placeholder="Lisboa" className={compactInputClass} /></Field>
            <Field label="Zona preferida"><input name="area" placeholder="Chiado, centro…" className={compactInputClass} /></Field>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-[#655A4E]">Tipo de cozinha * <span className="font-normal text-[#8A7D70]">· até 3</span></p><span className="text-[10px] font-bold text-[#8A6130]">{requestedCuisines.length}/3</span></div>
            <div className="mt-2 flex flex-wrap gap-1.5">{REFERRAL_CUISINE_TAGS.map((tag) => { const active = requestedCuisines.includes(tag); return <button key={tag} type="button" aria-pressed={active} onClick={() => toggleTag(tag, requestedCuisines, setRequestedCuisines, 3)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${active ? "border-[#8A6130] bg-[#17120D] text-white" : "border-[#DCC9AC] bg-[#FFF9F0] text-[#6E563A] hover:border-[#B9853E]"}`}>{active && <Check size={10} className="mr-1 inline" />}{tag}</button>; })}</div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Ocasião"><select name="occasion" className={compactInputClass}>{REFERRAL_OCCASION_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Acessibilidade"><select name="accessibility" className={compactInputClass}>{REFERRAL_ACCESSIBILITY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Alimentação"><select name="dietary" className={compactInputClass}>{REFERRAL_DIETARY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
          </div>
          <div className="mt-4"><p className="text-xs font-bold text-[#655A4E]">Outros pedidos <span className="font-normal text-[#8A7D70]">· opcional</span></p><div className="mt-2 flex flex-wrap gap-1.5">{REFERRAL_REQUIREMENT_TAGS.map((tag) => { const active = requirements.includes(tag); return <button key={tag} type="button" aria-pressed={active} onClick={() => toggleTag(tag, requirements, setRequirements, 5)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${active ? "border-[#8A6130] bg-[#FFF0D3] text-[#69491F]" : "border-[#DCC9AC] bg-white text-[#6E563A]"}`}>{active && <Check size={10} className="mr-1 inline" />}{tag}</button>; })}</div></div>
          <p className="mt-3 rounded-xl border border-[#D7E4D4] bg-[#F3FAF2] px-3 py-2.5 text-[11px] leading-4 text-[#4F6C4D]">Enquanto o grupo está aberto, os restaurantes veem apenas os detalhes do pedido. Nome, telefone e email permanecem protegidos até existir uma reserva confirmada.</p>
        </div>

        <div className="rounded-[20px] border border-[#E1D0B8] bg-white p-3.5 sm:p-4">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Restaurantes</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Escolhe quem recebe o pedido</h2></div><span className="rounded-full bg-[#F1E6D5] px-3 py-1 text-[10px] font-bold text-[#795D38]">{realCount} reais{demoCount > 0 ? ` · ${demoCount} DEMO` : ""}</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_170px_auto]">
            <label className="relative block"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8C7E6E]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setTargetMode("FILTERED"); }} placeholder="Nome ou especialidade" className={compactInputClass} style={{ paddingLeft: "2.25rem" }} /></label>
            <select value={restaurantCuisineFilter} onChange={(event) => { setRestaurantCuisineFilter(event.target.value); setTargetMode("FILTERED"); }} className={compactInputClass}><option value="ALL">Todas as cozinhas</option>{cuisines.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <label className="relative block"><MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8C7E6E]" /><input value={restaurantLocationFilter} onChange={(event) => { setRestaurantLocationFilter(event.target.value); setTargetMode("FILTERED"); }} placeholder="Zona ou cidade" className={compactInputClass} style={{ paddingLeft: "2.25rem" }} /></label>
            <button type="button" onClick={requestLocation} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#D8C6A9] bg-white px-3 text-[10px] font-bold text-[#715536]"><Crosshair size={13} />{locationState === "ready" ? "Distância ativa" : locationState === "loading" ? "A localizar…" : "Perto de mim"}</button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {([{"value":"ALL","label":`Enviar a todos (${restaurants.length})`},{"value":"FILTERED","label":`Enviar aos resultados (${filtered.length})`},{"value":"SELECTED","label":`Só selecionados (${selected.length})`}] as const).map((option) => <button key={option.value} type="button" disabled={option.value === "SELECTED" && selected.length === 0} onClick={() => setTargetMode(option.value)} className={`h-9 rounded-full border px-4 text-[11px] font-bold disabled:opacity-35 ${targetMode === option.value ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#D8C6A9] bg-[#FFFDFC] text-[#674E32]"}`}>{option.label}</button>)}
            <button type="button" onClick={() => { setSelected(filtered.map((restaurant) => restaurant.id)); setTargetMode("SELECTED"); }} className="ml-auto h-9 rounded-full border border-[#D8C6A9] px-3 text-[10px] font-bold text-[#715536]">Selecionar resultados</button>
            {selected.length > 0 && <button type="button" onClick={() => { setSelected([]); setTargetMode(query || restaurantLocationFilter || restaurantCuisineFilter !== "ALL" ? "FILTERED" : "ALL"); }} className="h-9 rounded-full px-2 text-[10px] font-bold text-[#9A563F]">Limpar</button>}
          </div>
          {locationState === "denied" && <p className="mt-2 text-[10px] text-[#8A6542]">Autoriza a localização no navegador para veres a distância em quilómetros.</p>}
          <div className="mt-3 space-y-2">
            {filtered.map((restaurant) => {
              const isSelected = selected.includes(restaurant.id);
              const distance = currentPosition ? distanceTo(restaurant, currentPosition) : null;
              return <article key={restaurant.id} className={`rounded-[17px] border p-2.5 transition ${isSelected ? "border-[#9E733D] bg-[#FFF7E9] ring-1 ring-[#C8A56A]/25" : "border-[#E1D0B8] bg-[#FFFDFC] hover:border-[#C8A56A]"}`}>
                <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3">
                  {restaurant.heroImage ? <div className="h-16 rounded-[13px] bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.heroImage})` }} /> : <div className="grid h-16 place-items-center rounded-[13px] bg-[#EADCC7] text-[#9B7D57]"><ImageIcon size={18} /></div>}
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><p className="truncate text-sm font-semibold">{restaurant.name}</p>{restaurant.isDemo && <span className="rounded-full bg-[#FFF2D5] px-1.5 py-0.5 text-[7px] font-black text-[#805D2B]">DEMO</span>}</div><p className="mt-0.5 text-[10px] font-bold text-[#80613D]">{restaurant.cuisine}</p><p className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#6B6258]"><MapPin size={11} className="shrink-0 text-[#9B6F3B]" />{distance !== null && Number.isFinite(distance) ? <strong className="text-[#4F6C4D]">{formatDistance(distance)} ·</strong> : null}<span className="truncate">{restaurant.address || "Portugal"}</span></p></div>
                  <button type="button" aria-pressed={isSelected} onClick={() => toggle(restaurant.id)} className={`grid h-9 w-9 place-items-center rounded-full border ${isSelected ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#D3BE9C] bg-white text-transparent"}`}><Check size={15} /></button>
                </div>
                <details className="group mt-2 border-t border-[#EEE3D3] pt-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><UtensilsCrossed size={14} /> Ver perfil, imagens e menu</span><span className="transition group-open:rotate-180">⌄</span></summary>
                    <div className="mt-2 rounded-xl bg-white p-3"><p className="line-clamp-2 text-[11px] leading-4 text-[#6B6258]">{restaurant.description}</p>
                      {restaurant.galleryImages.length > 0 && <div className="grid grid-cols-3 gap-2">{restaurant.galleryImages.slice(0, 3).map((image) => <div key={image} className="h-16 rounded-xl bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />)}</div>}
                      {restaurant.menuSections.length > 0 && <div className="mt-3 space-y-2">{restaurant.menuSections.slice(0, 3).map((section) => <div key={section.title}><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A6130]">{section.title}</p><p className="mt-1 text-[11px] leading-4 text-[#6B6258]">{section.items.join(" · ")}</p></div>)}</div>}
                      {restaurant.menuUrl && <a href={restaurant.menuUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#7B572B]">Abrir menu completo <ExternalLink size={13} /></a>}
                      {!restaurant.menuUrl && restaurant.menuSections.length === 0 && <p className="text-xs text-[#7A6D60]">O restaurante ainda não publicou o menu.</p>}
                      {restaurant.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noreferrer" className="mt-3 flex w-fit items-center gap-1.5 text-xs font-black text-[#7B572B]"><MapPin size={13} /> Ver localização no mapa <ExternalLink size={12} /></a>}
                    </div>
                  </details>
              </article>;
            })}
            {filtered.length === 0 && <div className="md:col-span-2 rounded-[24px] border border-dashed border-[#D6C3A5] p-8 text-center text-sm text-[#6B6258]">Ainda não existem restaurantes disponíveis com estes filtros.</div>}
          </div>
        </div>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-[20px] border border-[#2C2117] bg-[#17120D] p-3.5 text-white">
          <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D7B267]">Comissão</p><span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold">Recomendado: 1 €</span></div>
          <div className="mt-3 grid grid-cols-[1fr_100px] gap-2">
            <select value={commissionType} onChange={(event) => setCommissionType(event.target.value)} className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs"><option className="text-black" value="PER_PERSON">Por pessoa</option><option className="text-black" value="TOTAL">Total</option></select>
            <input aria-label="Valor da comissão" value={commissionAmount} onChange={(event) => setCommissionAmount(Number(event.target.value))} type="number" min="1" max="1000" step="0.01" className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs" />
          </div>
          <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-xs"><MoneyRow label="Por pessoa" value={money(gross / Math.max(1, guests))} /><MoneyRow label={`Total · ${guests} pessoas`} value={money(gross)} strong /></div>
          <p className="mt-2 text-[9px] leading-4 text-white/45">Ao pagamento são descontadas a comissão MesaLink, taxas de processamento e os impostos aplicáveis.</p>
        </div>
        {message && <div className={`rounded-[22px] border p-4 text-sm font-semibold ${success ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</div>}
        <button disabled={!publishingEnabled || loading || (targetMode === "SELECTED" && selected.length === 0) || (targetMode === "FILTERED" && filtered.length === 0)} className="h-12 w-full rounded-full bg-[#C8A56A] px-5 text-xs font-black text-[#17120D] shadow-[0_14px_35px_rgba(156,112,51,0.18)] disabled:cursor-not-allowed disabled:opacity-45">{!publishingEnabled ? "Adicionar IBAN para publicar" : loading ? "A publicar…" : `Enviar a ${targetMode === "ALL" ? restaurants.length : targetMode === "FILTERED" ? filtered.length : selected.length} restaurante(s)`}</button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#655A4E]">{label}</span>{children}</label>;
}

function MoneyRow({ label, value, muted = false, strong = false }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${muted ? "text-white/45" : ""} ${strong ? "border-t border-white/10 pt-2 text-sm font-bold text-[#E8C985]" : ""}`}><span>{label}</span><span>{value}</span></div>;
}

function distanceTo(restaurant: Pick<PartnerRestaurant, "latitude" | "longitude">, position: { latitude: number; longitude: number }) {
  if (restaurant.latitude == null || restaurant.longitude == null) return Number.POSITIVE_INFINITY;
  const radius = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(restaurant.latitude - position.latitude);
  const longitudeDelta = toRadians(restaurant.longitude - position.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(position.latitude)) * Math.cos(toRadians(restaurant.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distance: number) {
  if (distance < 1) return `${Math.max(50, Math.round(distance * 1000 / 50) * 50)} m`;
  return `${distance < 10 ? distance.toFixed(1) : Math.round(distance)} km`;
}
