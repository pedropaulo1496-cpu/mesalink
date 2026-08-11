import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgePercent, CalendarDays, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cartão de parceria | MesaLink",
  robots: { index: false, follow: false },
};

export default async function PublicBenefitCardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const card = await prisma.referralBenefitCard.findUnique({
    where: { publicCode: code.trim().toUpperCase() },
    include: {
      benefit: {
        include: { restaurant: { select: { name: true, address: true, websiteCuisine: true, websiteLogoImage: true, slug: true, websiteEnabled: true } } },
      },
    },
  });
  if (!card) notFound();

  const now = new Date();
  const expired = (card.expiresAt != null && card.expiresAt <= now) || (card.benefit.validUntil != null && card.benefit.validUntil <= now);
  const active = card.status === "ACTIVE" && card.benefit.active && !expired && card.benefit.validFrom <= now;

  return (
    <main className="min-h-screen bg-[#17120D] px-4 py-8 text-[#17120D] sm:py-14">
      <div className="mx-auto max-w-lg">
        <Link href="/partners" className="block text-center text-3xl font-black tracking-[-0.08em] text-white"><span className="text-[#D7B267]">Mesa</span>Link</Link>
        <article className="mt-7 overflow-hidden rounded-[38px] border border-white/15 bg-[#FFF9F0] shadow-[0_32px_100px_rgba(0,0,0,0.38)]">
          <div className="h-3 bg-gradient-to-r from-[#8A6130] via-[#E8C985] to-[#8A6130]" />
          <div className="p-7 sm:p-9">
            <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[0.23em] text-[#9B6F3B]">Cartão de parceria</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">{card.benefit.restaurant.name}</h1><p className="mt-1 text-sm text-[#746759]">{card.benefit.restaurant.websiteCuisine || card.benefit.restaurant.address || "Restaurante MesaLink"}</p></div><div className="rounded-full bg-[#F1E1C5] p-3 text-[#855E30]"><Ticket size={23} /></div></div>

            <div className="my-7 border-y border-dashed border-[#D6C3A5] py-7 text-center">
              <BadgePercent className="mx-auto text-[#9B6F3B]" size={28} />
              <p className="mt-4 text-3xl font-semibold tracking-[-0.055em] text-[#704E27]">{benefitLabel(card.benefit.benefitType, Number(card.benefit.value || 0), card.benefit.title)}</p>
              {card.benefit.description && <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6B6258]">{card.benefit.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3"><Detail label="Pessoas" value={String(card.guestCount)} /><Detail label="Estado" value={active ? "Válido" : card.status === "REDEEMED" ? "Utilizado" : "Expirado"} /></div>
            {card.expiresAt && <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#75695C]"><CalendarDays size={14} /> Válido até {new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(card.expiresAt)}</p>}
            {card.benefit.minSpend && <p className="mt-3 text-center text-xs text-[#75695C]">Consumo mínimo: {formatMoney(Number(card.benefit.minSpend))}</p>}
            {card.benefit.terms && <p className="mt-4 rounded-[18px] bg-white p-4 text-xs leading-5 text-[#6B6258]">{card.benefit.terms}</p>}

            <div className={`mt-6 rounded-[24px] p-5 text-center ${active ? "bg-[#17120D] text-white" : "bg-[#E7DED0] text-[#73685B]"}`}>
              {active ? <ShieldCheck className="mx-auto text-[#D7B267]" /> : <CheckCircle2 className="mx-auto" />}
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] opacity-60">Código para validação</p>
              <p className="mt-2 font-mono text-xl font-black tracking-[0.13em]">{card.publicCode}</p>
              <p className="mt-3 text-xs opacity-60">Mostra este cartão no restaurante. Não contém dados pessoais do cliente.</p>
            </div>

            {card.benefit.restaurant.websiteEnabled && <Link href={`/r/${card.benefit.restaurant.slug}`} className="mt-5 block text-center text-sm font-bold text-[#795D38]">Ver restaurante</Link>}
          </div>
        </article>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[20px] border border-[#E1D0B8] bg-white p-4 text-center"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#95816A]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function benefitLabel(type: string, value: number, title: string) {
  if (type === "PERCENT") return `${new Intl.NumberFormat("pt-PT").format(value)}% de desconto`;
  if (type === "FIXED") return `${formatMoney(value)} de desconto`;
  return title;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}
