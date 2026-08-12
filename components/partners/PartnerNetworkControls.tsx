"use client";

import { FormEvent, useState } from "react";

export function ReferralNetworkSettingsForm({
  restaurantId,
  initialEnabled,
  initialCommissionType,
  initialCommissionAmount,
}: {
  restaurantId: string;
  initialEnabled: boolean;
  initialCommissionType: string;
  initialCommissionAmount: number;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
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
        enabled,
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
      <label className="flex cursor-pointer items-start gap-4 rounded-[22px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="mt-1 h-5 w-5 accent-[#17120D]" />
        <span><span className="block text-sm font-semibold">Disponível na app dos parceiros</span><span className="mt-1 block text-xs leading-5 text-[#70665B]">Só os restaurantes que ativarem esta opção podem receber propostas de grupos.</span></span>
      </label>
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <select name="commissionType" defaultValue={initialCommissionType} className="input-premium h-12"><option value="PER_PERSON">Comissão por pessoa</option><option value="TOTAL">Comissão total</option></select>
        <input name="commissionAmount" type="number" min="1" max="1000" step="0.01" defaultValue={initialCommissionAmount} className="input-premium h-12" />
      </div>
      {message && <p className="text-xs font-semibold text-[#6F573A]">{message}</p>}
      <button disabled={loading} className="h-12 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar rede e comissão"}</button>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Categoria / cozinha</span><input name="cuisine" defaultValue={cuisine} maxLength={80} className="input-premium h-12" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Imagem principal</span><input name="heroImage" defaultValue={heroImage} placeholder="https://…" className="input-premium h-12" /></label>
        </div>
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Descrição para hotéis e parceiros</span><textarea name="description" defaultValue={description} maxLength={700} rows={4} className="input-premium min-h-28 py-3" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Destaques · um por linha</span><textarea name="highlights" defaultValue={highlights.join("\n")} rows={4} className="input-premium min-h-28 py-3" /></label>
          <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Galeria · um link por linha</span><textarea name="gallery" defaultValue={gallery.join("\n")} rows={4} className="input-premium min-h-28 py-3" /></label>
        </div>
        <label className="block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">Menu PDF ou página do menu</span><input name="menuUrl" defaultValue={menuUrl} placeholder="https://…" className="input-premium h-12" /></label>
        {message && <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}
        <button disabled={loading} className="h-12 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Guardar mini-perfil"}</button>
      </div>

      <div className="overflow-hidden rounded-[26px] border border-[#E1D0B8] bg-[#FFFDFC]">
        {heroImage ? <div className="h-36 bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} /> : <div className="grid h-36 place-items-center bg-[#EADCC7] text-xs font-black uppercase tracking-[0.16em] text-[#8A6D49]">Imagem automática</div>}
        <div className="p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-[#9B6F3B]">Pré-visualização</p>
          <p className="mt-2 text-xl font-semibold">{restaurantName}</p>
          <p className="mt-1 text-xs font-bold text-[#80613D]">{cuisine || "Restaurante"}</p>
          <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#6B6258]">{description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{highlights.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#F1E6D5] px-2.5 py-1 text-[9px] font-bold text-[#795D38]">{item}</span>)}</div>
        </div>
      </div>
    </form>
  );
}
