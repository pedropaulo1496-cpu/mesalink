import { CalendarClock, CheckCircle2, Clock3, MapPin, ShieldCheck, UsersRound, XCircle } from "lucide-react";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { findExternalReferralOffer, isExternalReferralSimulation } from "@/lib/external-referral-requests";
import { formatDateTimeInTimeZone, reservationTimeZone } from "@/lib/reservation-time-zone";

export default async function ExternalReservationRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { token } = await params;
  const { result } = await searchParams;
  const offer = await findExternalReferralOffer(token);
  if (!offer || offer.group.targetMode !== "EXTERNAL") return <StatePage title="Ligação inválida" text="Este pedido não existe ou a ligação já não é válida." tone="error" />;
  const simulation = isExternalReferralSimulation(offer);
  const timeZone = reservationTimeZone(offer.restaurant);

  if (simulation && result === "simulated-accepted") return <StatePage title="Simulação: reserva confirmada" text="O teste foi concluído com sucesso. Nenhuma reserva real foi criada e não houve qualquer cobrança." tone="success" />;
  if (simulation && result === "simulated-declined") return <StatePage title="Simulação: pedido recusado" text="A resposta de teste ficou concluída. Nenhum pedido real foi alterado." tone="neutral" />;
  if (simulation && result === "simulated-alternative") return <StatePage title="Simulação: novo horário sugerido" text="A proposta de teste foi recebida. Nenhum cliente real foi contactado." tone="neutral" />;

  const expired = !offer.publicAccessExpiresAt || offer.publicAccessExpiresAt <= new Date() || offer.group.desiredDate <= new Date();
  const booked = offer.status === "ACCEPTED" || offer.group.status === "BOOKED";
  const declined = offer.status === "DECLINED" || offer.group.status === "CANCELLED";
  const alternative = offer.status === "ALTERNATIVE_PROPOSED" || offer.group.status === "ALTERNATIVE_PROPOSED";
  if (booked || result === "accepted") return <StatePage title="Reserva confirmada" text="A reserva ficou registada. O cliente recebeu a confirmação por email com a localização e os contactos do restaurante." tone="success" />;
  if (declined) return <StatePage title="Pedido recusado" text="A resposta ficou registada e a pessoa que efetuou o pedido foi avisada." tone="neutral" />;
  if (alternative) return <StatePage title="Novo horário proposto" text={`A proposta para ${offer.group.alternativeDate ? formatDateTime(offer.group.alternativeDate, timeZone) : "outro horário"} foi enviada. Receberá uma nova mensagem se for aceite.`} tone="neutral" />;
  if (expired) return <StatePage title="Pedido expirado" text="Já não é possível responder através desta ligação. Se ainda tiver disponibilidade, contacte info@mesalink.pt." tone="error" />;

  const type = isCommissionType(offer.commissionType) ? offer.commissionType : "PER_PERSON";
  const amounts = calculateReferralCommission({ guests: offer.group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount), platformFeePercent: Number(offer.platformFeePercent) });
  const serviceFee = calculateReferralServiceFee(amounts.gross);
  const resultMessage = resultMessageFor(result);
  const adults = offer.group.adults ?? Math.max(1, offer.group.guests - offer.group.children);

  return <main className="min-h-screen bg-[#F2ECE3] px-4 py-8 text-[#17120D] sm:py-14">
    <div className="mx-auto max-w-2xl overflow-hidden rounded-[30px] border border-[#DCC9AA] bg-white shadow-[0_25px_70px_rgba(65,43,22,0.12)]">
      <header className="bg-[#17120D] px-6 py-6 text-white sm:px-9"><p className="font-serif text-2xl font-bold"><span className="text-[#D7B267]">Mesa</span>Link</p><p className="mt-4 text-[10px] font-black uppercase tracking-[.22em] text-[#D7B267]">{simulation ? "Simulação · " : ""}Reserva pendente de confirmação</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Novo pedido para {offer.restaurant.name}</h1></header>
      <div className="p-5 sm:p-9">
        {simulation && <div className="mb-5 rounded-[18px] border border-[#A9CDAA] bg-[#EFF9EF] px-4 py-3 text-xs font-semibold leading-5 text-[#315B36]"><strong>Simulação segura.</strong> Podes experimentar qualquer resposta: não existe um cliente real, não é criada uma reserva e não há qualquer cobrança.</div>}
        {resultMessage && <div className="mb-5 rounded-[18px] border border-[#E5C897] bg-[#FFF7E5] px-4 py-3 text-xs font-semibold leading-5 text-[#76552E]">{resultMessage}</div>}
        <section className="grid gap-3 rounded-[22px] border border-[#E4D5BD] bg-[#FFF9EF] p-5 sm:grid-cols-2">
          <Info icon={<CalendarClock size={16}/>} label="Data e hora" value={formatDateTime(offer.group.desiredDate, timeZone)} />
          <Info icon={<UsersRound size={16}/>} label="Pessoas" value={`${offer.group.guests} · ${adults} adultos${offer.group.children ? ` · ${offer.group.children} crianças` : ""}`} />
          <Info icon={<ShieldCheck size={16}/>} label="Nome da reserva" value={offer.group.customerName || "Cliente MesaLink"} />
          <Info icon={<MapPin size={16}/>} label="Referência" value={offer.group.publicCode} />
        </section>
        {offer.group.notes && <div className="mt-4 rounded-[18px] border border-[#E9DED0] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#8A7863]">Observações</p><p className="mt-1 text-xs leading-5 text-[#655A4E]">{offer.group.notes}</p></div>}

        <section className="mt-5 rounded-[20px] border border-[#CFE0CC] bg-[#F3FAF2] p-4 text-[#405C42]"><p className="text-xs font-black">{simulation ? "Teste sem pagamento" : "Confirmação segura"}</p><p className="mt-1 text-[11px] leading-5">{simulation ? "Nesta simulação, confirmar não pede cartão nem cria qualquer cobrança. O fluxo real apresentará aqui a garantia e os custos aplicáveis." : <>Para confirmar, será pedida uma autorização segura no cartão de {money(amounts.gross)} de garantia base, acrescida de {money(serviceFee)} de proteção/processamento e impostos aplicáveis. A cobrança só é concluída após a visita; em caso de no-show, a autorização é libertada.</>}</p></section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <form action={`/api/public/partner-reservations/${token}/accept`} method="POST"><button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#315B36] px-5 text-xs font-black text-white"><CheckCircle2 size={16}/> Confirmar reserva</button></form>
          <form action={`/api/public/partner-reservations/${token}/decline`} method="POST"><button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#E2BFAF] bg-[#FFF5F0] px-5 text-xs font-black text-[#934A35]"><XCircle size={16}/> Recusar</button></form>
        </div>

        <details className="group mt-4 rounded-[20px] border border-[#DED0BC] bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-black text-[#6E5232]"><span className="inline-flex items-center gap-2"><Clock3 size={15}/> Sugerir outro horário</span><span className="transition group-open:rotate-180">⌄</span></summary><form action={`/api/public/partner-reservations/${token}/propose`} method="POST" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="text-[10px] font-bold text-[#655A4E]">Nova data e hora<input name="alternativeDate" type="datetime-local" required className="input-premium mt-1.5" /></label><button className="h-11 self-end rounded-full bg-[#17120D] px-5 text-[10px] font-black text-white">Enviar proposta</button></form></details>
        <p className="mt-6 text-center text-[10px] leading-5 text-[#918577]">Os contactos completos do cliente são disponibilizados após a confirmação. Esta ligação é pessoal e não deve ser partilhada.</p>
      </div>
    </div>
  </main>;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex items-start gap-3"><span className="mt-0.5 text-[#9B6F3B]">{icon}</span><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-[#8A7863]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div></div>; }

function StatePage({ title, text, tone }: { title: string; text: string; tone: "success" | "error" | "neutral" }) { const icon = tone === "success" ? <CheckCircle2 size={30}/> : tone === "error" ? <XCircle size={30}/> : <Clock3 size={30}/>; return <main className="grid min-h-screen place-items-center bg-[#F2ECE3] p-5 text-[#17120D]"><div className="w-full max-w-lg rounded-[28px] border border-[#DCC9AA] bg-white p-8 text-center shadow-[0_24px_65px_rgba(65,43,22,.12)]"><div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${tone === "success" ? "bg-[#E9F5E8] text-[#315B36]" : tone === "error" ? "bg-[#FFF0EA] text-[#934A35]" : "bg-[#FFF5E2] text-[#8A6130]"}`}>{icon}</div><p className="mt-6 font-serif text-2xl font-bold"><span className="text-[#B9853E]">Mesa</span>Link</p><h1 className="mt-4 text-3xl font-semibold tracking-[-.05em]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#6B6258]">{text}</p></div></main>; }

function resultMessageFor(result?: string) { if (result === "cancelled") return "A confirmação não foi concluída. O pedido continua pendente e pode tentar novamente."; if (result === "fiscal-required") return "Faltaram dados legais ou fiscais na confirmação. Tente novamente e preencha todos os campos apresentados."; if (result === "authorization-too-short") return "O cartão não permitiu manter a garantia até à data da reserva. Tente outro cartão."; if (result === "invalid-alternative") return "Escolha um horário com pelo menos duas horas de antecedência e dentro dos próximos seis dias."; if (result === "unavailable") return "Este pedido já não está disponível para confirmação."; if (result === "processing") return "A confirmação está a ser processada. Atualize esta página dentro de alguns instantes."; if (result === "payment-error") return "Não foi possível abrir a confirmação segura. Tente novamente."; return null; }
function formatDateTime(value: Date, timeZone: string) { return formatDateTimeInTimeZone(value, timeZone, "long"); }
function money(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value); }
