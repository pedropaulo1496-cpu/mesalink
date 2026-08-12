import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { Building2, CalendarClock, CheckCircle2, CircleDollarSign, Clock3, MapPin, ShieldCheck, UsersRound } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { PartnerProfileSettingsForm, ReferralOfferFilterForm } from "@/components/partners/PartnerNetworkControls";
import { authOptions } from "@/lib/auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { calculateReferralCommission, isCommissionType } from "@/lib/referrals";
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
  const visibleReferralOffers = restaurant.referralOffers.filter((offer) => {
    if (restaurant.referralMaxCommissionPerPerson == null) return true;
    const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
    const gross = calculateReferralCommission({ guests: offer.group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount) }).gross;
    return gross / Math.max(1, offer.group.guests) <= Number(restaurant.referralMaxCommissionPerPerson);
  });

  const pendingValue = visibleReferralOffers.reduce((total, offer) => {
    const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
    return total + calculateReferralCommission({ guests: offer.group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount) }).gross;
  }, 0);
  const completedGroups = restaurant.acceptedReferralGroups.filter((group) => ["COMPLETED", "PAID"].includes(group.status));

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

          <section className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
            <Kpi icon={<UsersRound size={15} />} label="Pedidos novos" value={String(visibleReferralOffers.length)} />
            <Kpi icon={<CircleDollarSign size={15} />} label="Comissão em pedidos" value={formatMoney(pendingValue)} />
            <Kpi icon={<CheckCircle2 size={15} />} label="Grupos concluídos" value={String(completedGroups.length)} />
            <Kpi icon={<Building2 size={15} />} label="Limite por pessoa" value={restaurant.referralMaxCommissionPerPerson == null ? "Sem limite" : formatMoney(Number(restaurant.referralMaxCommissionPerPerson))} />
          </section>

          <section className="mt-4 rounded-[24px] border border-[#E1D0B8] bg-white p-4 shadow-[0_16px_40px_rgba(80,55,30,0.045)]">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Ofertas de grupos</p><h2 className="mt-0.5 text-xl font-semibold tracking-[-0.04em]">Por responder</h2></div><span className="rounded-full bg-[#F1E6D5] px-2.5 py-1 text-[10px] font-black text-[#795D38]">{visibleReferralOffers.length}</span></div>
            <div className="mt-4 space-y-2">
              {visibleReferralOffers.map((offer) => {
                const group = offer.group;
                const isDemoGroup = group.publicCode.startsWith("DEMO-");
                const type = isCommissionType(offer.commissionType) ? offer.commissionType : "TOTAL";
                const amounts = calculateReferralCommission({ guests: group.guests, commissionType: type, commissionAmount: Number(offer.commissionAmount), platformFeePercent: Number(offer.platformFeePercent) });
                const children = Math.max(0, group.children || 0);
                const adults = group.adults ?? Math.max(1, group.guests - children);
                const commissionPerPerson = amounts.gross / Math.max(1, group.guests);
                return <article key={offer.id} className="rounded-[20px] border border-[#E1D0B8] bg-[#FFFDFC] p-3 transition hover:border-[#C9AD83]">
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_270px] xl:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F1E6D5] text-[#8A6130]"><UsersRound size={17} /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5"><p className="text-base font-semibold tracking-[-0.02em]">{adults} {adults === 1 ? "adulto" : "adultos"}{children > 0 ? ` · ${children} ${children === 1 ? "criança" : "crianças"}` : ""}</p>{isDemoGroup && <span className="rounded-full border border-[#E4BD72] bg-[#FFF3D7] px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#8A5B16]">Demo</span>}<span className="rounded-full border border-[#D9C7AA] bg-white px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-[#795D38]">{partnerType(group.partner.partnerType)} {isDemoGroup ? "teste" : "verificado"}</span></div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6B6258]"><span className="inline-flex items-center gap-1"><CalendarClock size={12} className="text-[#9B6F3B]" />{new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} className="text-[#9B6F3B]" />{new Intl.DateTimeFormat("pt-PT", { timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)}</span><span className="inline-flex items-center gap-1"><MapPin size={12} className="text-[#9B6F3B]" />{group.area || group.city || "Zona flexível"}</span>{group.cuisineTypes.slice(0, 2).map((item) => <span key={item} className="font-semibold text-[#715B43]">· {item}</span>)}{group.budgetPerPerson && <span className="font-semibold text-[#4F6C4D]">· {formatMoney(Number(group.budgetPerPerson))}/pessoa</span>}</div>
                      </div>
                    </div>
                    <div className="rounded-[15px] border border-[#E5D6C0] bg-[#FFF7EA] px-3 py-2 xl:text-right"><p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#9A7650]">Comissão</p><p className="mt-0.5 text-sm font-bold text-[#704E27]">{formatMoney(commissionPerPerson)} / pessoa</p><p className="text-[9px] font-semibold text-[#8A7863]">{formatMoney(amounts.gross)} total</p></div>
                    <div className="grid grid-cols-[90px_1fr] gap-2"><form action={`/api/referral-offers/${offer.id}/decline`} method="POST"><button className="h-9 w-full rounded-full border border-[#D8C6A9] bg-white text-[11px] font-bold hover:bg-[#FFF7ED]">Rejeitar</button></form><form action={`/api/referral-offers/${offer.id}/accept`} method="POST"><button className="h-9 w-full rounded-full bg-[#17120D] px-3 text-[11px] font-bold text-white hover:bg-[#34271C]">{isDemoGroup ? "Testar · sem cobrança" : "Aceitar grupo"}</button></form></div>
                  </div>
                  {group.notes && <details className="group mt-2 border-t border-[#EEE3D3] pt-2"><summary className="w-fit cursor-pointer list-none text-[10px] font-bold text-[#755B3B]">Ver observações <span className="ml-1 inline-block transition group-open:rotate-180">⌄</span></summary><p className="mt-2 rounded-xl bg-white p-3 text-[10px] leading-4 text-[#665B50]">{group.notes}</p></details>}
                </article>;
              })}
              {visibleReferralOffers.length === 0 && <div className="rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-10 text-center"><CalendarClock className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Não há grupos dentro do teu limite.</p><p className="mt-2 text-sm text-[#6B6258]">Novas propostas aparecem aqui quando respeitam o máximo definido por pessoa.</p></div>}
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

          <section className="mt-5 max-w-md rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Filtro de propostas</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">Quanto aceitas pagar por pessoa?</h2><ReferralOfferFilterForm restaurantId={id} initialMaxCommissionPerPerson={restaurant.referralMaxCommissionPerPerson == null ? null : Number(restaurant.referralMaxCommissionPerPerson)} /></section>
            </div>
          </details>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function Kpi({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail?: string }) {
  return <div className="rounded-[16px] border border-[#E1D0B8] bg-white p-3"><div className="flex items-center gap-1.5 text-[#9B6F3B]">{icon}<p className="text-[7px] font-black uppercase tracking-[0.1em] text-[#8B7D6D]">{label}</p></div><div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2"><p className="text-lg font-semibold tracking-[-0.04em]">{value}</p>{detail && <p className="text-[8px] text-[#7B6D5D]">{detail}</p>}</div></div>;
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
