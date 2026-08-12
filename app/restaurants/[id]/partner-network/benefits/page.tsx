import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { BadgePercent, CheckCircle2, Gift, ScanLine, TicketCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { BenefitToggleButton, CreatePartnerBenefitForm, IssueBenefitCardButton, RedeemBenefitCardForm } from "@/components/partners/PartnerBenefitControls";
import { authOptions } from "@/lib/auth";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export default async function RestaurantBenefitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!hasGrowthAccess(user?.subscription)) redirect(`/billing?restaurantId=${id}`);
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
        select: { id: true, publicCode: true, title: true, template: true, status: true, sentAt: true, expiresAt: true, redeemedAt: true },
      },
    },
  }) : null;
  if (!restaurant) notFound();

  const allCards = restaurant.referralBenefits.flatMap((benefit) => benefit.cards);
  const activeBenefits = restaurant.referralBenefits.filter((benefit) => benefit.active);
  const redeemedCards = allCards.filter((card) => card.status === "REDEEMED");
  const totalCardCount = allCards.length + restaurant.marketingPromoCards.length;
  const totalRedeemedCount = redeemedCards.length + restaurant.marketingPromoCards.filter((card) => card.status === "REDEEMED").length;

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="marketing" />
        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header><p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">Marketing & Fidelização</p><h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-5xl">Ofertas e cartões que fazem os clientes voltar.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B6258]">Cria descontos ou vantagens, emite cartões pelos teus próprios canais e mede quantos foram utilizados. Esta área é do restaurante e não pertence à rede de hotéis.</p></header>
          <MarketingLoyaltyTabs id={id} />

          <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icon={<Gift size={18} />} label="Ofertas ativas" value={String(activeBenefits.length)} />
            <Kpi icon={<TicketCheck size={18} />} label="Cartões emitidos" value={String(totalCardCount)} />
            <Kpi icon={<CheckCircle2 size={18} />} label="Utilizações" value={String(totalRedeemedCount)} />
            <Kpi icon={<BadgePercent size={18} />} label="Taxa de utilização" value={totalCardCount ? `${Math.round((totalRedeemedCount / totalCardCount) * 100)}%` : "0%"} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[34px] border border-[#E1D0B8] bg-white p-5 shadow-[0_24px_75px_rgba(80,55,30,0.07)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Nova promoção</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Publicar oferta</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Depois de publicada, podes emitir cartões individuais e partilhar o link com os clientes.</p>
              <CreatePartnerBenefitForm restaurantId={id} />
            </div>
            <div className="rounded-[34px] border border-[#D8C39F] bg-[#FFF9F0] p-5 sm:p-8">
              <div className="w-fit rounded-full bg-[#17120D] p-3 text-[#D7B267]"><ScanLine size={22} /></div><p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">No restaurante</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Validar cartão</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Introduz o código mostrado pelo cliente. Cada cartão só pode ser utilizado uma vez.</p>
              <RedeemBenefitCardForm restaurantId={id} />
            </div>
          </section>

          <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Campanhas</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Ofertas publicadas</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {restaurant.referralBenefits.map((benefit) => {
                const used = benefit.cards.filter((card) => card.status === "REDEEMED").length;
                const expired = benefit.validUntil != null && benefit.validUntil <= new Date();
                return <article key={benefit.id} className="rounded-[28px] border border-[#E1D0B8] bg-[#FFFDFC] p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${benefit.active && !expired ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#EFE7DA] text-[#806D56]"}`}>{expired ? "Expirado" : benefit.active ? "Ativo" : "Pausado"}</span><span className="text-xs text-[#8A7863]">{benefitTypeLabel(benefit.benefitType)}</span></div><h3 className="mt-3 text-xl font-semibold">{benefit.title}</h3></div><p className="text-xl font-semibold text-[#704E27]">{benefitValue(benefit.benefitType, Number(benefit.value || 0))}</p></div>{benefit.description && <p className="mt-3 text-sm leading-6 text-[#6B6258]">{benefit.description}</p>}<div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="Emitidos" value={String(benefit.cards.length)} /><MiniStat label="Utilizados" value={String(used)} /><MiniStat label="Limite" value={benefit.maxRedemptions == null ? "∞" : String(benefit.maxRedemptions)} /></div>{benefit.active && !expired && <div className="mt-4 rounded-[18px] border border-[#E5D6C0] bg-[#FFF9F0] p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A6130]">Emitir cartão digital</p><IssueBenefitCardButton benefitId={benefit.id} /></div>}<div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-[#75695C]">{benefit.validUntil ? `Até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(benefit.validUntil)}` : "Sem data de fim"}</p><BenefitToggleButton benefitId={benefit.id} active={benefit.active} /></div></article>;
              })}
              {restaurant.referralBenefits.length === 0 && <div className="rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-10 text-center xl:col-span-2"><Gift className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Ainda não publicaste ofertas.</p><p className="mt-2 text-sm text-[#6B6258]">Cria a primeira promoção e emite cartões para partilhar com os teus clientes.</p></div>}
            </div>
          </section>

          {restaurant.marketingPromoCards.length > 0 && <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Enviados aos clientes</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Cartões digitais individuais</h2><p className="mt-2 text-sm text-[#6B6258]">Cartões de recuperação e fidelização. Cada número é único e pode ser validado na caixa acima.</p><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{restaurant.marketingPromoCards.map((card) => <article key={card.id} className="rounded-[22px] border border-[#E5D6C0] bg-[#FFF9F0] p-4"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#806D56]">{card.template}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${card.status === "REDEEMED" ? "bg-[#E8F6E8] text-[#3F6A4D]" : "bg-[#FFF0D8] text-[#8A6130]"}`}>{card.status === "REDEEMED" ? "Utilizado" : "Ativo"}</span></div><p className="mt-3 truncate font-semibold">{card.title}</p><p className="mt-2 font-mono text-xs font-bold tracking-[0.1em] text-[#704E27]">{card.publicCode}</p><div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] text-[#817466]">{card.redeemedAt ? `Usado ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(card.redeemedAt)}` : card.expiresAt ? `Válido até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short" }).format(card.expiresAt)}` : "Sem validade"}</p><Link href={`/offers/${card.publicCode}`} target="_blank" className="text-xs font-bold text-[#7A542A]">Abrir cartão ↗</Link></div></article>)}</div></section>}
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
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-[16px] bg-[#FFF4E2] p-3 text-center"><p className="text-lg font-semibold">{value}</p><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A7863]">{label}</p></div>; }
function benefitTypeLabel(value: string) { if (value === "PERCENT") return "Desconto percentual"; if (value === "FIXED") return "Desconto em euros"; return "Oferta / vantagem"; }
function benefitValue(type: string, value: number) { if (type === "PERCENT") return `${new Intl.NumberFormat("pt-PT").format(value)}%`; if (type === "FIXED") return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value); return "Oferta"; }
