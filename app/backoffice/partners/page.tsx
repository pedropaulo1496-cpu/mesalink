import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CalendarCheck2, Clock3, Mail, MapPin, MessageCircle, Phone, Search, UserRoundCheck } from "lucide-react";
import { PageHeading, StatCard, dateTime, euroAmount, inputClass, buttonClass } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { openPartnerSupportChat } from "../actions";

export const dynamic = "force-dynamic";

const SUCCESS_STATUSES = new Set(["BOOKED", "COMPLETED", "PAID"]);

export default async function BackofficePartnersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") notFound();
  const { q = "" } = await searchParams;
  const since = daysAgo(30);
  const partners = await prisma.referralPartner.findMany({
    where: q.trim() ? {
      OR: [
        { businessName: { contains: q.trim(), mode: "insensitive" } },
        { contactName: { contains: q.trim(), mode: "insensitive" } },
        { email: { contains: q.trim(), mode: "insensitive" } },
        { phone: { contains: q.trim(), mode: "insensitive" } },
        { city: { contains: q.trim(), mode: "insensitive" } },
        { partnerCode: { contains: q.trim(), mode: "insensitive" } },
      ],
    } : undefined,
    include: {
      groups: { select: { status: true, guests: true, createdAt: true, desiredDate: true }, orderBy: { createdAt: "desc" } },
      payments: { select: { grossCommission: true, partnerNet: true, status: true, createdAt: true } },
      _count: { select: { agreements: true, groups: true, payments: true } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 300,
  });

  const allPartners = q.trim() ? await prisma.referralPartner.findMany({
    select: { status: true, stripeOnboardingComplete: true, lastActiveAt: true, groups: { select: { status: true, createdAt: true } }, payments: { select: { partnerNet: true } } },
  }) : partners;
  const active30 = allPartners.filter((partner) => {
    const activity = newestDate(partner.lastActiveAt, ...partner.groups.map((group) => group.createdAt));
    return Boolean(activity && activity >= since);
  }).length;
  const successful = allPartners.reduce((total, partner) => total + partner.groups.filter((group) => SUCCESS_STATUSES.has(group.status)).length, 0);
  const partnerNet = allPartners.reduce((total, partner) => total + partner.payments.reduce((sum, payment) => sum + Number(payment.partnerNet), 0), 0);

  return <>
    <PageHeading eyebrow="MesaLink Partners · dados reais" title="Parceiros" description="Parceiros registados, estado da conta, atividade, reservas geradas e comissões acumuladas." />
    <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Parceiros registados" value={allPartners.length.toString()} note={`${allPartners.filter((partner) => partner.status === "ACTIVE").length} com conta ativa`} tone="gold" />
      <StatCard label="Ativos · 30 dias" value={active30.toString()} note="login, utilização ou criação de pedido" tone={active30 ? "green" : "plain"} />
      <StatCard label="Reservas conseguidas" value={successful.toString()} note="marcadas, concluídas ou pagas" tone="blue" />
      <StatCard label="Comissão líquida" value={euroAmount(partnerNet)} note="valor acumulado dos parceiros" tone="green" />
    </section>

    <form className="mt-4 flex max-w-xl gap-2" action="/backoffice/partners">
      <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9B6F3B]" size={17} /><input name="q" defaultValue={q} placeholder="Nome, email, cidade ou código" className={`${inputClass} pl-11`} /></label>
      <button className={buttonClass}>Procurar</button>
    </form>

    <section className="mt-4 space-y-2.5">
      {partners.map((partner) => {
        const recentGroups = partner.groups.filter((group) => group.createdAt >= since);
        const successfulGroups = partner.groups.filter((group) => SUCCESS_STATUSES.has(group.status));
        const guests = successfulGroups.reduce((total, group) => total + group.guests, 0);
        const gross = partner.payments.reduce((total, payment) => total + Number(payment.grossCommission), 0);
        const net = partner.payments.reduce((total, payment) => total + Number(payment.partnerNet), 0);
        const lastActivity = newestDate(partner.lastActiveAt, partner.lastLoginAt, partner.groups[0]?.createdAt, partner.updatedAt);
        const conversion = partner.groups.length ? Math.round((successfulGroups.length / partner.groups.length) * 100) : 0;
        return <article key={partner.id} className="rounded-[20px] border border-[#DCC9AA] bg-white p-4 shadow-[0_10px_30px_rgba(80,55,30,0.04)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 xl:w-[30%]">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-bold">{partner.businessName}</h2><StatusPill status={partner.status} /><span className="rounded-full bg-[#F2E8D8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] text-[#76572F]">{partner.partnerType}</span></div>
              <p className="mt-1 truncate text-[11px] text-[#6B6258]">{partner.contactName || "Sem nome de contacto"} · {partner.partnerCode}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#675D52]"><a href={`mailto:${partner.email}`} className="inline-flex items-center gap-1 font-semibold"><Mail size={11} />{partner.email}</a>{partner.phone && <a href={`tel:${partner.phone}`} className="inline-flex items-center gap-1"><Phone size={11} />{partner.phone}</a>}{partner.city && <span className="inline-flex items-center gap-1"><MapPin size={11} />{partner.city}</span>}</div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <Mini label="Última atividade" value={lastActivity ? dateTime(lastActivity) : "Nunca"} icon={<Clock3 size={12} />} />
              <Mini label="Pedidos · 30d" value={recentGroups.length.toString()} icon={<CalendarCheck2 size={12} />} />
              <Mini label="Reservas" value={`${successfulGroups.length} · ${conversion}%`} icon={<UserRoundCheck size={12} />} />
              <Mini label="Pessoas" value={guests.toString()} />
              <Mini label="Comissão bruta" value={euroAmount(gross)} />
              <Mini label="Líquido parceiro" value={euroAmount(net)} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#EEE3D3] pt-3 text-[9px] text-[#75695D]"><span>Registo: <strong>{dateTime(partner.createdAt)}</strong></span><span>·</span><span>{partner._count.agreements} acordos</span><span>·</span><span>{partner._count.groups} pedidos</span><span>·</span><span>{partner._count.payments} pagamentos</span><span>·</span><span className={`font-bold ${partner.stripeOnboardingComplete ? "text-[#3F6A4D]" : "text-[#A14E36]"}`}>{partner.stripeOnboardingComplete ? "IBAN/Stripe validado" : "IBAN por validar"}</span><form action={openPartnerSupportChat} className="ml-auto"><input type="hidden" name="partnerId" value={partner.id} /><button className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#D7B267] bg-[#FFF9F0] px-4 text-[9px] font-black uppercase tracking-[0.08em] text-[#684A25]"><MessageCircle size={13} /> Chat</button></form></div>
        </article>;
      })}
      {!partners.length && <div className="rounded-2xl border border-dashed border-[#DCC9AA] bg-white p-7 text-center text-[13px] text-[#6B6258]">Nenhum parceiro encontrado.</div>}
    </section>
  </>;
}

function Mini({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-[#F8F2E9] p-2.5"><p className="flex items-center gap-1 truncate text-[7px] font-black uppercase tracking-[.1em] text-[#8A6130]">{icon}{label}</p><p className="mt-1 truncate text-[12px] font-bold" title={value}>{value}</p></div>;
}

function StatusPill({ status }: { status: string }) {
  const active = status === "ACTIVE";
  const pending = status === "PENDING";
  return <span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[.1em] ${active ? "bg-[#E5F3E4] text-[#37613C]" : pending ? "bg-[#FFF0CA] text-[#80601E]" : "bg-[#F8E2D9] text-[#964A35]"}`}>{active ? "Ativo" : pending ? "Pendente" : status === "SUSPENDED" ? "Suspenso" : status}</span>;
}

function newestDate(...values: Array<Date | null | undefined>) {
  return values.filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0] || null;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
