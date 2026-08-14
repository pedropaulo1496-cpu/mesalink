"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send, Sparkles, X } from "lucide-react";
import { MARKETING_CARD_THEMES, type MarketingCardTheme } from "@/lib/marketing-card-themes";

export default function RecoveryOfferButton({ restaurantId, label = "Configurar recuperação", mode = "recovery", compact = false }: { restaurantId: string; label?: string; mode?: "recovery" | "birthday"; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [benefitType, setBenefitType] = useState("PERCENT");
  const [giftLabel, setGiftLabel] = useState("1 sobremesa");
  const [template, setTemplate] = useState<MarketingCardTheme>(mode === "birthday" ? "GOLD" : "FOREST");
  const birthday = mode === "birthday";

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch(birthday ? "/api/marketing/run-birthdays" : "/api/marketing/run-recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        offer: {
          title: form.get("title"),
          description: form.get("description"),
          benefitType,
          value: benefitType === "GIFT" ? 0 : form.get("value"),
          benefitLabel: benefitType === "GIFT" ? giftLabel : null,
          minSpend: form.get("minSpend"),
          validDays: form.get("validDays"),
          terms: form.get("terms"),
          template,
        },
      }),
    });
    const data = await response.json().catch(() => null);
    setSending(false);
    if (!response.ok || !data?.success) return setMessage(data?.error || (birthday ? "Não foi possível enviar os presentes de aniversário." : "Não foi possível executar a recuperação."));
    setSuccess(true);
    const cardsCreated = data.cardsCreated ?? data.created;
    setMessage(`${data.emailsSent} email${data.emailsSent === 1 ? "" : "s"} enviado${data.emailsSent === 1 ? "" : "s"} · ${cardsCreated} cartão${cardsCreated === 1 ? "" : "ões"} criado${cardsCreated === 1 ? "" : "s"}.`);
    if (data.emailsSent) setTimeout(() => window.location.reload(), 1300);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#16120E] font-semibold text-white transition hover:bg-[#2A2118] ${compact ? "h-10 px-4 text-xs" : "h-11 px-5 text-sm"}`}><Sparkles size={14} /> {label}</button>
    {open && <div className="fixed inset-0 z-[130] flex items-end justify-center bg-[#17120D]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !sending) setOpen(false); }}>
      <form onSubmit={send} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[30px] border border-[#E1D0B8] bg-[#FFF9F0] shadow-2xl sm:rounded-[30px]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E1D0B8] bg-white/95 p-5 backdrop-blur"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">{birthday ? "Aniversários" : "Recuperação de clientes"}</p><h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{birthday ? "Escolhe a recompensa de aniversário" : "Escolhe o incentivo antes de enviar"}</h3><p className="mt-1 text-xs text-[#75695D]">{birthday ? "Cada aniversariante recebe um cartão digital único com a recompensa escolhida." : "Cada cliente inativo recebe o seu próprio cartão digital."}</p></div><button type="button" onClick={() => setOpen(false)} disabled={sending} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0]"><X size={15} /></button></header>
        <div className="space-y-5 p-5">
          <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">{birthday ? "Tipo de recompensa" : "Tipo de incentivo"}</p><div className="mt-2 grid grid-cols-3 gap-2">{[{ value: "PERCENT", label: "Desconto %" }, { value: "FIXED", label: "Desconto €" }, { value: "GIFT", label: birthday ? "Presente" : "Oferta" }].map((option) => <button key={option.value} type="button" onClick={() => setBenefitType(option.value)} className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${benefitType === option.value ? "border-[#B9853E] bg-[#FFF0D3]" : "border-[#E1D0B8] bg-white"}`}>{option.label}</button>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-3"><label className="text-xs font-bold text-[#75695D]">{benefitType === "PERCENT" ? "Percentagem" : benefitType === "FIXED" ? "Valor em euros" : "Qual é a oferta?"}{benefitType === "GIFT" ? <input name="benefitLabel" type="text" value={giftLabel} onChange={(event) => setGiftLabel(event.target.value)} required minLength={2} maxLength={60} placeholder="Ex.: 1 sobremesa" className="input-premium mt-2" /> : <input name="value" type="number" min="1" max={benefitType === "PERCENT" ? 50 : 1000} step={benefitType === "FIXED" ? "0.01" : "1"} defaultValue="10" required className="input-premium mt-2" />}</label><label className="text-xs font-bold text-[#75695D]">Validade<select name="validDays" defaultValue="30" className="input-premium mt-2"><option value="14">14 dias</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></label><label className="text-xs font-bold text-[#75695D]">Consumo mínimo €<input name="minSpend" type="number" min="0" max="10000" step="0.01" placeholder="Opcional" className="input-premium mt-2" /></label></div>
          <label className="block text-xs font-bold text-[#75695D]">Título do cartão<input name="title" required maxLength={100} defaultValue={birthday ? "O seu presente de aniversário" : "Um convite especial para voltar"} className="input-premium mt-2" /></label>
          <label className="block text-xs font-bold text-[#75695D]">Mensagem do cartão<textarea name="description" required maxLength={280} rows={3} defaultValue={birthday ? "Parabéns! Preparámos esta recompensa para celebrar connosco na sua próxima visita." : "Já passou algum tempo desde a sua última visita. Gostávamos muito de o voltar a receber."} className="input-premium mt-2 resize-none py-3" /></label>
          <label className="block text-xs font-bold text-[#75695D]">Condições<input name="terms" maxLength={320} placeholder="Ex.: não acumulável com outras promoções" className="input-premium mt-2" /></label>
          <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Design do cartão</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(MARKETING_CARD_THEMES) as MarketingCardTheme[]).map((key) => { const theme = MARKETING_CARD_THEMES[key]; const selected = template === key; return <button key={key} type="button" onClick={() => setTemplate(key)} className={`relative aspect-[1.58/1] rounded-2xl border-2 p-3 text-left text-xs font-bold shadow-sm ${selected ? "border-[#B9853E] ring-2 ring-[#B9853E]/15" : "border-transparent"}`} style={{ background: theme.background, color: theme.foreground }}>{theme.name}<span className="mt-5 block line-clamp-2 text-base leading-tight" style={{ color: theme.accent }}>{benefitType === "PERCENT" ? "10% OFF" : benefitType === "FIXED" ? "10€ OFF" : giftLabel || "OFERTA"}</span>{selected && <CheckCircle2 size={14} className="absolute right-2 top-2" />}</button>; })}</div></div>
        </div>
        <footer className="sticky bottom-0 border-t border-[#E1D0B8] bg-white p-4">{message && <p className={`mb-3 rounded-xl px-3 py-2 text-xs font-semibold ${success ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</p>}<button disabled={sending} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] text-sm font-bold text-white disabled:opacity-50">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {sending ? "A enviar…" : birthday ? "Criar presentes e enviar" : "Criar cartões e enviar"}</button><p className="mt-2 text-center text-[10px] text-[#8B7D6D]">Antes do envio, o MesaLink evita duplicados e confirma o saldo de emails.</p></footer>
      </form>
    </div>}
  </>;
}
