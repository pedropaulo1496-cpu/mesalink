import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { BadgePercent, CheckCircle2, Gift, ScanLine, ShieldCheck, TicketCheck, UserRound } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { BenefitToggleButton, CreatePartnerBenefitForm, DeleteBenefitButton, RedeemBenefitCardForm } from "@/components/partners/PartnerBenefitControls";
import SendCardToCustomersButton from "@/components/marketing/SendCardToCustomersButton";
import { authOptions } from "@/lib/auth";
import { hasAppAccess } from "@/lib/ai-billing";
import { getMarketingCardTheme, marketingBenefitValue } from "@/lib/marketing-card-themes";
import { prisma } from "@/lib/prisma";

export default async function RestaurantBenefitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!hasAppAccess(user?.subscription)) redirect(`/billing?restaurantId=${id}`);
  const restaurant = user ? await prisma.restaurant.findFirst({
    where: { id, userId: user.id },
    include: {
      referralBenefits: {
        orderBy: { createdAt: "desc" },
        include: {
          cards: {
            orderBy: { createdAt: "desc" },
            take: 40,
            select: { id: true, publicCode: true, status: true, guestCount: true, createdAt: true, redeemedAt: true },
          },
        },
      },
      marketingPromoCards: {
        orderBy: { createdAt: "desc" },
        take: 80,
        select: {
          id: true,
          publicCode: true,
          title: true,
          template: true,
          campaignId: true,
          status: true,
          sentAt: true,
          expiresAt: true,
          redeemedAt: true,
          customer: { select: { name: true, email: true } },
        },
      },
      customers: {
        where: { marketingOptIn: true, email: { not: null } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
        take: 1000,
      },
    },
  }) : null;
  if (!restaurant) notFound();

  const allCards = restaurant.referralBenefits.flatMap((benefit) => benefit.cards);
  const activeBenefits = restaurant.referralBenefits.filter((benefit) => benefit.active);
  const redeemedCards = allCards.filter((card) => card.status === "REDEEMED");
  const totalCardCount = allCards.length + restaurant.marketingPromoCards.length;
  const totalRedeemedCount = redeemedCards.length + restaurant.marketingPromoCards.filter((card) => card.status === "REDEEMED").length;
  const customerOptions = restaurant.customers.flatMap((customer) => customer.email ? [{ id: customer.id, name: customer.name, email: customer.email }] : []);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="cardsOffers" />
        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header><p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">Cartões e ofertas · Essentials</p><h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-5xl">Cartões que fazem os clientes voltar.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B6258]">Cria cartões privados, escolhe um ou vários clientes do sistema e acompanha os envios e utilizações. Esta área é do restaurante e não pertence à Rede de Parceiros.</p></header>
          <MarketingLoyaltyTabs id={id} />

          <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icon={<Gift size={18} />} label="Modelos ativos" value={String(activeBenefits.length)} />
            <Kpi icon={<TicketCheck size={18} />} label="Cartões emitidos" value={String(totalCardCount)} />
            <Kpi icon={<CheckCircle2 size={18} />} label="Utilizações" value={String(totalRedeemedCount)} />
            <Kpi icon={<BadgePercent size={18} />} label="Taxa de utilização" value={totalCardCount ? `${Math.round((totalRedeemedCount / totalCardCount) * 100)}%` : "0%"} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_20px_60px_rgba(80,55,30,0.06)]">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Novo modelo</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">Criar cartão</h2></div><p className="max-w-sm text-xs leading-5 text-[#6B6258]">Escolhe uma sugestão, ajusta se quiseres e vê logo o resultado.</p></div>
              <CreatePartnerBenefitForm restaurantId={id} restaurantName={restaurant.name} />
            </div>
            <div className="rounded-[34px] border border-[#D8C39F] bg-[#FFF9F0] p-5 sm:p-8">
              <div className="w-fit rounded-full bg-[#17120D] p-3 text-[#D7B267]"><ScanLine size={22} /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">No restaurante</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Validar cartão</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Introduz o código mostrado pelo cliente. Cada cartão só pode ser utilizado uma vez.</p>
              <RedeemBenefitCardForm restaurantId={id} />
            </div>
          </section>

          <section className="mt-6 rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Biblioteca</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">Os teus cartões</h2></div><p className="max-w-md text-xs leading-5 text-[#6B6258]">Escolhe o cartão e envia-o aos clientes. Cada pessoa recebe um código exclusivo.</p></div>
            <div className="mt-5 grid gap-4 2xl:grid-cols-2">
              {restaurant.referralBenefits.map((benefit) => {
                const directCards = restaurant.marketingPromoCards.filter((card) => card.campaignId === benefit.id);
                const issued = benefit.cards.length + directCards.length;
                const used = benefit.cards.filter((card) => card.status === "REDEEMED").length + directCards.filter((card) => card.status === "REDEEMED").length;
                const expired = benefit.validUntil != null && benefit.validUntil <= new Date();
                const theme = getMarketingCardTheme(benefit.template);
                const previewValue = marketingBenefitValue(benefit.benefitType === "PERK" ? "GIFT" : benefit.benefitType, benefit.value == null ? null : Number(benefit.value), benefit.benefitLabel);
                return <article key={benefit.id} className="grid gap-4 rounded-[24px] border border-[#E1D0B8] bg-[#FFFDFC] p-3 sm:grid-cols-[minmax(0,310px)_minmax(190px,1fr)] sm:items-center">
                  <div className="relative aspect-[1.58/1] min-h-[176px] overflow-hidden rounded-[21px] border border-white/20 p-4 shadow-[0_16px_36px_rgba(55,37,20,0.18)]" style={{ background: theme.background, color: theme.foreground }}>
                    <span className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/15" />
                    <div className="relative flex h-full flex-col"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-[10px] font-bold">{restaurant.name}</p><p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Cartão digital</p></div><Gift size={15} style={{ color: theme.accent }} /></div><div className="my-auto py-2"><p className="line-clamp-2 text-xl font-bold leading-[0.98] tracking-[-0.04em]">{benefit.title}</p>{benefit.description && <p className="mt-2 line-clamp-2 text-[9px] leading-4" style={{ color: theme.muted }}>{benefit.description}</p>}</div><div className="flex items-end justify-between gap-3 border-t border-white/15 pt-2"><p className="font-mono text-[8px] font-bold tracking-[0.08em]">MLC-••••••••••</p><p className="text-xl font-black" style={{ color: theme.accent }}>{previewValue}</p></div></div>
                  </div>
                  <div className="min-w-0 px-1 pb-1 sm:py-1">
                    <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${benefit.active && !expired ? "bg-[#EAF6EA] text-[#3F6A4D]" : "bg-[#EFE7DA] text-[#806D56]"}`}>{expired ? "Expirado" : benefit.active ? "Ativo" : "Pausado"}</span><span className="text-[10px] text-[#786A5B]">{benefit.validUntil ? `até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(benefit.validUntil)}` : "sem validade"}</span></div>
                    <p className="mt-3 text-xs leading-5 text-[#6B6258]"><strong className="text-[#17120D]">{issued}</strong> enviado{issued === 1 ? "" : "s"} · <strong className="text-[#17120D]">{used}</strong> utilizado{used === 1 ? "" : "s"}</p>
                    {benefit.active && !expired ? <div className="mt-3"><SendCardToCustomersButton benefitId={benefit.id} customers={customerOptions} /></div> : <p className="mt-3 rounded-xl bg-[#F1E9DE] px-3 py-2 text-center text-[10px] font-bold text-[#786A5B]">Ativa o cartão para o enviar.</p>}
                    <div className="mt-3 flex items-center justify-between gap-2"><DeleteBenefitButton benefitId={benefit.id} /><BenefitToggleButton benefitId={benefit.id} active={benefit.active} /></div>
                  </div>
                </article>;
              })}
              {restaurant.referralBenefits.length === 0 && <div className="rounded-[24px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-8 text-center 2xl:col-span-2"><Gift className="mx-auto text-[#9B6F3B]" /><p className="mt-3 font-semibold">Ainda não criaste cartões.</p><p className="mt-1 text-xs text-[#6B6258]">Cria o primeiro modelo e escolhe os clientes que o vão receber.</p></div>}
            </div>
          </section>

          {restaurant.marketingPromoCards.length > 0 && <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Enviados aos clientes</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Cartões digitais individuais</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6258]">Cada código pertence a um único cliente e só pode ser utilizado uma vez. Para oferecer a mesma promoção a outra pessoa, volta ao modelo acima e emite um novo cartão.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{restaurant.marketingPromoCards.map((card) => <article key={card.id} className="rounded-[22px] border border-[#E5D6C0] bg-[#FFF9F0] p-4"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#806D56]">{card.template}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${card.status === "REDEEMED" ? "bg-[#E8F6E8] text-[#3F6A4D]" : "bg-[#FFF0D8] text-[#8A6130]"}`}>{card.status === "REDEEMED" ? "Utilizado" : "Ativo"}</span></div><p className="mt-3 truncate font-semibold">{card.title}</p><p className="mt-2 font-mono text-xs font-bold tracking-[0.1em] text-[#704E27]">{card.publicCode}</p><div className="mt-3 rounded-[16px] border border-[#E5D6C0] bg-white p-3"><p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8A7863]"><UserRound size={12} /> Atribuído a</p><p className="mt-1 truncate text-sm font-semibold">{card.customer?.name || "Cliente não identificado"}</p>{card.customer?.email && <p className="mt-0.5 truncate text-[10px] text-[#817466]">{card.customer.email}</p>}</div><p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-[#6D5435]"><ShieldCheck size={13} /> Utilização única · exclusivo deste cliente</p><div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E8DCCB] pt-3"><p className="text-[10px] text-[#817466]">{card.redeemedAt ? `Usado ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(card.redeemedAt)}` : card.expiresAt ? `Válido até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(card.expiresAt)}` : "Sem validade"}</p><Link href={`/offers/${card.publicCode}`} target="_blank" className="text-xs font-bold text-[#7A542A]">Abrir cartão ↗</Link></div></article>)}</div></section>}
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function MarketingLoyaltyTabs({ id }: { id: string }) {
  return <nav className="mt-6 inline-flex rounded-full border border-[#D9C7AA] bg-white p-1"><Link href={`/restaurants/${id}/marketing`} className="rounded-full px-5 py-2.5 text-xs font-bold text-[#6B6258]">Visão geral</Link><Link href={`/restaurants/${id}/marketing/loyalty`} className="rounded-full bg-[#17120D] px-5 py-2.5 text-xs font-bold text-white">Cartões e ofertas</Link></nav>;
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-[26px] border border-[#E1D0B8] bg-white p-4 sm:p-5"><div className="text-[#9B6F3B]">{icon}</div><p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8B7D6D]">{label}</p></div>; }
