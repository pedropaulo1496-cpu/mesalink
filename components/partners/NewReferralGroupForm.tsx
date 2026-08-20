"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Check, Crosshair, ExternalLink, Handshake, ImageIcon, LoaderCircle, MapPin, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { REFERRAL_ACCESSIBILITY_TAGS, REFERRAL_DIETARY_TAGS, REFERRAL_OCCASION_TAGS, REFERRAL_REQUIREMENT_TAGS } from "@/lib/referral-tags";

const compactInputClass = "input-premium partner-compact-input";

export type PartnerRestaurant = {
  id: string;
  source: "MESALINK" | "OPEN_DATA";
  googlePlaceId: string | null;
  externalPlaceProvider: string | null;
  externalPlaceId: string | null;
  name: string;
  isDemo: boolean;
  bookingReady: boolean;
  contactEmail: string;
  cuisine: string;
  address: string;
  description: string;
  heroImage: string;
  heroImageKind: "PHOTO" | "NONE";
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
  totalCapacity: number;
  reservationSlots: Array<{ date: string; guests: number; partner: boolean }>;
  blockedSlots: Array<{ day: string; time: string }>;
  dailyAvailability: Array<{ date: string; capacity: number; reserved: number }>;
  reservedByDay: Record<string, number>;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePriceLevel: number | null;
  ratingSource: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
  websiteUrl: string;
  openingHours: string;
  googleMapsUrl: string;
  googleBusinessConnected: boolean;
  negotiationStatus: string | null;
  negotiationRequestId: string | null;
  negotiationInitiator: string | null;
  negotiationType: "PER_PERSON" | "TOTAL" | null;
  negotiationAmount: number | null;
  negotiationMessage: string | null;
};

type ExternalRestaurantSearchItem = {
  provider: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  cuisine: string;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  mapUrl: string;
  websiteUrl: string;
  heroImage: string;
  galleryImages: string[];
  description: string;
  openingHours: string;
  ratingSource: string;
  photoAttribution?: string;
  photoAttributionUri?: string;
  contactEmail: string;
  mesalinkRestaurantId: string | null;
  bookingReady: boolean;
};

type ExternalRestaurantEnrichment = Pick<ExternalRestaurantSearchItem, "provider" | "placeId" | "websiteUrl" | "heroImage" | "galleryImages" | "description" | "openingHours" | "rating" | "reviewCount" | "ratingSource" | "priceLevel" | "contactEmail" | "photoAttribution" | "photoAttributionUri">;

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
  const [catalogRestaurants, setCatalogRestaurants] = useState<PartnerRestaurant[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState("");
  const [catalogConfigured, setCatalogConfigured] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const guests = adults + children;
  const allRestaurants = useMemo(() => {
    const localPlaceIds = new Set(restaurants.map(externalPlaceKey).filter(Boolean));
    const localIdentities = new Set(restaurants.map(restaurantIdentity));
    const localIds = new Set(restaurants.map((restaurant) => restaurant.id));
    return [
      ...restaurants,
      ...catalogRestaurants.filter((restaurant) => !localIds.has(restaurant.id) && !localPlaceIds.has(externalPlaceKey(restaurant)) && !localIdentities.has(restaurantIdentity(restaurant))),
    ];
  }, [restaurants, catalogRestaurants]);
  const cuisines = useMemo(() => [...new Set(allRestaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))].sort(), [allRestaurants]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const matches = allRestaurants.filter((restaurant) => {
      const remaining = remainingCapacity(restaurant, desiredDate);
      return (!restaurant.bookingReady || remaining >= guests)
        && (cuisineFilter === "ALL" || restaurant.cuisine === cuisineFilter)
        && (!normalizedLocation || restaurant.address.toLowerCase().includes(normalizedLocation))
        && (!normalized || `${restaurant.name} ${restaurant.cuisine} ${restaurant.description} ${restaurant.highlights.join(" ")}`.toLowerCase().includes(normalized));
    });
    return [...matches].sort((a, b) => {
      if (a.bookingReady !== b.bookingReady) return a.bookingReady ? -1 : 1;
      if (currentPosition) return distanceTo(a, currentPosition) - distanceTo(b, currentPosition);
      return a.name.localeCompare(b.name, "pt");
    });
  }, [allRestaurants, query, cuisineFilter, locationFilter, currentPosition, desiredDate, guests]);
  const selectedRestaurant = allRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) || null;
  const pendingSelection = Boolean(selectedRestaurant && !selectedRestaurant.bookingReady);

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

  const enrichCatalogRestaurants = useCallback(async (items: PartnerRestaurant[], signal?: AbortSignal) => {
    const profiles = new Map<string, ExternalRestaurantEnrichment>();
    const batches: Array<{ provider: string; placeIds: string[] }> = [];
    for (const provider of ["GOOGLE_PLACES"]) {
      const placeIds = items.filter((item) => item.source === "OPEN_DATA" && item.externalPlaceProvider === provider && item.externalPlaceId).map((item) => item.externalPlaceId!);
      for (let start = 0; start < placeIds.length; start += 8) batches.push({ provider, placeIds: placeIds.slice(start, start + 8) });
    }
    if (!batches.length) return items;
    await Promise.all(batches.map(async (batch) => {
      try {
        const response = await fetch("/api/partners/restaurants/enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
          signal,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data?.restaurants)) return;
        for (const profile of data.restaurants as ExternalRestaurantEnrichment[]) profiles.set(`${profile.provider}:${profile.placeId}`, profile);
      } catch { /* The base catalogue remains usable if enrichment is unavailable. */ }
    }));
    return items.map((restaurant) => {
      const profile = profiles.get(externalPlaceKey(restaurant));
      if (!profile) return restaurant;
      return {
        ...restaurant,
        contactEmail: profile.contactEmail || restaurant.contactEmail,
        heroImage: profile.heroImage || restaurant.heroImage,
        heroImageKind: profile.heroImage ? "PHOTO" as const : restaurant.heroImageKind,
        galleryImages: profile.galleryImages?.length ? profile.galleryImages : restaurant.galleryImages,
        description: profile.description || restaurant.description,
        openingHours: profile.openingHours || restaurant.openingHours,
        googleRating: profile.rating ?? restaurant.googleRating,
        googleReviewCount: profile.reviewCount ?? restaurant.googleReviewCount,
        googlePriceLevel: profile.priceLevel ?? restaurant.googlePriceLevel,
        ratingSource: profile.ratingSource || restaurant.ratingSource,
        photoAttribution: profile.photoAttribution || restaurant.photoAttribution,
        photoAttributionUri: profile.photoAttributionUri || restaurant.photoAttributionUri,
        websiteUrl: profile.websiteUrl || restaurant.websiteUrl,
      };
    }).filter((restaurant) => restaurant.source !== "OPEN_DATA" || (validEmail(restaurant.contactEmail) && Boolean(restaurant.heroImage)));
  }, []);

  const fetchCatalogRestaurants = useCallback(async (pageToken: string | null, append: boolean, signal?: AbortSignal) => {
    setCatalogLoading(true);
    setCatalogMessage("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (locationFilter.trim()) params.set("location", locationFilter.trim());
      if (currentPosition) {
        params.set("lat", String(currentPosition.latitude));
        params.set("lng", String(currentPosition.longitude));
      }
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(`/api/partners/restaurants/search?${params}`, { signal });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setCatalogConfigured(data?.configured !== false);
        setCatalogMessage(data?.error || "Não foi possível pesquisar restaurantes agora.");
        if (!append) setCatalogRestaurants([]);
        return;
      }
      setCatalogConfigured(true);
      const items: PartnerRestaurant[] = Array.isArray(data?.restaurants)
        ? (data.restaurants as ExternalRestaurantSearchItem[]).map(externalPartnerRestaurant).filter((item): item is PartnerRestaurant => Boolean(item))
        : [];
      const usableItems = await enrichCatalogRestaurants(items, signal);
      if (signal?.aborted) return;
      setCatalogRestaurants((current) => {
        const combined = append ? [...current, ...usableItems] : usableItems;
        return [...new Map<string, PartnerRestaurant>(combined.map((item) => [item.id, item])).values()];
      });
      if (items.length > 0 && usableItems.length === 0) setCatalogMessage("Não encontrámos restaurantes disponíveis nesta pesquisa.");
      setNextPageToken(typeof data?.nextPageToken === "string" ? data.nextPageToken : null);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setCatalogMessage("Não foi possível pesquisar restaurantes agora.");
    } finally {
      if (!signal?.aborted) setCatalogLoading(false);
    }
  }, [query, locationFilter, currentPosition, enrichCatalogRestaurants]);

  useEffect(() => {
    if (locationState === "loading") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchCatalogRestaurants(null, false, controller.signal);
    }, 450);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchCatalogRestaurants, locationState]);

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
    if (!selectedRestaurant) return setMessage("Escolhe um restaurante.");
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const response = await fetch("/api/partner-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestaurant.bookingReady ? selectedRestaurant.id : null,
          externalPlaceProvider: pendingSelection ? selectedRestaurant.externalPlaceProvider : null,
          externalPlaceId: pendingSelection ? selectedRestaurant.externalPlaceId : null,
          externalRestaurantEmail: pendingSelection ? selectedRestaurant.contactEmail : null,
          desiredDate,
          adults,
          children,
          guests,
          occasion: form.get("occasion"),
          accessibility: form.get("accessibility"),
          dietary: form.get("dietary"),
          cuisineTypes: selectedRestaurant ? [selectedRestaurant.cuisine] : [],
          requirements,
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          customerEmail: form.get("customerEmail"),
        }),
      });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || "Não foi possível confirmar a reserva.");
      setSuccess(true);
      setMessage(data.pending ? `Reserva ${data.publicCode} pendente de confirmação. O pedido foi enviado para ${data.restaurantName}.` : `Reserva ${data.publicCode} confirmada no ${data.restaurantName}.`);
      setTimeout(() => window.location.assign("/partners/app?tab=history"), 1400);
    } catch {
      setMessage("Não foi possível confirmar a reserva.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      {!publishingEnabled && <div className="rounded-[18px] border border-[#D8C29E] bg-[#FFF7E8] px-4 py-3 text-xs font-semibold text-[#795D38] xl:col-span-2">Podes explorar os restaurantes. Para confirmares uma reserva e receberes a comissão, adiciona primeiro o IBAN.</div>}
      <div className="space-y-3">
        <section className="rounded-[22px] border border-[#E1D0B8] bg-white p-4 shadow-[0_10px_34px_rgba(83,59,32,0.045)] sm:p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]"><span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[#F2E3CB] text-[9px] text-[#71502A]">01</span> Dados da reserva</div><span className="hidden text-[9px] font-semibold text-[#948679] sm:inline">Cliente e preferências</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Field label="Nome do cliente"><input name="customerName" required maxLength={100} placeholder="Nome da reserva" className={compactInputClass} /></Field>
            <Field label="Telemóvel"><input name="customerPhone" required maxLength={30} placeholder="+351 9…" className={compactInputClass} /></Field>
            <Field label="Email"><input name="customerEmail" type="email" required maxLength={160} autoComplete="email" placeholder="cliente@email.com" className={compactInputClass} /></Field>
            <Field label="Data e hora"><input value={desiredDate} onChange={(event) => setDesiredDate(event.target.value)} name="desiredDate" type="datetime-local" required className={compactInputClass} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Adultos"><input value={adults} onChange={(event) => setAdults(Math.max(1, Number(event.target.value)))} type="number" min="1" max="200" className={compactInputClass} /></Field><Field label="Crianças"><input value={children} onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))} type="number" min="0" max="199" className={compactInputClass} /></Field></div>
            <Field label="Ocasião"><select name="occasion" className={compactInputClass}>{REFERRAL_OCCASION_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Acessibilidade"><select name="accessibility" className={compactInputClass}>{REFERRAL_ACCESSIBILITY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
            <Field label="Alimentação"><select name="dietary" className={compactInputClass}>{REFERRAL_DIETARY_TAGS.map((tag) => <option key={tag.value} value={tag.value}>{tag.label}</option>)}</select></Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">{REFERRAL_REQUIREMENT_TAGS.map((tag) => { const active = requirements.includes(tag); return <button key={tag} type="button" onClick={() => toggleRequirement(tag)} className={`rounded-full border px-3 py-1.5 text-[9px] font-bold ${active ? "border-[#8A6130] bg-[#FFF0D3] text-[#69491F]" : "border-[#DCC9AC] bg-white text-[#6E563A]"}`}>{active && <Check size={9} className="mr-1 inline" />}{tag}</button>; })}</div>
        </section>

        <section className="rounded-[22px] border border-[#E1D0B8] bg-white p-4 shadow-[0_10px_34px_rgba(83,59,32,0.045)] sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]"><span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[#F2E3CB] text-[9px] text-[#71502A]">02</span> Restaurante</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">Pesquisa qualquer restaurante</h2></div><span className="rounded-full border border-[#DECEB4] bg-[#F8F1E7] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#795D38]">{filtered.length} opções</span></div>
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
              return <article key={restaurant.id} className={`relative overflow-hidden rounded-[18px] border p-2.5 transition ${selected ? "border-[#9E733D] bg-[#FFF7E9] shadow-[0_10px_28px_rgba(119,81,34,0.10)] ring-1 ring-[#C8A56A]/25" : restaurant.bookingReady ? "border-[#E1D0B8] bg-[#FFFDFC] hover:border-[#C8A56A] hover:bg-white" : "border-[#E5DBCC] bg-[#FAF7F2]"}`}>{selected && <span className="absolute inset-y-0 left-0 w-1 bg-[#B88745]" />}
                <button type="button" aria-pressed={selected} aria-label={`Escolher ${restaurant.name}`} onClick={() => setSelectedRestaurantId(restaurant.id)} className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border ${selected ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#D3BE9C] bg-white text-transparent"}`}>{selected ? <Check size={15} /> : restaurant.bookingReady ? <Check size={15} /> : <ShieldCheck size={14} />}</button>
                <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2.5 pr-11 sm:grid-cols-[84px_minmax(0,1fr)_150px] sm:gap-3">
                  {restaurant.heroImage ? <div className="relative h-[72px] overflow-hidden rounded-[13px] bg-[#EADCC7] bg-cover bg-center shadow-[inset_0_0_0_1px_rgba(79,59,34,.08)] sm:h-[78px]" style={{ backgroundImage: `url(${restaurant.heroImage})` }} role="img" aria-label={`Fotografia de ${restaurant.name}`} /> : <div className="grid h-[72px] place-items-center rounded-[13px] bg-[linear-gradient(145deg,#F0E4D1,#E2CFB3)] text-center text-[#9B7D57] sm:h-[78px]"><span><ImageIcon size={18} className="mx-auto" /><small className="mt-1 block text-[7px] font-bold uppercase tracking-[.08em]">Sem foto</small></span></div>}
                  <div className="min-w-0"><div className="flex flex-wrap items-start gap-1.5"><p className="line-clamp-2 break-words text-sm font-semibold leading-4">{restaurant.name}</p>{restaurant.bookingReady ? <span className="rounded-full bg-[#EAF4E8] px-1.5 py-0.5 text-[7px] font-black text-[#456846]">RESERVA IMEDIATA</span> : <span className="rounded-full bg-[#FFF2D5] px-1.5 py-0.5 text-[7px] font-black text-[#805D2B]">CONFIRMAÇÃO PENDENTE</span>}</div><div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="text-[#80613D]">{restaurant.cuisine}</span>{restaurant.googleRating != null && <span className="text-[#A36D19]" title={ratingSourceLabel(restaurant.ratingSource)}>★ {restaurant.googleRating.toFixed(1)}{restaurant.googleReviewCount != null && restaurant.googleReviewCount > 0 ? <span className="font-normal text-[#8A7863]"> ({restaurant.googleReviewCount})</span> : restaurant.ratingSource ? <span className="font-normal text-[#8A7863]"> · {ratingSourceShort(restaurant.ratingSource)}</span> : null}</span>}{restaurant.googlePriceLevel != null && <span className="tracking-[0.08em] text-[#4F6C4D]">{"€".repeat(Math.min(4, Math.max(1, restaurant.googlePriceLevel)))}</span>}</div><p className="mt-1 flex items-center gap-1 text-[10px] text-[#6B6258]"><MapPin size={11} className="shrink-0 text-[#9B6F3B]" />{distance !== null && Number.isFinite(distance) ? <strong className="shrink-0 text-[#4F6C4D]">{formatDistance(distance)} ·</strong> : null}<span className="line-clamp-1">{restaurant.address || "Portugal"}</span></p>{restaurant.photoAttribution && <p className="mt-1 truncate text-[8px] text-[#8A7863]">Foto: {restaurant.photoAttributionUri ? <a href={restaurant.photoAttributionUri} target="_blank" rel="noreferrer" className="underline">{restaurant.photoAttribution}</a> : restaurant.photoAttribution}</p>}</div>
                  <div className="col-start-2 text-left sm:col-start-auto sm:text-right"><p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8A7863]">Comissão atual</p><p className="mt-0.5 text-sm font-bold text-[#704E27]">{money(perPerson)} / pessoa</p><p className="text-[9px] text-[#8A7863]">{money(gross)} total + IVA</p>{desiredDate && restaurant.bookingReady && <p className="mt-0.5 text-[8px] font-bold text-[#4F6C4D]">{remainingCapacity(restaurant, desiredDate)} lugares livres</p>}</div>
                </div>
                {!restaurant.bookingReady && <p className="mt-2 rounded-xl bg-[#FFF4DE] px-3 py-2 text-[9px] leading-4 text-[#74613F]">A reserva fica pendente até o restaurante confirmar, recusar ou sugerir outro horário. Comissão de 1,50 € por pessoa + IVA.</p>}
                <details className="group mt-2 border-t border-[#EEE3D3] pt-2"><summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><UtensilsCrossed size={12} /> Mini-perfil, fotografias e menu</span><span className="transition group-open:rotate-180">⌄</span></summary><div className="mt-2 rounded-xl bg-white p-3"><p className="text-[11px] leading-4 text-[#6B6258]">{restaurant.description}</p>{restaurant.openingHours && <p className="mt-2 text-[9px] leading-4 text-[#75695D]"><strong>Horário:</strong> {restaurant.openingHours}</p>}{restaurant.galleryImages.length > 0 && <div className="mt-2 grid grid-cols-3 gap-2">{restaurant.galleryImages.slice(0, 3).map((image) => <div key={image} className="h-20 rounded-xl bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} role="img" aria-label={`Fotografia de ${restaurant.name}`} />)}</div>}<div className="mt-3 flex flex-wrap gap-3">{restaurant.menuUrl && <a href={restaurant.menuUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#7B572B]">Abrir menu <ExternalLink size={12} /></a>}{restaurant.websiteUrl && <a href={restaurant.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#7B572B]">Site oficial <ExternalLink size={12} /></a>}{restaurant.googleMapsUrl && <a href={restaurant.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#4F6C4D]">Abrir mapa <ExternalLink size={12} /></a>}</div></div></details>
                {restaurant.bookingReady && !restaurant.isDemo && <CommissionNegotiation restaurant={restaurant} />}
              </article>;
            })}
            {catalogLoading && filtered.length === 0 && <div className="flex items-center justify-center gap-2 rounded-[20px] border border-dashed border-[#D6C3A5] p-6 text-xs text-[#6B6258]"><LoaderCircle size={15} className="animate-spin" /> A pesquisar restaurantes…</div>}
            {!catalogLoading && filtered.length === 0 && <div className="rounded-[20px] border border-dashed border-[#D6C3A5] p-6 text-center text-xs text-[#6B6258]">Não encontrámos restaurantes com estes filtros. Experimenta pesquisar pelo nome, zona ou cidade.</div>}
          </div>
          <div className="mt-4 flex flex-col gap-3 rounded-[20px] border border-[#D5C5AE] bg-[#F8F5F0] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><strong className="block text-sm">Restaurantes</strong><span className="mt-1 block text-[10px] leading-5 text-[#75695D]">Alguns confirmam a reserva de imediato; os restantes respondem ao pedido de confirmação.</span>{catalogMessage && <span className={`mt-1 block text-[9px] font-semibold ${catalogConfigured ? "text-[#8A6130]" : "text-[#A14E36]"}`}>{catalogMessage}</span>}</div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              {nextPageToken && <button type="button" disabled={catalogLoading} onClick={() => void fetchCatalogRestaurants(nextPageToken, true)} className="h-9 rounded-full border border-[#CDBA9C] bg-white px-4 text-[9px] font-bold text-[#6E5232] disabled:opacity-50">{catalogLoading ? "A carregar…" : "Mostrar mais restaurantes"}</button>}
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <div className="relative overflow-hidden rounded-[22px] border border-[#2C2117] bg-[#17120D] p-5 text-white shadow-[0_18px_42px_rgba(23,18,13,0.14)]" style={{ backgroundImage: "radial-gradient(circle at 100% 0%, rgba(215,178,103,.24), transparent 15rem)" }}>
          <p className="relative flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#D7B267]"><ShieldCheck size={13} /> Resumo da reserva</p>
          {selectedRestaurant ? <><p className="mt-2 text-lg font-semibold">{selectedRestaurant.name}</p><p className="mt-1 text-xs text-white/55">{guests} pessoas · {selectedRestaurant.cuisine}</p>{pendingSelection && <p className="mt-2 inline-flex rounded-full bg-[#FFF2D5]/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] text-[#F2D394]">Reserva pendente de confirmação</p>}<div className="mt-3 border-t border-white/10 pt-3"><MoneyRow label="Comissão / pessoa" value={money((selectedRestaurant.commissionType === "PER_PERSON" ? selectedRestaurant.commissionAmount * guests : selectedRestaurant.commissionAmount) / guests)} /><MoneyRow label="Comissão total + IVA" value={money(selectedRestaurant.commissionType === "PER_PERSON" ? selectedRestaurant.commissionAmount * guests : selectedRestaurant.commissionAmount)} strong /></div></> : <p className="mt-2 text-xs leading-5 text-white/55">Escolhe um restaurante para veres a comissão e confirmares.</p>}
          <p className="mt-3 text-[9px] leading-4 text-white/45">{pendingSelection ? "O pedido só fica confirmado depois da resposta do restaurante. À comissão acresce IVA; o valor líquido considera a comissão MesaLink e as taxas de processamento." : "A reserva é confirmada de imediato. À comissão acresce IVA; o valor líquido considera a comissão MesaLink e as taxas de processamento."}</p>
        </div>
        {message && <div className={`rounded-[18px] border p-3 text-xs font-semibold ${success ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</div>}
        <button disabled={!publishingEnabled || loading || !selectedRestaurant || !desiredDate} className="h-12 w-full rounded-full bg-[#C8A56A] px-5 text-xs font-black text-[#17120D] shadow-[0_14px_35px_rgba(156,112,51,0.18)] transition hover:bg-[#D8BA7D] disabled:cursor-not-allowed disabled:opacity-45">{!publishingEnabled ? "Adicionar IBAN" : loading ? "A enviar…" : pendingSelection ? "Enviar pedido de confirmação" : "Confirmar e reservar"}</button>
      </aside>
    </form>
  );
}

function CommissionNegotiation({ restaurant }: { restaurant: PartnerRestaurant }) {
  const [commissionType, setCommissionType] = useState<"PER_PERSON" | "TOTAL">(restaurant.negotiationType || restaurant.commissionType);
  const [amount, setAmount] = useState(String(restaurant.negotiationAmount ?? restaurant.commissionAmount));
  const [status, setStatus] = useState(restaurant.negotiationStatus);
  const [initiator, setInitiator] = useState(restaurant.negotiationInitiator);
  const [requestId, setRequestId] = useState(restaurant.negotiationRequestId);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const incoming = status === "PENDING" && initiator === "RESTAURANT";
  const outgoing = status === "PENDING" && initiator === "PARTNER";

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
    setRequestId(result.requestId);
    setInitiator("PARTNER");
    setStatus("PENDING");
    setMessage("Proposta enviada. A comissão atual mantém-se até o restaurante aceitar.");
  }

  async function respond(action: "ACCEPT" | "REJECT") {
    if (!requestId) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/partners/commission-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível responder à proposta.");
    setStatus(result.status);
    setMessage(action === "ACCEPT" ? "Comissão aceite. Será usada automaticamente nas próximas reservas." : "Proposta recusada. A comissão anterior mantém-se.");
    if (action === "ACCEPT") window.setTimeout(() => window.location.reload(), 700);
  }

  const stateLabel = incoming
    ? "O restaurante enviou uma proposta"
    : outgoing
      ? "A aguardar resposta do restaurante"
      : status === "ACCEPTED"
        ? "Última alteração aceite"
        : status === "REJECTED"
          ? "Última proposta recusada"
          : "Negociar comissão permanente";

  return <details open={incoming || undefined} className="group mt-2 border-t border-[#EEE3D3] pt-2">
    <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><Handshake size={12} /> {stateLabel}</span><span className="transition group-open:rotate-180">⌄</span></summary>
    {incoming ? <div className="mt-2 rounded-xl border border-[#E4CA8C] bg-[#FFF7E2] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#8B6738]">Nova comissão proposta</p><p className="mt-1 text-base font-bold">{money(Number(amount))} {commissionType === "PER_PERSON" ? "/ pessoa" : "total"} + IVA</p>{restaurant.negotiationMessage && <p className="mt-1 text-[9px] text-[#75695D]">{restaurant.negotiationMessage}</p>}<p className="mt-1 text-[9px] text-[#75695D]">Só será aplicada às reservas futuras se aceitares.</p></div><div className="flex gap-2"><button type="button" onClick={() => respond("REJECT")} disabled={loading} className="h-9 rounded-full border border-[#D5C3A6] bg-white px-4 text-[9px] font-bold disabled:opacity-50">Recusar</button><button type="button" onClick={() => respond("ACCEPT")} disabled={loading} className="h-9 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white disabled:opacity-50">{loading ? "A responder…" : "Aceitar comissão"}</button></div></div>
      {message && <p className="mt-2 text-[9px] font-semibold text-[#4F6C4D]">{message}</p>}
    </div> : <div className="mt-2 grid gap-2 rounded-xl bg-white p-2.5 sm:grid-cols-[130px_90px_auto]">
      <select value={commissionType} onChange={(event) => setCommissionType(event.target.value as "PER_PERSON" | "TOTAL")} className="input-premium h-9 text-xs"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total</option></select>
      <input value={amount} onChange={(event) => setAmount(event.target.value)} onKeyDown={(event) => event.key === "Enter" && event.preventDefault()} type="number" min="0.5" max="1000" step="0.01" aria-label="Nova comissão" className="input-premium h-9 text-xs" />
      <button type="button" onClick={sendRequest} disabled={loading} className="h-9 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white disabled:opacity-50">{loading ? "A enviar…" : outgoing ? "Atualizar a minha proposta" : "Propor alteração"}</button>
      <p className="text-[9px] text-[#75695D] sm:col-span-3">Este acordo fica associado ao restaurante e será usado em todas as reservas futuras depois de aceite.</p>
      {message && <p className="text-[9px] font-semibold text-[#4F6C4D] sm:col-span-3">{message}</p>}
    </div>}
  </details>;
}

function externalPartnerRestaurant(item: ExternalRestaurantSearchItem): PartnerRestaurant | null {
  if (!item?.provider || !item?.placeId || !item.name) return null;
  return {
    id: item.mesalinkRestaurantId || `open:${item.provider}:${item.placeId}`,
    source: item.bookingReady && item.mesalinkRestaurantId ? "MESALINK" : "OPEN_DATA",
    googlePlaceId: null,
    externalPlaceProvider: item.provider,
    externalPlaceId: item.placeId,
    name: item.name,
    isDemo: false,
    bookingReady: Boolean(item.bookingReady && item.mesalinkRestaurantId),
    contactEmail: item.contactEmail || "",
    cuisine: item.cuisine || "Restaurante",
    address: item.address || "Portugal",
    description: item.description || "Restaurante disponível para pedido de reserva.",
    heroImage: item.heroImage || "",
    heroImageKind: item.heroImage ? "PHOTO" : "NONE",
    galleryImages: Array.isArray(item.galleryImages) ? item.galleryImages : [],
    highlights: [],
    menuUrl: "",
    menuSections: [],
    averageTicket: 0,
    latitude: item.latitude,
    longitude: item.longitude,
    commissionType: "PER_PERSON",
    commissionAmount: 1.5,
    defaultDailyCapacity: 0,
    totalCapacity: 0,
    reservationSlots: [],
    blockedSlots: [],
    dailyAvailability: [],
    reservedByDay: {},
    googleRating: item.rating,
    googleReviewCount: item.reviewCount,
    googlePriceLevel: item.priceLevel,
    ratingSource: item.ratingSource || "",
    photoAttribution: item.photoAttribution || "",
    photoAttributionUri: item.photoAttributionUri || "",
    websiteUrl: item.websiteUrl || "",
    openingHours: item.openingHours || "",
    googleMapsUrl: item.mapUrl,
    googleBusinessConnected: false,
    negotiationStatus: null,
    negotiationRequestId: null,
    negotiationInitiator: null,
    negotiationType: null,
    negotiationAmount: null,
    negotiationMessage: null,
  };
}

function remainingCapacity(restaurant: PartnerRestaurant, desiredDate: string) {
  const basePartnerLimit = restaurant.defaultDailyCapacity > 0 ? restaurant.defaultDailyCapacity : restaurant.totalCapacity;
  if (!desiredDate) return Math.min(restaurant.totalCapacity, basePartnerLimit);
  const key = desiredDate.slice(0, 10);
  const time = desiredDate.slice(11, 16);
  if (restaurant.blockedSlots.some((slot) => slot.day === key && slot.time === time)) return 0;
  const override = restaurant.dailyAvailability.find((item) => item.date === key);
  const partnerLimit = override?.capacity ?? basePartnerLimit;
  const selectedTime = new Date(desiredDate).getTime();
  if (Number.isNaN(selectedTime)) return Math.min(restaurant.totalCapacity, partnerLimit);
  const slots = restaurant.reservationSlots.filter((reservation) => {
    const reservationTime = new Date(reservation.date).getTime();
    return reservationTime >= selectedTime - 2 * 60 * 60 * 1000 && reservationTime < selectedTime + 2 * 60 * 60 * 1000;
  });
  const realReserved = slots.reduce((sum, reservation) => sum + reservation.guests, 0);
  const partnerReserved = slots.filter((reservation) => reservation.partner).reduce((sum, reservation) => sum + reservation.guests, 0);
  return Math.max(0, Math.min(restaurant.totalCapacity - realReserved, partnerLimit - partnerReserved));
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

function ratingSourceShort(source: string) {
  if (source === "SITE_OFICIAL") return "site oficial";
  if (source === "CLASSIFICACAO_ESTABELECIMENTO") return "classificação";
  if (source === "GOOGLE") return "Google";
  if (source === "DEMO") return "demonstração";
  return "avaliação pública";
}

function ratingSourceLabel(source: string) {
  if (source === "SITE_OFICIAL") return "Avaliação publicada pelo site oficial do restaurante";
  if (source === "CLASSIFICACAO_ESTABELECIMENTO") return "Classificação pública do estabelecimento; não representa avaliações MesaLink";
  if (source === "GOOGLE") return "Avaliação publicada no Google Maps";
  if (source === "DEMO") return "Dados de demonstração";
  return "Avaliação pública disponível";
}

function validEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;
  const [local, domain] = normalized.split("@");
  if (/^(usuario|utilizador|user|username|yourname|your-email|seuemail|seu-email)$/i.test(local || "")) return false;
  if (/(^|\.)(dominio|domain|example)\.(com|pt|net|org)$/i.test(domain || "")) return false;
  return !/(^|[.@_-])(websystems|wixpress|sentry|hosting|wordpress|cloudflare)([.@_-]|$)/i.test(normalized);
}

function externalPlaceKey(restaurant: Pick<PartnerRestaurant, "externalPlaceProvider" | "externalPlaceId">) {
  return restaurant.externalPlaceProvider && restaurant.externalPlaceId
    ? `${restaurant.externalPlaceProvider}:${restaurant.externalPlaceId}`
    : "";
}

function restaurantIdentity(restaurant: Pick<PartnerRestaurant, "name" | "address" | "latitude" | "longitude">) {
  const name = normalizeIdentity(restaurant.name);
  if (restaurant.latitude != null && restaurant.longitude != null) {
    return `${name}:${restaurant.latitude.toFixed(3)}:${restaurant.longitude.toFixed(3)}`;
  }
  return `${name}:${normalizeIdentity(restaurant.address).slice(0, 70)}`;
}

function normalizeIdentity(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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
