import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Copy, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { getMarketingCardTheme, marketingBenefitValue } from "@/lib/marketing-card-themes";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Cartão digital MesaLink",
  robots: { index: false, follow: false },
};

export default async function MarketingOfferCardPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ ml_action?: string }> }) {
  const { code } = await params;
  const { ml_action: marketingAction } = await searchParams;
  const card = await prisma.marketingPromoCard.findUnique({
    where: { publicCode: code.toUpperCase() },
    include: { restaurant: { select: { name: true, slug: true, websiteLogoImage: true, address: true } } },
  });
  if (!card) notFound();

  const theme = getMarketingCardTheme(card.template);
  const expired = Boolean(card.expiresAt && card.expiresAt <= new Date());
  const used = card.status === "REDEEMED";
  const active = card.status === "ACTIVE" && !expired;
  const expiry = card.expiresAt ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(card.expiresAt) : null;
  const reservationUrl = `/reserve/${card.restaurant.slug}${marketingAction && /^[a-f0-9]{48}$/.test(marketingAction) ? `?ml_action=${marketingAction}` : ""}`;

  return (
    <main className="min-h-screen bg-[#F2ECE2] px-4 py-8 text-[#17120D] sm:py-12">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href={`/s/${card.restaurant.slug}`} className="text-lg font-semibold tracking-[-0.04em]">MesaLink</Link>
          <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ${active ? "bg-[#E8F6E8] text-[#3F6A4D]" : "bg-[#E8DED1] text-[#786A5B]"}`}>{used ? "Utilizado" : expired ? "Expirado" : active ? "Válido" : "Indisponível"}</span>
        </header>

        <section className="relative aspect-[1.58/1] min-h-[340px] overflow-hidden rounded-[32px] border border-white/25 p-6 shadow-[0_32px_90px_rgba(62,43,23,0.24)] sm:p-8" style={{ background: theme.background, color: theme.foreground }}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/15" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-white/[0.06]" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {card.restaurant.websiteLogoImage ? <span aria-hidden="true" className="h-11 w-11 rounded-2xl border border-white/20 bg-cover bg-center" style={{ backgroundImage: `url(${card.restaurant.websiteLogoImage})` }} /> : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Sparkles size={20} style={{ color: theme.accent }} /></span>}
                <div className="min-w-0"><p className="truncate text-sm font-bold">{card.restaurant.name}</p><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: theme.muted }}>Cartão digital</p></div>
              </div>
              <Gift size={24} style={{ color: theme.accent }} />
            </div>

            <div className="my-auto py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: theme.accent }}>Uma nova experiência</p>
              <h1 className="mt-2 max-w-sm text-3xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-4xl">{card.title}</h1>
              {card.description && <p className="mt-3 max-w-sm text-xs leading-5" style={{ color: theme.muted }}>{card.description}</p>}
            </div>

            <div className="flex items-end justify-between gap-5 border-t border-white/15 pt-4">
              <div><p className="text-[8px] font-black uppercase tracking-[0.18em]" style={{ color: theme.muted }}>Número do cartão</p><p className="mt-1 font-mono text-sm font-bold tracking-[0.12em] sm:text-base">{card.publicCode}</p></div>
              <p className="text-3xl font-black tracking-[-0.04em]" style={{ color: theme.accent }}>{marketingBenefitValue(card.benefitType, card.value == null ? null : Number(card.value))}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[26px] border border-[#DECEB6] bg-white p-5 shadow-[0_16px_40px_rgba(65,46,27,0.06)]">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info icon={<ShieldCheck size={16} />} title="Utilização única" text="Apresenta o número no restaurante. Depois de validado, o cartão fica utilizado." />
            <Info icon={<Clock3 size={16} />} title={expiry ? `Válido até ${expiry}` : "Sem data de fim"} text={card.minSpend ? `Consumo mínimo: ${new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(Number(card.minSpend))}` : "Sem consumo mínimo definido."} />
          </div>
          {card.terms && <p className="mt-4 rounded-2xl bg-[#F7F1E8] px-4 py-3 text-xs leading-5 text-[#6B6258]">{card.terms}</p>}
          {active && <Link href={reservationUrl} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white"><CheckCircle2 size={16} /> Reservar mesa</Link>}
          {!active && <p className="mt-4 rounded-2xl bg-[#F3EAE0] px-4 py-3 text-center text-sm font-semibold text-[#75685B]">Este cartão já não pode ser utilizado.</p>}
          <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#918579]"><Copy size={12} /> Guarda este link ou mostra o cartão no telemóvel.</p>
        </section>
      </div>
    </main>
  );
}

function Info({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-[#E7DAC8] bg-[#FFFCF8] p-4"><div className="flex items-center gap-2 text-[#8A6130]">{icon}<p className="text-xs font-bold text-[#30271F]">{title}</p></div><p className="mt-2 text-[11px] leading-5 text-[#75695D]">{text}</p></div>;
}
