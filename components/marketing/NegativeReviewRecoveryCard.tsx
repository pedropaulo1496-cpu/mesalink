"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Mail, Sparkles, TicketCheck, X } from "lucide-react";
import { MARKETING_CARD_THEMES, type MarketingCardTheme } from "@/lib/marketing-card-themes";

export default function NegativeReviewRecoveryCard({ restaurantId, eligibleCount3, eligibleCount4, emailsRemaining }: { restaurantId: string; eligibleCount3: number; eligibleCount4: number; emailsRemaining: number }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");
  const [template, setTemplate] = useState<MarketingCardTheme>("GOLD");
  const [benefitType, setBenefitType] = useState("PERCENT");
  const [ratingThreshold, setRatingThreshold] = useState(3);
  const eligibleCount = ratingThreshold === 4 ? eligibleCount4 : eligibleCount3;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setResult("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/marketing/recover-reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        title: form.get("title"),
        description: form.get("description"),
        benefitType,
        value: benefitType === "GIFT" ? 0 : form.get("value"),
        minSpend: form.get("minSpend"),
        validDays: form.get("validDays"),
        terms: form.get("terms"),
        ratingThreshold,
        template,
      }),
    });
    const data = await response.json().catch(() => null);
    setSending(false);
    if (!response.ok) return setResult(data?.error || "Não foi possível enviar a recuperação.");
    setResult(`${data.sent} cartão${data.sent === 1 ? "" : "ões"} enviado${data.sent === 1 ? "" : "s"}. ${data.failed ? `${data.failed} envio(s) falharam.` : ""}`.trim());
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0]">
      <div className="flex min-h-[112px] flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Recuperar avaliações menos boas</p><span className="rounded-full bg-[#FFF0EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.09em] text-[#9A4934]">{eligibleCount} por recuperar</span></div>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-[#6B6258]">Envia um pedido de desculpa e um cartão digital único às avaliações que escolheres recuperar.</p>
            <p className="mt-2 text-xs font-semibold text-[#8A6130]">{emailsRemaining} emails disponíveis · 1 crédito = 75 emails</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${open ? "border border-[#D8C6A9] bg-white text-[#6D5030]" : "bg-[#16120E] text-white hover:bg-[#2A2118]"}`}>{open ? <><X size={14} /> Fechar</> : <><Sparkles size={14} /> Configurar e enviar</>}</button>
      </div>

      {open && (
        <form onSubmit={submit} className="border-t border-[#E8DCCB] bg-[#FFF9F0] p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
            <div className="space-y-4">
              <div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Avaliações a recuperar</label><div className="mt-2 grid grid-cols-2 gap-2">{[{ value: 3, label: "1 a 3 estrelas", description: "Foca experiências negativas" }, { value: 4, label: "1 a 4 estrelas", description: "Inclui clientes quase satisfeitos" }].map((option) => <button key={option.value} type="button" onClick={() => setRatingThreshold(option.value)} className={`rounded-2xl border p-3 text-left transition ${ratingThreshold === option.value ? "border-[#B9853E] bg-[#FFF4DF] ring-2 ring-[#B9853E]/10" : "border-[#E1D0B8] bg-white"}`}><span className="block text-xs font-bold">{option.label}</span><span className="mt-1 block text-[10px] leading-4 text-[#75695D]">{option.description}</span></button>)}</div><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9A4934]">{eligibleCount} cliente{eligibleCount === 1 ? "" : "s"} elegíve{eligibleCount === 1 ? "l" : "is"}</p></div>
              <div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Nome da promoção</label><input name="title" required maxLength={100} defaultValue="Uma nova experiência por nossa conta" className="input-premium mt-2" /></div>
              <div><label className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Mensagem no cartão</label><textarea name="description" required maxLength={280} rows={3} defaultValue="Obrigado pelo seu feedback. Gostávamos de ter a oportunidade de o receber novamente e proporcionar uma experiência melhor." className="input-premium mt-2 resize-none py-3" /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div><label className="text-[10px] font-black uppercase tracking-[0.1em] text-[#806D56]">Oferta</label><select value={benefitType} onChange={(event) => setBenefitType(event.target.value)} className="input-premium mt-2"><option value="PERCENT">Desconto %</option><option value="FIXED">Desconto €</option><option value="GIFT">Oferta</option></select></div>
                <div><label className="text-[10px] font-black uppercase tracking-[0.1em] text-[#806D56]">{benefitType === "GIFT" ? "Valor" : benefitType === "PERCENT" ? "Percentagem" : "Montante"}</label><input name="value" type="number" min="1" max={benefitType === "PERCENT" ? 50 : 1000} step={benefitType === "FIXED" ? "0.01" : "1"} defaultValue={10} disabled={benefitType === "GIFT"} className="input-premium mt-2 disabled:bg-[#EEE6DB]" /></div>
                <div><label className="text-[10px] font-black uppercase tracking-[0.1em] text-[#806D56]">Validade</label><select name="validDays" defaultValue="30" className="input-premium mt-2"><option value="14">14 dias</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2"><div><label className="text-[10px] font-black uppercase tracking-[0.1em] text-[#806D56]">Consumo mínimo € (opcional)</label><input name="minSpend" type="number" min="0" step="0.01" placeholder="0" className="input-premium mt-2" /></div><div><label className="text-[10px] font-black uppercase tracking-[0.1em] text-[#806D56]">Condições (opcional)</label><input name="terms" maxLength={320} placeholder="Ex.: não acumulável" className="input-premium mt-2" /></div></div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Escolhe o cartão</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(Object.keys(MARKETING_CARD_THEMES) as MarketingCardTheme[]).map((key) => {
                  const theme = MARKETING_CARD_THEMES[key];
                  const selected = template === key;
                  return <button key={key} type="button" onClick={() => setTemplate(key)} className={`relative aspect-[1.58/1] overflow-hidden rounded-[17px] border-2 p-3 text-left shadow-sm transition ${selected ? "border-[#B9853E] ring-2 ring-[#B9853E]/15" : "border-transparent"}`} style={{ background: theme.background, color: theme.foreground }}><span className="text-[7px] font-black uppercase tracking-[0.16em]" style={{ color: theme.accent }}>MesaLink card</span><p className="mt-3 text-sm font-bold leading-[0.95]">{theme.name}</p><p className="absolute bottom-3 right-3 text-lg font-black" style={{ color: theme.accent }}>{benefitType === "PERCENT" ? "10%" : benefitType === "FIXED" ? "10€" : "OFERTA"}</p>{selected && <CheckCircle2 className="absolute right-2 top-2" size={15} />}</button>;
                })}
              </div>
              <div className="mt-3 rounded-2xl border border-[#E2D2BB] bg-white p-4"><p className="flex items-center gap-2 text-xs font-bold"><TicketCheck size={15} className="text-[#8A6130]" /> Como funciona</p><ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-[#6B6258]"><li>1. Cada cliente recebe um cartão com número único.</li><li>2. O cartão abre no telemóvel e pode ser guardado.</li><li>3. No restaurante, validas o número em Cartões & ofertas.</li><li>4. Cada cartão só pode ser utilizado uma vez.</li></ul></div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#E1D0B8] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-[#7A6D60]"><AlertTriangle className="mt-0.5 shrink-0 text-[#A45138]" size={14} /> Serão contactados no máximo {Math.min(eligibleCount, 100)} clientes elegíveis, uma única vez por avaliação.</p>
            <button disabled={sending || eligibleCount === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{sending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Enviar pedido de desculpa + cartão</button>
          </div>
          {result && <p className="mt-4 rounded-2xl border border-[#C8DBC9] bg-[#F1FAF1] px-4 py-3 text-xs font-semibold text-[#3F6A4D]">{result}</p>}
        </form>
      )}
    </div>
  );
}
