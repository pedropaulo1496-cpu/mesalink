import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BadgePercent, CalendarDays, Gift, ShieldCheck, TicketCheck } from "lucide-react";
import { IssueBenefitCardButton } from "@/components/partners/PartnerBenefitControls";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PartnerBenefitsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/partners/app/benefits");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      referralPartner: {
        include: {
          benefitCards: {
            orderBy: { createdAt: "desc" },
            take: 30,
            include: { benefit: { include: { restaurant: { select: { name: true } } } } },
          },
        },
      },
    },
  });
  if (!user?.referralPartner) redirect("/partners/app");

  const partner = user.referralPartner;
  const now = new Date();
  const benefits = await prisma.referralBenefit.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      restaurant: { referralNetworkEnabled: true },
    },
    orderBy: [{ validUntil: "asc" }, { createdAt: "desc" }],
    include: { restaurant: { select: { name: true, address: true, websiteCuisine: true, websiteHeroImage: true } } },
  });
  const availableBenefits = benefits.filter((benefit) => benefit.maxRedemptions == null || benefit.redemptions < benefit.maxRedemptions);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <header className="sticky top-0 z-40 border-b border-[#E1D0B8] bg-[#F5EFE6]/92 px-4 py-4 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/partners/app" className="text-2xl font-black tracking-[-0.08em] sm:text-3xl"><span className="text-[#C8A56A]">Mesa</span>Link <span className="text-xs font-semibold tracking-normal text-[#8A6130]">Partners</span></Link>
          <div className="text-right"><p className="text-sm font-semibold">{partner.businessName}</p><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A7863]">Cartões anónimos</p></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6">
        <PartnerTabs active="benefits" />
        <section className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Cartões e benefícios</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">Ofertas prontas para partilhar.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">Emite um cartão para o número de pessoas certo e partilha o link. Não pedimos qualquer nome, telefone ou email do cliente.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#BAD8B7] bg-[#EFF9EF] px-4 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={16} /> Cliente anónimo</div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {availableBenefits.map((benefit) => (
            <article key={benefit.id} className="overflow-hidden rounded-[30px] border border-[#E1D0B8] bg-white shadow-[0_20px_65px_rgba(80,55,30,0.07)]">
              <div className="h-2 bg-gradient-to-r from-[#B9894D] via-[#E6C78E] to-[#7B5630]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">{benefit.restaurant.websiteCuisine || "Restaurante parceiro"}</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{benefit.restaurant.name}</h2></div><div className="rounded-full bg-[#F6EBD8] p-2.5 text-[#8A6130]"><BadgePercent size={19} /></div></div>
                <p className="mt-5 text-2xl font-semibold tracking-[-0.045em] text-[#704E27]">{benefitLabel(benefit.benefitType, Number(benefit.value || 0), benefit.title)}</p>
                {benefit.description && <p className="mt-2 text-sm leading-6 text-[#6B6258]">{benefit.description}</p>}
                <div className="mt-4 space-y-2 text-xs text-[#75695C]">
                  {benefit.restaurant.address && <p>{benefit.restaurant.address}</p>}
                  {benefit.validUntil && <p className="flex items-center gap-2"><CalendarDays size={14} /> Até {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(benefit.validUntil)}</p>}
                  {benefit.minSpend && <p>Consumo mínimo: {formatMoney(Number(benefit.minSpend))}</p>}
                  {benefit.terms && <p className="rounded-xl bg-[#FFF9F0] p-3 leading-5">{benefit.terms}</p>}
                </div>
                <IssueBenefitCardButton benefitId={benefit.id} />
              </div>
            </article>
          ))}
          {availableBenefits.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-[30px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-10 text-center"><Gift className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Ainda não há benefícios disponíveis.</p><p className="mt-2 text-sm text-[#6B6258]">As novas promoções dos restaurantes da rede aparecem aqui.</p></div>}
        </section>

        <section className="mt-7 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8">
          <div className="flex items-center gap-3"><TicketCheck className="text-[#9B6F3B]" /><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Carteira</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">Cartões emitidos</h2></div></div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {partner.benefitCards.map((card) => {
              const expired = card.expiresAt != null && card.expiresAt <= now;
              const status = card.status === "REDEEMED" ? "Utilizado" : expired ? "Expirado" : "Ativo";
              return <Link href={`/partners/cards/${card.publicCode}`} key={card.id} className="rounded-[24px] border border-[#E1D0B8] bg-[#FFFDFC] p-4 transition hover:border-[#BFA06F]">
                <div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{card.benefit.restaurant.name}</p><p className="mt-1 text-sm text-[#6B6258]">{card.benefit.title} · {card.guestCount} pessoa{card.guestCount === 1 ? "" : "s"}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${status === "Ativo" ? "bg-[#EFF9EF] text-[#3F6A4D]" : "bg-[#F1E8DA] text-[#806D56]"}`}>{status}</span></div>
                <p className="mt-3 font-mono text-xs font-bold tracking-wider text-[#795D38]">{card.publicCode}</p>
              </Link>;
            })}
            {partner.benefitCards.length === 0 && <p className="text-sm text-[#6B6258]">Os cartões que emitires ficam guardados aqui.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function PartnerTabs({ active }: { active: "groups" | "benefits" }) {
  return <nav className="inline-flex rounded-full border border-[#D9C7AA] bg-white p-1"><Link href="/partners/app" className={`rounded-full px-5 py-2.5 text-xs font-bold ${active === "groups" ? "bg-[#17120D] text-white" : "text-[#6B6258]"}`}>Grupos e reservas</Link><Link href="/partners/app/benefits" className={`rounded-full px-5 py-2.5 text-xs font-bold ${active === "benefits" ? "bg-[#17120D] text-white" : "text-[#6B6258]"}`}>Cartões e benefícios</Link></nav>;
}

function benefitLabel(type: string, value: number, title: string) {
  if (type === "PERCENT") return `${new Intl.NumberFormat("pt-PT").format(value)}% de desconto`;
  if (type === "FIXED") return `${formatMoney(value)} de desconto`;
  return title;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}
