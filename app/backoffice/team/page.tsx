import { notFound } from "next/navigation";
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
        clients: { select: { id: true } },
        commissions: { select: { commissionAmount: true, status: true } },
        requests: { select: { status: true } },
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
      <PageHeading eyebrow="Gestão de acessos" title="Equipa comercial" description="Cria acessos privados, define comissões por omissão e acompanha atividade, carteira, pedidos e valores de cada comercial." />
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comerciais ativos" value={String(active)} note={`${representatives.length} perfis criados`} tone="green" />
        <StatCard label="Clientes atribuídos" value={String(clients)} note="carteira comercial" tone="blue" />
        <StatCard label="Comissões pendentes" value={euroAmount(pending)} note="a liquidar" tone="red" />
        <StatCard label="Comissões pagas" value={euroAmount(paid)} note="histórico acumulado" tone="gold" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {representatives.map((rep) => {
            const repPending = rep.commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
            const repPaid = rep.commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
            const pendingRequests = rep.requests.filter((item) => item.status === "PENDING").length;
            return (
              <details key={rep.id} className="group rounded-[28px] border border-[#DCC9AA] bg-white p-5" open={representatives.length === 1}>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold">{rep.name}</h2><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${rep.active ? "bg-[#E3F1E2] text-[#35603A]" : "bg-[#EEE9E2] text-[#6B6258]"}`}>{rep.active ? "Ativo" : "Inativo"}</span></div><p className="mt-1 text-xs text-[#6B6258]">{rep.email}{rep.phone ? ` · ${rep.phone}` : ""}</p></div>
                    <div className="grid grid-cols-3 gap-4 text-right"><Metric label="Clientes" value={String(rep.clients.length)} /><Metric label="Pendente" value={euroAmount(repPending)} /><Metric label="Pago" value={euroAmount(repPaid)} /></div>
                  </div>
                  <p className="mt-4 border-t border-[#EFE4D4] pt-3 text-[11px] text-[#776B5E]">Último acesso: {dateTime(rep.user.lastActiveAt || rep.user.lastLoginAt)} · {pendingRequests} pedidos pendentes · {rep.messages.length} mensagens por ler <span className="float-right font-bold text-[#9B6F3B]">Editar ↓</span></p>
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
          {!representatives.length && <div className="rounded-[28px] border border-dashed border-[#C9A66B] bg-white/50 p-10 text-center text-sm text-[#6B6258]">Ainda não há comerciais. Cria o primeiro perfil no formulário ao lado.</div>}
        </div>

        <div className="space-y-5">
          <form action={createSalesRepresentative} className="rounded-[28px] border border-[#D7B267] bg-[#FFF6E5] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Novo acesso</p><h2 className="mt-2 text-2xl font-semibold">Convidar comercial</h2><p className="mt-2 text-xs leading-5 text-[#6B6258]">A pessoa recebe um email MesaLink para definir a password. Não vê dados administrativos nem clientes de outros comerciais.</p>
            <div className="mt-4 space-y-3"><input name="name" placeholder="Nome completo" className={inputClass} required /><input name="email" type="email" placeholder="email@empresa.pt" className={inputClass} required /><input name="phone" placeholder="Telefone (opcional)" className={inputClass} /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-[#776B5E]">Planos %<input name="planPercent" type="number" min="0" max="100" step="0.01" defaultValue="10" className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Extras %<input name="extraPercent" type="number" min="0" max="100" step="0.01" defaultValue="5" className={`${inputClass} mt-1`} required /></label></div><button className={`${buttonClass} w-full`}>Criar acesso e enviar convite</button></div>
          </form>

          <form action={updateCostSettings} className="rounded-[28px] border border-[#DCC9AA] bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Margem real</p><h2 className="mt-2 text-2xl font-semibold">Custos internos</h2><p className="mt-2 text-xs leading-5 text-[#6B6258]">Valores privados usados para calcular custo e margem de cada cliente. Nunca aparecem ao restaurante.</p>
            <div className="mt-4 space-y-3"><label className="text-[10px] font-bold text-[#776B5E]">Custo por email (€)<input name="emailCost" type="number" min="0" step="0.000001" defaultValue={(settings?.emailCostMicros ?? 400) / 1_000_000} className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Custo por crédito IA (€)<input name="aiCreditCost" type="number" min="0" step="0.000001" defaultValue={(settings?.aiCreditCostMicros ?? 10000) / 1_000_000} className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Custo por WhatsApp (€)<input name="whatsappCost" type="number" min="0" step="0.000001" defaultValue={(settings?.whatsappCostMicros ?? 5000) / 1_000_000} className={`${inputClass} mt-1`} required /></label><button className={`${buttonClass} w-full`}>Atualizar custos</button></div>
          </form>
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
