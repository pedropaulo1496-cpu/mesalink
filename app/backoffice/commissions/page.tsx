import { DoneNotice, PageHeading, StatCard, buttonClass, dateTime, euroAmount, inputClass } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { addManualCommission, markCommissionPaid, markRepresentativeCommissionsPaid } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const staff = await requireStaff();
  const { done } = await searchParams;
  const where = staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {};
  const [commissions, representatives, clients] = await Promise.all([
    prisma.salesCommission.findMany({
      where,
      include: {
        salesRepresentative: { select: { id: true, name: true } },
        user: { select: { name: true, email: true, restaurants: { select: { name: true }, take: 1 } } },
      },
      orderBy: { earnedAt: "desc" },
      take: 150,
    }),
    staff.role === "ADMIN" ? prisma.salesRepresentative.findMany({ where: { active: true }, include: { _count: { select: { clients: true } } }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    staff.role === "ADMIN" ? prisma.user.findMany({ where: { salesRepresentativeId: { not: null } }, select: { id: true, name: true, email: true, salesPlanCommissionPercent: true, restaurants: { select: { name: true }, take: 1 } }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  const pending = commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const paid = commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const thisMonth = commissions.filter((item) => item.earnedAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const gross = commissions.reduce((sum, item) => sum + Number(item.grossAmount), 0);

  return (
    <>
      <DoneNotice done={done} />
      <PageHeading eyebrow="Financeiro comercial" title="Comissões" description={staff.role === "ADMIN" ? "Comissões geradas automaticamente por planos, créditos IA e domínios, mais lançamentos individuais." : "O que já recebeste, o que está por pagar e a origem de cada comissão."} />
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Por pagar" value={euroAmount(pending)} note="comissões pendentes" tone="red" />
        <StatCard label="Pago" value={euroAmount(paid)} note="histórico liquidado" tone="green" />
        <StatCard label="Este mês" value={euroAmount(thisMonth)} note="comissões geradas" tone="gold" />
        <StatCard label="Vendas associadas" value={euroAmount(gross)} note={`${commissions.length} movimentos`} />
      </section>

      {staff.role === "ADMIN" && (
        <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="rounded-[28px] border border-[#DCC9AA] bg-white p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Liquidação</p><h2 className="mt-2 text-2xl font-semibold">Pagar por comercial</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {representatives.map((rep) => {
                const repPending = commissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
                const repPaid = commissions.filter((item) => item.salesRepresentativeId === rep.id && item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
                return <div key={rep.id} className="rounded-2xl border border-[#E2D3BC] bg-[#FFF9F0] p-4"><div className="flex justify-between gap-3"><div><p className="font-bold">{rep.name}</p><p className="mt-1 text-xs text-[#6B6258]">{rep._count.clients} clientes · {euroAmount(repPaid)} pago</p></div><p className="font-bold text-[#8A6130]">{euroAmount(repPending)}</p></div>{repPending > 0 && <form action={markRepresentativeCommissionsPaid} className="mt-3"><input type="hidden" name="salesRepresentativeId" value={rep.id} /><button className={`${buttonClass} w-full`}>Marcar tudo como pago</button></form>}</div>;
              })}
            </div>
          </div>

          <form action={addManualCommission} className="rounded-[28px] border border-[#D7B267] bg-[#FFF6E5] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Coisa individual</p><h2 className="mt-2 text-2xl font-semibold">Lançar comissão manual</h2>
            <div className="mt-4 space-y-3"><select name="userId" required className={inputClass}><option value="">Escolher cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.restaurants[0]?.name || client.name || client.email}</option>)}</select><input name="description" placeholder="Ex.: implementação personalizada" className={inputClass} required /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-[#776B5E]">Valor vendido €<input name="grossAmount" type="number" min="0.01" step="0.01" className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Comissão %<input name="percent" type="number" min="0" max="100" step="0.01" defaultValue="10" className={`${inputClass} mt-1`} required /></label></div><button className={`${buttonClass} w-full`}>Registar comissão</button></div>
          </form>
        </section>
      )}

      <section className="mt-6 rounded-[28px] border border-[#DCC9AA] bg-white p-4 sm:p-5">
        <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Livro de comissões</p><h2 className="mt-2 text-2xl font-semibold">Movimentos</h2></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm"><thead><tr className="border-b border-[#E2D3BC] text-[10px] uppercase tracking-wider text-[#8A6A42]"><th className="p-3">Data</th><th className="p-3">Comercial</th><th className="p-3">Cliente</th><th className="p-3">Origem</th><th className="p-3 text-right">Venda</th><th className="p-3 text-right">%</th><th className="p-3 text-right">Comissão</th><th className="p-3">Estado</th></tr></thead><tbody>{commissions.map((item) => <tr key={item.id} className="border-b border-[#EFE4D4] last:border-0"><td className="p-3 text-xs text-[#6B6258]">{dateTime(item.earnedAt)}</td><td className="p-3 font-semibold">{item.salesRepresentative.name}</td><td className="p-3"><p className="font-semibold">{item.user.restaurants[0]?.name || item.user.name || item.user.email}</p><p className="text-[11px] text-[#6B6258]">{item.description}</p></td><td className="p-3 text-xs font-bold">{sourceLabel(item.sourceType)}</td><td className="p-3 text-right">{euroAmount(Number(item.grossAmount))}</td><td className="p-3 text-right">{Number(item.commissionPercent)}%</td><td className="p-3 text-right font-bold">{euroAmount(Number(item.commissionAmount))}</td><td className="p-3">{item.status === "PAID" ? <span className="rounded-full bg-[#E3F1E2] px-2.5 py-1 text-[9px] font-black uppercase text-[#35603A]">Pago</span> : staff.role === "ADMIN" ? <form action={markCommissionPaid}><input type="hidden" name="commissionId" value={item.id} /><button className="rounded-full bg-[#FFF0CA] px-2.5 py-1 text-[9px] font-black uppercase text-[#80601E]">Marcar pago</button></form> : <span className="rounded-full bg-[#FFF0CA] px-2.5 py-1 text-[9px] font-black uppercase text-[#80601E]">Pendente</span>}</td></tr>)}</tbody></table>
          {!commissions.length && <p className="py-8 text-center text-sm text-[#6B6258]">Ainda não existem comissões.</p>}
        </div>
      </section>
    </>
  );
}

function sourceLabel(source: string) { return ({ PLAN: "Plano", AI_CREDITS: "Créditos IA", CUSTOM_DOMAIN: "Domínio", MANUAL: "Individual" } as Record<string, string>)[source] || source; }
