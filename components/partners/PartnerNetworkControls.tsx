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
