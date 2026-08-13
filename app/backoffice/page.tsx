import Link from "next/link";
import { ArrowRight, BellRing, MessageCircle, TrendingUp } from "lucide-react";
import FinancialTrendChart from "@/components/backoffice/FinancialTrendChart";
import { DoneNotice, PageHeading, RiskPill, StatCard, euroAmount, euroCents } from "@/components/backoffice/BackofficeUI";
import { getBackofficeClients } from "@/lib/backoffice-data";
import { getBackofficeFinance } from "@/lib/backoffice-finance";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function BackofficeOverview({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const staff = await requireStaff();
  const { done } = await searchParams;
  const referenceTime = new Date();
  const activeThreshold = new Date(referenceTime.getTime() - 7 * 86_400_000);
  const newThreshold = new Date(referenceTime.getTime() - 30 * 86_400_000);
  const clientWhere = { isAdmin: false, salesProfile: null, referralPartner: null, ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {}) };
  const [clients, finance, totalClientCount, activeClientCount, newClientCount] = await Promise.all([
    getBackofficeClients(staff),
    staff.role === "ADMIN" ? getBackofficeFinance() : Promise.resolve(null),
    prisma.user.count({ where: clientWhere }),
    prisma.user.count({ where: { ...clientWhere, OR: [{ lastActiveAt: { gte: activeThreshold } }, { lastLoginAt: { gte: activeThreshold } }, { restaurants: { some: { updatedAt: { gte: activeThreshold } } } }] } }),
    prisma.user.count({ where: { ...clientWhere, createdAt: { gte: newThreshold } } }),
  ]);
  const commissionWhere = staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {};
  const [commissions, pendingRequests, unreadMessages, representatives] = await Promise.all([
    prisma.salesCommission.groupBy({ by: ["status"], where: commissionWhere, _sum: { commissionAmount: true } }),
    prisma.commercialRequest.count({ where: { ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {}), status: "PENDING" } }),
    prisma.commercialMessage.count({ where: { ...(staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {}), senderUserId: { not: staff.userId }, readAt: null } }),
    staff.role === "ADMIN" ? prisma.salesRepresentative.findMany({
      where: { active: true },
      include: { _count: { select: { clients: true, requests: true } } },
      orderBy: { name: "asc" },
    }) : Promise.resolve([]),
  ]);

  const pendingCommission = commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
  const paidCommission = commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
  const activeClients = activeClientCount;
  const inactiveClients = totalClientCount - activeClientCount;
  const highRiskClients = clients.filter((client) => client.health.riskLevel === "HIGH").length;
  const newClients = newClientCount;
  const opportunities = [...clients].sort((a, b) => b.health.riskScore - a.health.riskScore).slice(0, 6);

  const representativeCommissions = staff.role === "ADMIN" ? await prisma.salesCommission.groupBy({
    by: ["salesRepresentativeId", "status"],
    _sum: { commissionAmount: true },
  }) : [];

  return (
    <>
      <DoneNotice done={done} />
      <PageHeading
        eyebrow={staff.role === "ADMIN" ? "MesaLink HQ · Administração" : "Backoffice comercial · A minha carteira"}
        title={staff.role === "ADMIN" ? "Controlo da operação" : `Bom dia, ${staff.name?.split(" ")[0] || "equipa"}.`}
        description={staff.role === "ADMIN" ? "Negócio, clientes em risco, aprovações, pagamentos e desempenho da equipa num único resumo." : "Os teus clientes, as ações de hoje e a evolução das tuas comissões — sem dados da restante equipa."}
        action={<Link href="/backoffice/clients" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#17130F] px-5 text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(23,19,15,0.14)]">{staff.role === "ADMIN" ? "Gerir clientes" : "Abrir carteira"} <ArrowRight size={14} /></Link>}
      />

      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {staff.role === "ADMIN" ? <>
          <StatCard label="Receita recorrente líquida" value={euroCents(finance?.netMrrCents || 0)} note={`${euroCents(finance?.grossMrrCents || 0)} MRR bruto · ${euroCents(finance?.planCommissionCents || 0)} comercial`} tone="gold" />
          <StatCard label="Créditos comprados" value={euroCents(finance?.current.creditGrossCents || 0)} note={`${euroCents(finance?.current.creditNetCents || 0)} líquido este mês`} tone="blue" />
          <StatCard label="Despesa do mês" value={euroCents(finance?.current.expenseCents || 0)} note={monthChange(finance?.current.expenseCents || 0, finance?.previous.expenseCents || 0)} tone="red" />
          <StatCard label="Lucro líquido" value={euroCents(finance?.current.profitCents || 0)} note={monthChange(finance?.current.profitCents || 0, finance?.previous.profitCents || 0)} tone={(finance?.current.profitCents || 0) >= 0 ? "green" : "red"} />
        </> : <>
          <StatCard label="A minha carteira" value={totalClientCount.toString()} note="clientes atribuídos" />
          <StatCard label="Novos clientes" value={newClients.toString()} note="últimos 30 dias" tone="blue" />
          <StatCard label="A receber" value={euroAmount(pendingCommission)} note="comissões pendentes" tone="gold" />
          <StatCard label="Já recebido" value={euroAmount(paidCommission)} note="comissões pagas" tone="green" />
        </>}
      </section>

      <section className={`mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border sm:grid-cols-4 ${staff.role === "ADMIN" ? "border-[#30271E] bg-[#332B23]" : "border-[#304536] bg-[#35503C]"}`}>
        <CompactMetric label="Clientes ativos" value={activeClients.toString()} />
        <CompactMetric label={staff.role === "ADMIN" ? "Inativos há mais de 1 semana" : "A contactar hoje"} value={(staff.role === "ADMIN" ? inactiveClients : highRiskClients).toString()} alert={(staff.role === "ADMIN" ? inactiveClients : highRiskClients) > 0} />
        <CompactMetric label={staff.role === "ADMIN" ? "Comissões do mês" : "Meus pedidos pendentes"} value={staff.role === "ADMIN" ? euroCents(finance?.current.commissionCents || 0) : pendingRequests.toString()} alert={staff.role !== "ADMIN" && pendingRequests > 0} />
        <CompactMetric label={staff.role === "ADMIN" ? "Taxas Stripe do mês" : "Mensagens por ler"} value={staff.role === "ADMIN" ? euroCents(finance?.current.stripeFeesCents || 0) : unreadMessages.toString()} alert={staff.role !== "ADMIN" && unreadMessages > 0} />
      </section>

      {staff.role === "ADMIN" && finance && <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <FinancialTrendChart months={finance.months} />
        <div className="rounded-2xl border border-[#DCC9AA] bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Despesa deste mês</p>
          <div className="mt-3 divide-y divide-[#EEE4D6]"><CostRow label="Stripe" value={finance.current.stripeFeesCents} /><CostRow label="Comerciais" value={finance.current.commissionCents} /><CostRow label="Email, IA e WhatsApp" value={finance.current.usageCostCents} /><CostRow label="Fornecedores e domínios" value={finance.current.providerCostCents} /></div>
          <div className="mt-3 rounded-xl bg-[#F5EFE6] px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold text-[#6B6258]">Receita capturada</span><strong className="text-[13px]">{euroCents(finance.current.revenueCents)}</strong></div><p className="mt-1 text-[9px] leading-4 text-[#887A6B]">Valores operacionais estimados com dados Stripe e custos definidos no HQ.</p></div>
        </div>
      </section>}

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_340px]">
        <div className="overflow-hidden rounded-[22px] border border-[#DCC9AA] bg-white shadow-[0_12px_34px_rgba(75,52,29,0.04)]">
          <div className="flex items-center justify-between gap-3">
            <div className="px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">{staff.role === "ADMIN" ? "Risco e retenção" : "Prioridades de hoje"}</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">{staff.role === "ADMIN" ? "Clientes que precisam de atenção" : "Quem contactar agora"}</h2></div>
            <BellRing className="mr-4 text-[#A97936]" size={18} />
          </div>
          <div className="border-t border-[#E8DDCD]">
            {opportunities.map((client) => (
              <Link key={client.id} href={`/backoffice/clients?q=${encodeURIComponent(client.email)}`} className="grid gap-2 border-b border-[#EEE4D6] px-4 py-3 transition last:border-0 hover:bg-[#FFF9F0] sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.85fr)_auto] sm:items-center">
                <div className="min-w-0"><p className="truncate text-[13px] font-bold">{client.restaurant?.name || client.name || client.email}</p><p className="mt-0.5 truncate text-[10px] text-[#6B6258]">{client.email} · {client.health.inactiveDays === null ? "sem entrada" : `${client.health.inactiveDays} dias inativo`}</p></div>
                <p className="truncate text-[11px] text-[#5E5348]">{client.suggestion}</p>
                <div className="justify-self-start sm:justify-self-end">
                  <RiskPill level={client.health.riskLevel} score={client.health.riskScore} />
                </div>
              </Link>
            ))}
            {!opportunities.length && <p className="p-5 text-center text-[13px] text-[#6B6258]">Ainda não existem clientes nesta carteira.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[22px] bg-[#17130F] p-4 text-white shadow-[0_16px_38px_rgba(23,19,15,0.14)]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D7B267]">{staff.role === "ADMIN" ? "Operação" : "O teu dia"}</p>
            <div className="mt-3 grid gap-2">
              <QuickLink href="/backoffice/requests" icon={<BellRing size={17} />} title="Pedidos comerciais" note={`${pendingRequests} aguardam decisão`} />
              <QuickLink href="/backoffice/chat" icon={<MessageCircle size={17} />} title="Chat interno" note={`${unreadMessages} mensagens por ler`} />
              <QuickLink href="/backoffice/commissions" icon={<TrendingUp size={17} />} title="Comissões" note={`${euroAmount(pendingCommission)} por liquidar`} />
            </div>
          </div>

          {staff.role === "ADMIN" && (
            <div className="rounded-2xl border border-[#DCC9AA] bg-white p-4">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Equipa</p><h2 className="mt-1 text-lg font-semibold">Comerciais</h2></div><Link href="/backoffice/team" className="text-[11px] font-bold text-[#8A6130]">Gerir</Link></div>
              <div className="mt-3 divide-y divide-[#EEE4D6]">
                {representatives.map((rep) => {
                  const repPending = representativeCommissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PENDING").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
                  const repPaid = representativeCommissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PAID").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
                  return <div key={rep.id} className="flex justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-[12px] font-bold">{rep.name}</p><p className="mt-0.5 text-[10px] text-[#6B6258]">{rep._count.clients} clientes · {rep._count.requests} pedidos</p></div><div className="text-right"><p className="text-[12px] font-bold">{euroAmount(repPending)}</p><p className="text-[9px] text-[#8A6A42]">{euroAmount(repPaid)} pago</p></div></div>;
                })}
                {!representatives.length && <p className="text-sm text-[#6B6258]">Cria o primeiro comercial na área Equipa.</p>}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function QuickLink({ href, icon, title, note }: { href: string; icon: React.ReactNode; title: string; note: string }) {
  return <Link href={href} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] p-2.5 hover:bg-white/10"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D7B267] text-[#17130F]">{icon}</span><span className="min-w-0"><span className="block text-[12px] font-bold">{title}</span><span className="block truncate text-[10px] text-white/45">{note}</span></span></Link>;
}

function CompactMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="flex items-center justify-between gap-3 bg-white/[0.035] px-4 py-3"><p className="truncate text-[9px] font-bold text-white/48">{label}</p><p className={`text-sm font-black ${alert ? "text-[#F0A58D]" : "text-[#F0D28F]"}`}>{value}</p></div>;
}

function CostRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-3 py-2"><span className="text-[11px] text-[#6B6258]">{label}</span><strong className="text-[12px]">{euroCents(value)}</strong></div>;
}

function monthChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "sem movimento este mês" : "primeiro movimento comparável";
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
  return `${percent >= 0 ? "+" : ""}${percent}% face ao mês anterior`;
}
