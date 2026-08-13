import { CircleDollarSign, Clock3, FileCheck2, FileWarning, Landmark, Send } from "lucide-react";
import { DoneNotice, PageHeading, StatCard, euroAmount } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { confirmPartnerPayout, processDuePartnerPayments, processPartnerPayment, reviewPartnerInvoice } from "./actions";

export const dynamic = "force-dynamic";

export default async function PartnerPayoutsPage({ searchParams }: { searchParams: Promise<{ done?: string; count?: string }> }) {
  const staff = await requireStaff();
  const { done, count } = await searchParams;
  const payments = await prisma.referralPayment.findMany({
    where: { status: { in: ["CAPTURED_AWAITING_PAYOUT", "TRANSFER_FAILED", "TRANSFERRED", "PAID"] } },
    include: {
      partner: { select: { businessName: true, contactName: true, email: true, stripeOnboardingComplete: true } },
      group: { include: { acceptedRestaurant: { select: { name: true, billingLegalName: true, billingTaxId: true } } } },
    },
    orderBy: [{ payoutDueAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const awaiting = payments.filter((payment) => ["CAPTURED_AWAITING_PAYOUT", "TRANSFER_FAILED"].includes(payment.status));
  const ready = awaiting.filter((payment) => payment.partnerInvoiceStatus === "VERIFIED" && payment.partnerInvoiceUrl);
  const blocked = awaiting.filter((payment) => payment.partnerInvoiceStatus !== "VERIFIED" || !payment.partnerInvoiceUrl);
  const transferred = payments.filter((payment) => payment.status === "TRANSFERRED");
  const paid = payments.filter((payment) => payment.status === "PAID");
  const sum = (items: typeof payments) => items.reduce((total, item) => total + Number(item.partnerInvoiceTotal || item.partnerNet), 0);

  return <>
    <DoneNotice done={done === "batch" ? `${count || 0} pagamentos semanais enviados.` : done} />
    <PageHeading eyebrow="Partner Network" title="Faturas e pagamentos semanais" description="Nenhuma comissão sai do MesaLink sem a fatura do parceiro estar anexada e verificada. O PDF fica ligado ao grupo para o restaurante e para o histórico." action={staff.role === "ADMIN" ? <form action={processDuePartnerPayments}><button className="inline-flex h-11 items-center gap-2 rounded-full bg-[#17130F] px-5 text-sm font-bold text-white"><Send size={15} /> Processar verificados</button></form> : undefined} />
    <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Prontos a pagar" value={euroAmount(sum(ready))} note={`${ready.length} com fatura verificada`} tone="green" />
      <StatCard label="Bloqueados" value={euroAmount(sum(blocked))} note={`${blocked.length} sem verificação`} tone="red" />
      <StatCard label="No Stripe" value={euroAmount(sum(transferred))} note={`${transferred.length} por confirmar`} tone="gold" />
      <StatCard label="Recebido" value={euroAmount(sum(paid))} note={`${paid.length} confirmados`} tone="blue" />
    </section>
    <section className="mt-6 space-y-3">
      {payments.map((payment) => <article key={payment.id} className="rounded-[26px] border border-[#DCC9AA] bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_0.75fr_0.9fr_auto] lg:items-center">
          <div><p className="font-bold">{payment.partner.businessName}</p><p className="mt-1 text-xs text-[#74685B]">{payment.partner.contactName || payment.partner.email}</p></div>
          <div><p className="font-semibold">{payment.group.publicCode}</p><p className="mt-1 text-xs text-[#74685B]">{payment.group.acceptedRestaurant?.name || "Restaurante"}</p></div>
          <div><p className="font-black text-[#6C4B25]">{euroAmount(Number(payment.partnerInvoiceTotal || payment.partnerNet))}</p><p className="mt-1 text-[10px] text-[#8A7863]">Fatura: {euroAmount(Number(payment.partnerInvoiceBase || payment.partnerNet))} + {euroAmount(Number(payment.partnerInvoiceTax))} imposto · MesaLink {euroAmount(Number(payment.platformFee))}</p></div>
          <PaymentState status={payment.status} dueAt={payment.payoutDueAt} />
          <div>{staff.role === "ADMIN" && ["CAPTURED_AWAITING_PAYOUT", "TRANSFER_FAILED"].includes(payment.status) && (payment.partnerInvoiceStatus === "VERIFIED" ? <form action={processPartnerPayment}><input type="hidden" name="paymentId" value={payment.id} /><button className="h-10 rounded-full bg-[#17130F] px-4 text-xs font-bold text-white">Transferir</button></form> : <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#A14E36]">Pagamento bloqueado</span>)}{staff.role === "ADMIN" && payment.status === "TRANSFERRED" && <form action={confirmPartnerPayout}><input type="hidden" name="paymentId" value={payment.id} /><button className="h-10 rounded-full border border-[#9BC49B] bg-[#EFF8EF] px-4 text-xs font-bold text-[#3F6A4D]">Confirmar recebido</button></form>}</div>
        </div>
        <div className="mt-4 rounded-2xl border border-[#E6D8C3] bg-[#FFF9F0] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#76572F]">{payment.partnerInvoiceStatus === "VERIFIED" ? <FileCheck2 size={15} /> : <FileWarning size={15} />} Fatura do parceiro · {invoiceStatusLabel(payment.partnerInvoiceStatus)}</p>
              {payment.partnerInvoiceUrl ? <a href={payment.partnerInvoiceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#6C4B25] underline">{payment.partnerInvoiceNumber || "Abrir PDF"}</a> : <p className="mt-2 text-xs text-[#8A7863]">O hotel ainda não anexou a fatura.</p>}
              {payment.partnerInvoiceRejectionReason && <p className="mt-2 text-xs font-semibold text-[#A14E36]">Motivo: {payment.partnerInvoiceRejectionReason}</p>}
              <p className="mt-2 text-[11px] text-[#75695C]">Destinatário: {payment.group.acceptedRestaurant?.billingLegalName || payment.group.acceptedRestaurant?.name || "—"} · NIF {payment.group.acceptedRestaurant?.billingTaxId || "por sincronizar"}</p>
            </div>
            {staff.role === "ADMIN" && payment.partnerInvoiceUrl && payment.partnerInvoiceStatus !== "VERIFIED" && !["TRANSFERRED", "PAID"].includes(payment.status) && <div className="flex flex-col gap-2 sm:min-w-72"><form action={reviewPartnerInvoice}><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="decision" value="VERIFY" /><button className="h-10 w-full rounded-full bg-[#3F6A4D] px-4 text-xs font-bold text-white">Verifiquei · aprovar fatura</button></form><form action={reviewPartnerInvoice} className="flex gap-2"><input type="hidden" name="paymentId" value={payment.id} /><input type="hidden" name="decision" value="REJECT" /><input name="reason" placeholder="Motivo da rejeição" className="h-10 min-w-0 flex-1 rounded-full border border-[#D8C6A9] bg-white px-3 text-xs" /><button className="h-10 rounded-full border border-[#E0B7A8] bg-[#FFF0EA] px-3 text-xs font-bold text-[#934A35]">Rejeitar</button></form></div>}
          </div>
        </div>
      </article>)}
      {!payments.length && <div className="rounded-[26px] border border-dashed border-[#DCC9AA] bg-white p-10 text-center text-sm text-[#6B6258]">Ainda não existem comissões capturadas para pagar.</div>}
    </section>
  </>;
}

function PaymentState({ status, dueAt }: { status: string; dueAt: Date | null }) {
  if (status === "PAID") return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3F6A4D]"><Landmark size={14} /> Recebido</span>;
  if (status === "TRANSFERRED") return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A5B31]"><CircleDollarSign size={14} /> Enviado ao Stripe</span>;
  if (status === "TRANSFER_FAILED") return <span className="text-xs font-bold text-[#A14E36]">Falhou · repetir</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#725A3E]"><Clock3 size={14} /> {dueAt ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeZone: "Europe/Lisbon" }).format(dueAt) : "Próximo ciclo"}</span>;
}

function invoiceStatusLabel(status: string) {
  if (status === "VERIFIED") return "verificada";
  if (status === "PENDING") return "por verificar";
  if (status === "REJECTED") return "rejeitada";
  return "em falta";
}
