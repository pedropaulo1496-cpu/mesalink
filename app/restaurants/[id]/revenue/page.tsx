import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Check, ChevronRight, CircleDollarSign, CreditCard, Mail, Plus, ShieldCheck, Sparkles, TicketCheck, UsersRound } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { prisma } from "@/lib/prisma";
import { getRevenueMeter, monthRange } from "@/lib/revenue-meter";
import { createExperience, saveRevenueSettings, updateExperienceState } from "./actions";

const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

type RevenueRestaurant = Prisma.RestaurantGetPayload<{
  include: {
    diningExperiences: {
      include: {
        addOns: true;
        reservations: { select: { guests: true } };
      };
    };
  };
}>;

export default async function RevenuePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; result?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const tab = ["overview", "protect", "experiences"].includes(query.tab || "") ? query.tab! : "overview";
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      diningExperiences: {
        include: { addOns: true, reservations: { where: { status: { notIn: ["CANCELLED", "REJECTED", "NO_SHOW"] } }, select: { guests: true } } },
        orderBy: { startsAt: "asc" },
      },
    },
  });
  if (!restaurant) return null;
  const now = new Date();
  const currentRange = monthRange(now);
  const previousReference = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const previousRange = monthRange(previousReference);
  const [meter, previous] = await Promise.all([
    getRevenueMeter(id, currentRange.from, currentRange.to),
    getRevenueMeter(id, previousRange.from, previousRange.to),
  ]);
  const trend = previous.total > 0 ? Math.round(((meter.total - previous.total) / previous.total) * 100) : meter.total > 0 ? 100 : 0;
  const paymentsReady = Boolean(restaurant.paymentsStripeAccountId && restaurant.paymentsStripeOnboardingComplete);
  const saveSettings = saveRevenueSettings.bind(null, id);
  const addExperience = createExperience.bind(null, id);
  const changeExperience = updateExperienceState.bind(null, id);

  return <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]"><div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
    <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenue" />
    <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[.26em] text-[#9B6F3B]">Receita MesaLink</p><span className="rounded-full border border-[#B9D5B8] bg-[#EFF9EF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-[#3F6A4D]">Ao vivo</span></div><h1 className="mt-2 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Receita, protegida.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">Vê o valor gerado pelo MesaLink, reduz faltas e apresenta menus diretamente na reserva.</p></div><div className="inline-flex w-fit rounded-full border border-[#DDC9AB] bg-white p-1 shadow-sm">{[["overview","Resultados"],["protect","No-Show Protect"],["experiences","Menus & experiências"]].map(([key,label]) => <Link key={key} href={`/restaurants/${id}/revenue?tab=${key}`} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${tab === key ? "bg-[#17120D] text-white" : "text-[#715F4A] hover:bg-[#F7EFE4]"}`}>{label}</Link>)}</div></header>

      {query.result && <div className={`mt-5 rounded-[18px] border px-4 py-3 text-sm font-semibold ${query.result.includes("required") || query.result === "invalid" ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#98452F]" : "border-[#B8D7B9] bg-[#EFF9EF] text-[#3F6A4D]"}`}>{resultMessage(query.result)}</div>}

      <section className="mt-5 overflow-hidden rounded-[28px] bg-[#17120D] text-white shadow-[0_20px_60px_rgba(43,29,16,.13)]"><div className="grid lg:grid-cols-[1.1fr_.9fr]"><div className="p-5 sm:p-6"><p className="text-[9px] font-black uppercase tracking-[.24em] text-[#D7B267]">Receita estimada este mês</p><div className="mt-3 flex flex-wrap items-end gap-3"><strong className="text-5xl tracking-[-.07em] sm:text-6xl">{money(meter.total)}</strong><span className={`mb-1 rounded-full px-3 py-1.5 text-xs font-black ${trend >= 0 ? "bg-[#28482F] text-[#BEE3C3]" : "bg-[#5B2D24] text-[#F4C6B8]"}`}>{trend >= 0 ? "+" : ""}{trend}% vs. mês anterior</span></div><p className="mt-3 text-sm text-white/55">{meter.reservations} reservas com valor atribuído no período.</p></div><div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0"><DarkMini label="ROI MesaLink" value={meter.roi ? `${meter.roi}×` : "—"} /><DarkMini label="Clientes recuperados" value={String(meter.customersRecovered)} /><DarkMini label="Receita protegida" value={money(meter.protected)} /><DarkMini label="Experiências" value={money(meter.experiences)} /></div></div></section>

      {tab === "overview" && <Overview meter={meter} previousTotal={previous.total} restaurantId={id} emailEnabled={restaurant.revenueSummaryEmailEnabled} saveSettings={saveSettings} restaurant={restaurant} />}
      {tab === "protect" && <Protect restaurant={restaurant} paymentsReady={paymentsReady} saveSettings={saveSettings} />}
      {tab === "experiences" && <Experiences restaurant={restaurant} paymentsReady={paymentsReady} addExperience={addExperience} changeExperience={changeExperience} />}
    </section>
  </div><BottomNav id={id} /></main>;
}

function Overview({ meter, previousTotal, restaurantId, emailEnabled, saveSettings, restaurant }: { meter: Awaited<ReturnType<typeof getRevenueMeter>>; previousTotal: number; restaurantId: string; emailEnabled: boolean; saveSettings: (formData: FormData) => void; restaurant: { noShowProtectionEnabled: boolean; noShowMinGuests: number; noShowDepositPerPerson: unknown; noShowFridayEnabled: boolean; noShowSaturdayEnabled: boolean; noShowSpecialDates: string[]; noShowCancellationHours: number; noShowCreditOnLateCancellation: boolean } }) {
  const rows = [
    ["Reservas diretas", "Google, site e redes", meter.direct, CircleDollarSign],
    ["Marketing AI", "Clientes recuperados", meter.marketing, Sparkles],
    ["Rede de Parceiros", "Reservas enviadas por parceiros", meter.partners, UsersRound],
    ["No-Show Protect", "Depósitos já garantidos", meter.protected, ShieldCheck],
    ["Menus & experiências", "Reservas com menu selecionado", meter.experiences, TicketCheck],
  ] as const;
  return <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">De onde vem</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Receita atribuída</h2></div><span className="text-xs text-[#84776A]">Mês anterior: {money(previousTotal)}</span></div><div className="mt-4 divide-y divide-[#EEE3D4]">{rows.map(([label,sub,value,Icon]) => <div key={label} className="flex items-center gap-3 py-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#F5ECDE] text-[#9B6F3B]"><Icon size={17} /></span><div className="min-w-0 flex-1"><p className="font-bold">{label}</p><p className="truncate text-xs text-[#817568]">{sub}</p></div><strong className="text-lg">{money(value)}</strong></div>)}</div></section><section className="rounded-[26px] border border-[#D7C29F] bg-[#FFF8EC] p-5"><Mail className="text-[#9B6F3B]" size={20}/><h2 className="mt-4 text-2xl font-semibold tracking-[-.05em]">Resumo semanal</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">À segunda-feira recebes um email curto com receita, crescimento, reservas e oportunidades.</p><form action={saveSettings} className="mt-5"><input type="hidden" name="noShowMinGuests" value={restaurant.noShowMinGuests}/><input type="hidden" name="noShowDepositPerPerson" value={String(restaurant.noShowDepositPerPerson)}/><input type="hidden" name="noShowCancellationHours" value={restaurant.noShowCancellationHours}/>{restaurant.noShowProtectionEnabled && <input type="hidden" name="noShowProtectionEnabled" value="on"/>}{restaurant.noShowFridayEnabled && <input type="hidden" name="noShowFridayEnabled" value="on"/>}{restaurant.noShowSaturdayEnabled && <input type="hidden" name="noShowSaturdayEnabled" value="on"/>}{restaurant.noShowCreditOnLateCancellation && <input type="hidden" name="noShowCreditOnLateCancellation" value="on"/>}<input type="hidden" name="noShowSpecialDates" value={restaurant.noShowSpecialDates.join(",")}/><label className="flex items-center gap-3 rounded-[18px] border border-[#E2D0B3] bg-white p-3"><input type="checkbox" name="revenueSummaryEmailEnabled" defaultChecked={emailEnabled} className="h-5 w-5 accent-[#17120D]"/><span className="text-sm font-bold">Enviar automaticamente</span></label><button className="mt-3 h-11 w-full rounded-full bg-[#17120D] text-sm font-bold text-white">Guardar preferência</button></form><Link href={`/restaurants/${restaurantId}/revenue?tab=protect`} className="mt-3 flex items-center justify-between rounded-[18px] border border-[#E2D0B3] bg-white p-3 text-sm font-bold">Configurar proteção <ChevronRight size={16}/></Link></section></div>;
}

function Protect({ restaurant, paymentsReady, saveSettings }: { restaurant: RevenueRestaurant; paymentsReady: boolean; saveSettings: (formData: FormData) => void }) {
  return <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]"><form action={saveSettings} className="rounded-[26px] border border-[#E1D0B8] bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">Regras automáticas</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Depósito só quando faz sentido</h2></div><label className="flex items-center gap-3 rounded-full border border-[#DDC9AB] bg-[#FFF8EC] px-4 py-2.5 text-sm font-bold"><input type="checkbox" name="noShowProtectionEnabled" defaultChecked={restaurant.noShowProtectionEnabled} disabled={!paymentsReady} className="h-5 w-5 accent-[#17120D]"/> Ativar</label></div><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">O cliente paga um depósito na Stripe e recebe confirmação imediata. O valor fica ligado à reserva e é descontado na conta final.</p><input type="hidden" name="revenueSummaryEmailEnabled" value={restaurant.revenueSummaryEmailEnabled ? "on" : ""}/><div className="mt-5 grid gap-3 sm:grid-cols-3"><Field label="A partir de"><div className="relative"><input name="noShowMinGuests" type="number" min="1" max="100" defaultValue={restaurant.noShowMinGuests} className="input-premium pr-20"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">pessoas</span></div></Field><Field label="Depósito por pessoa"><div className="relative"><input name="noShowDepositPerPerson" type="number" min="1" max="500" step="0.5" defaultValue={String(restaurant.noShowDepositPerPerson)} className="input-premium pr-12"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">€</span></div></Field><Field label="Cancelamento gratuito"><div className="relative"><input name="noShowCancellationHours" type="number" min="1" max="336" defaultValue={restaurant.noShowCancellationHours} className="input-premium pr-14"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">horas</span></div></Field></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><CheckField name="noShowFridayEnabled" checked={restaurant.noShowFridayEnabled} label="Sextas-feiras"/><CheckField name="noShowSaturdayEnabled" checked={restaurant.noShowSaturdayEnabled} label="Sábados"/><CheckField name="noShowCreditOnLateCancellation" checked={restaurant.noShowCreditOnLateCancellation} label="Crédito digital se cancelar tarde"/></div><Field label="Datas especiais"><input name="noShowSpecialDates" defaultValue={restaurant.noShowSpecialDates.join(", ")} placeholder="2026-12-24, 2026-12-31" className="input-premium"/><span className="mt-1.5 block text-xs text-[#8A7C6D]">Separa datas por vírgulas. Nessas datas o depósito aplica-se a qualquer tamanho de mesa.</span></Field><button className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white"><Check size={16}/> Guardar regras</button></form><ConnectCard restaurantId={restaurant.id} paymentsReady={paymentsReady}/></div>;
}

function Experiences({ restaurant, paymentsReady, addExperience, changeExperience }: { restaurant: RevenueRestaurant; paymentsReady: boolean; addExperience: (formData: FormData) => void; changeExperience: (formData: FormData) => void }) {
  return <div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
    <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5">
      <div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">Novo menu</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Publicar na reserva</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Menus de grupo, almoço, degustação ou eventos. Por defeito, o cliente paga no restaurante e não precisa de Stripe.</p></div>
      <form action={addExperience} className="mt-5 space-y-3">
        <Field label="Nome"><input name="title" required maxLength={90} placeholder="Ex.: Menu de grupo 1" className="input-premium"/></Field>
        <Field label="Resumo"><textarea name="summary" required maxLength={320} rows={2} placeholder="Uma explicação curta que aparece no cartão." className="input-premium min-h-20 py-3"/></Field>
        <Field label="Tudo o que inclui"><textarea name="details" maxLength={6000} rows={6} placeholder="Entradas, pratos, bebidas, sobremesas e condições..." className="input-premium min-h-36 py-3"/></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Disponibilidade"><select name="scheduleType" defaultValue="FLEXIBLE" className="input-premium"><option value="FLEXIBLE">Qualquer data disponível</option><option value="FIXED">Evento com data fixa</option></select></Field>
          <Field label="Data e hora · só eventos"><input name="startsAt" type="datetime-local" className="input-premium"/></Field>
          <Field label="Preço por pessoa"><input name="pricePerPerson" type="number" min="1" step="0.5" required placeholder="23,50" className="input-premium"/></Field>
          <Field label="Máximo de pessoas"><input name="capacity" type="number" min="1" required defaultValue={restaurant.totalCapacity || 30} className="input-premium"/></Field>
          <Field label="Pagamento"><select name="paymentMode" defaultValue="AT_RESTAURANT" className="input-premium"><option value="AT_RESTAURANT">No restaurante · sem Stripe</option>{paymentsReady && <option value="PREPAID">Pré-pago na reserva</option>}</select></Field>
          <Field label="Duração"><select name="durationMinutes" defaultValue="120" className="input-premium"><option value="90">1h30</option><option value="120">2h</option><option value="150">2h30</option><option value="180">3h</option></select></Field>
        </div>
        <div className="grid gap-2 sm:grid-cols-2"><CheckField name="servicePeriods" checked label="Almoço" value="LUNCH"/><CheckField name="servicePeriods" checked label="Jantar" value="DINNER"/></div>
        <input type="hidden" name="cancellationHours" value="48"/>
        <details className="rounded-[18px] border border-[#E4D5C0] bg-[#FFF9F0] p-4"><summary className="cursor-pointer text-sm font-bold">+ Extras opcionais</summary><div className="mt-4 space-y-3">{[1,2,3].map((index) => <div key={index} className="grid grid-cols-[1fr_110px] gap-2"><input name={`addOnName${index}`} placeholder={index === 1 ? "Ex.: Sobremesa" : "Nome do extra"} className="input-premium"/><input name={`addOnPrice${index}`} type="number" min="0" step="0.5" placeholder="€" className="input-premium"/><label className="col-span-2 flex items-center gap-2 text-xs text-[#756755]"><input type="checkbox" name={`addOnPerGuest${index}`} className="accent-[#17120D]"/> cobrar por pessoa</label></div>)}</div></details>
        <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] text-sm font-bold text-white"><Plus size={16}/> Publicar menu</button>
        {!paymentsReady && <p className="text-center text-[10px] leading-4 text-[#817568]">Não é preciso ligar pagamentos. O Stripe só é necessário se um dia quiseres pré-pagamento ou caução.</p>}
      </form>
    </section>
    <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5">
      <div className="flex items-end justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">Reserva pública</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Menus publicados</h2></div><span className="rounded-full bg-[#F3E8D6] px-3 py-1.5 text-xs font-bold">{restaurant.diningExperiences.length}</span></div>
      <div className="mt-4 space-y-3">{restaurant.diningExperiences.length ? restaurant.diningExperiences.map((experience) => { const reserved = experience.reservations.reduce((sum, reservation) => sum + reservation.guests, 0); const period = experience.servicePeriods.length === 1 ? experience.servicePeriods[0] === "LUNCH" ? "Só almoços" : "Só jantares" : "Almoço e jantar"; return <article key={experience.id} className="rounded-[20px] border border-[#E4D5C0] bg-[#FFFDFC] p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${experience.active ? "bg-[#EAF6EA] text-[#3F6A4D]" : "bg-[#EEE8DF] text-[#756B60]"}`}>{experience.active ? "Publicado" : "Pausado"}</span><span className="text-xs text-[#88796A]">{experience.scheduleType === "FIXED" && experience.startsAt ? new Date(experience.startsAt).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }) : period}</span></div><h3 className="mt-2 text-xl font-semibold tracking-[-.04em]">{experience.title}</h3><p className="mt-1 text-sm leading-5 text-[#71675D]">{experience.summary}</p></div><strong className="whitespace-nowrap text-xl text-[#9B6F3B]">{money(Number(experience.pricePerPerson))}</strong></div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-[#F4EBDD] px-3 py-1.5">{experience.paymentMode === "PREPAID" ? "Pré-pago" : "Paga no restaurante"}</span><span className="rounded-full bg-[#F4EBDD] px-3 py-1.5">{experience.scheduleType === "FIXED" ? `${reserved}/${experience.capacity} lugares` : `Até ${experience.capacity} pessoas`}</span>{experience.addOns.map((addOn) => <span key={addOn.id} className="rounded-full bg-[#F4EBDD] px-3 py-1.5">{addOn.name} · {money(Number(addOn.price))}</span>)}</div><form action={changeExperience} className="mt-4 flex gap-2"><input type="hidden" name="experienceId" value={experience.id}/><button name="intent" value="toggle" className="h-10 rounded-full border border-[#DCC7A7] px-4 text-xs font-bold">{experience.active ? "Pausar" : "Reativar"}</button><button name="intent" value="delete" className="h-10 rounded-full px-4 text-xs font-bold text-[#A14E36]">{reserved ? "Arquivar" : "Eliminar"}</button></form></article>; }) : <div className="grid min-h-56 place-items-center rounded-[20px] border border-dashed border-[#DCC7A7] bg-[#FFF9F0] p-8 text-center"><div><TicketCheck className="mx-auto text-[#A77A3D]"/><p className="mt-3 font-bold">Ainda não há menus.</p><p className="mt-1 text-sm text-[#7B6D5E]">O primeiro aparece automaticamente na página de reservas.</p></div></div>}</div>
    </section>
  </div>;
}

function ConnectCard({ restaurantId, paymentsReady }: { restaurantId: string; paymentsReady: boolean }) { return <aside className={`rounded-[24px] border p-5 ${paymentsReady ? "border-[#B8D7B9] bg-[#EFF9EF]" : "border-[#E0C38C] bg-[#FFF3D8]"}`}><span className={`grid h-11 w-11 place-items-center rounded-[15px] ${paymentsReady ? "bg-white text-[#3F6A4D]" : "bg-white text-[#9B6F3B]"}`}><CreditCard size={19}/></span><h3 className="mt-4 text-xl font-semibold tracking-[-.04em]">{paymentsReady ? "Pagamentos ligados" : "Liga os recebimentos"}</h3><p className="mt-2 text-sm leading-6 text-[#6B6258]">{paymentsReady ? "A Stripe recebe o pagamento e envia o valor base diretamente para a conta do restaurante." : "Valida a conta uma vez. É necessário para receber depósitos e experiências pré-pagas."}</p>{!paymentsReady && <form action={`/api/restaurants/${restaurantId}/payments/connect`} method="post"><button className="mt-4 h-11 w-full rounded-full bg-[#17120D] text-sm font-bold text-white">Ligar Stripe</button></form>}{paymentsReady && <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={14}/> Conta verificada</div>}</aside>; }
function DarkMini({ label, value }: { label: string; value: string }) { return <div className="border-b border-r border-white/10 p-4 sm:p-5"><p className="text-[8px] font-black uppercase tracking-[.18em] text-white/40">{label}</p><p className="mt-2 text-2xl font-semibold tracking-[-.05em]">{value}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-[#806D56]">{label}</span>{children}</label>; }
function CheckField({ name, checked, label, value }: { name: string; checked: boolean; label: string; value?: string }) { return <label className="flex min-h-14 items-center gap-3 rounded-[17px] border border-[#E4D5C0] bg-[#FFF9F0] px-4"><input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-5 w-5 accent-[#17120D]"/><span className="text-sm font-bold">{label}</span></label>; }
function resultMessage(result: string) { if (result === "saved") return "Definições guardadas."; if (result === "created") return "Menu publicado e disponível nas reservas."; if (result === "updated") return "Menu atualizado."; if (result === "connect-required") return "Liga primeiro a conta Stripe apenas para ativar o pré-pagamento."; if (result === "invalid") return "Revê os dados do menu e tenta novamente."; if (result === "connected") return "Conta Stripe ligada. Já podes receber pagamentos opcionais."; return "Alteração concluída."; }
