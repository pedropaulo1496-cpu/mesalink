import Link from "next/link";
import { ArrowRight, BellRing, MessageCircle, TrendingUp } from "lucide-react";
import { DoneNotice, PageHeading, RiskPill, StatCard, euroAmount, euroCents } from "@/components/backoffice/BackofficeUI";
import { getBackofficeClients } from "@/lib/backoffice-data";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function BackofficeOverview({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const staff = await requireStaff();
  const { done } = await searchParams;
  const clients = await getBackofficeClients(staff);
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
  const activeClients = clients.filter((client) => client.health.inactiveDays !== null && client.health.inactiveDays <= 7).length;
  const highRiskClients = clients.filter((client) => client.health.riskLevel === "HIGH").length;
  const newClients = clients.filter((client) => client.isNewLast30Days).length;
  const totalRevenue = clients.reduce((sum, client) => sum + client.payments.revenueCents, 0);
  const mrr = clients.filter((client) => client.subscription?.status === "ACTIVE").reduce((sum, client) => sum + (client.subscription?.priceMonthly || 0), 0);
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
        action={<Link href="/backoffice/clients" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#17130F] px-4 text-[13px] font-bold text-white">{staff.role === "ADMIN" ? "Gerir clientes" : "Abrir carteira"} <ArrowRight size={14} /></Link>}
      />

      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {staff.role === "ADMIN" ? <>
          <StatCard label="Clientes" value={clients.length.toString()} note={`${newClients} novos em 30 dias`} />
          <StatCard label="MRR" value={euroAmount(mrr)} note="planos ativos" />
          <StatCard label="Receita" value={euroCents(totalRevenue)} note="pagamentos Stripe" tone="gold" />
          <StatCard label="Comissões por pagar" value={euroAmount(pendingCommission)} note="equipa comercial" tone="red" />
        </> : <>
          <StatCard label="A minha carteira" value={clients.length.toString()} note="clientes atribuídos" />
          <StatCard label="Novos clientes" value={newClients.toString()} note="últimos 30 dias" tone="blue" />
          <StatCard label="A receber" value={euroAmount(pendingCommission)} note="comissões pendentes" tone="gold" />
          <StatCard label="Já recebido" value={euroAmount(paidCommission)} note="comissões pagas" tone="green" />
        </>}
      </section>

      <section className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#DCC9AA] bg-[#DCC9AA] sm:grid-cols-4">
        <CompactMetric label={staff.role === "ADMIN" ? "Ativos esta semana" : "Clientes ativos 7d"} value={activeClients.toString()} />
        <CompactMetric label={staff.role === "ADMIN" ? "Clientes em risco alto" : "A contactar hoje"} value={highRiskClients.toString()} alert={highRiskClients > 0} />
        <CompactMetric label={staff.role === "ADMIN" ? "Aprovações pendentes" : "Meus pedidos pendentes"} value={pendingRequests.toString()} alert={pendingRequests > 0} />
        <CompactMetric label="Mensagens por ler" value={unreadMessages.toString()} alert={unreadMessages > 0} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_340px]">
        <div className="overflow-hidden rounded-2xl border border-[#DCC9AA] bg-white">
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
          <div className="rounded-2xl bg-[#17130F] p-4 text-white">
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
  return <div className="flex items-center justify-between gap-3 bg-white px-3.5 py-2.5"><p className="truncate text-[10px] font-bold text-[#6B6258]">{label}</p><p className={`text-sm font-black ${alert ? "text-[#A14E36]" : "text-[#17130F]"}`}>{value}</p></div>;
}
