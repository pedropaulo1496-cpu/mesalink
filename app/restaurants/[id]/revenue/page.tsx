import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Check, ChevronRight, CreditCard, ShieldCheck, TicketCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { prisma } from "@/lib/prisma";
import { createExperience, saveRevenueSettings, updateExperiencePayment, updateExperienceState } from "./actions";
import MenuBuilder from "./MenuBuilder";

const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

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

export default async function RevenuePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; result?: string; standalone?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const tab = ["overview", "protect", "experiences"].includes(query.tab || "") ? query.tab! : "overview";
  const standalone = query.standalone === "1";
  if (!standalone) {
    const result = query.result ? `?result=${encodeURIComponent(query.result)}` : "";
    if (tab === "protect") redirect(`/restaurants/${id}/experiences${result}#protecao-no-show`);
    if (tab === "experiences") redirect(`/restaurants/${id}/experiences${result}`);
    redirect(`/restaurants/${id}#receita`);
  }
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
  const paymentsReady = Boolean(restaurant.paymentsStripeAccountId && restaurant.paymentsStripeOnboardingComplete);
  const saveSettings = saveRevenueSettings.bind(null, id);
  const addExperience = createExperience.bind(null, id);
  const changeExperience = updateExperienceState.bind(null, id);
  const changeExperiencePayment = updateExperiencePayment.bind(null, id);

  return <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]"><div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
    <RestaurantSidebar id={id} restaurantName={restaurant.name} active={tab === "protect" ? "noShowProtect" : tab === "experiences" ? "experiences" : "dashboard"} />
    <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[.26em] text-[#9B6F3B]">Menu, experiências e garantias</p><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${restaurant.noShowProtectionEnabled ? "border-[#B9D5B8] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#DDC9AB] bg-white text-[#806D56]"}`}>{restaurant.noShowProtectionEnabled ? "No-show ativo" : "Proteção opcional"}</span></div><h1 className="mt-2 text-4xl font-semibold tracking-[-.06em] sm:text-5xl">Menus & Proteção No-show</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">Cria menus de grupo ou experiências e decide quando pedir uma entrada para proteger a reserva.</p></div>{standalone && <Link href={`/restaurants/${id}`} className="inline-flex h-11 w-fit items-center gap-2 rounded-full border border-[#DDC9AB] bg-white px-4 text-xs font-bold text-[#715F4A]">Voltar à Dashboard <ChevronRight size={15}/></Link>}</header>

      {query.result && <div className={`mt-5 rounded-[18px] border px-4 py-3 text-sm font-semibold ${query.result.includes("required") || query.result === "invalid" ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#98452F]" : "border-[#B8D7B9] bg-[#EFF9EF] text-[#3F6A4D]"}`}>{resultMessage(query.result)}</div>}

      {(tab === "protect" || tab === "experiences") && <><Protect restaurant={restaurant} paymentsReady={paymentsReady} saveSettings={saveSettings} /><Experiences restaurant={restaurant} paymentsReady={paymentsReady} addExperience={addExperience} changeExperience={changeExperience} changeExperiencePayment={changeExperiencePayment} /></>}
    </section>
  </div><BottomNav id={id} /></main>;
}

function Protect({ restaurant, paymentsReady, saveSettings }: { restaurant: RevenueRestaurant; paymentsReady: boolean; saveSettings: (formData: FormData) => void }) {
  return <div id="protecao-no-show" className="mt-4 grid scroll-mt-6 gap-4 xl:grid-cols-[1fr_330px]"><form action={saveSettings} className="rounded-[26px] border border-[#E1D0B8] bg-white p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">Proteção opcional</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Garantia para grupos e datas críticas</h2></div><label className="flex items-center gap-3 rounded-full border border-[#DDC9AB] bg-[#FFF8EC] px-4 py-2.5 text-sm font-bold"><input type="checkbox" name="noShowProtectionEnabled" defaultChecked={restaurant.noShowProtectionEnabled} disabled={!paymentsReady} className="h-5 w-5 accent-[#17120D]"/> Ativar</label></div><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">Usa esta regra geral para reservas maiores ou datas especiais. Cada menu também pode ter a sua própria entrada por pessoa.</p><input type="hidden" name="revenueSummaryEmailEnabled" value={restaurant.revenueSummaryEmailEnabled ? "on" : ""}/><div className="mt-5 grid gap-3 sm:grid-cols-3"><Field label="A partir de"><div className="relative"><input name="noShowMinGuests" type="number" min="1" max="100" defaultValue={restaurant.noShowMinGuests} className="input-premium pr-20"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">pessoas</span></div></Field><Field label="Garantia por pessoa"><div className="relative"><input name="noShowDepositPerPerson" type="number" min="1" max="500" step="0.5" defaultValue={String(restaurant.noShowDepositPerPerson)} className="input-premium pr-12"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">€</span></div></Field><Field label="Cancelamento gratuito"><div className="relative"><input name="noShowCancellationHours" type="number" min="1" max="336" defaultValue={restaurant.noShowCancellationHours} className="input-premium pr-14"/><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#897B6C]">horas</span></div></Field></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><CheckField name="noShowFridayEnabled" checked={restaurant.noShowFridayEnabled} label="Sextas-feiras"/><CheckField name="noShowSaturdayEnabled" checked={restaurant.noShowSaturdayEnabled} label="Sábados"/><CheckField name="noShowCreditOnLateCancellation" checked={restaurant.noShowCreditOnLateCancellation} label="Crédito digital se cancelar tarde"/></div><Field label="Datas especiais"><input name="noShowSpecialDates" defaultValue={restaurant.noShowSpecialDates.join(", ")} placeholder="2026-12-24, 2026-12-31" className="input-premium"/><span className="mt-1.5 block text-xs text-[#8A7C6D]">Separa datas por vírgulas. Nessas datas a garantia aplica-se a qualquer tamanho de mesa.</span></Field><button className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-6 text-sm font-bold text-white"><Check size={16}/> Guardar proteção</button></form><ConnectCard restaurantId={restaurant.id} paymentsReady={paymentsReady}/></div>;
}

function Experiences({ restaurant, paymentsReady, addExperience, changeExperience, changeExperiencePayment }: { restaurant: RevenueRestaurant; paymentsReady: boolean; addExperience: (formData: FormData) => void; changeExperience: (formData: FormData) => void; changeExperiencePayment: (formData: FormData) => void }) {
  return <div className="mt-4 space-y-4">
    <MenuBuilder action={addExperience} paymentsReady={paymentsReady} restaurantName={restaurant.name} totalCapacity={restaurant.totalCapacity || 30}/>
    <section className="rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-[#9B6F3B]">Biblioteca</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.05em]">Menus publicados</h2><p className="mt-1 text-sm text-[#74695E]">Preços reais, disponibilidade e entrada definidos menu a menu.</p></div><span className="rounded-full bg-[#F3E8D6] px-3 py-1.5 text-xs font-bold">{restaurant.diningExperiences.length}</span></div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">{restaurant.diningExperiences.length ? restaurant.diningExperiences.map((experience) => {
        const reserved = experience.reservations.reduce((sum, reservation) => sum + reservation.guests, 0);
        const period = experience.servicePeriods.length === 1 ? experience.servicePeriods[0] === "LUNCH" ? "Só almoços" : "Só jantares" : "Almoço e jantar";
        const paymentLabel = experience.paymentMode === "PREPAID" ? "Menu pré-pago" : experience.paymentMode === "DEPOSIT" ? `${money(Number(experience.depositPerPerson || 0))} entrada / pessoa` : "Sem entrada";
        return <article key={experience.id} className="overflow-hidden rounded-[24px] border border-[#E4D5C0] bg-[#FFFDFC]">
          <div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${experience.active ? "bg-[#EAF6EA] text-[#3F6A4D]" : "bg-[#EEE8DF] text-[#756B60]"}`}>{experience.active ? "Publicado" : "Pausado"}</span><span className="text-[11px] font-semibold text-[#88796A]">{experience.scheduleType === "FIXED" && experience.startsAt ? new Date(experience.startsAt).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }) : period}</span></div><h3 className="mt-2 truncate text-xl font-semibold tracking-[-.04em]">{experience.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#71675D]">{experience.summary}</p></div><div className="shrink-0 text-right"><strong className="block text-xl text-[#9B6F3B]">{money(Number(experience.pricePerPerson))}</strong><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#958675]">por pessoa</span></div></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-[15px] bg-[#F5ECDE] px-3 py-2.5"><p className="text-[8px] font-black uppercase tracking-[.14em] text-[#98764A]">Reserva</p><p className="mt-1 text-xs font-bold">{paymentLabel}</p></div><div className="rounded-[15px] bg-[#F5ECDE] px-3 py-2.5"><p className="text-[8px] font-black uppercase tracking-[.14em] text-[#98764A]">Capacidade</p><p className="mt-1 text-xs font-bold">{experience.scheduleType === "FIXED" ? `${reserved}/${experience.capacity} lugares` : `Até ${experience.capacity} pessoas`}</p></div></div>
          {experience.addOns.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{experience.addOns.map((addOn) => <span key={addOn.id} className="rounded-full border border-[#E2D0B5] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#6D5C48]">{addOn.name} · {money(Number(addOn.price))}{addOn.perGuest ? "/pessoa" : ""}</span>)}</div>}
          </div>
          <div className="border-t border-[#E9DDCD] bg-[#FFF9F0] p-3.5"><form action={changeExperiencePayment} className="grid grid-cols-[1fr_92px_auto] gap-2"><input type="hidden" name="experienceId" value={experience.id}/><select name="paymentMode" defaultValue={experience.paymentMode === "PREPAID" ? "PREPAID" : experience.paymentMode === "DEPOSIT" ? "DEPOSIT" : "AT_RESTAURANT"} className="h-10 min-w-0 rounded-[13px] border border-[#DCC7A7] bg-white px-2.5 text-[11px] font-bold"><option value="AT_RESTAURANT">Sem entrada</option><option value="DEPOSIT">Entrada/pessoa</option>{paymentsReady && <option value="PREPAID">Pré-pago</option>}</select><input name="depositPerPerson" type="number" min="1" max={Number(experience.pricePerPerson)} step="0.01" defaultValue={experience.depositPerPerson == null ? "5.00" : String(experience.depositPerPerson)} aria-label="Valor da entrada por pessoa" className="h-10 min-w-0 rounded-[13px] border border-[#DCC7A7] bg-white px-2.5 text-xs"/><button className="h-10 rounded-[13px] bg-[#17120D] px-3 text-[11px] font-bold text-white">Guardar</button></form><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[9px] leading-4 text-[#8A7C6D]">O valor só é usado ao escolher “Entrada/pessoa”.</p><form action={changeExperience} className="flex shrink-0 gap-1"><input type="hidden" name="experienceId" value={experience.id}/><button name="intent" value="toggle" className="rounded-full px-2.5 py-1.5 text-[10px] font-bold text-[#6F5B44]">{experience.active ? "Pausar" : "Reativar"}</button><button name="intent" value="delete" className="rounded-full px-2.5 py-1.5 text-[10px] font-bold text-[#A14E36]">{reserved ? "Arquivar" : "Eliminar"}</button></form></div></div>
        </article>;
      }) : <div className="grid min-h-52 place-items-center rounded-[22px] border border-dashed border-[#DCC7A7] bg-[#FFF9F0] p-8 text-center lg:col-span-2"><div><TicketCheck className="mx-auto text-[#A77A3D]"/><p className="mt-3 font-bold">Ainda não há menus.</p><p className="mt-1 text-sm text-[#7B6D5E]">Cria o primeiro no editor acima.</p></div></div>}</div>
    </section>
    {!paymentsReady && <ConnectCard restaurantId={restaurant.id} paymentsReady={false}/>}
  </div>;
}

function ConnectCard({ restaurantId, paymentsReady }: { restaurantId: string; paymentsReady: boolean }) { return <aside className={`rounded-[24px] border p-5 ${paymentsReady ? "border-[#B8D7B9] bg-[#EFF9EF]" : "border-[#E0C38C] bg-[#FFF3D8]"}`}><span className={`grid h-11 w-11 place-items-center rounded-[15px] ${paymentsReady ? "bg-white text-[#3F6A4D]" : "bg-white text-[#9B6F3B]"}`}><CreditCard size={19}/></span><h3 className="mt-4 text-xl font-semibold tracking-[-.04em]">{paymentsReady ? "Pagamentos ligados" : "Liga os recebimentos"}</h3><p className="mt-2 text-sm leading-6 text-[#6B6258]">{paymentsReady ? "A Stripe recebe o pagamento e envia o valor base diretamente para a conta do restaurante." : "Valida a conta uma vez. É necessário para receber depósitos e experiências pré-pagas."}</p>{!paymentsReady && <form action={`/api/restaurants/${restaurantId}/payments/connect`} method="post"><button className="mt-4 h-11 w-full rounded-full bg-[#17120D] text-sm font-bold text-white">Ligar Stripe</button></form>}{paymentsReady && <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={14}/> Conta verificada</div>}</aside>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[9px] font-black uppercase tracking-[.15em] text-[#806D56]">{label}</span>{children}</label>; }
function CheckField({ name, checked, label, value }: { name: string; checked: boolean; label: string; value?: string }) { return <label className="flex min-h-14 items-center gap-3 rounded-[17px] border border-[#E4D5C0] bg-[#FFF9F0] px-4"><input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-5 w-5 accent-[#17120D]"/><span className="text-sm font-bold">{label}</span></label>; }
function resultMessage(result: string) { if (result === "saved") return "Definições guardadas."; if (result === "created") return "Menu publicado e disponível nas reservas."; if (result === "updated") return "Menu atualizado."; if (result === "payment-updated") return "Entrada e pagamento do menu atualizados."; if (result === "connect-required") return "A opção sem entrada funciona já. Para cobrar entrada ou pré-pagamento, liga primeiro a conta Stripe."; if (result === "invalid") return "Revê os dados do menu e tenta novamente."; if (result === "connected") return "Conta Stripe ligada. Já podes receber entradas opcionais."; return "Alteração concluída."; }
