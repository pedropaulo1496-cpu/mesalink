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
      <DoneNotice done={done} />
      <PageHeading eyebrow="Aprovações" title="Pedidos comerciais" description={staff.role === "ADMIN" ? "Controla descontos, extensões de trial, créditos e emails pedidos pela equipa para clientes concretos." : "Pede benefícios para os teus clientes. A administração aprova e o sistema executa e regista tudo."} />
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Pendentes" value={pending.toString()} note="aguardam decisão" tone={pending ? "red" : "green"} /><StatCard label="Aprovados" value={approved.toString()} note="executados" tone="green" /><StatCard label="Recusados" value={rejected.toString()} note="com justificação" /><StatCard label="Descontos" value={discounts.toString()} note="pedidos totais" tone="gold" /></section>

      <section className="mt-6 rounded-[30px] border border-[#D7B267] bg-[#FFF6E5] p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Revenue AI</p><h2 className="mt-2 text-2xl font-semibold">Ativações de WhatsApp e chamadas</h2><p className="mt-2 text-sm text-[#6B6258]">Pedidos enviados diretamente pelos restaurantes. O email continua a chegar a info@mesalink.pt, mas o estado operacional é controlado aqui.</p></div><span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#795D38]">{activationRequests.filter((item) => item.status !== "COMPLETED").length} por concluir</span></div>
        <div className={`mt-5 rounded-[22px] border p-4 ${twilioReady ? "border-[#B8D7B9] bg-[#EFF9EF]" : "border-[#E7B7A8] bg-[#FFF0EA]"}`}><p className={`text-sm font-black ${twilioReady ? "text-[#35603A]" : "text-[#98452F]"}`}>{twilioReady ? "Conector central Twilio pronto" : "Falta configurar a conta central Twilio"}</p><p className="mt-1 text-xs leading-5 text-[#6B6258]">{twilioReady ? "Já podes atribuir números e concluir pedidos abaixo." : "Cria/atualiza a conta Twilio MesaLink e adiciona TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN nas variáveis de ambiente do Vercel."}</p>{!twilioReady && <div className="mt-3 flex flex-wrap gap-2"><a href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer" className="rounded-full bg-[#17120D] px-4 py-2 text-xs font-bold text-white">Criar conta Twilio</a><a href="https://www.twilio.com/docs/whatsapp/self-sign-up" target="_blank" rel="noreferrer" className="rounded-full border border-[#D8C6A9] bg-white px-4 py-2 text-xs font-bold">Ativar WhatsApp</a></div>}</div>
        <div className="mt-5 space-y-3">{activationRequests.map((request) => { const details = activationDetails(request.failureReason); return <article key={request.id} className="rounded-[24px] border border-[#E2D3BC] bg-white p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{request.restaurant.name}</h3><ActivationStatus status={request.status} /></div><p className="mt-1 text-xs text-[#6B6258]">{request.restaurant.user?.email || "Conta sem email"} · {dateTime(request.sentAt)}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#F3E6D2] px-3 py-1 text-xs font-bold text-[#76552E]">{channelLabel(request.channel)}</span><span className="rounded-full bg-[#EEF5ED] px-3 py-1 text-xs font-bold text-[#3F6A4D]">Telefone público: {details.contactPhone || "não indicado"}</span></div>{details.adminNote && <p className="mt-3 text-xs text-[#6B6258]"><strong>Nota:</strong> {details.adminNote}</p>}</div>{staff.role === "ADMIN" && <form action={updateRevenueActivationRequest} className="w-full shrink-0 rounded-2xl bg-[#FFF9F0] p-3 lg:w-[440px]"><input type="hidden" name="requestId" value={request.id} /><div className="grid gap-2 sm:grid-cols-2"><input name="whatsappNumber" defaultValue={details.whatsappNumber || request.restaurant.revenueWhatsappNumber || ""} placeholder="WhatsApp atribuído +351…" className={inputClass} /><input name="contentSid" defaultValue={details.contentSid || request.restaurant.revenueWhatsappContentSid || ""} placeholder="Content SID HX…" className={inputClass} /><input name="voiceNumber" defaultValue={details.voiceNumber || request.restaurant.revenueVoiceNumber || ""} placeholder="N.º deteção +351…" className={inputClass} /><input name="forwardNumber" defaultValue={details.forwardNumber || request.restaurant.revenueVoiceForwardNumber || details.contactPhone} placeholder="Telefone público +351…" className={inputClass} /></div><textarea name="adminNote" defaultValue={details.adminNote} rows={2} placeholder="Instruções de reencaminhamento, fornecedor, próxima ação…" className={`${inputClass} mt-2 min-h-20 py-2`} /><div className="mt-2 grid grid-cols-3 gap-2"><button name="status" value="REQUESTED" className="h-10 rounded-xl border border-[#DCC9AA] text-[10px] font-bold">Recebido</button><button name="status" value="PREPARING" className="h-10 rounded-xl bg-[#8A6130] text-[10px] font-bold text-white">Guardar preparação</button><button name="status" value="COMPLETED" disabled={!twilioReady} className="h-10 rounded-xl bg-[#315C36] text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Ativar canais</button></div></form>}</div></article>; })}{!activationRequests.length && <p className="rounded-2xl border border-dashed border-[#DCC9AA] bg-white p-6 text-center text-sm text-[#6B6258]">Ainda não existem pedidos de ativação.</p>}</div>
      </section>

      {staff.role === "SALES" && (
        <form action={createCommercialRequest} className="mt-6 rounded-[30px] border border-[#D7B267] bg-[#FFF6E5] p-5 sm:p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Novo pedido</p><h2 className="mt-2 text-2xl font-semibold">Propor benefício ao cliente</h2><p className="mt-2 text-sm text-[#6B6258]">Para descontos, o valor é a percentagem. Para os restantes tipos, são dias, créditos ou emails.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><select name="userId" defaultValue={client || ""} required className={inputClass}><option value="">Escolher cliente</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.restaurants[0]?.name || item.name || item.email}</option>)}</select><select name="type" defaultValue="DISCOUNT" className={inputClass}><option value="DISCOUNT">Desconto no plano (%)</option><option value="TRIAL">Dias adicionais de trial</option><option value="AI_CREDITS">Créditos IA</option><option value="EMAILS">Emails</option></select><input name="amount" type="number" min="1" defaultValue="10" placeholder="Valor" className={inputClass} required /><select name="duration" defaultValue="ONCE" className={inputClass}><option value="ONCE">Desconto: 1 cobrança</option><option value="REPEATING">Desconto: vários meses</option><option value="FOREVER">Desconto: sempre</option></select><input name="durationMonths" type="number" min="1" max="24" defaultValue="3" placeholder="Meses" className={inputClass} /></div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row"><textarea name="reason" rows={3} placeholder="Porque é que este benefício ajuda a fechar ou reter o cliente?" className={`${inputClass} min-h-24 flex-1 py-3`} required /><button className={`${buttonClass} sm:self-end`}>Enviar para aprovação</button></div>
        </form>
      )}

      <section className="mt-6 space-y-4">
        {requests.map((request) => {
          const clientName = request.targetUser.restaurants[0]?.name || request.targetUser.name || request.targetUser.email;
          return <article key={request.id} className={`rounded-[28px] border p-5 ${request.status === "PENDING" ? "border-[#D7B267] bg-white" : "border-[#DCC9AA] bg-white/75"}`}><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{requestLabel(request.type, Number(request.amount || 0), request.durationMonths)}</h2><RequestStatus status={request.status} /></div><p className="mt-1 text-sm text-[#6B6258]">{clientName} · {request.salesRepresentative.name} · {dateTime(request.createdAt)}</p><p className="mt-3 max-w-3xl text-sm leading-6">{request.reason}</p>{request.adminNote && <p className="mt-2 rounded-xl bg-[#F7F0E5] px-3 py-2 text-xs text-[#6B6258]"><strong>Administração:</strong> {request.adminNote}</p>}{request.promotion && <p className="mt-2 text-xs font-bold text-[#35603A]">Código enviado: {request.promotion.code} · {request.promotion.status}</p>}</div>{staff.role === "ADMIN" && request.status === "PENDING" && <form action={decideCommercialRequest} className="w-full shrink-0 rounded-2xl border border-[#E2D3BC] bg-[#FFF9F0] p-3 lg:w-80"><input type="hidden" name="requestId" value={request.id} /><textarea name="adminNote" rows={2} placeholder="Nota opcional" className={`${inputClass} min-h-20 py-2`} /><div className="mt-2 grid grid-cols-2 gap-2"><button name="decision" value="REJECT" className="h-10 rounded-xl border border-[#E7B7A8] text-xs font-bold text-[#9C412B]">Recusar</button><button name="decision" value="APPROVE" className="h-10 rounded-xl bg-[#315C36] text-xs font-bold text-white">Aprovar e executar</button></div></form>}</div></article>;
        })}
        {!requests.length && <div className="rounded-[28px] border border-[#DCC9AA] bg-white p-8 text-center text-sm text-[#6B6258]">Ainda não existem pedidos.</div>}
      </section>
    </>
  );
}

function RequestStatus({ status }: { status: string }) { const styles = status === "APPROVED" ? "bg-[#E3F1E2] text-[#35603A]" : status === "PENDING" ? "bg-[#FFF0CA] text-[#80601E]" : status === "REJECTED" ? "bg-[#FFE2D8] text-[#9C412B]" : "bg-[#EEE8DF] text-[#655B50]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${styles}`}>{status}</span>; }
function requestLabel(type: string, amount: number, months: number | null) { if (type === "DISCOUNT") return `${amount}% de desconto${months ? ` durante ${months} meses` : ""}`; if (type === "TRIAL") return `Adicionar ${amount} dias de trial`; if (type === "AI_CREDITS") return `Oferecer ${amount} créditos IA`; if (type === "EMAILS") return `Oferecer ${amount} emails`; return type; }
function ActivationStatus({ status }: { status: string }) { const label = status === "COMPLETED" ? "Ativado" : status === "PREPARING" ? "Em preparação" : "Recebido"; const tone = status === "COMPLETED" ? "bg-[#E3F1E2] text-[#35603A]" : status === "PREPARING" ? "bg-[#F4E4C7] text-[#79561F]" : "bg-[#FFF0CA] text-[#80601E]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${tone}`}>{label}</span>; }
function activationDetails(raw: string | null) { try { const value = raw ? JSON.parse(raw) : {}; return { contactPhone: typeof value.contactPhone === "string" ? value.contactPhone : "", adminNote: typeof value.adminNote === "string" ? value.adminNote : "", whatsappNumber: typeof value.whatsappNumber === "string" ? value.whatsappNumber : "", voiceNumber: typeof value.voiceNumber === "string" ? value.voiceNumber : "", forwardNumber: typeof value.forwardNumber === "string" ? value.forwardNumber : "", contentSid: typeof value.contentSid === "string" ? value.contentSid : "" }; } catch { return { contactPhone: "", adminNote: "", whatsappNumber: "", voiceNumber: "", forwardNumber: "", contentSid: "" }; } }
function channelLabel(channel: string) { if (channel === "WHATSAPP+VOICE") return "WhatsApp + chamadas"; if (channel === "VOICE") return "Chamadas"; return "WhatsApp"; }
