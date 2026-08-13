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
    <form onSubmit={submit} className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_130px_150px]">
        <label className="block text-xs font-bold text-[#75695D]">Comissão oferecida<select name="commissionType" defaultValue={initialCommissionType} className="input-premium mt-2 h-11"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total da reserva</option></select></label>
        <label className="block text-xs font-bold text-[#75695D]">Valor (€)<input name="commissionAmount" type="number" min="0.5" max="1000" step="0.01" defaultValue={initialCommissionAmount} className="input-premium mt-2 h-11" /></label>
        <label className="block text-xs font-bold text-[#75695D]">Lugares / dia<input name="defaultDailyCapacity" type="number" min="0" max="2000" step="1" defaultValue={initialDefaultDailyCapacity} className="input-premium mt-2 h-11" /></label>
      </div>
      <label className="flex items-start gap-3 rounded-[16px] border border-[#D7E4D4] bg-[#F3FAF2] p-3">
        <input name="autoAcceptEnabled" type="checkbox" defaultChecked={initialAutoAcceptEnabled} disabled={!paymentMethodReady} className="mt-0.5 h-4 w-4 accent-[#17120D]" />
        <span><strong className="block text-xs">Reservas imediatas</strong><span className="mt-1 block text-[10px] leading-4 text-[#587255]">O parceiro escolhe o restaurante e a reserva entra logo no MesaLink, se houver capacidade.</span></span>
      </label>
      {!paymentMethodReady && <p className="text-[11px] leading-5 text-[#8A6130]">Valida um cartão uma única vez para o MesaLink conseguir garantir automaticamente a comissão de cada reserva.</p>}
      {message && <p className="text-xs font-semibold text-[#6F573A]">{message}</p>}
      <button disabled={loading} className="h-10 rounded-full bg-[#17120D] px-5 text-xs font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar condições"}</button>
    </form>

    <div className="mt-4 border-t border-[#E7D9C6] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold">Capacidade por data</p><p className="mt-1 text-[10px] text-[#75695D]">Substitui os lugares habituais apenas nos dias que escolheres.</p></div>{paymentMethodReady ? <span className="rounded-full bg-[#E7F4E7] px-3 py-1 text-[9px] font-black uppercase text-[#3F6A4D]">Cartão validado</span> : <form action={`/api/restaurants/${restaurantId}/referral-auto-accept/setup`} method="POST"><button className="h-9 rounded-full border border-[#CBB795] bg-white px-4 text-[10px] font-bold">Validar cartão</button></form>}</div>
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
      }} className="mt-3 grid grid-cols-[1fr_100px_auto] gap-2">
        <input name="date" type="date" required className="input-premium h-10" />
        <input name="capacity" type="number" min="0" max="2000" placeholder="Lugares" required className="input-premium h-10" />
        <button disabled={capacityLoading} className="h-10 rounded-full border border-[#CBB795] bg-white px-4 text-[10px] font-bold disabled:opacity-50">Adicionar</button>
      </form>
      {dailyCapacities.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{dailyCapacities.map((item) => <div key={item.date} className="inline-flex items-center gap-2 rounded-full border border-[#D8C6A9] bg-white py-1 pl-3 pr-1 text-[10px]"><span>{new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T12:00:00Z`))} · <strong>{item.capacity} lugares</strong></span><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: item.date }) }); if (response.ok) setDailyCapacities((items) => items.filter((row) => row.date !== item.date)); }} className="grid h-7 w-7 place-items-center rounded-full bg-[#F6EBDD] font-black text-[#9A563F]" aria-label={`Remover ${item.date}`}>×</button></div>)}</div>}
    </div>
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
    <form onSubmit={submit} className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Tipo de cozinha *</span><select name="cuisine" value={profileCuisine} onChange={(event) => setProfileCuisine(event.target.value)} required className="input-premium h-12"><option value="" disabled>Escolher categoria</option>{REFERRAL_CUISINE_TAGS.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select><span className="mt-1.5 block text-[10px] text-[#827566]">Categoria uniforme usada na pesquisa e nos filtros dos parceiros.</span></label>
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Descrição para parceiros</span><textarea name="description" value={profileDescription} onChange={(event) => setProfileDescription(event.target.value)} maxLength={700} rows={4} className="input-premium min-h-28 py-3" /></label>
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Destaques · um por linha</span><textarea name="highlights" value={profileHighlights} onChange={(event) => setProfileHighlights(event.target.value)} rows={3} className="input-premium min-h-24 py-3" /></label>
        <details className="rounded-[18px] border border-[#E1D0B8] bg-[#FFF9F0]" open={!googleBusinessConnected}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold"><span>Fotografias próprias <span className="font-normal text-[#786C5F]">· opcional</span></span><span className="text-[9px] font-black uppercase text-[#9B6F3B]">{googleBusinessConnected ? "O Google já fornece as imagens" : `${profileGallery.length + (profileHeroImage ? 1 : 0)} adicionadas`}</span></summary>
          <div className="border-t border-[#E1D0B8] p-3.5">
            <p className="mb-3 text-[10px] leading-4 text-[#70665B]">Só precisas de carregar fotografias se quiseres substituir as imagens importadas automaticamente do Google Maps.</p>
            <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#8A765F]">Capa opcional</p><ImageUploadField value={profileHeroImage} onChange={setProfileHeroImage} compact /></div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{profileGallery.map((image, index) => <ImageUploadField key={`${image}-${index}`} value={image} onChange={(url) => setProfileGallery((items) => url ? items.map((item, itemIndex) => itemIndex === index ? url : item) : items.filter((_, itemIndex) => itemIndex !== index))} compact />)}{profileGallery.length < 6 && <ImageUploadField value="" onChange={(url) => url && setProfileGallery((items) => [...items, url].slice(0, 6))} compact />}</div>
            </div>
          </div>
        </details>
        <input type="hidden" name="heroImage" value={profileHeroImage} />
        <input type="hidden" name="gallery" value={profileGallery.join("\n")} />
        <div><p className="mb-2 text-xs font-bold text-[#655A4E]">Menu em PDF</p><FileUploadField value={profileMenuUrl} onChange={setProfileMenuUrl} /><input type="hidden" name="menuUrl" value={profileMenuUrl} /></div>
        <div className="rounded-[18px] border border-[#D7E4D4] bg-[#F3FAF2] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-[#405C42]">Mini-perfil Google Maps</p><p className="mt-1 text-[10px] leading-4 text-[#587255]">Importa automaticamente fotografias, avaliação, reviews, nome e localização do perfil do restaurante.</p></div><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${googleBusinessConnected ? "bg-[#DDEEDB] text-[#3F6A4D]" : "bg-[#FFF0CB] text-[#7A592F]"}`}>{googleBusinessConnected ? `Ligado · ${googleBusinessPhotoCount} fotos` : "Por ligar"}</span></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => submitExternalForm(`/api/restaurants/${restaurantId}/google-business/${googleBusinessConnected ? "sync" : "connect"}`)} disabled={!googleBusinessReady} className="h-9 rounded-full bg-[#17120D] px-4 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{googleBusinessConnected ? "Atualizar do Google" : "Associar Google Business"}</button>
            {googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full border border-[#BFD5BC] bg-white px-4 text-[10px] font-bold text-[#405C42]">Ver perfil Maps</a>}
          </div>
          {!googleBusinessReady && <p className="mt-2 text-[10px] font-semibold text-[#80613D]">A ligação gratuita central do MesaLink ao Google Business aguarda a aprovação/API do Google.</p>}
          <details className="mt-3 border-t border-[#CFE0CC] pt-3"><summary className="cursor-pointer text-[10px] font-bold text-[#587255]">Dados manuais de substituição</summary><div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px_110px_120px]"><input name="googleMapsUrl" type="url" defaultValue={googleMapsUrl} placeholder="Link do Google Maps" className="input-premium h-10" /><input name="googleRating" type="number" min="1" max="5" step="0.1" defaultValue={googleRating ?? ""} placeholder="4,7" aria-label="Avaliação Google" className="input-premium h-10" /><input name="googleReviewCount" type="number" min="0" step="1" defaultValue={googleReviewCount ?? ""} placeholder="N.º reviews" aria-label="Número de reviews Google" className="input-premium h-10" /><select name="googlePriceLevel" defaultValue={googlePriceLevel ?? ""} aria-label="Faixa de preços Google" className="input-premium h-10"><option value="">Preço não indicado</option><option value="1">€ · Económico</option><option value="2">€€ · Moderado</option><option value="3">€€€ · Elevado</option><option value="4">€€€€ · Premium</option></select></div></details>
        </div>
        {message && <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}
        <button disabled={loading} className="h-12 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar mini-perfil"}</button>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-[#E1D0B8] bg-[#FFFDFC]">
        {profileHeroImage ? <div className="h-36 bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${profileHeroImage})` }} /> : <div className="grid h-36 place-items-center bg-[#EADCC7] text-xs font-black uppercase tracking-[0.16em] text-[#8A6D49]">Carrega uma fotografia</div>}
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#9B6F3B]">Pré-visualização</p>
          <p className="mt-2 text-xl font-semibold">{restaurantName}</p>
          <p className="mt-1 text-xs font-bold text-[#80613D]">{profileCuisine || "Restaurante"}</p>
          <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#6B6258]">{profileDescription}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{profileHighlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#F1E6D5] px-2.5 py-1 text-[9px] font-bold text-[#795D38]">{item}</span>)}</div>
        </div>
      </div>
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
