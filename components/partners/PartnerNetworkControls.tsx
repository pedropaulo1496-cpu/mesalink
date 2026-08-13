"use client";

import { FormEvent, useState } from "react";

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
  initialDailyCapacities: Array<{ date: string; capacity: number; enabled: boolean }>;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dailyCapacities, setDailyCapacities] = useState(initialDailyCapacities);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionCapacity, setExceptionCapacity] = useState(String(initialDefaultDailyCapacity || ""));

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

  async function saveDate(enabled: boolean) {
    if (!exceptionDate) return setMessage("Escolhe primeiro o dia.");
    const capacity = enabled ? Number(exceptionCapacity) : 0;
    if (enabled && (!Number.isInteger(capacity) || capacity < 1)) return setMessage("Indica quantos lugares queres abrir nesse dia.");
    setCapacityLoading(true);
    setMessage("");
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: exceptionDate, capacity, enabled }),
    });
    const result = await response.json();
    setCapacityLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível guardar o dia.");
    setDailyCapacities((items) => [...items.filter((item) => item.date !== exceptionDate), { date: exceptionDate, capacity, enabled }].sort((a, b) => a.date.localeCompare(b.date)));
    setExceptionDate("");
    setExceptionCapacity(String(initialDefaultDailyCapacity || ""));
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
        <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[10px] font-bold"><span>Alterar disponibilidade num dia</span><span className="text-[#9B6F3B] group-open:hidden">Abrir ↓</span><span className="hidden text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
        <div className="border-t border-[#E7D9C6] p-3">
          <div className="grid gap-2 sm:grid-cols-[150px_100px_auto_auto] sm:items-center">
            <input value={exceptionDate} onChange={(event) => setExceptionDate(event.target.value)} type="date" aria-label="Dia" className="input-premium h-9 text-xs" />
            <input value={exceptionCapacity} onChange={(event) => setExceptionCapacity(event.target.value)} type="number" min="1" max="2000" placeholder="Lugares" aria-label="Lugares disponíveis" className="input-premium h-9 text-xs" />
            <button type="button" onClick={() => saveDate(true)} disabled={capacityLoading} className="h-9 rounded-full border border-[#CBB795] bg-white px-3 text-[9px] font-bold disabled:opacity-50">Guardar lugares</button>
            <button type="button" onClick={() => saveDate(false)} disabled={capacityLoading} className="h-9 rounded-full bg-[#17120D] px-3 text-[9px] font-bold text-white disabled:opacity-50">Ficar offline neste dia</button>
          </div>
          {dailyCapacities.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{dailyCapacities.map((item) => <div key={item.date} className={`inline-flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-[10px] ${item.enabled ? "border-[#C9DCC6] bg-[#F2FAF1] text-[#405C42]" : "border-[#E0B7A8] bg-[#FFF0EA] text-[#934A35]"}`}><span>{new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T12:00:00Z`))} · <strong>{item.enabled ? `${item.capacity} lugares` : "Offline"}</strong></span><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: item.date }) }); if (response.ok) setDailyCapacities((items) => items.filter((row) => row.date !== item.date)); }} className="grid h-7 w-7 place-items-center rounded-full bg-white/80 font-black" aria-label={`Remover exceção de ${item.date}`}>×</button></div>)}</div>}
        </div>
      </details>
    </>
  );
}

export function ReferralAgreementForm({
  restaurantId,
  initialAgreements,
  initialRequests,
}: {
  restaurantId: string;
  initialAgreements: Array<{ id: string; partnerName: string; partnerEmail: string; commissionType: "PER_PERSON" | "TOTAL"; commissionAmount: number }>;
  initialRequests: Array<{ id: string; partnerName: string; partnerEmail: string; commissionType: "PER_PERSON" | "TOTAL"; commissionAmount: number }>;
}) {
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
    <details className="group mt-3 rounded-[13px] border border-[#E7D9C6] bg-[#FFFDFC]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[10px] font-bold"><span>Comissão diferente por parceiro {initialAgreements.length > 0 ? `· ${initialAgreements.length}` : ""}</span><span className="text-[#9B6F3B] group-open:hidden">Acrescentar ↓</span><span className="hidden text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
      <div className="border-t border-[#E7D9C6] p-3">
        {initialRequests.length > 0 && <div className="mb-3 space-y-2"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#9B6F3B]">Pedidos por responder</p>{initialRequests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[11px] border border-[#E5CF9D] bg-[#FFF7E5] px-3 py-2"><p className="text-[9px]"><strong>{request.partnerName}</strong> propõe <strong>{request.commissionAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} € {request.commissionType === "PER_PERSON" ? "/ pessoa" : "total"}</strong></p><div className="flex gap-1.5"><button type="button" onClick={() => respondToCommissionRequest(restaurantId, request.id, "REJECT")} className="h-7 rounded-full border border-[#D8C6A9] bg-white px-3 text-[8px] font-bold">Recusar</button><button type="button" onClick={() => respondToCommissionRequest(restaurantId, request.id, "ACCEPT")} className="h-7 rounded-full bg-[#17120D] px-3 text-[8px] font-bold text-white">Aceitar</button></div></div>)}</div>}
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_130px_90px_auto] sm:items-end">
          <label className="text-[9px] font-bold text-[#75695D]">Parceiro<input name="partnerEmail" type="email" required placeholder="email da conta Partner" className="input-premium mt-1 h-9 text-xs" /></label>
          <label className="text-[9px] font-bold text-[#75695D]">Tipo<select name="commissionType" defaultValue="PER_PERSON" className="input-premium mt-1 h-9 text-xs"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total</option></select></label>
          <label className="text-[9px] font-bold text-[#75695D]">Valor (€)<input name="commissionAmount" type="number" min="0.5" max="1000" step="0.01" defaultValue="1.5" required className="input-premium mt-1 h-9 text-xs" /></label>
          <button disabled={loading} className="h-9 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Adicionar"}</button>
        </form>
        {message && <p className={`mt-2 text-[9px] font-semibold ${success ? "text-[#3F6A4D]" : "text-[#A14E36]"}`}>{message}</p>}
        {initialAgreements.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{initialAgreements.map((agreement) => <div key={agreement.id} className="inline-flex items-center gap-2 rounded-full border border-[#D8C6A9] bg-white py-1 pl-3 pr-1 text-[9px]"><span><strong>{agreement.partnerName}</strong> · {agreement.commissionAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} € {agreement.commissionType === "PER_PERSON" ? "/ pessoa" : "total"}</span><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-agreements`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agreementId: agreement.id }) }); if (response.ok) window.location.reload(); }} className="grid h-7 w-7 place-items-center rounded-full bg-[#F6EBDD] font-black text-[#9A563F]" aria-label={`Remover exceção de ${agreement.partnerName}`}>×</button></div>)}</div>}
      </div>
    </details>
  );
}

export function PartnerProfileSettingsForm({
  restaurantId,
  restaurantName,
  cuisine,
  description,
  heroImage,
  address,
  googleMapsUrl,
  googleRating,
  googleReviewCount,
  googlePriceLevel,
  googleBusinessConnected,
  googleBusinessReady,
}: {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  description: string;
  heroImage: string;
  address: string;
  googleMapsUrl: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  googlePriceLevel: number | null;
  googleBusinessConnected: boolean;
  googleBusinessReady: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-[14px] bg-[#FBF8F3] p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center">
      {heroImage ? <span className="h-[72px] rounded-[12px] bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} /> : <span className="grid h-[72px] place-items-center rounded-[12px] bg-[#EADCC7] text-[8px] font-black uppercase tracking-[0.12em] text-[#8A6D49]">Google</span>}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{restaurantName}</p><span className={`rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] ${googleBusinessConnected ? "bg-[#DDEEDB] text-[#3F6A4D]" : "bg-[#FFF0CB] text-[#7A592F]"}`}>{googleBusinessConnected ? "Google ligado" : "Google por ligar"}</span></div>
        <p className="mt-0.5 text-[10px] font-semibold text-[#80613D]">{cuisine || "Restaurante"}{googleRating != null ? ` · ★ ${googleRating.toFixed(1)}${googleReviewCount != null ? ` (${googleReviewCount})` : ""}` : ""}{googlePriceLevel ? ` · ${"€".repeat(googlePriceLevel)}` : ""}</p>
        {address && <p className="mt-1 truncate text-[9px] text-[#75695D]">{address}</p>}
        {description && <p className="mt-1 line-clamp-1 text-[9px] text-[#75695D]">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button type="button" onClick={() => submitExternalForm(`/api/restaurants/${restaurantId}/google-business/${googleBusinessConnected ? "sync" : "connect"}`)} disabled={!googleBusinessReady} className="h-8 rounded-full bg-[#17120D] px-3 text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-35">{googleBusinessConnected ? "Atualizar Google" : "Associar Google"}</button>
        {googleMapsUrl && <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="h-8 rounded-full border border-[#CBB795] px-3 py-2 text-[9px] font-bold text-[#6F573A]">Abrir Maps</a>}
        <p className="w-full text-[8px] leading-3 text-[#80613D]">{googleBusinessReady ? "Avaliação, preço, localização e fotografias vêm do Google e não podem ser alterados aqui." : "A integração central MesaLink aguarda aprovação do Google. Depois, cada restaurante autoriza o seu perfil uma vez."}</p>
      </div>
    </div>
  );
}

function submitExternalForm(action: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  document.body.appendChild(form);
  form.submit();
}

async function respondToCommissionRequest(restaurantId: string, requestId: string, action: "ACCEPT" | "REJECT") {
  const response = await fetch(`/api/restaurants/${restaurantId}/referral-commission-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, action }),
  });
  if (response.ok) window.location.reload();
}
