import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { BadgePercent, CheckCircle2, Gift, ScanLine, TicketCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { BenefitToggleButton, CreatePartnerBenefitForm, RedeemBenefitCardForm } from "@/components/partners/PartnerBenefitControls";
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
    },
  }) : null;
  if (!restaurant) notFound();

  const allCards = restaurant.referralBenefits.flatMap((benefit) => benefit.cards);
  const activeBenefits = restaurant.referralBenefits.filter((benefit) => benefit.active);
  const redeemedCards = allCards.filter((card) => card.status === "REDEEMED");

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="partnerNetwork" />
        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header><p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">MesaLink Partner Network</p><h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-5xl">Cria benefícios que os parceiros querem partilhar.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B6258]">Publica descontos ou ofertas, controla a validade e valida os cartões no momento da visita. O cliente continua anónimo.</p></header>
          <RestaurantPartnerTabs id={id} active="benefits" />

          <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi icon={<Gift size={18} />} label="Benefícios ativos" value={String(activeBenefits.length)} />
            <Kpi icon={<TicketCheck size={18} />} label="Cartões emitidos" value={String(allCards.length)} />
            <Kpi icon={<CheckCircle2 size={18} />} label="Utilizações" value={String(redeemedCards.length)} />
            <Kpi icon={<BadgePercent size={18} />} label="Taxa de utilização" value={allCards.length ? `${Math.round((redeemedCards.length / allCards.length) * 100)}%` : "0%"} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[34px] border border-[#E1D0B8] bg-white p-5 shadow-[0_24px_75px_rgba(80,55,30,0.07)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Nova promoção</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Publicar benefício</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">A oferta aparece na app dos hotéis, concierges e restantes parceiros enquanto estiver ativa.</p>
              <CreatePartnerBenefitForm restaurantId={id} />
            </div>
            <div className="rounded-[34px] border border-[#D8C39F] bg-[#FFF9F0] p-5 sm:p-8">
              <div className="rounded-full bg-[#17120D] p-3 text-[#D7B267] w-fit"><ScanLine size={22} /></div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">No restaurante</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Validar cartão</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">Introduz o código mostrado pelo cliente. Cada cartão só pode ser utilizado uma vez e não revela a sua identidade.</p>
              <RedeemBenefitCardForm restaurantId={id} />
            </div>
          </section>

          <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Campanhas</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Benefícios publicados</h2>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {restaurant.referralBenefits.map((benefit) => {
                const used = benefit.cards.filter((card) => card.status === "REDEEMED").length;
                const expired = benefit.validUntil != null && benefit.validUntil <= new Date();
                return <article key={benefit.id} className="rounded-[28px] border border-[#E1D0B8] bg-[#FFFDFC] p-5">
                  <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${benefit.active && !expired ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#EFE7DA] text-[#806D56]"}`}>{expired ? "Expirado" : benefit.active ? "Ativo" : "Pausado"}</span><span className="text-xs text-[#8A7863]">{benefitTypeLabel(benefit.benefitType)}</span></div><h3 className="mt-3 text-xl font-semibold">{benefit.title}</h3></div><p className="text-xl font-semibold text-[#704E27]">{benefitValue(benefit.benefitType, Number(benefit.value || 0))}</p></div>
                  {benefit.description && <p className="mt-3 text-sm leading-6 text-[#6B6258]">{benefit.description}</p>}
                  <div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="Emitidos" value={String(benefit.cards.length)} /><MiniStat label="Utilizados" value={String(used)} /><MiniStat label="Limite" value={benefit.maxRedemptions == null ? "∞" : String(benefit.maxRedemptions)} /></div>
                  <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-[#75695C]">{benefit.validUntil ? `Até ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(benefit.validUntil)}` : "Sem data de fim"}</p><BenefitToggleButton benefitId={benefit.id} active={benefit.active} /></div>
                </article>;
              })}
              {restaurant.referralBenefits.length === 0 && <div className="xl:col-span-2 rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-10 text-center"><Gift className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Ainda não publicaste benefícios.</p><p className="mt-2 text-sm text-[#6B6258]">Cria a primeira oferta para aparecer na app dos parceiros.</p></div>}
            </div>
          </section>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function RestaurantPartnerTabs({ id, active }: { id: string; active: "groups" | "benefits" }) {
  return <nav className="mt-6 inline-flex rounded-full border border-[#D9C7AA] bg-white p-1"><Link href={`/restaurants/${id}/partner-network`} className={`rounded-full px-5 py-2.5 text-xs font-bold ${active === "groups" ? "bg-[#17120D] text-white" : "text-[#6B6258]"}`}>Grupos e comissões</Link><Link href={`/restaurants/${id}/partner-network/benefits`} className={`rounded-full px-5 py-2.5 text-xs font-bold ${active === "benefits" ? "bg-[#17120D] text-white" : "text-[#6B6258]"}`}>Cartões e benefícios</Link></nav>;
}

function Kpi({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-[26px] border border-[#E1D0B8] bg-white p-4 sm:p-5"><div className="text-[#9B6F3B]">{icon}</div><p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8B7D6D]">{label}</p></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[16px] bg-[#FFF4E2] p-3 text-center"><p className="text-lg font-semibold">{value}</p><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A7863]">{label}</p></div>;
}

function benefitTypeLabel(value: string) {
  if (value === "PERCENT") return "Desconto percentual";
  if (value === "FIXED") return "Desconto em euros";
  return "Oferta / vantagem";
}

function benefitValue(type: string, value: number) {
  if (type === "PERCENT") return `${new Intl.NumberFormat("pt-PT").format(value)}%`;
  if (type === "FIXED") return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
  return "Oferta";
}
