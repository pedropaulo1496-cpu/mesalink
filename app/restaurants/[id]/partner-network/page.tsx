import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, Clock3, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { PartnerProfileSettingsForm, ReferralAgreementForm, ReferralNetworkSettingsForm } from "@/components/partners/PartnerNetworkControls";
import { authOptions } from "@/lib/auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { calculateReferralCommission, calculateReferralServiceFee, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export default async function PartnerNetworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { id } = await params;
  const { result } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const restaurant = user
    ? await prisma.restaurant.findFirst({
        where: { id, userId: user.id },
        include: {
          referralOffers: {
            where: { status: "PENDING", group: { status: "OPEN" } },
            orderBy: { createdAt: "desc" },
            include: {
              group: {
                include: {
                  partner: { select: { partnerType: true, status: true } },
                },
              },
            },
          },
          referralAgreements: {
            where: { active: true },
            orderBy: { updatedAt: "desc" },
            include: { partner: { select: { businessName: true, partnerType: true, email: true } } },
          },
          acceptedReferralGroups: {
            orderBy: { updatedAt: "desc" },
            take: 20,
            include: { payment: true },
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

  const pendingValue = restaurant.referralOffers.reduce((total, offer) => {
    const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
    return total + calculateReferralCommission({ guests: offer.group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount) }).gross;
  }, 0);
  const completedGroups = restaurant.acceptedReferralGroups.filter((group) => ["COMPLETED", "PAID"].includes(group.status));
  const paidCommission = restaurant.acceptedReferralGroups.reduce((total, group) => total + Math.max(0, Number(group.payment?.grossCommission || 0) - Number(group.payment?.refundedAmount || 0)), 0);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="partnerNetwork" />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><div className="flex flex-wrap items-center gap-3"><p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">Rede de Parceiros</p><span className="rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#3F6A4D]">Ativa</span></div><h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Grupos enviados por hotéis e parceiros.</h1><p className="mt-2 max-w-2xl text-sm leading-5 text-[#6B6258]">Aceita os grupos que interessam. A comissão e o pagamento ficam tratados no MesaLink.</p></div>
            <div className="flex items-center gap-2 rounded-full border border-[#BAD8B7] bg-[#EFF9EF] px-4 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={16} /> Contacto oculto até aceitar</div>
          </header>

          {result && <div className={`mt-5 rounded-[22px] border px-5 py-4 text-sm font-semibold ${["accepted", "completed", "payment-success", "already-paid"].includes(result) ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : result === "declined" || result === "payment-cancelled" ? "border-[#DCCCAD] bg-[#FFF9ED] text-[#795D38]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{resultMessage(result)}</div>}

          <section className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4">
            <Kpi icon={<UsersRound size={18} />} label="Pedidos novos" value={String(restaurant.referralOffers.length)} />
            <Kpi icon={<CircleDollarSign size={18} />} label="Comissão em pedidos" value={formatMoney(pendingValue)} />
            <Kpi icon={<CheckCircle2 size={18} />} label="Grupos concluídos" value={String(completedGroups.length)} />
            <Kpi icon={<Building2 size={18} />} label="Acordos ativos" value={String(restaurant.referralAgreements.length)} detail={`${formatMoney(paidCommission)} em comissões`} />
          </section>

          <section className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_50px_rgba(80,55,30,0.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Ofertas de grupos</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">Por responder</h2></div><span className="w-fit rounded-full bg-[#F1E6D5] px-3 py-1.5 text-xs font-black text-[#795D38]">{restaurant.referralOffers.length}</span></div>
            <div className="mt-6 space-y-3">
              {restaurant.referralOffers.map((offer) => {
                const group = offer.group;
                const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
                const amounts = calculateReferralCommission({ guests: group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount), platformFeePercent: Number(offer.platformFeePercent) });
                const children = Math.max(0, group.children || 0);
                const adults = group.adults ?? Math.max(1, group.guests - children);
                const commissionLabel = type === "PER_PERSON" ? `${formatMoney(Number(offer.commissionAmount))} / pessoa` : `${formatMoney(Number(offer.commissionAmount))} total`;
                return <article key={offer.id} className="rounded-[26px] border border-[#E1D0B8] bg-[#FFFDFC] p-4 transition hover:border-[#C9AD83] sm:p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F1E6D5] text-[#8A6130]"><UsersRound size={21} /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><p className="text-lg font-semibold tracking-[-0.025em]">{adults} {adults === 1 ? "adulto" : "adultos"}{children > 0 ? ` · ${children} ${children === 1 ? "criança" : "crianças"}` : ""}</p><span className="rounded-full border border-[#D9C7AA] bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#795D38]">{partnerType(group.partner.partnerType)} verificado</span></div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6B6258]"><span className="inline-flex items-center gap-1.5"><CalendarClock size={15} className="text-[#9B6F3B]" />{new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" }).format(group.desiredDate)}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-[#9B6F3B]" />{new Intl.DateTimeFormat("pt-PT", { timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={15} className="text-[#9B6F3B]" />{group.area || group.city || "Zona flexível"}</span></div>
                        <div className="mt-3 flex flex-wrap gap-2">{group.cuisineTypes.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#F6EFE5] px-2.5 py-1 text-[10px] font-bold text-[#715B43]">{item}</span>)}{group.budgetPerPerson && <span className="rounded-full bg-[#EEF6ED] px-2.5 py-1 text-[10px] font-bold text-[#4F6C4D]">Budget {formatMoney(Number(group.budgetPerPerson))}/pessoa</span>}</div>
                      </div>
                    </div>
                    <div className="rounded-[20px] bg-[#17120D] p-4 text-white lg:text-right"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Comissão proposta</p><p className="mt-1 text-xl font-semibold text-[#E8C985]">{commissionLabel}</p><p className="mt-1 text-xs text-white/50">{formatMoney(amounts.gross)} no total</p></div>
                  </div>
                  <details className="group mt-4 rounded-[18px] border border-[#E8DCCB] bg-white px-4 py-3"><summary className="cursor-pointer list-none text-xs font-bold text-[#755B3B]">Ver condições e valores <span className="ml-1 inline-block transition group-open:rotate-180">⌄</span></summary><div className="mt-3 grid gap-3 border-t border-[#EEE3D3] pt-3 text-xs sm:grid-cols-3"><div><p className="text-[#8B7D6D]">Parceiro recebe 85%</p><p className="mt-1 font-bold">{formatMoney(amounts.partnerNet)}</p></div><div><p className="text-[#8B7D6D]">MesaLink retém 15%</p><p className="mt-1 font-bold">{formatMoney(amounts.platformFee)}</p></div><div><p className="text-[#8B7D6D]">Serviço e pagamento</p><p className="mt-1 font-bold">{formatMoney(calculateReferralServiceFee(amounts.gross))}</p></div>{group.notes && <p className="sm:col-span-3 leading-5 text-[#665B50]">{group.notes}</p>}</div></details>
                  <div className="mt-4 grid gap-2 sm:ml-auto sm:max-w-lg sm:grid-cols-[130px_1fr]"><form action={`/api/referral-offers/${offer.id}/decline`} method="POST"><button className="h-11 w-full rounded-full border border-[#D8C6A9] bg-white text-sm font-bold hover:bg-[#FFF7ED]">Rejeitar</button></form><form action={`/api/referral-offers/${offer.id}/accept`} method="POST"><button className="h-11 w-full rounded-full bg-[#17120D] px-4 text-sm font-bold text-white hover:bg-[#34271C]">Autorizar cartão e aceitar</button></form></div>
                </article>;
              })}
              {restaurant.referralOffers.length === 0 && <div className="rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-10 text-center"><CalendarClock className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Não há grupos pendentes.</p><p className="mt-2 text-sm text-[#6B6258]">Quando um parceiro selecionar o restaurante, aparece aqui em tempo real.</p></div>}
            </div>
          </section>

          {restaurant.acceptedReferralGroups.length > 0 && (
            <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Serviço e pagamento</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Grupos aceites</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">O cartão já está autorizado. Depois da refeição, confirma quantas pessoas vieram ou marca no-show. Só então o valor é cobrado; 85% fica a pagar semanalmente ao parceiro e o MesaLink retém 15%.</p>
              <div className="mt-6 space-y-3">
                {restaurant.acceptedReferralGroups.map((group) => (
                  <div key={group.id} className="grid gap-4 rounded-[24px] border border-[#E1D0B8] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><span className="rounded-full border border-[#DCCCAD] bg-[#FFF9ED] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#795D38]">{groupStatus(group.status)}</span></div><p className="mt-2 text-sm text-[#6B6258]">{groupPeople(group)} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)} · comissão {formatMoney(Number(group.payment?.grossCommission || 0))}{group.payment && Number(group.payment.serviceFee) > 0 ? ` + ${formatMoney(Number(group.payment.serviceFee))} serviço` : ""}</p>{group.customerName && <div className="mt-3 rounded-2xl border border-[#CFE0CC] bg-[#F3FAF2] p-3 text-xs leading-5 text-[#405C42]"><p className="font-black uppercase tracking-[0.12em]">Contacto desbloqueado</p><p className="mt-1 font-semibold">{group.customerName} · <a href={`tel:${group.customerPhone}`} className="underline">{group.customerPhone}</a>{group.customerEmail ? <> · <a href={`mailto:${group.customerEmail}`} className="underline">{group.customerEmail}</a></> : null}</p></div>}<ReferralInvoices payment={group.payment} /></div>
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

          <details className="group mt-5 rounded-[24px] border border-[#E1D0B8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold"><span>Perfil e regras da parceria</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Configurar ↓</span><span className="hidden text-xs text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
            <div className="border-t border-[#E8DCCB] p-5">
          <section className="rounded-[24px] border border-[#E1D0B8] bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Perfil para parceiros</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">O teu mini-perfil na app dos hotéis.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6258]">Já o preenchemos com a cozinha, descrição, fotografias e menu do Website Builder. Podes ajustar este perfil sem alterar o teu website público.</p></div><span className="w-fit rounded-full border border-[#BAD8B7] bg-[#EFF9EF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#3F6A4D]">Preenchido automaticamente</span></div>
            <PartnerProfileSettingsForm restaurantId={id} restaurantName={restaurant.name} cuisine={partnerProfile.cuisine} description={partnerProfile.description} heroImage={partnerProfile.heroImage} gallery={partnerProfile.galleryImages} highlights={partnerProfile.highlights} menuUrl={partnerProfile.menuUrl} />
          </section>

          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Comissão sugerida</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Valor base para novos grupos</h2><ReferralNetworkSettingsForm restaurantId={id} initialCommissionType={restaurant.referralDefaultCommissionType} initialCommissionAmount={Number(restaurant.referralDefaultCommissionAmount)} /></div>
            <div className="rounded-[34px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Acordo direto</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Define uma comissão recorrente</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">Usa o email profissional do hotel ou parceiro. O acordo substitui a comissão base em todos os grupos futuros.</p><ReferralAgreementForm restaurantId={id} /></div>
          </section>

          {restaurant.referralAgreements.length > 0 && <section className="mt-5 rounded-[24px] border border-[#E1D0B8] bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Parceiros recorrentes</p><div className="mt-4 grid gap-3 md:grid-cols-2">{restaurant.referralAgreements.map((agreement) => <div key={agreement.id} className="rounded-[20px] border border-[#E1D0B8] bg-[#FFFDFC] p-4"><p className="font-semibold">{agreement.partner.businessName}</p><p className="mt-1 text-xs text-[#75695C]">{partnerType(agreement.partner.partnerType)} · {agreement.partner.email}</p><p className="mt-3 text-sm font-bold text-[#795D38]">{agreement.commissionType === "PER_PERSON" ? `${formatMoney(Number(agreement.commissionAmount))} por pessoa` : `${formatMoney(Number(agreement.commissionAmount))} total`} · MesaLink 15%</p></div>)}</div></section>}
            </div>
          </details>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function Kpi({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return <div className="rounded-[20px] border border-[#E1D0B8] bg-white p-3.5"><div className="flex items-center gap-2 text-[#9B6F3B]">{icon}<p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8B7D6D]">{label}</p></div><p className="mt-2 text-xl font-semibold tracking-[-0.04em]">{value}</p>{detail && <p className="mt-1 text-[10px] text-[#7B6D5D]">{detail}</p>}</div>;
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

function partnerType(value: string) {
  if (value === "HOTEL") return "Hotel";
  if (value === "CONCIERGE") return "Concierge";
  if (value === "GUIDE") return "Guia";
  if (value === "AGENCY") return "Agência";
  return "Empresa";
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
  if (value === "accepted") return "Cartão autorizado. A reserva entrou no calendário e o contacto do cliente foi desbloqueado.";
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
