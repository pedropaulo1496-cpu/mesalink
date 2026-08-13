"use client";

import { FormEvent, useState } from "react";
import { FileUploadField } from "@/components/FileUploadField";
import { ImageUploadField } from "@/components/ImageUploadField";
import { REFERRAL_CUISINE_TAGS, isReferralCuisineTag } from "@/lib/referral-tags";

export function ReferralBookingSettingsForm({
  restaurantId,
  initialCommissionType,
  initialCommissionAmount,
  initialDefaultDailyCapacity,
  initialAutoAcceptEnabled,
  paymentMethodReady,
  initialDailyCapacities,
}: {
  restaurantId: string;
  initialCommissionType: "PER_PERSON" | "TOTAL";
  initialCommissionAmount: number;
  initialDefaultDailyCapacity: number;
  initialAutoAcceptEnabled: boolean;
  paymentMethodReady: boolean;
  initialDailyCapacities: Array<{ date: string; capacity: number }>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dailyCapacities, setDailyCapacities] = useState(initialDailyCapacities);
  const [capacityLoading, setCapacityLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commissionType: data.get("commissionType"),
        commissionAmount: data.get("commissionAmount"),
        defaultDailyCapacity: Number(data.get("defaultDailyCapacity")),
        autoAcceptEnabled: data.get("autoAcceptEnabled") === "on",
      }),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Definições guardadas." : result.error || "Não foi possível guardar.");
  }

  return (
    <>
      {!paymentMethodReady && <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#E5CF9D] bg-[#FFF7E5] p-3"><div><p className="text-xs font-bold text-[#6E512A]">1. Validar garantia de pagamento</p><p className="mt-0.5 text-[9px] text-[#80613D]">É feito uma única vez e não cobra nada agora.</p></div><form action={`/api/restaurants/${restaurantId}/referral-auto-accept/setup`} method="POST"><button className="h-8 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white">Validar cartão</button></form></div>}

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[180px_110px_130px_minmax(190px,1fr)_auto] sm:items-end">
          <label className="block text-[10px] font-bold text-[#75695D]">Comissão<select name="commissionType" defaultValue={initialCommissionType} className="input-premium mt-1 h-9 text-xs"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total da reserva</option></select></label>
          <label className="block text-[10px] font-bold text-[#75695D]">Valor (€)<input name="commissionAmount" type="number" min="0.5" max="1000" step="0.01" defaultValue={initialCommissionAmount} className="input-premium mt-1 h-9 text-xs" /></label>
          <label className="block text-[10px] font-bold text-[#75695D]">Lugares / dia<input name="defaultDailyCapacity" type="number" min="0" max="2000" step="1" defaultValue={initialDefaultDailyCapacity} className="input-premium mt-1 h-9 text-xs" /></label>
          <label className={`flex h-9 items-center gap-2 rounded-full border px-3 text-[10px] font-bold ${paymentMethodReady ? "border-[#BFD9BC] bg-[#F1F9F0] text-[#456846]" : "border-[#E1D0B8] bg-[#F7F3ED] text-[#998D7D]"}`}><input name="autoAcceptEnabled" type="checkbox" defaultChecked={initialAutoAcceptEnabled} disabled={!paymentMethodReady} className="h-3.5 w-3.5 accent-[#17120D]" /> Reservas automáticas</label>
          <button disabled={loading} className="h-9 rounded-full bg-[#17120D] px-4 text-[10px] font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar"}</button>
        </div>
        {message && <p className="text-[10px] font-semibold text-[#6F573A]">{message}</p>}
      </form>

      <details className="group mt-3 rounded-[13px] border border-[#E7D9C6] bg-[#FFFDFC]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[10px] font-bold"><span>Exceções de capacidade por data</span><span className="text-[#9B6F3B] group-open:hidden">Opcional ↓</span><span className="hidden text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
        <div className="border-t border-[#E7D9C6] p-3">
      <form onSubmit={async (event) => {
        event.preventDefault();
        setCapacityLoading(true);
        const data = new FormData(event.currentTarget);
        const date = String(data.get("date") || "");
        const capacity = Number(data.get("capacity"));
        const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, capacity }) });
        const result = await response.json();
        setCapacityLoading(false);
        if (!response.ok) return setMessage(result.error || "Não foi possível guardar a data.");
        setDailyCapacities((items) => [...items.filter((item) => item.date !== date), { date, capacity }].sort((a, b) => a.date.localeCompare(b.date)));
        event.currentTarget.reset();
      }} className="grid grid-cols-[1fr_90px_auto] gap-2">
        <input name="date" type="date" required className="input-premium h-9 text-xs" />
        <input name="capacity" type="number" min="0" max="2000" placeholder="Lugares" required className="input-premium h-9 text-xs" />
        <button disabled={capacityLoading} className="h-9 rounded-full border border-[#CBB795] bg-white px-3 text-[9px] font-bold disabled:opacity-50">Adicionar</button>
      </form>
      {dailyCapacities.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{dailyCapacities.map((item) => <div key={item.date} className="inline-flex items-center gap-2 rounded-full border border-[#D8C6A9] bg-white py-1 pl-3 pr-1 text-[10px]"><span>{new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T12:00:00Z`))} · <strong>{item.capacity} lugares</strong></span><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: item.date }) }); if (response.ok) setDailyCapacities((items) => items.filter((row) => row.date !== item.date)); }} className="grid h-7 w-7 place-items-center rounded-full bg-[#F6EBDD] font-black text-[#9A563F]" aria-label={`Remover ${item.date}`}>×</button></div>)}</div>}
        </div>
      </details>
    </>
  );
}

export function ReferralAgreementForm({ restaurantId }: { restaurantId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-agreements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data.entries())),
    });
    const result = await response.json();
    setSuccess(response.ok);
    setMessage(response.ok ? "Acordo guardado. A comissão será aplicada automaticamente." : result.error || "Não foi possível guardar.");
    setLoading(false);
    if (response.ok) setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      <input name="partnerEmail" type="email" required placeholder="Email da conta MesaLink Partner" className="input-premium h-12" />
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <select name="commissionType" defaultValue="PER_PERSON" className="input-premium h-12"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total</option></select>
        <input name="commissionAmount" type="number" min="1" max="1000" step="0.01" defaultValue="5" required className="input-premium h-12" />
      </div>
      {message && <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}
      <button disabled={loading} className="h-12 rounded-full border border-[#CBB795] bg-[#FFF9F0] px-6 text-sm font-bold disabled:opacity-50">{loading ? "A guardar…" : "Criar acordo"}</button>
    </form>
  );
}

export function PartnerProfileSettingsForm({
  restaurantId,
  restaurantName,
  cuisine,
  description,
  heroImage,
  gallery,
  highlights,
  menuUrl,
  googleMapsUrl,
  googleRating,
  googleReviewCount,
  googlePriceLevel,
  googleBusinessConnected,
  googleBusinessPhotoCount,
  googleBusinessReady,
}: {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  description: string;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  menuUrl: string;
  googleMapsUrl: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePriceLevel: number | null;
  googleBusinessConnected: boolean;
  googleBusinessPhotoCount: number;
  googleBusinessReady: boolean;
}) {
  const [profileCuisine, setProfileCuisine] = useState(isReferralCuisineTag(cuisine) ? cuisine : "");
  const [profileDescription, setProfileDescription] = useState(description);
  const [profileHeroImage, setProfileHeroImage] = useState(heroImage);
  const [profileGallery, setProfileGallery] = useState(gallery.slice(0, 6));
  const [profileHighlights, setProfileHighlights] = useState(highlights.join("\n"));
  const [profileMenuUrl, setProfileMenuUrl] = useState(menuUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(data.entries())),
    });
    const result = await response.json();
    setLoading(false);
    setSuccess(response.ok);
    setMessage(response.ok ? "Mini-perfil guardado e atualizado na app dos parceiros." : result.error || "Não foi possível guardar.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[190px_minmax(0,1fr)]">
          <label className="block"><span className="mb-1 block text-[10px] font-bold text-[#655A4E]">Cozinha *</span><select name="cuisine" value={profileCuisine} onChange={(event) => setProfileCuisine(event.target.value)} required className="input-premium h-10"><option value="" disabled>Escolher</option>{REFERRAL_CUISINE_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></label>
          <label className="block"><span className="mb-1 block text-[10px] font-bold text-[#655A4E]">Descrição curta</span><textarea name="description" value={profileDescription} onChange={(event) => setProfileDescription(event.target.value)} maxLength={700} rows={2} className="input-premium min-h-20 py-2.5 text-sm" /></label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#CFE0CC] bg-[#F3FAF2] p-3">
          <div><p className="text-xs font-bold text-[#405C42]">Google Maps</p><p className="mt-0.5 text-[9px] text-[#587255]">Fotografias, avaliação e localização automáticas.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase ${googleBusinessConnected ? "bg-[#DDEEDB] text-[#3F6A4D]" : "bg-[#FFF0CB] text-[#7A592F]"}`}>{googleBusinessConnected ? `Ligado · ${googleBusinessPhotoCount} fotos` : "Por ligar"}</span><button type="button" onClick={() => submitExternalForm(`/api/restaurants/${restaurantId}/google-business/${googleBusinessConnected ? "sync" : "connect"}`)} disabled={!googleBusinessReady} className="h-8 rounded-full bg-[#17120D] px-3 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-35">{googleBusinessConnected ? "Atualizar" : "Associar"}</button>{googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-[#456846] underline">Abrir Maps</a>}</div>
          {!googleBusinessReady && <p className="w-full text-[9px] text-[#80613D]">Ligação automática disponível assim que o Google aprovar o acesso central do MesaLink.</p>}
        </div>

        <details className="group rounded-[14px] border border-[#E1D0B8] bg-[#FFF9F0]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 text-[10px] font-bold"><span>Personalização opcional</span><span className="text-[#9B6F3B] group-open:hidden">Abrir ↓</span><span className="hidden text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
          <div className="space-y-3 border-t border-[#E1D0B8] p-3">
            <div className="grid gap-2 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[9px] font-bold text-[#655A4E]">Destaques · um por linha</span><textarea name="highlights" value={profileHighlights} onChange={(event) => setProfileHighlights(event.target.value)} rows={2} className="input-premium min-h-20 py-2.5 text-xs" /></label><div><p className="mb-1 text-[9px] font-bold text-[#655A4E]">Menu em PDF</p><FileUploadField value={profileMenuUrl} onChange={setProfileMenuUrl} /></div></div>
            <div><p className="mb-2 text-[9px] font-bold text-[#655A4E]">Fotografias próprias · substituem as do Google</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-5"><ImageUploadField value={profileHeroImage} onChange={setProfileHeroImage} compact />{profileGallery.slice(0, 3).map((image, index) => <ImageUploadField key={`${image}-${index}`} value={image} onChange={(url) => setProfileGallery((items) => url ? items.map((item, itemIndex) => itemIndex === index ? url : item) : items.filter((_, itemIndex) => itemIndex !== index))} compact />)}{profileGallery.length < 6 && <ImageUploadField value="" onChange={(url) => url && setProfileGallery((items) => [...items, url].slice(0, 6))} compact />}</div></div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_80px_100px_110px]"><input name="googleMapsUrl" type="url" defaultValue={googleMapsUrl} placeholder="Link Google Maps" className="input-premium h-9 text-xs" /><input name="googleRating" type="number" min="1" max="5" step="0.1" defaultValue={googleRating ?? ""} placeholder="Nota" aria-label="Avaliação Google" className="input-premium h-9 text-xs" /><input name="googleReviewCount" type="number" min="0" step="1" defaultValue={googleReviewCount ?? ""} placeholder="Reviews" aria-label="Número de reviews Google" className="input-premium h-9 text-xs" /><select name="googlePriceLevel" defaultValue={googlePriceLevel ?? ""} aria-label="Faixa de preços Google" className="input-premium h-9 text-xs"><option value="">Preço</option><option value="1">€</option><option value="2">€€</option><option value="3">€€€</option><option value="4">€€€€</option></select></div>
          </div>
        </details>
        <input type="hidden" name="heroImage" value={profileHeroImage} />
        <input type="hidden" name="gallery" value={profileGallery.join("\n")} />
        <input type="hidden" name="menuUrl" value={profileMenuUrl} />
        {message && <p className={`rounded-xl px-3 py-2 text-[10px] font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}
        <button disabled={loading} className="h-9 rounded-full bg-[#17120D] px-5 text-[10px] font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar perfil"}</button>
      </div>

      <aside className="overflow-hidden rounded-[16px] border border-[#E1D0B8] bg-[#FFFDFC] xl:self-start">
        {profileHeroImage ? <div className="h-24 bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${profileHeroImage})` }} /> : <div className="grid h-24 place-items-center bg-[#EADCC7] text-[9px] font-black uppercase tracking-[0.12em] text-[#8A6D49]">Imagem automática</div>}
        <div className="p-3.5"><div className="flex items-center justify-between gap-2"><div><p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#9B6F3B]">Como aparece</p><p className="mt-1 text-base font-semibold">{restaurantName}</p></div>{googleRating != null && <span className="text-[10px] font-bold text-[#A36D19]">★ {googleRating.toFixed(1)}</span>}</div><p className="mt-0.5 text-[10px] font-bold text-[#80613D]">{profileCuisine || "Restaurante"}</p><p className="mt-2 line-clamp-2 text-[10px] leading-4 text-[#6B6258]">{profileDescription}</p><div className="mt-2 flex flex-wrap gap-1">{profileHighlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 2).map((item) => <span key={item} className="rounded-full bg-[#F1E6D5] px-2 py-0.5 text-[8px] font-bold text-[#795D38]">{item}</span>)}</div></div>
      </aside>
    </form>
  );
}

function submitExternalForm(action: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  document.body.appendChild(form);
  form.submit();
}
