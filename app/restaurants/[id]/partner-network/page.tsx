import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, Handshake, UsersRound } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { PartnerProfileSettingsForm, ReferralAgreementForm, ReferralBookingSettingsForm } from "@/components/partners/PartnerNetworkControls";
import { authOptions } from "@/lib/auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { referralAttendanceDeadline, referralInvoiceDeadline } from "@/lib/referral-deadlines";
import { isCommissionType } from "@/lib/referrals";
import { googleBusinessConfigured } from "@/lib/google-business";
import { prisma } from "@/lib/prisma";

export default async function PartnerNetworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; google?: string }>;
}) {
  const { id } = await params;
  const { result, google } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const restaurant = user
    ? await prisma.restaurant.findFirst({
        where: { id, userId: user.id },
        include: {
          acceptedReferralGroups: {
            orderBy: { updatedAt: "desc" },
            take: 20,
            include: { payment: true },
          },
          referralDailyCapacities: {
            where: { date: { gte: new Date() } },
            orderBy: { date: "asc" },
            take: 30,
          },
          referralAgreements: {
            where: { active: true },
            orderBy: { updatedAt: "desc" },
            include: { partner: { select: { businessName: true, email: true, partnerCode: true } } },
          },
          referralCommissionRequests: {
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            include: { partner: { select: { businessName: true, email: true, partnerCode: true } } },
          },
          tables: { select: { capacity: true } },
          websiteMenus: {
            orderBy: { sortOrder: "asc" },
            take: 6,
            select: { title: true, pdf: true },
          },
          orderingCategories: {
            where: { activeInPOS: true },
            orderBy: { position: "asc" },
            take: 6,
            select: {
              name: true,
              products: {
                where: { active: true, activeOnWebsite: true },
                orderBy: { sortOrder: "asc" },
                take: 5,
                select: { name: true, imageUrl: true },
              },
            },
          },
        },
      })
    : null;

  if (!restaurant) notFound();

  const partnerProfile = buildPartnerProfile(restaurant);
  const commissionType = isCommissionType(restaurant.referralDefaultCommissionType) ? restaurant.referralDefaultCommissionType : "PER_PERSON";
  const configuredCapacity = restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
    ? restaurant.totalCapacity
    : restaurant.tables.reduce((sum, table) => sum + table.capacity, 0);
  const defaultDailyCapacity = restaurant.referralDefaultDailyCapacity > 0 ? restaurant.referralDefaultDailyCapacity : configuredCapacity;
  const defaultCommissionAmount = !restaurant.referralAutoAcceptEnabled && Number(restaurant.referralDefaultCommissionAmount) === 5
    ? 1.5
    : Number(restaurant.referralDefaultCommissionAmount);
  const bookedGroups = restaurant.acceptedReferralGroups.filter((group) => group.status === "BOOKED").length;
  const overduePayments = await prisma.referralPayment.findMany({
    where: {
      status: { in: ["AUTHORIZATION_EXPIRED", "PAYMENT_FAILED"] },
      group: { acceptedRestaurantId: restaurant.id },
    },
    select: { grossCommission: true, serviceFee: true, taxAmount: true },
  });
  const overdueAmount = overduePayments.reduce((sum, payment) => sum + Number(payment.grossCommission) + Number(payment.serviceFee) + Number(payment.taxAmount), 0);
  const paymentBlocked = Boolean(restaurant.referralPaymentBlockedAt);
  const pageNow = new Date();

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="partnerNetwork" />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto max-w-[1380px]">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Rede de parceiros</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.055em] sm:text-[38px]">Reservas Partner</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-[#6B6258]">Define as condições uma vez. Hotéis, concierges e outros parceiros podem reservar diretamente no teu restaurante.</p></div>
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] ${paymentBlocked ? "border-[#E0B7A8] bg-[#FFF0EA] text-[#934A35]" : restaurant.referralAutoAcceptEnabled ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]"}`}><span className={`h-2 w-2 rounded-full ${paymentBlocked ? "bg-[#B85A43]" : restaurant.referralAutoAcceptEnabled ? "bg-[#5D8B61]" : "bg-[#C28A45]"}`} />{paymentBlocked ? "Offline · pagamento em atraso" : restaurant.referralAutoAcceptEnabled ? "Rede ativa" : "Configuração pendente"}</span>
          </header>

          {result && <div className={`mt-5 rounded-[22px] border px-5 py-4 text-sm font-semibold ${["accepted", "completed", "captured", "payment-success", "already-paid", "auto-accept-ready", "debt-settled"].includes(result) ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : ["declined", "no-show", "confirmation-expired", "payment-cancelled", "card-cancelled"].includes(result) ? "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{resultMessage(result)}</div>}
          {google && <div className={`mt-5 rounded-[22px] border px-5 py-4 text-sm font-semibold ${["connected", "synced"].includes(google) ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : google === "not-configured" ? "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{google === "connected" ? "Perfil Google Business associado e mini-perfil atualizado." : google === "synced" ? "Avaliação, reviews e fotografias atualizadas a partir do Google." : google === "not-configured" ? "A ligação gratuita central aguarda as credenciais e a aprovação do Google Business Profile API." : "Não foi possível atualizar agora o perfil Google."}</div>}

          <section className="mt-5 overflow-hidden rounded-[26px] bg-[#D8BD8A] shadow-[0_18px_45px_rgba(98,70,36,0.10)]"><div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,.42fr))]"><div className="col-span-2 flex items-center gap-4 border-b border-[#BFA370]/55 p-5 lg:col-span-4 2xl:col-span-1 2xl:border-b-0 2xl:border-r"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${restaurant.referralAutoAcceptEnabled ? "bg-[#1F2B20] text-[#A7D0A9]" : "bg-[#4E3821] text-[#E5C888]"}`}><CalendarCheck2 size={21} /></span><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#74532B]">Funcionamento</p><p className="mt-1 text-base font-semibold">{restaurant.referralAutoAcceptEnabled ? "Reservas entram automaticamente" : "Ativa quando estiveres pronto"}</p><p className="mt-1 text-[10px] text-[#684D2E]">Sem pedidos para aprovar um a um.</p></div></div><SummaryValue label="Comissão padrão" value={`${formatMoney(defaultCommissionAmount)}${commissionType === "PER_PERSON" ? " / pessoa" : " total"}`} /><SummaryValue label="Lugares disponíveis" value={`${defaultDailyCapacity} por dia`} /><SummaryValue label="Próximas reservas" value={`${bookedGroups}`} /><SummaryValue label="A aguardar" value={`${restaurant.referralCommissionRequests.length} ${restaurant.referralCommissionRequests.length === 1 ? "negociação" : "negociações"}`} /></div></section>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_380px] 2xl:items-start">
            <div className="space-y-5">
              <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_12px_38px_rgba(88,62,31,0.045)] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Regra base</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Comissão e disponibilidade</h2><p className="mt-1 text-[10px] leading-5 text-[#75695D]">Estas são as condições apresentadas por defeito a todos os parceiros.</p></div><span className="hidden h-10 w-10 place-items-center rounded-full bg-[#F4ECE1] text-[#8B6738] sm:grid"><CalendarCheck2 size={17} /></span></div><ReferralBookingSettingsForm restaurantId={id} initialCommissionType={commissionType} initialCommissionAmount={defaultCommissionAmount} initialDefaultDailyCapacity={defaultDailyCapacity} initialAutoAcceptEnabled={restaurant.referralAutoAcceptEnabled} paymentMethodReady={Boolean(restaurant.referralPaymentMethodId)} paymentBlocked={paymentBlocked} paymentBlockReason={restaurant.referralPaymentBlockReason} overdueAmount={overdueAmount} billingDetails={{ legalName: restaurant.billingLegalName || "", taxId: (restaurant.billingTaxId || "").replace(/^PT/i, ""), addressLine1: restaurant.billingAddressLine1 || "", addressLine2: restaurant.billingAddressLine2 || "", postalCode: restaurant.billingPostalCode || "", city: restaurant.billingCity || "" }} initialDailyCapacities={restaurant.referralDailyCapacities.map((item) => ({ date: item.date.toISOString().slice(0, 10), capacity: item.capacity, enabled: item.enabled }))} /></section>
              <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_12px_38px_rgba(88,62,31,0.045)] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Condições privadas</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Parceiros e negociações</h2><p className="mt-1 text-[10px] leading-5 text-[#75695D]">Cada acordo é permanente e só muda quando a outra parte aceita a nova comissão.</p></div><span className="hidden h-10 w-10 place-items-center rounded-full bg-[#F4ECE1] text-[#8B6738] sm:grid"><Handshake size={17} /></span></div><ReferralAgreementForm restaurantId={id} initialAgreements={restaurant.referralAgreements.map((agreement) => ({ id: agreement.id, partnerName: agreement.partner.businessName, partnerEmail: agreement.partner.email, partnerCode: agreement.partner.partnerCode, commissionType: isCommissionType(agreement.commissionType) ? agreement.commissionType : "PER_PERSON", commissionAmount: Number(agreement.commissionAmount) }))} initialRequests={restaurant.referralCommissionRequests.map((request) => ({ id: request.id, partnerName: request.partner.businessName, partnerEmail: request.partner.email, partnerCode: request.partner.partnerCode, initiator: request.initiator, message: request.message, commissionType: isCommissionType(request.commissionType) ? request.commissionType : "PER_PERSON", commissionAmount: Number(request.commissionAmount) }))} /></section>
            </div>
            <aside className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)] 2xl:sticky 2xl:top-6 2xl:grid-cols-1"><PartnerProfileSettingsForm restaurantId={id} restaurantName={restaurant.name} cuisine={partnerProfile.cuisine} description={partnerProfile.description} heroImage={partnerProfile.heroImage} address={restaurant.address || restaurant.googleBusinessAddress || ""} googleMapsUrl={restaurant.googleReviewUrl || ""} googleRating={restaurant.googleRating} googleReviewCount={restaurant.googleReviewCount} googlePriceLevel={restaurant.googlePriceLevel} googleBusinessConnected={Boolean(restaurant.googleBusinessConnectedAt)} googleBusinessReady={googleBusinessConfigured()} /><section className="rounded-[24px] border border-[#E1D0B8] bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">Fluxo automático</p><h3 className="mt-1 text-lg font-semibold">Da pesquisa à tua agenda</h3><div className="mt-4 space-y-4"><FlowStep number="01" title="O parceiro escolhe" text="Vê a comissão, capacidade e perfil verificado." /><FlowStep number="02" title="A reserva entra" text="O contacto fica visível e a mesa aparece no MesaLink." /><FlowStep number="03" title="Tens 3 dias para confirmar" text="Indica quantas pessoas foram ou marca no-show. Sem resposta, o valor é cobrado automaticamente." /></div></section></aside>
          </div>

          {restaurant.acceptedReferralGroups.length > 0 && (
            <section className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_12px_38px_rgba(88,62,31,0.045)] sm:p-6">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Reservas</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Reservas e presenças</h2></div><p className="hidden text-[10px] text-[#75695D] sm:block">Tens 3 dias após cada reserva para confirmar.</p></div>
              <div className="mt-3 space-y-2">
                {restaurant.acceptedReferralGroups.map((group) => {
                  const attendanceDeadline = referralAttendanceDeadline(group.desiredDate);
                  const canConfirm = group.status === "BOOKED" && group.desiredDate <= pageNow && attendanceDeadline > pageNow;
                  return (
                  <div key={group.id} className="grid gap-3 rounded-[15px] border border-[#E8DCCB] bg-[#FFFDFC] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><span className="rounded-full border border-[#DCCCAD] bg-[#FFF9ED] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#795D38]">{groupStatus(group.status)}</span></div><p className="mt-2 text-sm text-[#6B6258]">{groupPeople(group)} · {formatDateTime(group.desiredDate)} · comissão base {formatMoney(Number(group.payment?.grossCommission || 0))}{group.payment && Number(group.payment.taxAmount) > 0 ? ` · impostos ${formatMoney(Number(group.payment.taxAmount))}` : " · impostos calculados pela Stripe"}</p>{group.status === "BOOKED" && group.desiredDate <= pageNow && <p className="mt-2 text-[10px] font-bold text-[#8A6130]">Confirma até {formatDateTime(attendanceDeadline)}. Depois, o número reservado é cobrado automaticamente.</p>}{group.status === "COMPLETED" && group.payment?.capturedAt && <p className="mt-2 text-[10px] font-bold text-[#795D38]">O parceiro tem até {formatDateTime(referralInvoiceDeadline(group.payment.capturedAt))} para anexar uma fatura válida; sem ela, recebes o reembolso automático.</p>}{group.customerName && <div className="mt-3 rounded-2xl border border-[#CFE0CC] bg-[#F3FAF2] p-3 text-xs leading-5 text-[#405C42]"><p className="font-black uppercase tracking-[0.12em]">Contacto desbloqueado</p><p className="mt-1 font-semibold">{group.customerName} · <a href={`tel:${group.customerPhone}`} className="underline">{group.customerPhone}</a>{group.customerEmail ? <> · <a href={`mailto:${group.customerEmail}`} className="underline">{group.customerEmail}</a></> : null}</p></div>}<ReferralInvoices payment={group.payment} /></div>
                    <div>
                      {canConfirm && <div className="grid gap-2"><form action={`/api/referral-groups/${group.id}/complete`} method="POST" className="flex gap-2"><input type="hidden" name="outcome" value="ATTENDED" /><input name="actualGuests" type="number" min="1" max={group.guests} defaultValue={group.guests} aria-label="Pessoas que compareceram" className="h-11 w-20 rounded-full border border-[#CBB795] bg-white px-3 text-center text-sm font-bold" /><button className="h-11 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white">Confirmar e cobrar</button></form><form action={`/api/referral-groups/${group.id}/complete`} method="POST"><input type="hidden" name="outcome" value="NO_SHOW" /><button className="h-10 w-full rounded-full border border-[#E0B7A8] bg-[#FFF0EA] px-5 text-xs font-bold text-[#934A35]">Não compareceu · não cobrar</button></form></div>}
                      {group.status === "BOOKED" && group.desiredDate > pageNow && <span className="text-xs font-semibold text-[#806F5C]">Confirmação disponível após a visita</span>}
                      {group.status === "BOOKED" && attendanceDeadline <= pageNow && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#795D38]"><Clock3 size={16} /> Prazo terminado · cobrança automática em processamento</span>}
                      {group.status === "COMPLETED" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#795D38]"><Clock3 size={16} /> Cobrado · aguarda fatura válida</span>}
                      {group.status === "NO_SHOW" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#934A35]">No-show · valor libertado</span>}
                      {group.status === "PAID" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3F6A4D]"><CheckCircle2 size={16} /> Comissão paga</span>}
                      {group.status === "REFUNDED" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3F6A4D]"><CheckCircle2 size={16} /> Reembolsado · fatura não entregue</span>}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}
          {!restaurant.acceptedReferralGroups.length && <section className="mt-5 flex flex-col gap-4 rounded-[24px] border border-dashed border-[#D4BE9C] bg-[#FBF7F0] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#9B6F3B]"><UsersRound size={18} /></span><div><p className="text-sm font-bold">Ainda não existem reservas Partner</p><p className="mt-1 text-[10px] leading-5 text-[#75695D]">Quando um parceiro escolher o restaurante, a reserva aparece aqui com todos os dados.</p></div></div><span className="inline-flex items-center gap-2 text-[9px] font-bold text-[#8B6738]">A acompanhar em tempo real <ArrowRight size={12} /></span></section>}
          </div>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-r border-[#BFA370]/55 px-4 py-4 even:border-r-0 lg:border-b-0 lg:border-r lg:even:border-r 2xl:last:border-r-0"><p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#74532B]">{label}</p><p className="mt-2 text-sm font-bold tracking-[-0.02em]">{value}</p></div>;
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="grid grid-cols-[34px_1fr] gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1E6D5] text-[8px] font-black text-[#8B6738]">{number}</span><div><p className="text-[11px] font-bold">{title}</p><p className="mt-0.5 text-[9px] leading-4 text-[#75695D]">{text}</p></div></div>;
}

function ReferralInvoices({ payment }: { payment: null | {
  stripeInvoiceUrl: string | null;
  stripeInvoicePdfUrl: string | null;
  partnerInvoiceUrl: string | null;
  partnerInvoiceNumber: string | null;
  partnerInvoiceStatus: string;
} }) {
  if (!payment) return null;
  const mesaLinkInvoice = payment.stripeInvoicePdfUrl || payment.stripeInvoiceUrl;
  if (!mesaLinkInvoice && !payment.partnerInvoiceUrl) return null;
  return <div className="mt-3 flex flex-wrap gap-2">
    {mesaLinkInvoice && <a href={mesaLinkInvoice} target="_blank" rel="noreferrer" className="rounded-full border border-[#C9DCC6] bg-[#F2FAF1] px-3 py-1.5 text-[10px] font-black text-[#3F6A4D] underline">Fatura MesaLink / Stripe</a>}
    {payment.partnerInvoiceUrl && <a href={payment.partnerInvoiceUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#D8C6A9] bg-[#FFF9F0] px-3 py-1.5 text-[10px] font-black text-[#795D38] underline">Fatura do parceiro {payment.partnerInvoiceNumber || ""} · {payment.partnerInvoiceStatus === "VERIFIED" ? "verificada" : "em validação"}</a>}
  </div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(value);
}

function groupPeople(group: { guests: number; adults: number | null; children: number }) {
  const children = Math.max(0, group.children || 0);
  const adults = group.adults ?? Math.max(1, group.guests - children);
  return `${adults} ${adults === 1 ? "adulto" : "adultos"}${children > 0 ? ` · ${children} ${children === 1 ? "criança" : "crianças"}` : ""}`;
}

function groupStatus(value: string) {
  if (value === "BOOKED") return "Reservado";
  if (value === "COMPLETED") return "Por pagar";
  if (value === "PAID") return "Pago";
  if (value === "NO_SHOW") return "Não compareceu";
  if (value === "REFUNDED") return "Reembolsado";
  if (value === "PARTIALLY_REFUNDED") return "Reembolso parcial";
  if (value === "DISPUTED") return "Pagamento contestado";
  return value;
}

function resultMessage(value: string) {
  if (value === "auto-accept-ready") return "Cartão validado. Já podes ativar reservas imediatas para parceiros.";
  if (value === "debt-settled") return "Pagamento regularizado. O restaurante voltou a ficar visível e disponível na app Partners.";
  if (value === "debt-payment-failed") return "O novo cartão ficou guardado, mas não permitiu liquidar todo o valor em atraso. O restaurante continua offline para novas reservas Partner.";
  if (value === "payment-blocked") return "Não foi possível cobrar a comissão. As reservas já confirmadas mantêm-se, mas o restaurante ficou offline para novas reservas Partner até regularizar o pagamento.";
  if (value === "card-cancelled") return "A validação do cartão foi cancelada. As reservas automáticas continuam desligadas.";
  if (value === "card-error") return "Não foi possível validar o cartão. Tenta novamente.";
  if (value === "accepted") return "Cartão autorizado. A reserva entrou no calendário e o contacto do cliente foi desbloqueado.";
  if (value === "demo-safe") return "Teste concluído: este pedido é fictício, por isso não foi criado nenhum pagamento nem reserva real.";
  if (value === "declined") return "Proposta recusada.";
  if (value === "captured") return "Presença confirmada e valor cobrado. O parceiro tem 30 dias para anexar uma fatura válida; depois entra no pagamento semanal.";
  if (value === "no-show") return "No-show confirmado. A autorização do cartão foi libertada sem cobrar a comissão.";
  if (value === "authorization-cancelled") return "A autorização do cartão foi cancelada; o grupo continua disponível.";
  if (value === "authorization-expired") return "A autorização já não pode ser cobrada. Contacta o suporte MesaLink para regularizar.";
  if (value === "fiscal-required") return "Falta completar a ficha fiscal. Preenche o nome legal, NIF e morada no formulário abaixo antes de validares o cartão.";
  if (value === "fiscal-invalid") return "Confirma o nome legal, o NIF com 9 algarismos, a morada e o código postal no formato 0000-000.";
  if (value === "fiscal-tax-id-conflict") return "A conta Stripe já tem outro número fiscal associado. Contacta o suporte MesaLink antes de substituir o NIF.";
  if (value === "authorization-too-short") return "Este cartão não permite manter a autorização até à data da refeição. O valor foi libertado e o grupo continua disponível; tenta outro cartão ou aceita mais perto da data.";
  if (value === "invalid-attendance") return "Confirma um número válido de pessoas que compareceram.";
  if (value === "confirmation-expired") return "O prazo de 3 dias terminou. A cobrança automática já está a ser processada com o número de pessoas da reserva.";
  if (value === "already-settled") return "Esta reserva já foi confirmada e não pode ser alterada.";
  if (value === "payment-success") return "Pagamento recebido. A transferência para o parceiro será confirmada automaticamente.";
  if (value === "payment-processing") return "Pagamento em validação pelo Stripe. O estado será atualizado automaticamente antes da transferência.";
  if (value === "payment-error") return "Não foi possível abrir o pagamento. Tenta novamente ou contacta o suporte.";
  if (value === "already-paid") return "Esta comissão já foi paga.";
  if (value === "payment-cancelled") return "O pagamento foi cancelado e pode ser retomado.";
  if (value === "partner-payment-pending") return "O parceiro ainda precisa de concluir a verificação para receber pagamentos.";
  if (value === "too-early") return "A refeição só pode ser confirmada depois da data da reserva.";
  return "Este grupo já não estava disponível.";
}
