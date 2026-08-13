import { notFound } from "next/navigation";
import Link from "next/link";
import { DoneNotice, PageHeading, StatCard, buttonClass, dateTime, euroAmount, inputClass } from "@/components/backoffice/BackofficeUI";
import { updateCostSettings } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { createSalesRepresentative, resendSalesInvitation, updateSalesRepresentative } from "../actions";

export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") notFound();
  const { done } = await searchParams;
  const [representatives, settings] = await Promise.all([
    prisma.salesRepresentative.findMany({
      include: {
        user: { select: { lastLoginAt: true, lastActiveAt: true } },
        clients: { select: { id: true, createdAt: true, lastActiveAt: true, lastLoginAt: true } },
        commissions: { select: { grossAmount: true, commissionAmount: true, status: true, earnedAt: true } },
        requests: { select: { status: true, createdAt: true } },
        messages: { where: { readAt: null, senderUserId: { not: staff.userId } }, select: { id: true } },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.adminSettings.findUnique({ where: { id: "global" } }),
  ]);
  const active = representatives.filter((item) => item.active).length;
  const clients = representatives.reduce((sum, item) => sum + item.clients.length, 0);
  const pending = representatives.flatMap((item) => item.commissions).filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const paid = representatives.flatMap((item) => item.commissions).filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);

  return (
    <>
      <DoneNotice done={done} />
      <PageHeading eyebrow="Equipa e resultados" title="Comerciais" description="Resultados individuais, carteiras, vendas, comissões e atividade. Cada comercial vê apenas os próprios clientes." />
      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comerciais ativos" value={String(active)} note={`${representatives.length} perfis criados`} tone="green" />
        <StatCard label="Clientes atribuídos" value={String(clients)} note="carteira comercial" tone="blue" />
        <StatCard label="Comissões pendentes" value={euroAmount(pending)} note="a liquidar" tone="red" />
        <StatCard label="Comissões pagas" value={euroAmount(paid)} note="histórico acumulado" tone="gold" />
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-[#C9A66B] bg-[#FFF9F0] p-3.5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Demonstração</p><h2 className="mt-1 text-base font-semibold">Exemplo dos resultados por comercial</h2></div><span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-[#8A6130]">Dados fictícios</span></div>
        <div className="mt-3 grid gap-2.5 md:grid-cols-3">{demoCommercials.map((demo) => <DemoCommercial key={demo.name} {...demo} />)}</div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-2.5">
          {representatives.map((rep) => {
            const repPending = rep.commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
            const repPaid = rep.commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
            const pendingRequests = rep.requests.filter((item) => item.status === "PENDING").length;
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const monthCommissions = rep.commissions.filter((item) => item.earnedAt >= monthStart);
            const monthSales = monthCommissions.reduce((sum, item) => sum + Number(item.grossAmount), 0);
            const monthCommission = monthCommissions.reduce((sum, item) => sum + Number(item.commissionAmount), 0);
            const newClients = rep.clients.filter((item) => item.createdAt >= monthStart).length;
            return (
              <details key={rep.id} className="group rounded-2xl border border-[#DCC9AA] bg-white p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><div className="flex items-center gap-2"><h2 className="text-base font-semibold">{rep.name}</h2><span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase ${rep.active ? "bg-[#E3F1E2] text-[#35603A]" : "bg-[#EEE9E2] text-[#6B6258]"}`}>{rep.active ? "Ativo" : "Inativo"}</span></div><p className="mt-0.5 text-[11px] text-[#6B6258]">{rep.email}{rep.phone ? ` · ${rep.phone}` : ""}</p></div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-right sm:grid-cols-4"><Metric label="Clientes" value={String(rep.clients.length)} /><Metric label="Novos" value={String(newClients)} /><Metric label="Vendas mês" value={euroAmount(monthSales)} /><Metric label="Comissão mês" value={euroAmount(monthCommission)} /></div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#EFE4D4] pt-2.5 text-[10px] text-[#776B5E]"><p>Último acesso: {dateTime(rep.user.lastActiveAt || rep.user.lastLoginAt)} · {euroAmount(repPending)} por faturar · {euroAmount(repPaid)} pago · {pendingRequests} pedidos</p><div className="flex items-center gap-2"><Link href={`/backoffice/chat?rep=${rep.id}`} className="rounded-full bg-[#17130F] px-3 py-1.5 font-bold text-white">Abrir chat{rep.messages.length > 0 ? ` · ${rep.messages.length} nova${rep.messages.length === 1 ? "" : "s"}` : ""}</Link><span className="font-bold text-[#9B6F3B]">Editar ↓</span></div></div>
                </summary>
                <form action={updateSalesRepresentative} className="mt-4 grid gap-3 border-t border-[#EFE4D4] pt-4 sm:grid-cols-2 xl:grid-cols-5">
                  <input type="hidden" name="salesRepresentativeId" value={rep.id} />
                  <label className="text-[10px] font-bold text-[#776B5E]">Nome<input name="name" defaultValue={rep.name} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-[10px] font-bold text-[#776B5E]">Telefone<input name="phone" defaultValue={rep.phone || ""} className={`${inputClass} mt-1`} /></label>
                  <label className="text-[10px] font-bold text-[#776B5E]">Comissão planos %<input name="planPercent" type="number" min="0" max="100" step="0.01" defaultValue={Number(rep.defaultPlanCommissionPercent)} className={`${inputClass} mt-1`} required /></label>
                  <label className="text-[10px] font-bold text-[#776B5E]">Comissão extras %<input name="extraPercent" type="number" min="0" max="100" step="0.01" defaultValue={Number(rep.defaultExtraCommissionPercent)} className={`${inputClass} mt-1`} required /></label>
                  <div className="flex items-end gap-2"><label className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-[#DCC9AA] px-3 text-xs font-bold"><input name="active" type="checkbox" defaultChecked={rep.active} /> Ativo</label><button className={buttonClass}>Guardar</button></div>
                </form>
                <form action={resendSalesInvitation} className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#FFF9F0] p-3">
                  <input type="hidden" name="salesRepresentativeId" value={rep.id} /><p className="text-xs text-[#6B6258]">Reenvia um link válido por 7 dias para definir uma nova password.</p><button className="shrink-0 rounded-xl border border-[#C9A66B] px-3 py-2 text-xs font-bold">Reenviar convite</button>
                </form>
              </details>
            );
          })}
          {!representatives.length && <div className="rounded-2xl border border-dashed border-[#C9A66B] bg-white/50 p-7 text-center text-[13px] text-[#6B6258]">Ainda não há comerciais. Cria o primeiro perfil ao lado.</div>}
        </div>

        <div className="space-y-3">
          <details className="rounded-2xl border border-[#D7B267] bg-[#FFF6E5]">
            <summary className="cursor-pointer list-none px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Novo acesso</p><div className="mt-1 flex items-center justify-between"><h2 className="text-base font-semibold">Convidar comercial</h2><span className="text-[10px] font-bold text-[#8A6130]">Abrir ↓</span></div></summary>
            <form action={createSalesRepresentative} className="space-y-2.5 border-t border-[#E5D3B8] p-4"><p className="text-[11px] leading-4 text-[#6B6258]">Envia um convite privado por email.</p><input name="name" placeholder="Nome completo" className={inputClass} required /><input name="email" type="email" placeholder="email@empresa.pt" className={inputClass} required /><input name="phone" placeholder="Telefone (opcional)" className={inputClass} /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-[#776B5E]">Planos %<input name="planPercent" type="number" min="0" max="100" step="0.01" defaultValue="10" className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Extras %<input name="extraPercent" type="number" min="0" max="100" step="0.01" defaultValue="5" className={`${inputClass} mt-1`} required /></label></div><button className={`${buttonClass} w-full`}>Criar e convidar</button></form>
          </details>

          <details className="rounded-2xl border border-[#DCC9AA] bg-white">
            <summary className="cursor-pointer list-none px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Configuração</p><div className="mt-1 flex items-center justify-between"><h2 className="text-base font-semibold">Custos internos</h2><span className="text-[10px] font-bold text-[#8A6130]">Abrir ↓</span></div></summary>
            <form action={updateCostSettings} className="space-y-2.5 border-t border-[#E8DDCD] p-4"><p className="text-[11px] leading-4 text-[#6B6258]">Valores privados usados para calcular a margem real.</p><label className="text-[10px] font-bold text-[#776B5E]">Custo por email (€)<input name="emailCost" type="number" min="0" step="0.000001" defaultValue={(settings?.emailCostMicros ?? 400) / 1_000_000} className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Custo por crédito IA (€)<input name="aiCreditCost" type="number" min="0" step="0.000001" defaultValue={(settings?.aiCreditCostMicros ?? 10000) / 1_000_000} className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Custo por WhatsApp (€)<input name="whatsappCost" type="number" min="0" step="0.000001" defaultValue={(settings?.whatsappCostMicros ?? 5000) / 1_000_000} className={`${inputClass} mt-1`} required /></label><button className={`${buttonClass} w-full`}>Guardar custos</button></form>
          </details>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

const demoCommercials = [
  { name: "Ana Martins", clients: 14, newClients: 3, sales: "1 485 €", commission: "148,50 €", conversion: "31%" },
  { name: "Miguel Costa", clients: 9, newClients: 2, sales: "920 €", commission: "92 €", conversion: "24%" },
  { name: "Sofia Almeida", clients: 18, newClients: 5, sales: "2 160 €", commission: "216 €", conversion: "38%" },
];

function DemoCommercial({ name, clients, newClients, sales, commission, conversion }: { name: string; clients: number; newClients: number; sales: string; commission: string; conversion: string }) {
  return <div className="rounded-xl border border-[#E2D3BC] bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-[12px] font-bold">{name}</p><span className="rounded-full bg-[#EDF5EA] px-2 py-1 text-[8px] font-black text-[#3F6A4D]">{conversion} conversão</span></div><div className="mt-3 grid grid-cols-2 gap-2"><Metric label="Clientes" value={String(clients)} /><Metric label="Novos" value={String(newClients)} /><Metric label="Vendas mês" value={sales} /><Metric label="Comissão" value={commission} /></div></div>;
}
