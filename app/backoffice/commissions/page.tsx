import SalesCommissionInvoiceUpload from "@/components/backoffice/SalesCommissionInvoiceUpload";
import { DoneNotice, PageHeading, StatCard, buttonClass, dateTime, euroAmount, inputClass } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { expireOverdueSalesCommissions } from "@/lib/sales-commission-expiry";
import { commissionInvoiceDeadlineLabel, commissionPeriod, commissionPeriodLabel, isClosedCommissionPeriod, isCommissionInvoiceExpired } from "@/lib/sales-commission-statements";
import { requireStaff } from "@/lib/staff-auth";
import { addManualCommission } from "../actions";
import { paySalesCommissionStatement, reviewSalesCommissionInvoice } from "./actions";

export const dynamic = "force-dynamic";

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<{ done?: string; connect?: string }> }) {
  const staff = await requireStaff();
  const { done, connect } = await searchParams;
  await expireOverdueSalesCommissions(staff.role === "SALES" ? staff.salesRepresentativeId! : undefined);
  const where = staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {};
  const [commissions, statements, clients, representative] = await Promise.all([
    prisma.salesCommission.findMany({
      where,
      include: {
        salesRepresentative: { select: { id: true, name: true } },
        user: { select: { name: true, email: true, restaurants: { select: { name: true }, take: 1 } } },
      },
      orderBy: { earnedAt: "desc" },
      take: 500,
    }),
    prisma.salesCommissionStatement.findMany({
      where,
      include: { salesRepresentative: { select: { name: true, stripeAccountId: true, stripeOnboardingComplete: true } } },
      orderBy: [{ period: "desc" }, { createdAt: "desc" }],
    }),
    staff.role === "ADMIN" ? prisma.user.findMany({ where: { salesRepresentativeId: { not: null } }, select: { id: true, name: true, email: true, salesPlanCommissionPercent: true, restaurants: { select: { name: true }, take: 1 } }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    staff.role === "SALES" ? prisma.salesRepresentative.findUnique({ where: { id: staff.salesRepresentativeId! }, select: { stripeAccountId: true, stripeOnboardingComplete: true } }) : Promise.resolve(null),
  ]);
  const pending = commissions.filter((item) => item.status === "PENDING").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const paid = commissions.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const thisMonth = commissions.filter((item) => item.earnedAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, item) => sum + Number(item.commissionAmount), 0);
  const gross = commissions.reduce((sum, item) => sum + Number(item.grossAmount), 0);
  const currentPeriod = commissionPeriod(new Date());
  const monthlyBalances = [...commissions.reduce((groups, item) => {
    const period = commissionPeriod(item.earnedAt);
    const key = `${item.salesRepresentativeId}:${period}`;
    const current = groups.get(key) || { key, period, salesRepresentativeId: item.salesRepresentativeId, name: item.salesRepresentative.name, gross: 0, commission: 0, paid: 0, pending: 0, forfeited: 0 };
    current.gross += Number(item.grossAmount);
    current.commission += Number(item.commissionAmount);
    if (item.status === "PAID") current.paid += Number(item.commissionAmount);
    else if (item.status === "FORFEITED") current.forfeited += Number(item.commissionAmount);
    else current.pending += Number(item.commissionAmount);
    groups.set(key, current);
    return groups;
  }, new Map<string, { key: string; period: string; salesRepresentativeId: string; name: string; gross: number; commission: number; paid: number; pending: number; forfeited: number }>()).values()]
    .sort((a, b) => b.period.localeCompare(a.period) || a.name.localeCompare(b.name))
    .slice(0, 18);

  return (
    <>
      <DoneNotice done={done} />
      {connect && <div className={`mb-4 rounded-xl border px-3.5 py-2.5 text-xs font-semibold ${connect === "complete" ? "border-[#B8D3B7] bg-[#EEF8EC] text-[#315C36]" : "border-[#E4C995] bg-[#FFF7E5] text-[#76552E]"}`}>{connect === "complete" ? "IBAN validado. A conta está pronta para receber comissões." : connect === "pending" ? "A validação do IBAN ainda está pendente no Stripe." : "Não foi possível concluir a configuração do IBAN. Tenta novamente."}</div>}
      <PageHeading eyebrow="Financeiro comercial" title="Comissões" description={staff.role === "ADMIN" ? "Saldos mensais, faturas da equipa e pagamentos. Sem fatura verificada e IBAN validado, nenhum valor é liquidado." : "O saldo fecha no fim do mês. Tens o mês seguinte para anexar a fatura e receber no IBAN validado."} />
      {staff.role === "SALES" && (
        <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DCC9AA] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Receber comissões</p><h2 className="mt-1 text-base font-semibold">{representative?.stripeOnboardingComplete ? "IBAN pronto para pagamentos" : "Associar o meu IBAN"}</h2><p className="mt-1 text-[11px] text-[#6B6258]">A validação é feita em segurança pelo Stripe. A MesaLink não guarda os dados bancários.</p></div>
          <form action="/api/backoffice/sales/connect" method="post"><button className={`${representative?.stripeOnboardingComplete ? "border border-[#B8D3B7] bg-[#EEF8EC] text-[#315C36]" : "bg-[#17130F] text-white"} inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-[12px] font-bold`}>{representative?.stripeOnboardingComplete ? "Atualizar dados bancários" : representative?.stripeAccountId ? "Continuar validação" : "Configurar IBAN"}</button></form>
        </section>
      )}
      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo elegível" value={euroAmount(pending)} note="aguarda fecho e/ou fatura" tone="red" />
        <StatCard label="Pago" value={euroAmount(paid)} note="histórico liquidado" tone="green" />
        <StatCard label="Este mês" value={euroAmount(thisMonth)} note="comissões geradas" tone="gold" />
        <StatCard label="Vendas associadas" value={euroAmount(gross)} note={`${commissions.length} movimentos`} />
      </section>

      <section className="mt-4 rounded-2xl border border-[#DCC9AA] bg-white p-4">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Fecho mensal</p><h2 className="mt-1 text-lg font-semibold">Saldos e faturas</h2></div><p className="max-w-md text-right text-[10px] text-[#75695C]">Cada mês tem uma fatura própria. O prazo termina no fim do mês seguinte; sem fatura válida, o montante deixa de ser elegível.</p></div>
        <div className="mt-3 grid gap-2.5 xl:grid-cols-2">
          {monthlyBalances.map((balance) => {
            const statement = statements.find((item) => item.salesRepresentativeId === balance.salesRepresentativeId && item.period === balance.period);
            const closed = isClosedCommissionPeriod(balance.period);
            const expired = isCommissionInvoiceExpired(balance.period);
            const status = balance.period === currentPeriod ? "ACCUMULATING" : balance.forfeited > 0 || statement?.status === "EXPIRED" ? "EXPIRED" : statement?.status || (balance.pending > 0 ? "MISSING" : "PAID");
            return <article key={balance.key} className="rounded-xl border border-[#E4D6C1] bg-[#FFFDF9] p-3">
              <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="text-[13px] font-bold">{balance.name}</p><StatementStatus status={status} /></div><p className="mt-0.5 text-[10px] capitalize text-[#75695C]">{commissionPeriodLabel(balance.period)} · vendas {euroAmount(balance.gross)}</p></div><div className="text-right"><p className="text-[15px] font-black">{euroAmount(balance.commission)}</p><p className="text-[9px] text-[#8A7863]">comissão do mês</p></div></div>
              {status === "ACCUMULATING" && <p className="mt-2 rounded-lg bg-[#F5EFE6] px-3 py-2 text-[10px] text-[#6B6258]">Em acumulação. A fatura fica disponível quando o mês terminar.</p>}
              {closed && status !== "EXPIRED" && status !== "PAID" && <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8A6130]">Fatura até {commissionInvoiceDeadlineLabel(balance.period)}</p>}
              {status === "EXPIRED" && <p className="mt-2 rounded-lg bg-[#FFF0EA] px-3 py-2 text-[10px] font-semibold text-[#934A35]">Prazo expirado sem fatura válida. Este montante não será pago.</p>}
              {staff.role === "SALES" && closed && !expired && ["MISSING", "REJECTED"].includes(status) && <>{statement?.invoiceRejectionReason && <p className="mt-2 rounded-lg bg-[#FFF0EA] px-3 py-2 text-[10px] font-semibold text-[#934A35]">Corrigir: {statement.invoiceRejectionReason}</p>}<SalesCommissionInvoiceUpload period={balance.period} amount={euroAmount(balance.pending)} /></>}
              {statement?.invoiceUrl && <div className="mt-2 flex flex-wrap items-center gap-2"><a href={statement.invoiceUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-[#76552E] underline">Fatura {statement.invoiceNumber || "PDF"}</a>{statement.status === "PENDING" && staff.role === "ADMIN" && <><form action={reviewSalesCommissionInvoice}><input type="hidden" name="statementId" value={statement.id} /><input type="hidden" name="decision" value="VERIFY" /><button className="h-8 rounded-lg bg-[#3F6A4D] px-3 text-[10px] font-bold text-white">Aprovar</button></form><form action={reviewSalesCommissionInvoice} className="flex gap-1"><input type="hidden" name="statementId" value={statement.id} /><input type="hidden" name="decision" value="REJECT" /><input name="reason" placeholder="Motivo" className="h-8 w-28 rounded-lg border border-[#D8C6A9] px-2 text-[10px]" /><button className="h-8 rounded-lg border border-[#E0B7A8] px-2 text-[10px] font-bold text-[#934A35]">Rejeitar</button></form></>}{statement.status === "VERIFIED" && staff.role === "ADMIN" && (statement.salesRepresentative.stripeOnboardingComplete && statement.salesRepresentative.stripeAccountId ? <form action={paySalesCommissionStatement}><input type="hidden" name="statementId" value={statement.id} /><button className="h-8 rounded-lg bg-[#17130F] px-3 text-[10px] font-bold text-white">Pagar para o IBAN</button></form> : <span className="rounded-lg bg-[#FFF0EA] px-2.5 py-2 text-[9px] font-bold text-[#934A35]">Falta validar o IBAN</span>)}</div>}
              {staff.role === "ADMIN" && closed && status === "MISSING" && <p className="mt-2 text-[10px] font-semibold text-[#A14E36]">Pagamento bloqueado: falta a fatura do comercial.</p>}
            </article>;
          })}
          {!monthlyBalances.length && <p className="col-span-full py-5 text-center text-[12px] text-[#6B6258]">Ainda não existem saldos comerciais.</p>}
        </div>
      </section>

      {staff.role === "ADMIN" && (
        <section className="mt-4 max-w-sm">
          <details className="rounded-2xl border border-[#D7B267] bg-[#FFF6E5]">
            <summary className="cursor-pointer list-none px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Lançamento individual</p><div className="mt-1 flex items-center justify-between"><h2 className="text-base font-semibold">Comissão manual</h2><span className="text-[10px] font-bold text-[#8A6130]">Abrir ↓</span></div></summary>
            <form action={addManualCommission} className="space-y-2.5 border-t border-[#E5D3B8] p-4"><select name="userId" required className={inputClass}><option value="">Escolher cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.restaurants[0]?.name || client.name || client.email}</option>)}</select><input name="description" placeholder="Ex.: implementação personalizada" className={inputClass} required /><div className="grid grid-cols-2 gap-2"><label className="text-[10px] font-bold text-[#776B5E]">Valor vendido €<input name="grossAmount" type="number" min="0.01" step="0.01" className={`${inputClass} mt-1`} required /></label><label className="text-[10px] font-bold text-[#776B5E]">Comissão %<input name="percent" type="number" min="0" max="100" step="0.01" defaultValue="10" className={`${inputClass} mt-1`} required /></label></div><button className={`${buttonClass} w-full`}>Registar comissão</button></form>
          </details>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-[#DCC9AA] bg-white p-3.5 sm:p-4">
        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Livro de comissões</p><h2 className="mt-1 text-lg font-semibold">Movimentos</h2></div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm"><thead><tr className="border-b border-[#E2D3BC] text-[10px] uppercase tracking-wider text-[#8A6A42]"><th className="p-3">Data</th><th className="p-3">Comercial</th><th className="p-3">Cliente</th><th className="p-3">Origem</th><th className="p-3 text-right">Venda</th><th className="p-3 text-right">%</th><th className="p-3 text-right">Comissão</th><th className="p-3">Estado</th></tr></thead><tbody>{commissions.map((item) => <tr key={item.id} className="border-b border-[#EFE4D4] last:border-0"><td className="p-3 text-xs text-[#6B6258]">{dateTime(item.earnedAt)}</td><td className="p-3 font-semibold">{item.salesRepresentative.name}</td><td className="p-3"><p className="font-semibold">{item.user.restaurants[0]?.name || item.user.name || item.user.email}</p><p className="text-[11px] text-[#6B6258]">{item.description}</p></td><td className="p-3 text-xs font-bold">{sourceLabel(item.sourceType)}</td><td className="p-3 text-right">{euroAmount(Number(item.grossAmount))}</td><td className="p-3 text-right">{Number(item.commissionPercent)}%</td><td className="p-3 text-right font-bold">{euroAmount(Number(item.commissionAmount))}</td><td className="p-3">{item.status === "PAID" ? <span className="rounded-full bg-[#E3F1E2] px-2.5 py-1 text-[9px] font-black uppercase text-[#35603A]">Pago</span> : item.status === "FORFEITED" ? <span className="rounded-full bg-[#FFE2D8] px-2.5 py-1 text-[9px] font-black uppercase text-[#934A35]">Expirado</span> : <span className="rounded-full bg-[#FFF0CA] px-2.5 py-1 text-[9px] font-black uppercase text-[#80601E]">Acumulado</span>}</td></tr>)}</tbody></table>
          {!commissions.length && <p className="py-8 text-center text-sm text-[#6B6258]">Ainda não existem comissões.</p>}
        </div>
      </section>
    </>
  );
}

function sourceLabel(source: string) { return ({ PLAN: "Plano", AI_CREDITS: "Créditos IA", CUSTOM_DOMAIN: "Domínio", PARTNER_NETWORK: "Rede de Parceiros", MANUAL: "Individual" } as Record<string, string>)[source] || source; }
function StatementStatus({ status }: { status: string }) { const labels = { ACCUMULATING: "A acumular", MISSING: "Fatura em falta", PENDING: "Em verificação", VERIFIED: "Pronto a pagar", REJECTED: "Corrigir fatura", EXPIRED: "Prazo expirado", PAID: "Pago" } as Record<string, string>; const tone = status === "PAID" || status === "VERIFIED" ? "bg-[#E3F1E2] text-[#35603A]" : status === "MISSING" || status === "REJECTED" || status === "EXPIRED" ? "bg-[#FFE2D8] text-[#934A35]" : "bg-[#FFF0CA] text-[#80601E]"; return <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${tone}`}>{labels[status] || status}</span>; }
