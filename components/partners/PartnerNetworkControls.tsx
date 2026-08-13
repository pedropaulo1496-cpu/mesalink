"use client";

import { FormEvent, useState } from "react";
import { CalendarDays, Check, CloudOff, ExternalLink, MapPin, RefreshCw, ShieldCheck, UsersRound, X } from "lucide-react";

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
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(initialAutoAcceptEnabled);

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
        autoAcceptEnabled,
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
    <div className="space-y-5">
      {!paymentMethodReady && <div className="flex flex-col gap-4 rounded-[20px] border border-[#E8C97D] bg-[#FFF7DF] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F1D48C] text-[#674A20]"><ShieldCheck size={18} /></span><div><p className="text-sm font-bold text-[#5F431D]">Falta validar o cartão do restaurante</p><p className="mt-1 max-w-xl text-[11px] leading-5 text-[#80613D]">É apenas uma garantia para as comissões. Não existe qualquer cobrança nesta validação.</p></div></div><form action={`/api/restaurants/${restaurantId}/referral-auto-accept/setup`} method="POST"><button className="h-10 whitespace-nowrap rounded-full bg-[#17120D] px-5 text-[10px] font-bold text-white">Validar cartão</button></form></div>}

      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block rounded-[18px] border border-[#E5D7C3] bg-[#FBF7F1] p-4"><span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">Comissão padrão</span><div className="mt-2 grid grid-cols-[1fr_92px] gap-2"><select name="commissionType" defaultValue={initialCommissionType} className="h-11 rounded-xl border border-[#DDCDB5] bg-white px-3 text-xs font-bold outline-none"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total da reserva</option></select><div className="relative"><input name="commissionAmount" type="number" min="0.5" max="1000" step="0.01" defaultValue={initialCommissionAmount} className="h-11 w-full rounded-xl border border-[#DDCDB5] bg-white pl-3 pr-7 text-sm font-bold outline-none" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8B765E]">€</span></div></div><p className="mt-2 text-[9px] leading-4 text-[#7A6C5D]">O valor que todos os parceiros veem, salvo acordo próprio.</p></label>
          <label className="block rounded-[18px] border border-[#E5D7C3] bg-[#FBF7F1] p-4"><span className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">Capacidade diária</span><div className="mt-2 flex h-11 items-center rounded-xl border border-[#DDCDB5] bg-white"><UsersRound size={16} className="ml-3 text-[#A47A43]" /><input name="defaultDailyCapacity" type="number" min="0" max="2000" step="1" defaultValue={initialDefaultDailyCapacity} className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-bold outline-none" /><span className="pr-3 text-[10px] text-[#8B765E]">lugares</span></div><p className="mt-2 text-[9px] leading-4 text-[#7A6C5D]">Preenchida a partir das mesas ou capacidade definida.</p></label>
          <div className={`flex flex-col justify-between rounded-[18px] border p-4 ${autoAcceptEnabled ? "border-[#B9D8B8] bg-[#F1F8EF]" : "border-[#E5D7C3] bg-[#FBF7F1]"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#587255]">Estado da rede</p><p className="mt-2 text-sm font-bold">{autoAcceptEnabled ? "A receber reservas" : "Reservas pausadas"}</p></div><button type="button" role="switch" aria-checked={autoAcceptEnabled} disabled={!paymentMethodReady} onClick={() => setAutoAcceptEnabled((value) => !value)} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-35 ${autoAcceptEnabled ? "bg-[#4E7453]" : "bg-[#CFC4B5]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${autoAcceptEnabled ? "left-6" : "left-1"}`} /></button></div><p className="mt-3 text-[9px] leading-4 text-[#62715F]">Quando está ativo, a reserva entra diretamente no calendário.</p></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E9DECF] pt-4"><p className="text-[10px] text-[#74695D]">Podes alterar estes valores a qualquer momento. As reservas já feitas não mudam.</p><div className="flex items-center gap-3">{message && <span className="text-[10px] font-semibold text-[#526D51]">{message}</span>}<button disabled={loading} className="h-10 rounded-full bg-[#17120D] px-6 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(23,18,13,0.12)] disabled:opacity-50">{loading ? "A guardar…" : "Guardar alterações"}</button></div></div>
      </form>

      <div className="border-t border-[#E9DECF] pt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-sm font-bold"><CalendarDays size={16} className="text-[#9B6F3B]" /> Exceções por data</p><p className="mt-1 text-[10px] text-[#74695D]">Fecha um dia ou abre um número diferente de lugares.</p></div>{dailyCapacities.length > 0 && <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8C7356]">{dailyCapacities.length} {dailyCapacities.length === 1 ? "exceção ativa" : "exceções ativas"}</p>}</div>
        <div className="mt-3 grid gap-2 rounded-[18px] bg-[#F5EEE4] p-3 sm:grid-cols-[170px_130px_auto_auto] sm:items-center">
          <input value={exceptionDate} onChange={(event) => setExceptionDate(event.target.value)} type="date" aria-label="Dia" className="h-10 rounded-xl border border-[#DDCDB5] bg-white px-3 text-xs font-semibold outline-none" />
          <input value={exceptionCapacity} onChange={(event) => setExceptionCapacity(event.target.value)} type="number" min="1" max="2000" placeholder="Lugares" aria-label="Lugares disponíveis" className="h-10 rounded-xl border border-[#DDCDB5] bg-white px-3 text-xs font-semibold outline-none" />
          <button type="button" onClick={() => saveDate(true)} disabled={capacityLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#CBB795] bg-white px-4 text-[10px] font-bold disabled:opacity-50"><Check size={13} /> Definir lugares</button>
          <button type="button" onClick={() => saveDate(false)} disabled={capacityLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#7B4034] px-4 text-[10px] font-bold text-white disabled:opacity-50"><CloudOff size={13} /> Fechar neste dia</button>
        </div>
        {dailyCapacities.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dailyCapacities.map((item) => <div key={item.date} className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-2.5 ${item.enabled ? "border-[#C9DCC6] bg-[#F2FAF1] text-[#405C42]" : "border-[#E0B7A8] bg-[#FFF0EA] text-[#934A35]"}`}><div><p className="text-[9px] font-black uppercase tracking-[0.1em]">{new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(new Date(`${item.date}T12:00:00Z`))}</p><p className="mt-0.5 text-xs font-bold">{new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long" }).format(new Date(`${item.date}T12:00:00Z`))} · {item.enabled ? `${item.capacity} lugares` : "Fechado"}</p></div><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-capacity`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: item.date }) }); if (response.ok) setDailyCapacities((items) => items.filter((row) => row.date !== item.date)); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80" aria-label={`Remover exceção de ${item.date}`}><X size={13} /></button></div>)}</div>}
      </div>
    </div>
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
    <div className="space-y-5">
      {initialRequests.length > 0 && <div><div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#A36D19]">A tua decisão</p><h3 className="mt-1 text-base font-semibold">Pedidos de negociação</h3></div><span className="grid h-8 min-w-8 place-items-center rounded-full bg-[#FFF0CB] px-2 text-[10px] font-black text-[#7A592F]">{initialRequests.length}</span></div><div className="grid gap-3 lg:grid-cols-2">{initialRequests.map((request) => <div key={request.id} className="rounded-[18px] border border-[#E5CF9D] bg-[#FFF8E8] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{request.partnerName}</p><p className="mt-1 truncate text-[9px] text-[#806B50]">{request.partnerEmail}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#8B6738]">Proposta</span></div><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.12em] text-[#8A7863]">Nova comissão</p><p className="mt-1 text-xl font-semibold tracking-[-0.04em]">{request.commissionAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} € <span className="text-[10px] font-normal text-[#75695D]">{request.commissionType === "PER_PERSON" ? "/ pessoa" : "total"}</span></p></div><div className="flex gap-2"><button type="button" onClick={() => respondToCommissionRequest(restaurantId, request.id, "REJECT")} className="h-9 rounded-full border border-[#D8C6A9] bg-white px-4 text-[9px] font-bold">Recusar</button><button type="button" onClick={() => respondToCommissionRequest(restaurantId, request.id, "ACCEPT")} className="h-9 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white">Aceitar</button></div></div></div>)}</div></div>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]">
        <div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">Adicionar exceção</p><h3 className="mt-1 text-base font-semibold">Condição especial para um parceiro</h3><p className="mt-1 text-[10px] leading-5 text-[#75695D]">Usa o email da conta MesaLink Partner. Este valor substitui a comissão normal apenas para essa conta.</p><form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[minmax(190px,1fr)_130px_100px_auto] sm:items-end"><label className="text-[9px] font-bold text-[#75695D]">Conta do parceiro<input name="partnerEmail" type="email" required placeholder="parceiro@email.com" className="mt-1 h-10 w-full rounded-xl border border-[#DDCDB5] bg-[#FBF8F3] px-3 text-xs outline-none" /></label><label className="text-[9px] font-bold text-[#75695D]">Tipo<select name="commissionType" defaultValue="PER_PERSON" className="mt-1 h-10 w-full rounded-xl border border-[#DDCDB5] bg-[#FBF8F3] px-3 text-xs font-bold outline-none"><option value="PER_PERSON">Por pessoa</option><option value="TOTAL">Total</option></select></label><label className="text-[9px] font-bold text-[#75695D]">Valor (€)<input name="commissionAmount" type="number" min="0.5" max="1000" step="0.01" defaultValue="1.5" required className="mt-1 h-10 w-full rounded-xl border border-[#DDCDB5] bg-[#FBF8F3] px-3 text-xs font-bold outline-none" /></label><button disabled={loading} className="h-10 rounded-full bg-[#17120D] px-5 text-[9px] font-bold text-white disabled:opacity-50">{loading ? "A guardar…" : "Adicionar parceiro"}</button></form>{message && <p className={`mt-2 text-[9px] font-semibold ${success ? "text-[#3F6A4D]" : "text-[#A14E36]"}`}>{message}</p>}</div>
        <div className="rounded-[18px] bg-[#F4ECE1] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8B6738]">Acordos ativos</p><p className="mt-1 text-2xl font-semibold">{initialAgreements.length}</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#8B6738]"><UsersRound size={17} /></span></div>{initialAgreements.length === 0 ? <p className="mt-3 text-[10px] leading-5 text-[#75695D]">Todos os parceiros estão a usar a comissão padrão.</p> : <div className="mt-3 space-y-2">{initialAgreements.map((agreement) => <div key={agreement.id} className="flex items-center justify-between gap-2 rounded-[12px] bg-white px-3 py-2.5"><div className="min-w-0"><p className="truncate text-[10px] font-bold">{agreement.partnerName}</p><p className="mt-0.5 text-[9px] text-[#7A6C5D]">{agreement.commissionAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} € {agreement.commissionType === "PER_PERSON" ? "/ pessoa" : "total"}</p></div><button type="button" onClick={async () => { const response = await fetch(`/api/restaurants/${restaurantId}/referral-agreements`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agreementId: agreement.id }) }); if (response.ok) window.location.reload(); }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F7EEE3] text-[#9A563F]" aria-label={`Remover exceção de ${agreement.partnerName}`}><X size={12} /></button></div>)}</div>}</div>
      </div>
    </div>
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
    <div className="overflow-hidden rounded-[24px] bg-[#17120D] text-white shadow-[0_22px_55px_rgba(35,24,14,0.18)]">
      <div className="relative h-48 overflow-hidden bg-[#3B2A1C] sm:h-56">{heroImage ? <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg,rgba(23,18,13,.05),rgba(23,18,13,.72)),url(${heroImage})` }} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#785B35,transparent_40%),linear-gradient(135deg,#2A1D13,#17120D)]" />}<div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.14em] backdrop-blur"><span className={`h-2 w-2 rounded-full ${googleBusinessConnected ? "bg-[#93D297]" : "bg-[#E7BC67]"}`} />{googleBusinessConnected ? "Perfil Google verificado" : "A aguardar ligação Google"}</div><div className="absolute inset-x-5 bottom-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#E6C57E]">Como aparece aos parceiros</p><h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em]">{restaurantName}</h3></div></div>
      <div className="p-5"><div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold"><span className="rounded-full bg-white/10 px-3 py-1.5">{cuisine || "Restaurante"}</span>{googleRating != null && <span className="text-[#F1CF80]">★ {googleRating.toFixed(1)} <span className="font-normal text-white/45">({googleReviewCount || 0} avaliações)</span></span>}{googlePriceLevel && <span className="tracking-[0.12em] text-[#A7D0A9]">{"€".repeat(googlePriceLevel)}</span>}</div>{address && <p className="mt-4 flex items-start gap-2 text-[10px] leading-5 text-white/60"><MapPin size={14} className="mt-0.5 shrink-0 text-[#D6AF64]" />{address}</p>}{description && <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-white/65">{description}</p>}<div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => submitExternalForm(`/api/restaurants/${restaurantId}/google-business/${googleBusinessConnected ? "sync" : "connect"}`)} disabled={!googleBusinessReady} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#D6AF64] px-4 text-[9px] font-black text-[#17120D] disabled:cursor-not-allowed disabled:opacity-35">{googleBusinessConnected ? <RefreshCw size={13} /> : <ShieldCheck size={13} />}{googleBusinessConnected ? "Atualizar dados" : "Associar Google"}</button>{googleMapsUrl ? <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/20 px-4 text-[9px] font-bold text-white"><ExternalLink size={12} /> Abrir Maps</a> : <span className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-center text-[8px] text-white/35">Maps ainda não associado</span>}</div><p className="mt-4 flex items-start gap-2 border-t border-white/10 pt-4 text-[8px] leading-4 text-white/40"><ShieldCheck size={12} className="mt-0.5 shrink-0" />{googleBusinessReady ? "Avaliações, preço, localização e fotografias são sincronizados e não podem ser escritos manualmente." : "A integração central MesaLink aguarda aprovação do Google. Depois, o restaurante autoriza o perfil uma vez."}</p></div>
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
