"use client";

import { FormEvent, useState } from "react";
import { Check, ChevronDown, Copy, Gift, Loader2, Share2, Sparkles, Trash2 } from "lucide-react";
import { MARKETING_CARD_THEMES, marketingBenefitValue, type MarketingCardTheme } from "@/lib/marketing-card-themes";

type BenefitPreset = {
  label: string;
  title: string;
  description: string;
  benefitType: "PERCENT" | "FIXED" | "PERK";
  value: string;
  benefitLabel: string;
  template: MarketingCardTheme;
  terms: string;
};

const benefitPresets: BenefitPreset[] = [
  {
    label: "15% próxima visita",
    title: "Um convite especial para voltar",
    description: "Gostávamos de voltar a recebê-lo. Aproveite 15% de desconto na sua próxima visita.",
    benefitType: "PERCENT",
    value: "15",
    benefitLabel: "",
    template: "GOLD",
    terms: "Não acumulável com outras promoções.",
  },
  {
    label: "10€ de desconto",
    title: "10€ para a sua próxima visita",
    description: "Temos 10€ de desconto reservados para tornar a sua próxima experiência ainda melhor.",
    benefitType: "FIXED",
    value: "10",
    benefitLabel: "",
    template: "FOREST",
    terms: "Não acumulável com outras promoções.",
  },
  {
    label: "Sobremesa oferta",
    title: "Uma sobremesa por nossa conta",
    description: "Na sua próxima reserva, escolha uma sobremesa da casa e deixe o resto connosco.",
    benefitType: "PERK",
    value: "",
    benefitLabel: "Sobremesa grátis",
    template: "TERRACOTTA",
    terms: "Uma sobremesa por mesa. Não acumulável com outras promoções.",
  },
];

function futureDateTimeLocal(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export function CreatePartnerBenefitForm({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState(benefitPresets[0].title);
  const [description, setDescription] = useState(benefitPresets[0].description);
  const [benefitType, setBenefitType] = useState<BenefitPreset["benefitType"]>("PERCENT");
  const [value, setValue] = useState("15");
  const [benefitLabel, setBenefitLabel] = useState("");
  const [terms, setTerms] = useState(benefitPresets[0].terms);
  const [validUntil] = useState(() => futureDateTimeLocal(30));
  const [template, setTemplate] = useState<MarketingCardTheme>("GOLD");

  function applyPreset(preset: BenefitPreset) {
    setTitle(preset.title);
    setDescription(preset.description);
    setBenefitType(preset.benefitType);
    setValue(preset.value);
    setBenefitLabel(preset.benefitLabel);
    setTemplate(preset.template);
    setTerms(preset.terms);
  }

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
    setMessage("Modelo criado. Já podes enviá-lo a um ou vários clientes.");
    setTimeout(() => window.location.reload(), 900);
  }

  const theme = MARKETING_CARD_THEMES[template];
  const previewBenefit = marketingBenefitValue(
    benefitType === "PERK" ? "GIFT" : benefitType,
    benefitType === "PERK" ? null : Number(value || 0),
    benefitLabel,
  );

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="flex flex-wrap gap-2">
        {benefitPresets.map((preset) => <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="rounded-full border border-[#DDC9AA] bg-[#FFF9F0] px-3 py-2 text-[10px] font-bold text-[#6E5130] transition hover:border-[#B9853E] hover:bg-[#FFF1D8]">{preset.label}</button>)}
      </div>

      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Título<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={80} className="input-premium mt-1.5 h-11" /></label>
          <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Mensagem<textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} rows={2} className="input-premium mt-1.5 min-h-20 resize-none py-3 text-sm" /></label>
          <div className={`grid gap-2 ${benefitType === "PERK" ? "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-[minmax(0,1fr)_110px]"}`}>
            <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Oferta<select name="benefitType" value={benefitType} onChange={(event) => { const next = event.target.value as BenefitPreset["benefitType"]; setBenefitType(next); if (next === "PERK") { setValue(""); if (!benefitLabel) setBenefitLabel("Oferta especial"); } else if (!value) setValue(next === "PERCENT" ? "15" : "10"); }} className="input-premium mt-1.5 h-11"><option value="PERCENT">Desconto percentual</option><option value="FIXED">Desconto em euros</option><option value="PERK">Oferta / vantagem</option></select></label>
            {benefitType === "PERK" ? <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Qual é a oferta?<input name="benefitLabel" value={benefitLabel} onChange={(event) => setBenefitLabel(event.target.value)} required minLength={2} maxLength={40} placeholder="Ex.: Sobremesa grátis" className="input-premium mt-1.5 h-11" /></label> : <label className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Valor<input name="value" value={value} onChange={(event) => setValue(event.target.value)} type="number" min="0" max={benefitType === "PERCENT" ? 100 : 10000} step="0.01" required className="input-premium mt-1.5 h-11" /></label>}
          </div>

          <details className="group rounded-[18px] border border-[#E5D6C0] bg-[#FFF9F0]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-bold text-[#6E5130]">Validade e condições <ChevronDown size={14} className="transition group-open:rotate-180" /></summary>
            <div className="grid gap-3 border-t border-[#E5D6C0] p-3 sm:grid-cols-2">
              <label className="text-[10px] font-bold text-[#786A5B]">Válido até<input name="validUntil" type="datetime-local" defaultValue={validUntil} className="input-premium mt-1.5 h-10 text-xs" /></label>
              <label className="text-[10px] font-bold text-[#786A5B]">Consumo mínimo (€)<input name="minSpend" type="number" min="0" max="100000" step="0.01" placeholder="Opcional" className="input-premium mt-1.5 h-10 text-xs" /></label>
              <label className="text-[10px] font-bold text-[#786A5B]">Máximo de cartões<input name="maxRedemptions" type="number" min="1" max="100000" step="1" placeholder="Sem limite" className="input-premium mt-1.5 h-10 text-xs" /></label>
              <label className="text-[10px] font-bold text-[#786A5B]">Condições<input name="terms" value={terms} onChange={(event) => setTerms(event.target.value)} maxLength={400} className="input-premium mt-1.5 h-10 text-xs" /></label>
            </div>
          </details>

          {message && <p className="rounded-xl bg-[#FFF4E2] px-3 py-2 text-xs font-semibold text-[#76572F]">{message}</p>}
          <button disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />} {loading ? "A criar…" : "Criar modelo"}
          </button>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Pré-visualização</p>
          <div className="relative mt-2 aspect-[1.58/1] min-h-[176px] overflow-hidden rounded-[22px] border border-white/25 p-4 shadow-[0_18px_40px_rgba(55,37,20,0.18)]" style={{ background: theme.background, color: theme.foreground }}>
            <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/15" />
            <div className="relative flex h-full flex-col"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-bold">{restaurantName}</p><p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Cartão digital</p></div><Sparkles size={15} style={{ color: theme.accent }} /></div><div className="my-auto py-2"><p className="line-clamp-2 text-lg font-bold leading-[0.98] tracking-[-0.035em]">{title || "Título da oferta"}</p><p className="mt-2 line-clamp-2 text-[9px] leading-4" style={{ color: theme.muted }}>{description || "A mensagem aparece aqui."}</p></div><div className="flex items-end justify-between gap-3 border-t border-white/15 pt-2"><p className="font-mono text-[8px] font-bold tracking-[0.08em]">MLC-••••••••••</p><p className="text-xl font-black" style={{ color: theme.accent }}>{previewBenefit}</p></div></div>
          </div>
          <p className="mt-2 text-[10px] leading-4 text-[#7B6E60]">Cada cliente recebe um código exclusivo. O benefício aparece automaticamente na reserva.</p>
          <div className="mt-3 flex flex-wrap gap-2">{(Object.keys(MARKETING_CARD_THEMES) as MarketingCardTheme[]).map((key) => { const option = MARKETING_CARD_THEMES[key]; return <button key={key} type="button" title={option.name} aria-label={`Usar design ${option.name}`} onClick={() => setTemplate(key)} className={`h-8 w-8 rounded-full border-2 transition ${template === key ? "border-[#17120D] ring-2 ring-[#C8A56A]/30" : "border-white"}`} style={{ background: option.background }} />; })}</div>
          <input type="hidden" name="template" value={template} />
        </div>
      </div>
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

export function DeleteBenefitButton({ benefitId }: { benefitId: string }) {
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!window.confirm("Eliminar este modelo de cartão? Os cartões já enviados continuam guardados no histórico.")) return;
    setLoading(true);
    const response = await fetch(`/api/referral-benefits/${benefitId}`, { method: "DELETE" });
    if (response.ok) window.location.reload();
    else {
      const result = await response.json().catch(() => null);
      window.alert(result?.error || "Não foi possível eliminar o cartão.");
      setLoading(false);
    }
  }

  return <button type="button" onClick={remove} disabled={loading} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[10px] font-bold text-[#A04735] transition hover:bg-[#FFF0EC] disabled:opacity-50"><Trash2 size={13} /> {loading ? "A eliminar…" : "Eliminar"}</button>;
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
