import { DoneNotice, PageHeading, StatCard, buttonClass, dateTime, inputClass } from "@/components/backoffice/BackofficeUI";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { createCommercialRequest, decideCommercialRequest, updateRevenueActivationRequest } from "../actions";
import { getTwilioCredentials } from "@/lib/revenue-twilio";

export const dynamic = "force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ done?: string; client?: string }> }) {
  const staff = await requireStaff();
  const twilioReady = getTwilioCredentials().configured;
  const { done, client } = await searchParams;
  const where = staff.role === "SALES" ? { salesRepresentativeId: staff.salesRepresentativeId! } : {};
  const [requests, clients, activationRequests] = await Promise.all([
    prisma.commercialRequest.findMany({
      where,
      include: {
        salesRepresentative: { select: { name: true } },
        targetUser: { select: { name: true, email: true, restaurants: { select: { name: true }, take: 1 } } },
        promotion: { select: { code: true, status: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 150,
    }),
    staff.role === "SALES" ? prisma.user.findMany({
      where: { salesRepresentativeId: staff.salesRepresentativeId! },
      select: { id: true, name: true, email: true, restaurants: { select: { name: true }, take: 1 } },
      orderBy: { name: "asc" },
    }) : Promise.resolve([]),
    prisma.marketingAction.findMany({
      where: {
        type: "CHANNEL_ACTIVATION_REQUEST",
        ...(staff.role === "SALES" ? { restaurant: { user: { salesRepresentativeId: staff.salesRepresentativeId! } } } : {}),
      },
      include: { restaurant: { select: { name: true, revenueWhatsappNumber: true, revenueWhatsappContentSid: true, revenueVoiceNumber: true, revenueVoiceForwardNumber: true, user: { select: { email: true } } } } },
      orderBy: { sentAt: "desc" },
      take: 100,
    }),
  ]);
  const pending = requests.filter((item) => item.status === "PENDING").length;
  const approved = requests.filter((item) => item.status === "APPROVED").length;
  const rejected = requests.filter((item) => item.status === "REJECTED").length;
  const discounts = requests.filter((item) => item.type === "DISCOUNT").length;

  return (
    <>
      <DoneNotice done={done === "request-error" ? undefined : done} />
      {done === "request-error" && <div className="mb-4 rounded-xl border border-[#E5C36F] bg-[#FFF7DF] px-3.5 py-2.5 text-xs font-semibold text-[#715023]">A aprovação não foi concluída. O pedido continua pendente e a explicação aparece na respetiva nota.</div>}
      <PageHeading eyebrow="Aprovações" title="Pedidos comerciais" description={staff.role === "ADMIN" ? "Controla descontos, extensões de trial, créditos e emails pedidos pela equipa para clientes concretos." : "Pede benefícios para os teus clientes. A administração aprova e o sistema executa e regista tudo."} />
      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Pendentes" value={pending.toString()} note="aguardam decisão" tone={pending ? "red" : "green"} /><StatCard label="Aprovados" value={approved.toString()} note="executados" tone="green" /><StatCard label="Recusados" value={rejected.toString()} note="com justificação" /><StatCard label="Descontos" value={discounts.toString()} note="pedidos totais" tone="gold" /></section>

      <details className="mt-4 rounded-2xl border border-[#D7B267] bg-[#FFF6E5]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Revenue AI</p><h2 className="mt-1 text-base font-semibold">Ativações de WhatsApp e chamadas</h2></div><span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#795D38]">{activationRequests.filter((item) => item.status !== "COMPLETED").length} por concluir · abrir ↓</span></summary>
        <div className="border-t border-[#E5D3B8] p-4">
          <div className={`rounded-xl border p-3 ${twilioReady ? "border-[#B8D7B9] bg-[#EFF9EF]" : "border-[#E7B7A8] bg-[#FFF0EA]"}`}><p className={`text-[12px] font-black ${twilioReady ? "text-[#35603A]" : "text-[#98452F]"}`}>{twilioReady ? "Conector Twilio pronto" : "Falta configurar a conta Twilio"}</p><p className="mt-1 text-[11px] leading-4 text-[#6B6258]">{twilioReady ? "Já podes atribuir números e concluir pedidos." : "Adiciona as credenciais Twilio nas variáveis de ambiente do Vercel."}</p>{!twilioReady && <div className="mt-2 flex flex-wrap gap-2"><a href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer" className="rounded-lg bg-[#17120D] px-3 py-2 text-[11px] font-bold text-white">Criar conta Twilio</a><a href="https://www.twilio.com/docs/whatsapp/self-sign-up" target="_blank" rel="noreferrer" className="rounded-lg border border-[#D8C6A9] bg-white px-3 py-2 text-[11px] font-bold">Ativar WhatsApp</a></div>}</div>
          <div className="mt-3 space-y-2.5">{activationRequests.map((request) => { const details = activationDetails(request.failureReason); return <article key={request.id} className="rounded-xl border border-[#E2D3BC] bg-white p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-[13px] font-bold">{request.restaurant.name}</h3><ActivationStatus status={request.status} /></div><p className="mt-1 text-[10px] text-[#6B6258]">{request.restaurant.user?.email || "Conta sem email"} · {dateTime(request.sentAt)}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#F3E6D2] px-2.5 py-1 text-[10px] font-bold text-[#76552E]">{channelLabel(request.channel)}</span><span className="rounded-full bg-[#EEF5ED] px-2.5 py-1 text-[10px] font-bold text-[#3F6A4D]">{details.contactPhone || "telefone não indicado"}</span></div>{details.adminNote && <p className="mt-2 text-[11px] text-[#6B6258]"><strong>Nota:</strong> {details.adminNote}</p>}</div>{staff.role === "ADMIN" && <form action={updateRevenueActivationRequest} className="w-full shrink-0 rounded-xl bg-[#FFF9F0] p-2.5 lg:w-[400px]"><input type="hidden" name="requestId" value={request.id} /><div className="grid gap-2 sm:grid-cols-2"><input name="whatsappNumber" defaultValue={details.whatsappNumber || request.restaurant.revenueWhatsappNumber || ""} placeholder="WhatsApp atribuído +351…" className={inputClass} /><input name="contentSid" defaultValue={details.contentSid || request.restaurant.revenueWhatsappContentSid || ""} placeholder="Content SID HX…" className={inputClass} /><input name="voiceNumber" defaultValue={details.voiceNumber || request.restaurant.revenueVoiceNumber || ""} placeholder="N.º deteção +351…" className={inputClass} /><input name="forwardNumber" defaultValue={details.forwardNumber || request.restaurant.revenueVoiceForwardNumber || details.contactPhone} placeholder="Telefone público +351…" className={inputClass} /></div><textarea name="adminNote" defaultValue={details.adminNote} rows={2} placeholder="Nota de preparação…" className={`${inputClass} mt-2 min-h-16 py-2`} /><div className="mt-2 grid grid-cols-3 gap-2"><button name="status" value="REQUESTED" className="h-9 rounded-lg border border-[#DCC9AA] text-[9px] font-bold">Recebido</button><button name="status" value="PREPARING" className="h-9 rounded-lg bg-[#8A6130] text-[9px] font-bold text-white">Guardar</button><button name="status" value="COMPLETED" disabled={!twilioReady} className="h-9 rounded-lg bg-[#315C36] text-[9px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Ativar</button></div></form>}</div></article>; })}{!activationRequests.length && <p className="rounded-xl border border-dashed border-[#DCC9AA] bg-white p-5 text-center text-[12px] text-[#6B6258]">Ainda não existem pedidos de ativação.</p>}</div>
        </div>
      </details>

      {staff.role === "SALES" && (
        <details className="mt-4 rounded-2xl border border-[#D7B267] bg-[#FFF6E5]">
          <summary className="cursor-pointer list-none px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Novo pedido</p><div className="mt-1 flex items-center justify-between"><h2 className="text-base font-semibold">Propor benefício</h2><span className="text-[10px] font-bold text-[#8A6130]">Abrir formulário ↓</span></div></summary>
          <form action={createCommercialRequest} className="border-t border-[#E5D3B8] p-4"><div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-5"><select name="userId" defaultValue={client || ""} required className={inputClass}><option value="">Escolher cliente</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.restaurants[0]?.name || item.name || item.email}</option>)}</select><select name="type" defaultValue="DISCOUNT" className={inputClass}><option value="DISCOUNT">Desconto no plano (%)</option><option value="TRIAL">Dias adicionais de trial</option><option value="AI_CREDITS">Créditos IA</option><option value="EMAILS">Emails</option></select><input name="amount" type="number" min="1" defaultValue="10" placeholder="Valor" className={inputClass} required /><select name="duration" defaultValue="ONCE" className={inputClass}><option value="ONCE">Desconto: 1 cobrança</option><option value="REPEATING">Desconto: vários meses</option><option value="FOREVER">Desconto: sempre</option></select><input name="durationMonths" type="number" min="1" max="24" defaultValue="3" placeholder="Meses" className={inputClass} /></div><div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row"><textarea name="reason" rows={2} placeholder="Porque ajuda a fechar ou reter o cliente?" className={`${inputClass} min-h-16 flex-1 py-2`} required /><button className={`${buttonClass} sm:self-end`}>Enviar para aprovação</button></div></form>
        </details>
      )}

      <section className="mt-4 space-y-2.5">
        {requests.map((request) => {
          const clientName = request.targetUser.restaurants[0]?.name || request.targetUser.name || request.targetUser.email;
          return <article key={request.id} className={`rounded-2xl border p-4 ${request.status === "PENDING" ? "border-[#D7B267] bg-white" : "border-[#DCC9AA] bg-white/75"}`}><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-[14px] font-bold">{requestLabel(request.type, Number(request.amount || 0), request.durationMonths)}</h2><RequestStatus status={request.status} /></div><p className="mt-1 text-[11px] text-[#6B6258]">{clientName} · {request.salesRepresentative.name} · {dateTime(request.createdAt)}</p><p className="mt-2 max-w-3xl text-[12px] leading-5">{request.reason}</p>{request.adminNote && <p className="mt-2 whitespace-pre-line rounded-xl bg-[#F7F0E5] px-3 py-2 text-[11px] text-[#6B6258]"><strong>Administração:</strong> {request.adminNote}</p>}{request.promotion && <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#B8D3B7] bg-[#EEF8EC] px-3 py-2 text-[11px] font-bold text-[#35603A]"><span>Código Stripe: <span className="font-black tracking-[0.08em]">{request.promotion.code}</span></span><span className="rounded-full bg-white px-2 py-1 text-[8px] uppercase tracking-wider">{request.promotion.status === "SENT" ? "enviado pelo HQ" : "para o comercial enviar"}</span></div>}</div>{staff.role === "ADMIN" && request.status === "PENDING" && <form action={decideCommercialRequest} className="w-full shrink-0 rounded-xl border border-[#E2D3BC] bg-[#FFF9F0] p-2.5 lg:w-72"><input type="hidden" name="requestId" value={request.id} /><textarea name="adminNote" rows={2} placeholder="Nota opcional para o comercial" className={`${inputClass} min-h-16 py-2`} /><div className="mt-2 grid grid-cols-2 gap-2"><button name="decision" value="REJECT" className="h-9 rounded-lg border border-[#E7B7A8] text-[11px] font-bold text-[#9C412B]">Recusar</button><button name="decision" value="APPROVE" className="h-9 rounded-lg bg-[#315C36] text-[11px] font-bold text-white">Aprovar e criar código</button></div></form>}</div></article>;
        })}
        {!requests.length && <div className="rounded-2xl border border-[#DCC9AA] bg-white p-6 text-center text-[13px] text-[#6B6258]">Ainda não existem pedidos.</div>}
      </section>
    </>
  );
}

function RequestStatus({ status }: { status: string }) { const styles = status === "APPROVED" ? "bg-[#E3F1E2] text-[#35603A]" : status === "PENDING" ? "bg-[#FFF0CA] text-[#80601E]" : status === "REJECTED" ? "bg-[#FFE2D8] text-[#9C412B]" : "bg-[#EEE8DF] text-[#655B50]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${styles}`}>{status}</span>; }
function requestLabel(type: string, amount: number, months: number | null) { if (type === "DISCOUNT") return `${amount}% de desconto${months ? ` durante ${months} meses` : ""}`; if (type === "TRIAL") return `Adicionar ${amount} dias de trial`; if (type === "AI_CREDITS") return `Oferecer ${amount} créditos IA`; if (type === "EMAILS") return `Oferecer ${amount} emails`; return type; }
function ActivationStatus({ status }: { status: string }) { const label = status === "COMPLETED" ? "Ativado" : status === "PREPARING" ? "Em preparação" : "Recebido"; const tone = status === "COMPLETED" ? "bg-[#E3F1E2] text-[#35603A]" : status === "PREPARING" ? "bg-[#F4E4C7] text-[#79561F]" : "bg-[#FFF0CA] text-[#80601E]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${tone}`}>{label}</span>; }
function activationDetails(raw: string | null) { try { const value = raw ? JSON.parse(raw) : {}; return { contactPhone: typeof value.contactPhone === "string" ? value.contactPhone : "", adminNote: typeof value.adminNote === "string" ? value.adminNote : "", whatsappNumber: typeof value.whatsappNumber === "string" ? value.whatsappNumber : "", voiceNumber: typeof value.voiceNumber === "string" ? value.voiceNumber : "", forwardNumber: typeof value.forwardNumber === "string" ? value.forwardNumber : "", contentSid: typeof value.contentSid === "string" ? value.contentSid : "" }; } catch { return { contactPhone: "", adminNote: "", whatsappNumber: "", voiceNumber: "", forwardNumber: "", contentSid: "" }; } }
function channelLabel(channel: string) { if (channel === "WHATSAPP+VOICE") return "WhatsApp + chamadas"; if (channel === "VOICE") return "Chamadas"; return "WhatsApp"; }
