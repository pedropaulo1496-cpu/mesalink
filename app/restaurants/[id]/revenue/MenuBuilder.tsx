"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  ReceiptText,
  Sparkles,
  UtensilsCrossed,
  UsersRound,
} from "lucide-react";

type MenuBuilderProps = {
  action: (formData: FormData) => void;
  paymentsReady: boolean;
  restaurantName: string;
  totalCapacity: number;
};

const menuPresets = [
  {
    label: "Grupo",
    title: "Menu de Grupo",
    summary: "Uma experiência completa para partilhar à mesa.",
    details: "COUVERT\n• Pão e azeitonas\n\nENTRADAS\n• Entrada para partilhar\n\nPRATO PRINCIPAL\n• Escolher uma opção por pessoa\n\nBEBIDAS\n• Bebida incluída\n\nCAFÉ\n• Café",
    price: "23.50",
    periods: ["LUNCH", "DINNER"],
  },
  {
    label: "Almoço",
    title: "Menu de Almoço",
    summary: "Prato principal, bebida e café.",
    details: "PRATO PRINCIPAL\n• Escolher uma opção por pessoa\n\nBEBIDA\n• Escolher uma opção por pessoa\n\nCAFÉ\n• Café",
    price: "15.50",
    periods: ["LUNCH"],
  },
  {
    label: "Degustação",
    title: "Menu de Degustação",
    summary: "Uma seleção especial da cozinha do restaurante.",
    details: "BOAS-VINDAS\n• Seleção do chef\n\nMOMENTOS\n• Pratos de degustação\n\nFINAL\n• Sobremesa e café",
    price: "39.50",
    periods: ["DINNER"],
  },
] as const;

const euro = (value: number) => new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);

export default function MenuBuilder({ action, paymentsReady, restaurantName, totalCapacity }: MenuBuilderProps) {
  const [title, setTitle] = useState("Menu de Grupo");
  const [summary, setSummary] = useState("Uma experiência completa para partilhar à mesa.");
  const [details, setDetails] = useState<string>(menuPresets[0].details);
  const [price, setPrice] = useState("23.50");
  const [capacity, setCapacity] = useState(String(totalCapacity));
  const [periods, setPeriods] = useState<string[]>(["LUNCH", "DINNER"]);
  const [scheduleType, setScheduleType] = useState("FLEXIBLE");
  const [paymentMode, setPaymentMode] = useState("AT_RESTAURANT");
  const [deposit, setDeposit] = useState("5.00");

  const periodLabel = periods.length === 2
    ? "Almoço e jantar"
    : periods[0] === "LUNCH"
      ? "Só almoços"
      : "Só jantares";
  const paymentLabel = paymentMode === "DEPOSIT"
    ? `${euro(Number(deposit))} de entrada / pessoa`
    : "Sem entrada";

  function applyPreset(preset: (typeof menuPresets)[number]) {
    setTitle(preset.title);
    setSummary(preset.summary);
    setDetails(preset.details);
    setPrice(preset.price);
    setPeriods([...preset.periods]);
  }

  function togglePeriod(period: string) {
    setPeriods((current) => {
      if (current.includes(period)) {
        return current.length === 1 ? current : current.filter((item) => item !== period);
      }
      return [...current, period];
    });
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#DDC9AB] bg-white shadow-[0_18px_55px_rgba(54,37,20,.08)]">
      <div className="flex flex-col gap-3 border-b border-[#E8DCCB] bg-[#FFF9F0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.24em] text-[#9B6F3B]">Criador de menus</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Cria, vê e publica.</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {menuPresets.map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="rounded-full border border-[#DCC7A7] bg-white px-3.5 py-2 text-xs font-bold text-[#6F5B44] transition hover:border-[#A97C42] hover:bg-[#FFF2D9]">
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.08fr_.92fr]">
        <form action={action} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <BuilderField label="Nome do menu" wide>
              <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={90} className="input-premium" />
            </BuilderField>
            <BuilderField label="Descrição curta" wide>
              <textarea name="summary" value={summary} onChange={(event) => setSummary(event.target.value)} required maxLength={320} rows={2} className="input-premium min-h-20 py-3" />
            </BuilderField>
            <BuilderField label="Preço real por pessoa">
              <div className="relative">
                <input name="pricePerPerson" value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="1" step="0.01" required className="input-premium pr-10" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8A7761]">€</span>
              </div>
            </BuilderField>
            <BuilderField label="Máximo por reserva">
              <div className="relative">
                <input name="capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} type="number" min="1" max="1000" required className="input-premium pr-20" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8A7761]">pessoas</span>
              </div>
            </BuilderField>
          </div>

          <div className="rounded-[22px] border border-[#E6D7C2] bg-[#FCF8F2] p-4">
            <div className="flex items-center gap-2"><Clock3 size={16} className="text-[#9B6F3B]"/><p className="text-sm font-bold">Quando está disponível?</p></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PeriodButton active={periods.includes("LUNCH")} label="Almoço" onClick={() => togglePeriod("LUNCH")} />
              <PeriodButton active={periods.includes("DINNER")} label="Jantar" onClick={() => togglePeriod("DINNER")} />
            </div>
            {periods.map((period) => <input key={period} type="hidden" name="servicePeriods" value={period}/>) }
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <BuilderField label="Tipo de disponibilidade">
                <select name="scheduleType" value={scheduleType} onChange={(event) => setScheduleType(event.target.value)} className="input-premium">
                  <option value="FLEXIBLE">Nas datas disponíveis</option>
                  <option value="FIXED">Evento com data fixa</option>
                </select>
              </BuilderField>
              {scheduleType === "FIXED" ? <BuilderField label="Data e hora"><input name="startsAt" type="datetime-local" required className="input-premium"/></BuilderField> : <BuilderField label="Duração"><select name="durationMinutes" defaultValue="120" className="input-premium"><option value="90">1h30</option><option value="120">2h</option><option value="150">2h30</option><option value="180">3h</option></select></BuilderField>}
            </div>
            {scheduleType === "FIXED" && <input type="hidden" name="durationMinutes" value="120"/>}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-sm font-bold">Entrada na reserva</p><p className="mt-0.5 text-xs text-[#7C6E5F]">Escolhe se o cliente paga alguma coisa antecipadamente.</p></div>
              <CreditCard size={18} className="text-[#9B6F3B]"/>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <PaymentChoice
                active={paymentMode === "AT_RESTAURANT"}
                title="Sem entrada"
                text="Reserva agora e paga tudo no restaurante."
                onClick={() => setPaymentMode("AT_RESTAURANT")}
              />
              <PaymentChoice
                active={paymentMode === "DEPOSIT"}
                title="Entrada por pessoa"
                text="Cobra um valor e desconta-o na conta final."
                onClick={() => setPaymentMode("DEPOSIT")}
              />
            </div>
            <input type="hidden" name="paymentMode" value={paymentMode}/>
            {paymentMode === "DEPOSIT" && <div className="mt-3 rounded-[18px] border border-[#D8B46D] bg-[#FFF3D8] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_190px] sm:items-end"><div><p className="text-sm font-bold">Quanto cobrar por pessoa?</p><p className="mt-1 text-xs leading-5 text-[#756550]">O restante valor do menu continua a ser pago no restaurante.</p></div><BuilderField label="Entrada por pessoa"><div className="relative"><input name="depositPerPerson" value={deposit} onChange={(event) => setDeposit(event.target.value)} type="number" min="1" max={Math.max(1, Number(price) || 1)} step="0.01" required className="input-premium bg-white pr-10"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#8A7761]">€</span></div></BuilderField></div>{!paymentsReady && <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[11px] font-semibold text-[#8D542F]">Para cobrar a entrada é necessário concluir a ligação segura ao Stripe. A opção sem entrada funciona sem Stripe.</p>}</div>}
          </div>

          <details className="group rounded-[20px] border border-[#E4D5C0] bg-white" open>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><ReceiptText size={16} className="text-[#9B6F3B]"/> Conteúdo do menu</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Abrir</span></summary>
            <div className="border-t border-[#EEE3D4] p-4"><textarea name="details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={6000} rows={8} className="input-premium min-h-44 py-3 font-mono text-xs leading-5"/></div>
          </details>

          <details className="group rounded-[20px] border border-[#E4D5C0] bg-[#FFF9F0]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold [&::-webkit-details-marker]:hidden"><span>Extras opcionais</span><span className="text-xs text-[#9B6F3B]">+ Adicionar</span></summary>
            <div className="space-y-3 border-t border-[#E8DCCB] p-4">{[1, 2, 3].map((index) => <div key={index} className="grid grid-cols-[1fr_105px] gap-2"><input name={`addOnName${index}`} placeholder={index === 1 ? "Ex.: Sobremesa" : "Nome do extra"} className="input-premium"/><input name={`addOnPrice${index}`} type="number" min="0" step="0.01" placeholder="0,00 €" className="input-premium"/><label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-[#756755]"><input type="checkbox" name={`addOnPerGuest${index}`} className="h-4 w-4 accent-[#17120D]"/> cobrar por pessoa</label></div>)}</div>
          </details>

          <input type="hidden" name="cancellationHours" value="48"/>
          <button className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,18,13,.2)] transition hover:-translate-y-0.5 hover:bg-[#2B2118]"><Sparkles size={16}/> Publicar na página de reservas</button>
        </form>

        <aside className="border-t border-[#E8DCCB] bg-[#F2E9DC] p-5 xl:border-l xl:border-t-0 xl:p-6">
          <div className="sticky top-6">
            <div className="mb-3 flex items-center justify-between"><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#846542]">Pré-visualização</p><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[.1em] text-[#477052]"><span className="h-1.5 w-1.5 rounded-full bg-[#5E9B6E]"/> Ao vivo</span></div>
            <div className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_right,#6A4725_0,#2A1C12_44%,#17120D_100%)] p-5 text-white shadow-[0_24px_55px_rgba(42,28,18,.25)] sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.24em] text-[#E3C57E]">{restaurantName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">Menu na reserva</p></div><span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-[#E3C57E]"><UtensilsCrossed size={17}/></span></div>
              <h3 className="mt-8 text-3xl font-semibold leading-[.95] tracking-[-.06em]">{title || "Nome do menu"}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/65">{summary || "Descrição curta do menu."}</p>
              <div className="mt-7 flex items-end justify-between gap-3 border-t border-white/15 pt-5"><div><strong className="text-3xl tracking-[-.05em] text-[#E3C57E]">{euro(Number(price))}</strong><span className="ml-1 text-xs text-white/45">/ pessoa</span></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/75">{periodLabel}</span></div>
              <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-white/10 bg-black/15 px-3 py-2.5"><CreditCard size={14} className="text-[#E3C57E]"/><p className="text-xs font-semibold">{paymentLabel}</p></div>
              <div className="mt-4 flex items-center justify-between rounded-full bg-[#E3C57E] px-4 py-3 text-[#17120D]"><span className="text-xs font-black">Escolher este menu</span><Check size={15}/></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2"><PreviewFact icon={<UsersRound size={14}/>} label="Máximo" value={`${capacity || "—"} pessoas`}/><PreviewFact icon={<CalendarDays size={14}/>} label="Serviço" value={periodLabel}/></div>
            <p className="mt-4 text-center text-[11px] leading-5 text-[#756A5E]">É este o cartão que o cliente verá antes de escolher a data, a hora e o número de pessoas.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function BuilderField({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "block sm:col-span-2" : "block"}><span className="mb-1.5 block text-[9px] font-black uppercase tracking-[.14em] text-[#806D56]">{label}</span>{children}</label>;
}

function PeriodButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex h-11 items-center justify-center gap-2 rounded-[15px] border text-xs font-bold transition ${active ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#DDC9AB] bg-white text-[#756755]"}`}><span className={`h-2 w-2 rounded-full ${active ? "bg-[#E3C57E]" : "bg-[#D8C7B0]"}`}/>{label}</button>;
}

function PaymentChoice({ active, title, text, onClick }: { active: boolean; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-h-24 rounded-[18px] border p-3.5 text-left transition ${active ? "border-[#A97C42] bg-[#FFF3D8] shadow-[0_8px_20px_rgba(169,124,66,.12)]" : "border-[#E4D5C0] bg-white hover:border-[#C7A36B]"}`}><span className="flex items-center justify-between gap-2"><strong className="text-sm">{title}</strong><span className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#CFBFA9]"}`}>{active && <Check size={12}/>}</span></span><span className="mt-1.5 block text-[11px] leading-4 text-[#776B5E]">{text}</span></button>;
}

function PreviewFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[16px] border border-[#DDC9AB] bg-white px-3 py-3"><span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.12em] text-[#94744E]">{icon}{label}</span><p className="mt-1.5 truncate text-xs font-bold">{value}</p></div>;
}
