import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { PartnerProfileSettingsForm, ReferralBookingSettingsForm } from "@/components/partners/PartnerNetworkControls";
import { authOptions } from "@/lib/auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
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
  const completedGroups = restaurant.acceptedReferralGroups.filter((group) => ["COMPLETED", "PAID"].includes(group.status));
  const commissionType = isCommissionType(restaurant.referralDefaultCommissionType) ? restaurant.referralDefaultCommissionType : "PER_PERSON";

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="partnerNetwork" />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Parceiros</p><span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${restaurant.referralAutoAcceptEnabled ? "bg-[#E5F3E4] text-[#3F6A4D]" : "bg-[#FFF0D3] text-[#795D38]"}`}>{restaurant.referralAutoAcceptEnabled ? "Ativo" : "Por configurar"}</span></div><h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Reservas de parceiros</h1><p className="mt-1 text-xs leading-5 text-[#6B6258]">Define a comissão e os lugares. As reservas disponíveis entram automaticamente.</p></div>
            <div className="inline-flex w-fit items-center gap-1.5 text-[10px] font-bold text-[#48704E]"><ShieldCheck size={14} /> Contacto protegido até à reserva</div>
          </header>

          {result && <div className={`mt-5 rounded-[22px] border px-5 py-4 text-sm font-semibold ${["accepted", "completed", "payment-success", "already-paid", "auto-accept-ready"].includes(result) ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : result === "declined" || result === "payment-cancelled" || result === "card-cancelled" ? "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{resultMessage(result)}</div>}
          {google && <div className={`mt-5 rounded-[22px] border px-5 py-4 text-sm font-semibold ${["connected", "synced"].includes(google) ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : google === "not-configured" ? "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{google === "connected" ? "Perfil Google Business associado e mini-perfil atualizado." : google === "synced" ? "Avaliação, reviews e fotografias atualizadas a partir do Google." : google === "not-configured" ? "A ligação gratuita central aguarda as credenciais e a aprovação do Google Business Profile API." : "Não foi possível atualizar agora o perfil Google."}</div>}

          <section className="mt-4 flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 rounded-[16px] border border-[#E1D0B8] bg-white px-4 py-3">
            <CompactMetric label="Comissão" value={`${formatMoney(Number(restaurant.referralDefaultCommissionAmount))}${commissionType === "PER_PERSON" ? " / pessoa" : " total"}`} />
            <CompactMetric label="Lugares" value={`${restaurant.referralDefaultDailyCapacity} / dia`} />
            <CompactMetric label="Próximas" value={String(restaurant.acceptedReferralGroups.filter((group) => group.status === "BOOKED").length)} />
            <CompactMetric label="Concluídas" value={String(completedGroups.length)} />
          </section>

          <section className="mt-4 max-w-6xl space-y-2">
            <details open={!restaurant.referralAutoAcceptEnabled} className="group rounded-[18px] border border-[#E1D0B8] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5"><div><p className="text-sm font-bold">Comissão e disponibilidade</p><p className="mt-0.5 text-[10px] text-[#75695D]">O essencial para começar a receber reservas.</p></div><span className="rounded-full bg-[#F5EBDD] px-3 py-1 text-[9px] font-black text-[#795D38] group-open:hidden">Configurar</span><span className="hidden text-[10px] font-bold text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
              <div className="border-t border-[#E8DCCB] px-4 pb-4"><ReferralBookingSettingsForm restaurantId={id} initialCommissionType={commissionType} initialCommissionAmount={Number(restaurant.referralDefaultCommissionAmount)} initialDefaultDailyCapacity={restaurant.referralDefaultDailyCapacity} initialAutoAcceptEnabled={restaurant.referralAutoAcceptEnabled} paymentMethodReady={Boolean(restaurant.referralPaymentMethodId)} initialDailyCapacities={restaurant.referralDailyCapacities.map((item) => ({ date: item.date.toISOString().slice(0, 10), capacity: item.capacity }))} /></div>
            </details>

            <details className="group rounded-[18px] border border-[#E1D0B8] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5"><div><p className="text-sm font-bold">Perfil visto pelos parceiros</p><p className="mt-0.5 text-[10px] text-[#75695D]">{partnerProfile.cuisine} · fotografias e informações preenchidas automaticamente.</p></div><div className="flex items-center gap-2">{partnerProfile.heroImage && <div className="h-9 w-12 rounded-lg bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${partnerProfile.heroImage})` }} />}<span className="text-[10px] font-bold text-[#9B6F3B] group-open:hidden">Editar</span><span className="hidden text-[10px] font-bold text-[#9B6F3B] group-open:block">Fechar ↑</span></div></summary>
              <div className="border-t border-[#E8DCCB] p-4"><PartnerProfileSettingsForm restaurantId={id} restaurantName={restaurant.name} cuisine={partnerProfile.cuisine} description={partnerProfile.description} heroImage={partnerProfile.heroImage} gallery={partnerProfile.galleryImages} highlights={partnerProfile.highlights} menuUrl={partnerProfile.menuUrl} googleMapsUrl={restaurant.googleReviewUrl || ""} googleRating={restaurant.googleRating} googleReviewCount={restaurant.googleReviewCount} googlePriceLevel={restaurant.googlePriceLevel} googleBusinessConnected={Boolean(restaurant.googleBusinessConnectedAt)} googleBusinessPhotoCount={restaurant.googleBusinessPhotos.length} googleBusinessReady={googleBusinessConfigured()} /></div>
            </details>
          </section>

          {restaurant.acceptedReferralGroups.length > 0 && (
            <section className="mt-5 max-w-6xl rounded-[20px] border border-[#E1D0B8] bg-white p-4">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Reservas</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Próximos grupos</h2></div><p className="hidden text-[10px] text-[#75695D] sm:block">Confirma a presença depois da refeição.</p></div>
              <div className="mt-3 space-y-2">
                {restaurant.acceptedReferralGroups.map((group) => (
                  <div key={group.id} className="grid gap-3 rounded-[15px] border border-[#E8DCCB] bg-[#FFFDFC] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><span className="rounded-full border border-[#DCCCAD] bg-[#FFF9ED] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#795D38]">{groupStatus(group.status)}</span></div><p className="mt-2 text-sm text-[#6B6258]">{groupPeople(group)} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)} · comissão base {formatMoney(Number(group.payment?.grossCommission || 0))}{group.payment && Number(group.payment.taxAmount) > 0 ? ` · impostos ${formatMoney(Number(group.payment.taxAmount))}` : " · impostos calculados pela Stripe"}</p>{group.customerName && <div className="mt-3 rounded-2xl border border-[#CFE0CC] bg-[#F3FAF2] p-3 text-xs leading-5 text-[#405C42]"><p className="font-black uppercase tracking-[0.12em]">Contacto desbloqueado</p><p className="mt-1 font-semibold">{group.customerName} · <a href={`tel:${group.customerPhone}`} className="underline">{group.customerPhone}</a>{group.customerEmail ? <> · <a href={`mailto:${group.customerEmail}`} className="underline">{group.customerEmail}</a></> : null}</p></div>}<ReferralInvoices payment={group.payment} /></div>
                    <div>
                      {group.status === "BOOKED" && group.desiredDate <= new Date() && <div className="grid gap-2"><form action={`/api/referral-groups/${group.id}/complete`} method="POST" className="flex gap-2"><input type="hidden" name="outcome" value="ATTENDED" /><input name="actualGuests" type="number" min="1" max={group.guests} defaultValue={group.guests} aria-label="Pessoas que compareceram" className="h-11 w-20 rounded-full border border-[#CBB795] bg-white px-3 text-center text-sm font-bold" /><button className="h-11 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white">Confirmar presença e cobrar</button></form><form action={`/api/referral-groups/${group.id}/complete`} method="POST"><input type="hidden" name="outcome" value="NO_SHOW" /><button className="h-10 w-full rounded-full border border-[#E0B7A8] bg-[#FFF0EA] px-5 text-xs font-bold text-[#934A35]">Cliente não compareceu · libertar valor</button></form></div>}
                      {group.status === "BOOKED" && group.desiredDate > new Date() && <span className="text-xs font-semibold text-[#806F5C]">Pagamento após a refeição</span>}
                      {group.status === "COMPLETED" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#795D38]"><Clock3 size={16} /> Cobrado · pagamento semanal pendente</span>}
                      {group.status === "NO_SHOW" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#934A35]">No-show · valor libertado</span>}
                      {group.status === "PAID" && <span className="inline-flex items-center gap-2 text-xs font-bold text-[#3F6A4D]"><CheckCircle2 size={16} /> Comissão paga</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-baseline gap-2"><span className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8B7D6D]">{label}</span><strong className="text-sm">{value}</strong></div>;
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
  if (value === "card-cancelled") return "A validação do cartão foi cancelada. As reservas automáticas continuam desligadas.";
  if (value === "card-error") return "Não foi possível validar o cartão. Tenta novamente.";
  if (value === "accepted") return "Cartão autorizado. A reserva entrou no calendário e o contacto do cliente foi desbloqueado.";
  if (value === "demo-safe") return "Teste concluído: este pedido é fictício, por isso não foi criado nenhum pagamento nem reserva real.";
  if (value === "declined") return "Proposta recusada.";
  if (value === "captured") return "Presença confirmada e valor cobrado. O pagamento ao parceiro entra no processamento semanal.";
  if (value === "no-show") return "No-show confirmado. A autorização do cartão foi libertada sem cobrar a comissão.";
  if (value === "authorization-cancelled") return "A autorização do cartão foi cancelada; o grupo continua disponível.";
  if (value === "authorization-expired") return "A autorização já não pode ser cobrada. Contacta o suporte MesaLink para regularizar.";
  if (value === "fiscal-required") return "Faltaram o nome legal, a morada ou o NIF no Stripe. Tenta aceitar novamente e assinala que estás a comprar como empresa para preencher os dados fiscais.";
  if (value === "authorization-too-short") return "Este cartão não permite manter a autorização até à data da refeição. O valor foi libertado e o grupo continua disponível; tenta outro cartão ou aceita mais perto da data.";
  if (value === "invalid-attendance") return "Confirma um número válido de pessoas que compareceram.";
  if (value === "payment-success") return "Pagamento recebido. A transferência para o parceiro será confirmada automaticamente.";
  if (value === "payment-processing") return "Pagamento em validação pelo Stripe. O estado será atualizado automaticamente antes da transferência.";
  if (value === "payment-error") return "Não foi possível abrir o pagamento. Tenta novamente ou contacta o suporte.";
  if (value === "already-paid") return "Esta comissão já foi paga.";
  if (value === "payment-cancelled") return "O pagamento foi cancelado e pode ser retomado.";
  if (value === "partner-payment-pending") return "O parceiro ainda precisa de concluir a verificação para receber pagamentos.";
  if (value === "too-early") return "A refeição só pode ser confirmada depois da data da reserva.";
  return "Este grupo já não estava disponível.";
}
