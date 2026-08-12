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
  const opportunities = [...clients].sort((a, b) => b.health.riskScore - a.health.riskScore).slice(0, 8);

  const representativeCommissions = staff.role === "ADMIN" ? await prisma.salesCommission.groupBy({
    by: ["salesRepresentativeId", "status"],
    _sum: { commissionAmount: true },
  }) : [];

  return (
    <>
      <DoneNotice done={done} />
      <PageHeading
        eyebrow={staff.role === "ADMIN" ? "MesaLink HQ" : "A minha carteira"}
        title={`Bom dia, ${staff.name?.split(" ")[0] || "equipa"}.`}
        description={staff.role === "ADMIN" ? "Visão completa da operação comercial, clientes em risco, receita, pedidos e comissões." : "Prioridades do dia, clientes atribuídos, pedidos e evolução das tuas comissões."}
        action={<Link href="/backoffice/clients" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#17130F] px-5 text-sm font-bold text-white">Abrir carteira <ArrowRight size={15} /></Link>}
      />

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <StatCard label="Clientes" value={clients.length.toString()} note={`${newClients} novos em 30 dias`} />
        <StatCard label="Ativos 7 dias" value={activeClients.toString()} note="com atividade recente" tone="green" />
        <StatCard label="Risco alto" value={highRiskClients.toString()} note="pedem contacto" tone={highRiskClients ? "red" : "green"} />
        <StatCard label="Receita" value={euroCents(totalRevenue)} note="pagamentos Stripe" tone="gold" />
        <StatCard label="MRR" value={euroAmount(mrr)} note="planos ativos" />
        <StatCard label="Por pagar" value={euroAmount(pendingCommission)} note="comissões abertas" tone="red" />
        <StatCard label="Já recebido" value={euroAmount(paidCommission)} note="comissões pagas" tone="green" />
        <StatCard label="Pedidos" value={pendingRequests.toString()} note={`${unreadMessages} mensagens por ler`} tone="blue" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="rounded-[30px] border border-[#DCC9AA] bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Prioridades</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Quem contactar agora</h2></div>
            <BellRing className="text-[#A97936]" />
          </div>
          <div className="mt-5 space-y-3">
            {opportunities.map((client) => (
              <Link key={client.id} href={`/backoffice/clients?q=${encodeURIComponent(client.email)}`} className="block rounded-2xl border border-[#E4D5BF] bg-[#FFF9F0] p-4 transition hover:border-[#B78B49]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0"><p className="truncate font-bold">{client.restaurant?.name || client.name || client.email}</p><p className="mt-1 truncate text-xs text-[#6B6258]">{client.email} · {client.health.inactiveDays === null ? "sem entrada registada" : `${client.health.inactiveDays} dias inativo`}</p></div>
                  <RiskPill level={client.health.riskLevel} score={client.health.riskScore} />
                </div>
                <p className="mt-3 text-sm leading-5 text-[#5E5348]"><strong>Próxima ação:</strong> {client.suggestion}</p>
                {client.health.factors.length > 0 && <p className="mt-2 text-[11px] text-[#9A6A37]">{client.health.factors.join(" · ")}</p>}
              </Link>
            ))}
            {!opportunities.length && <p className="rounded-2xl bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">Ainda não existem clientes nesta carteira.</p>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[30px] bg-[#17130F] p-5 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D7B267]">Atalhos</p>
            <div className="mt-4 grid gap-2">
              <QuickLink href="/backoffice/requests" icon={<BellRing size={17} />} title="Pedidos comerciais" note={`${pendingRequests} aguardam decisão`} />
              <QuickLink href="/backoffice/chat" icon={<MessageCircle size={17} />} title="Chat interno" note={`${unreadMessages} mensagens por ler`} />
              <QuickLink href="/backoffice/commissions" icon={<TrendingUp size={17} />} title="Comissões" note={`${euroAmount(pendingCommission)} por liquidar`} />
            </div>
          </div>

          {staff.role === "ADMIN" && (
            <div className="rounded-[30px] border border-[#DCC9AA] bg-white p-5">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Equipa</p><h2 className="mt-2 text-2xl font-semibold">Desempenho comercial</h2></div><Link href="/backoffice/team" className="text-xs font-bold text-[#8A6130]">Gerir</Link></div>
              <div className="mt-4 space-y-3">
                {representatives.map((rep) => {
                  const repPending = representativeCommissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PENDING").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
                  const repPaid = representativeCommissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PAID").reduce((sum, item) => sum + Number(item._sum.commissionAmount || 0), 0);
                  return <div key={rep.id} className="rounded-2xl bg-[#F7F0E5] p-3"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{rep.name}</p><p className="mt-1 text-[11px] text-[#6B6258]">{rep._count.clients} clientes · {rep._count.requests} pedidos</p></div><div className="text-right"><p className="text-sm font-bold">{euroAmount(repPending)}</p><p className="text-[10px] text-[#8A6A42]">pendente · {euroAmount(repPaid)} pago</p></div></div></div>;
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
  return <Link href={href} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 hover:bg-white/10"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#D7B267] text-[#17130F]">{icon}</span><span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className="block truncate text-[11px] text-white/45">{note}</span></span></Link>;
}
