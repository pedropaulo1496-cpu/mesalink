"use client";

import { FormEvent, useState } from "react";
import { Check, Copy, Gift, Loader2, Share2 } from "lucide-react";

export function CreatePartnerBenefitForm({ restaurantId }: { restaurantId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [benefitType, setBenefitType] = useState("PERCENT");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/restaurants/${restaurantId}/referral-benefits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível criar o benefício.");
    setMessage("Benefício publicado na app dos parceiros.");
    setTimeout(() => window.location.reload(), 900);
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <input name="title" required minLength={3} maxLength={80} placeholder="Ex.: 15% no menu de almoço" className="input-premium h-12" />
      <textarea name="description" maxLength={240} rows={3} placeholder="Explica o benefício ao parceiro e ao cliente." className="input-premium min-h-24 resize-y py-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="benefitType" value={benefitType} onChange={(event) => setBenefitType(event.target.value)} className="input-premium h-12">
          <option value="PERCENT">Desconto percentual</option>
          <option value="FIXED">Desconto em euros</option>
          <option value="PERK">Oferta / vantagem</option>
        </select>
        <input name="value" type="number" min="0" max={benefitType === "PERCENT" ? 100 : 10000} step="0.01" required={benefitType !== "PERK"} placeholder={benefitType === "PERCENT" ? "15%" : benefitType === "FIXED" ? "10 €" : "Sem valor obrigatório"} className="input-premium h-12" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-[#786A5B]">Válido desde<input name="validFrom" type="datetime-local" className="input-premium mt-2 h-12" /></label>
        <label className="text-xs font-bold text-[#786A5B]">Válido até<input name="validUntil" type="datetime-local" className="input-premium mt-2 h-12" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="minSpend" type="number" min="0" max="100000" step="0.01" placeholder="Consumo mínimo (€), opcional" className="input-premium h-12" />
        <input name="maxRedemptions" type="number" min="1" max="100000" step="1" placeholder="Máximo de utilizações" className="input-premium h-12" />
      </div>
      <textarea name="terms" maxLength={400} rows={2} placeholder="Condições: dias, menus excluídos, acumulação…" className="input-premium min-h-20 resize-y py-3" />
      {message && <p className="rounded-xl bg-[#FFF4E2] px-3 py-2 text-xs font-semibold text-[#76572F]">{message}</p>}
      <button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />} {loading ? "A publicar…" : "Publicar benefício"}
      </button>
    </form>
  );
}

export function BenefitToggleButton({ benefitId, active }: { benefitId: string; active: boolean }) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const response = await fetch(`/api/referral-benefits/${benefitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    if (response.ok) window.location.reload();
    else setLoading(false);
  }

  return <button onClick={toggle} disabled={loading} className="h-10 rounded-full border border-[#D5C19F] bg-white px-4 text-xs font-bold disabled:opacity-50">{loading ? "A guardar…" : active ? "Pausar" : "Reativar"}</button>;
}

export function IssueBenefitCardButton({ benefitId }: { benefitId: string }) {
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  const [card, setCard] = useState<{ publicCode: string; cardUrl: string } | null>(null);
  const [message, setMessage] = useState("");

  async function issue() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/referral-benefits/${benefitId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestCount }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível emitir o cartão.");
    setCard(result);
  }

  async function share() {
    if (!card) return;
    const text = `Cartão MesaLink ${card.publicCode}: ${card.cardUrl}`;
    if (navigator.share) await navigator.share({ title: "Cartão MesaLink", text, url: card.cardUrl });
    else {
      await navigator.clipboard.writeText(text);
      setMessage("Link copiado.");
    }
  }

  if (card) return (
    <div className="mt-4 rounded-[20px] border border-[#9DC9A0] bg-[#EFF9EF] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4A7656]">Cartão emitido</p>
      <p className="mt-2 font-mono text-lg font-black tracking-wider text-[#24482F]">{card.publicCode}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={share} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#24482F] px-4 text-xs font-bold text-white"><Share2 size={14} /> Partilhar</button>
        <button onClick={async () => { await navigator.clipboard.writeText(card.cardUrl); setMessage("Link copiado."); }} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#A9C9AC] bg-white px-4 text-xs font-bold text-[#24482F]"><Copy size={14} /> Copiar link</button>
      </div>
      {message && <p className="mt-2 text-xs font-semibold text-[#3F6A4D]">{message}</p>}
    </div>
  );

  return (
    <div className="mt-4 flex items-center gap-2">
      <input type="number" min={1} max={100} value={guestCount} onChange={(event) => setGuestCount(Number(event.target.value))} aria-label="Número de pessoas" className="input-premium h-11 w-20" />
      <button onClick={issue} disabled={loading} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-50">{loading ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />} {loading ? "A emitir…" : "Emitir cartão"}</button>
      {message && <p className="text-xs font-semibold text-[#A14E36]" role="alert">{message}</p>}
    </div>
  );
}

export function RedeemBenefitCardForm({ restaurantId }: { restaurantId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/referral-benefit-cards/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, publicCode: form.get("publicCode") }),
    });
    const result = await response.json();
    setLoading(false);
    setSuccess(response.ok);
    setMessage(response.ok ? `${result.title} validado para ${result.guestCount} pessoa${result.guestCount === 1 ? "" : "s"}.` : result.error || "Código inválido.");
    if (response.ok) (event.currentTarget as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input name="publicCode" required maxLength={40} placeholder="MLC-XXXXXXXXXX" autoCapitalize="characters" className="input-premium h-12 flex-1 font-mono uppercase tracking-wider" />
        <button disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white disabled:opacity-50">{success ? <Check size={16} /> : loading ? <Loader2 size={16} className="animate-spin" /> : null}{loading ? "A validar…" : "Validar cartão"}</button>
      </div>
      {message && <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}
    </form>
  );
}
