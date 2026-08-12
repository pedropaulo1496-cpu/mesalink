"use client";

import { FormEvent, useState } from "react";
import { FileUploadField } from "@/components/FileUploadField";
import { ImageUploadField } from "@/components/ImageUploadField";

export function ReferralNetworkSettingsForm({
  restaurantId,
  initialCommissionType,
  initialCommissionAmount,
}: {
  restaurantId: string;
  initialCommissionType: string;
  initialCommissionAmount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: true,
        commissionType: data.get("commissionType"),
        commissionAmount: data.get("commissionAmount"),
      }),
    });
    const result = await response.json();
    setLoading(false);
    setMessage(response.ok ? "Definições guardadas." : result.error || "Não foi possível guardar.");
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="rounded-[22px] border border-[#BFD7BB] bg-[#F1F9F0] p-4"><span className="block text-sm font-semibold text-[#3F6A4D]">Publicado automaticamente na app Partners</span><span className="mt-1 block text-xs leading-5 text-[#60705E]">Todos os restaurantes MesaLink aparecem na pesquisa. Define aqui a comissão sugerida para novos grupos.</span></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <select name="commissionType" defaultValue={initialCommissionType} className="input-premium h-12"><option value="PER_PERSON">Comissão por pessoa</option><option value="TOTAL">Comissão total</option></select>
        <input name="commissionAmount" type="number" min="1" max="1000" step="0.01" defaultValue={initialCommissionAmount} className="input-premium h-12" />
      </div>
      {message && <p className="text-xs font-semibold text-[#6F573A]">{message}</p>}
      <button disabled={loading} className="h-12 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar comissão base"}</button>
    </form>
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
}: {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  description: string;
  heroImage: string;
  gallery: string[];
  highlights: string[];
  menuUrl: string;
}) {
  const [profileCuisine, setProfileCuisine] = useState(cuisine);
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
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Categoria / cozinha</span><input name="cuisine" value={profileCuisine} onChange={(event) => setProfileCuisine(event.target.value)} maxLength={80} className="input-premium h-12" /></label>
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Descrição para hotéis e parceiros</span><textarea name="description" value={profileDescription} onChange={(event) => setProfileDescription(event.target.value)} maxLength={700} rows={4} className="input-premium min-h-28 py-3" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Destaques · um por linha</span><textarea name="highlights" value={profileHighlights} onChange={(event) => setProfileHighlights(event.target.value)} rows={4} className="input-premium min-h-28 py-3" /></label>
          <div><p className="mb-2 text-xs font-bold text-[#655A4E]">Fotografia principal</p><ImageUploadField value={profileHeroImage} onChange={setProfileHeroImage} compact /><input type="hidden" name="heroImage" value={profileHeroImage} /></div>
        </div>
        <div className="rounded-[26px] border border-[#E1D0B8] bg-[#FFF9F0] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Galeria do restaurante</p><p className="mt-1 text-xs text-[#70665B]">Carrega até 6 fotografias. Podes substituir ou remover cada uma.</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#795D38]">{profileGallery.length}/6</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profileGallery.map((image, index) => <div key={`${image}-${index}`}><p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#8A765F]">Fotografia {index + 1}</p><ImageUploadField value={image} onChange={(url) => setProfileGallery((items) => url ? items.map((item, itemIndex) => itemIndex === index ? url : item) : items.filter((_, itemIndex) => itemIndex !== index))} compact /></div>)}
            {profileGallery.length < 6 && <div><p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#8A765F]">Adicionar fotografia</p><ImageUploadField value="" onChange={(url) => url && setProfileGallery((items) => [...items, url].slice(0, 6))} compact /></div>}
          </div>
          <input type="hidden" name="gallery" value={profileGallery.join("\n")} />
        </div>
        <div><p className="mb-2 text-xs font-bold text-[#655A4E]">Menu em PDF</p><FileUploadField value={profileMenuUrl} onChange={setProfileMenuUrl} /><input type="hidden" name="menuUrl" value={profileMenuUrl} /></div>
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
