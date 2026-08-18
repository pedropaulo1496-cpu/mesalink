import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, CalendarPlus2, CheckCircle2, Clock3, Euro, FileCheck2, FileText, Landmark, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import NewReferralGroupForm from "@/components/partners/NewReferralGroupForm";
import PartnerInvoiceUpload from "@/components/partners/PartnerInvoiceUpload";
import PartnerSignOutButton from "@/components/partners/PartnerSignOutButton";
import PartnerCodeCopy from "@/components/partners/PartnerCodeCopy";
import { requirePartner } from "@/lib/partner-auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { referralAttendanceDeadline, referralInvoiceCutoff, referralInvoiceDeadline } from "@/lib/referral-deadlines";
import { calculateReferralCommission, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import PushNotificationToggle from "@/components/PushNotificationToggle";

export default async function PartnerAppPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string; tab?: string }>;
}) {
  const { connect, tab: requestedTab } = await searchParams;
  const tab = ["groups", "history", "stats", "account"].includes(requestedTab || "") ? requestedTab! : "groups";
  const identity = await requirePartner();
  const partner = await prisma.referralPartner.findUnique({
    where: { id: identity.id },
    include: {
      groups: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          acceptedRestaurant: { select: { name: true, billingLegalName: true, billingTaxId: true, billingAddressLine1: true, billingPostalCode: true, billingCity: true, billingCountry: true } },
          payment: true,
        },
      },
    },
  });
  if (!partner) redirect("/partners/login");

  const requestTime = new Date();
  const availabilityStart = new Date(requestTime);
  availabilityStart.setUTCHours(0, 0, 0, 0);
  const invoiceCutoff = referralInvoiceCutoff(requestTime);
  const [restaurants, paidTotals, pendingTotals, invoicedTotals, toInvoiceTotals, acceptedGroupsCount, upcomingGroupsCount] = await Promise.all([
    prisma.restaurant.findMany({
    where: {
      userId: { not: null },
      referralNetworkEnabled: true,
      referralAutoAcceptEnabled: true,
      referralPaymentMethodId: { not: null },
      referralPaymentBlockedAt: null,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      address: true,
      latitude: true,
      longitude: true,
      websiteCuisine: true,
      websiteDescription: true,
      websiteAboutText: true,
      websiteHeroImage: true,
      websiteLogoImage: true,
      websiteGalleryImage1: true,
      websiteGalleryImage2: true,
      websiteGalleryImage3: true,
      websiteGalleryImage4: true,
      websiteSpecialties: true,
      websiteMenuPdf: true,
      referralProfileCuisine: true,
      referralProfileDescription: true,
      referralProfileHeroImage: true,
      referralProfileGallery: true,
      referralProfileHighlights: true,
      referralProfileMenuUrl: true,
      averageTicket: true,
      googleRating: true,
      googleReviewCount: true,
      googlePriceLevel: true,
      googleReviewUrl: true,
      googleBusinessTitle: true,
      googleBusinessAddress: true,
      googleBusinessPhotos: true,
      googleBusinessConnectedAt: true,
      referralDefaultCommissionType: true,
      referralDefaultCommissionAmount: true,
      referralDefaultDailyCapacity: true,
      referralNetworkEnabled: true,
      referralAutoAcceptEnabled: true,
      referralPaymentMethodId: true,
      referralPaymentBlockedAt: true,
      referralAgreements: {
        where: { partnerId: partner.id, active: true },
        take: 1,
        select: { commissionType: true, commissionAmount: true },
      },
      referralCommissionRequests: {
        where: { partnerId: partner.id },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, initiator: true, commissionType: true, commissionAmount: true, message: true },
      },
      referralDailyCapacities: {
        where: { date: { gte: availabilityStart } },
        orderBy: { date: "asc" },
        take: 120,
        select: { date: true, capacity: true, enabled: true },
      },
      reservations: {
        where: { date: { gte: availabilityStart }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        select: { date: true, guests: true },
        take: 500,
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
    }),
    prisma.referralPayment.aggregate({
      where: { partnerId: partner.id, status: { in: ["TRANSFERRED", "PAID"] } },
      _sum: { partnerInvoiceTotal: true, reversedAmount: true },
    }),
    prisma.referralPayment.aggregate({
      where: { partnerId: partner.id, status: { in: ["AUTHORIZED", "CAPTURED_AWAITING_PAYOUT", "TRANSFER_PENDING"] } },
      _sum: { partnerInvoiceTotal: true },
    }),
    prisma.referralPayment.aggregate({
      where: { partnerId: partner.id, partnerInvoiceStatus: { in: ["PENDING", "VERIFIED"] } },
      _sum: { partnerInvoiceTotal: true },
    }),
    prisma.referralPayment.aggregate({
      where: {
        partnerId: partner.id,
        status: "CAPTURED_AWAITING_PAYOUT",
        capturedAt: { gt: invoiceCutoff },
        partnerInvoiceStatus: { in: ["MISSING", "REJECTED"] },
      },
      _sum: { partnerInvoiceTotal: true },
    }),
    prisma.referralGroup.count({ where: { partnerId: partner.id, status: { in: ["BOOKED", "COMPLETED", "PAID"] } } }),
    prisma.referralGroup.count({ where: { partnerId: partner.id, status: "BOOKED", desiredDate: { gte: requestTime } } }),
  ]);

  const restaurantOptions = restaurants.map((restaurant) => {
    const profile = buildPartnerProfile(restaurant);
    const isDemo = restaurant.slug.includes("demo");
    const reservedByDay = restaurant.reservations.reduce<Record<string, number>>((totals, reservation) => {
      const key = reservation.date.toISOString().slice(0, 10);
      totals[key] = (totals[key] || 0) + reservation.guests;
      return totals;
    }, {});
    const agreement = restaurant.referralAgreements[0];
    const negotiation = restaurant.referralCommissionRequests[0];
    const bookingReady = restaurant.referralNetworkEnabled && restaurant.referralAutoAcceptEnabled && Boolean(restaurant.referralPaymentMethodId) && !restaurant.referralPaymentBlockedAt;
    return {
      id: restaurant.id,
      name: restaurant.googleBusinessTitle || restaurant.name,
      isDemo,
      bookingReady,
      cuisine: profile.cuisine,
      address: restaurant.googleBusinessAddress || restaurant.address || "",
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      description: profile.description,
      heroImage: profile.heroImage,
      galleryImages: profile.galleryImages,
      highlights: profile.highlights,
      menuUrl: profile.menuUrl,
      menuSections: profile.menuSections,
      averageTicket: Number(restaurant.averageTicket || 0),
      commissionType: agreement && isCommissionType(agreement.commissionType) ? agreement.commissionType : isCommissionType(restaurant.referralDefaultCommissionType) ? restaurant.referralDefaultCommissionType : "PER_PERSON" as const,
      commissionAmount: isDemo ? 1.5 : Number(agreement?.commissionAmount ?? restaurant.referralDefaultCommissionAmount),
      defaultDailyCapacity: isDemo ? Math.max(80, restaurant.referralDefaultDailyCapacity) : restaurant.referralDefaultDailyCapacity,
      dailyAvailability: restaurant.referralDailyCapacities.map((item) => ({
        date: item.date.toISOString().slice(0, 10),
        capacity: item.enabled ? item.capacity : 0,
        reserved: reservedByDay[item.date.toISOString().slice(0, 10)] || 0,
      })),
      reservedByDay,
      googleRating: restaurant.googleRating ?? (isDemo ? 4.6 : null),
      googleReviewCount: restaurant.googleReviewCount ?? (isDemo ? 284 : null),
      googlePriceLevel: restaurant.googlePriceLevel ?? (isDemo ? 2 : null),
      googleMapsUrl: restaurant.googleReviewUrl || "",
      googleBusinessConnected: Boolean(restaurant.googleBusinessConnectedAt),
      negotiationStatus: negotiation?.status || null,
      negotiationRequestId: negotiation?.id || null,
      negotiationInitiator: negotiation?.initiator || null,
      negotiationType: negotiation && isCommissionType(negotiation.commissionType) ? negotiation.commissionType : null,
      negotiationAmount: negotiation ? Number(negotiation.commissionAmount) : null,
      negotiationMessage: negotiation?.message || null,
    };
  });

  const paidRevenue = Math.max(0, Number(paidTotals._sum.partnerInvoiceTotal || 0) - Number(paidTotals._sum.reversedAmount || 0));
  const pendingRevenue = Number(pendingTotals._sum.partnerInvoiceTotal || 0);
  const invoicedRevenue = Number(invoicedTotals._sum.partnerInvoiceTotal || 0);
  const toInvoiceRevenue = Number(toInvoiceTotals._sum.partnerInvoiceTotal || 0);

  return (
    <main className="min-h-screen bg-[#F3EEE6] text-[#17120D]" style={{ backgroundImage: "radial-gradient(circle at 8% 5%, rgba(215,178,103,.18), transparent 24rem), radial-gradient(circle at 92% 28%, rgba(111,137,107,.10), transparent 28rem)" }}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#17120D]/95 px-4 py-3 text-white shadow-[0_10px_35px_rgba(23,18,13,0.16)] backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
          <Link href="/partners/app" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[15px] bg-[#D7B267] text-lg font-black text-[#17120D]">M</span><span><span className="block text-xl font-black tracking-[-0.07em] sm:text-2xl"><span className="text-[#D7B267]">Mesa</span>Link</span><span className="block text-[7px] font-black uppercase tracking-[0.24em] text-white/40">Partner Network</span></span></Link>
          <div className="flex items-center gap-2 sm:gap-3"><PartnerCodeCopy code={partner.partnerCode} /><div className="hidden border-l border-white/10 pl-3 text-right lg:block"><p className="text-xs font-semibold">{partner.businessName}</p><p className={`mt-0.5 text-[8px] font-black uppercase tracking-[0.15em] ${partner.status === "ACTIVE" ? "text-[#9BC99D]" : "text-[#E1C47E]"}`}>{partner.status === "ACTIVE" ? "Conta verificada" : "Verificação pendente"}</p></div><PartnerSignOutButton /></div>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-4 pb-16 pt-5 sm:px-6 sm:pt-6">
        <nav className="mb-5 grid grid-cols-2 gap-1.5 rounded-[22px] border border-[#D9C7AA] bg-white/70 p-1.5 shadow-[0_12px_35px_rgba(79,56,32,0.06)] backdrop-blur-xl sm:grid-cols-4 lg:w-fit">
          {[
            { id: "groups", label: "Nova reserva", note: "Escolher restaurante", icon: <CalendarPlus2 size={14} /> },
            { id: "history", label: "Reservas", note: "Histórico e faturas", icon: <FileText size={14} /> },
            { id: "stats", label: "Resultados", note: "Receita gerada", icon: <BarChart3 size={14} /> },
            { id: "account", label: "Pagamentos", note: "IBAN e estado", icon: <Landmark size={14} /> },
          ].map((item) => (
            <Link key={item.id} href={`/partners/app?tab=${item.id}`} className={`relative flex min-h-12 items-center gap-2.5 rounded-[16px] px-3 py-2 text-[11px] font-bold transition ${tab === item.id ? "bg-[#17120D] text-white shadow-[0_9px_24px_rgba(23,18,13,0.2)]" : "text-[#5F574F] hover:bg-white"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[11px] ${tab === item.id ? "bg-[#D7B267] text-[#17120D]" : "bg-[#F1E6D5] text-[#8A6130]"}`}>{item.icon}</span><span className="min-w-0"><span className="block truncate">{item.label}</span><span className={`hidden truncate text-[8px] font-medium sm:block ${tab === item.id ? "text-white/40" : "text-[#918577]"}`}>{item.note}</span></span>
              {item.id === "account" && !partner.stripeOnboardingComplete && <span className="h-2 w-2 rounded-full bg-[#D79A4A]" />}
            </Link>
          ))}
        </nav>

        {tab === "account" && !partner.stripeOnboardingComplete && (
          <section className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#2C2117] bg-[#17120D] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.23em] text-[#D7B267]">Pagamentos</p>
              <h2 className="mt-2 text-xl font-semibold">Ativa a conta para receber os pagamentos.</h2>
              <p className="mt-1 text-xs leading-5 text-white/50">Introduz o teu IBAN no ambiente seguro Stripe Connect. O MesaLink nunca mostra os teus dados bancários aos restaurantes e os pagamentos são processados semanalmente.</p>
              {connect === "pending" && <p className="mt-2 text-xs font-semibold text-[#E8C985]">Ainda faltam dados no processo de verificação.</p>}
            </div>
            <form action="/api/partners/connect" method="POST">
              <button className="h-12 w-full whitespace-nowrap rounded-full bg-[#D7B267] px-6 text-sm font-black text-[#17120D] sm:w-auto">Adicionar IBAN e verificar</button>
            </form>
          </section>
        )}

        {tab === "account" && partner.stripeOnboardingComplete && connect === "complete" && (
          <div className="mb-6 rounded-[22px] border border-[#A8D3A6] bg-[#EFF9EF] px-5 py-4 text-sm font-semibold text-[#3F6A4D]">Pagamentos verificados. A conta está pronta para receber comissões.</div>
        )}
        {tab === "account" && connect === "platform-not-enabled" && <div className="mb-6 rounded-[20px] border border-[#E8C8B9] bg-[#FFF0EA] px-5 py-4 text-sm leading-6 text-[#934A35]"><strong>Validação bancária temporariamente indisponível.</strong> A ativação central de pagamentos do MesaLink está a ser concluída no Stripe. Não precisas de repetir dados nem criar outra conta; o botão ficará disponível assim que essa validação única terminar.</div>}
        {tab === "account" && connect === "retry" && <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-[#D8C29E] bg-[#FFF7E8] px-5 py-4 text-sm text-[#795D38] sm:flex-row sm:items-center sm:justify-between"><p>Não foi possível concluir aquela sessão. Abre uma ligação segura nova.</p><form action="/api/partners/connect" method="POST"><button className="h-10 whitespace-nowrap rounded-full bg-[#17120D] px-5 text-xs font-bold text-white">Adicionar IBAN</button></form></div>}
        {tab === "account" && connect === "unavailable" && <div className="mb-6 rounded-[22px] border border-[#E8C8B9] bg-[#FFF0EA] px-5 py-4 text-sm font-semibold text-[#934A35]">Não foi possível abrir agora a verificação bancária Stripe. Nenhum dado foi perdido; tenta novamente dentro de alguns minutos.</div>}

        {tab === "groups" && <>
        <section className="relative overflow-hidden rounded-[28px] bg-[#17120D] p-5 text-white shadow-[0_22px_55px_rgba(23,18,13,0.16)] sm:p-6" style={{ backgroundImage: "radial-gradient(circle at 78% 20%, rgba(215,178,103,.24), transparent 22rem), linear-gradient(125deg, rgba(255,255,255,.025), transparent 48%)" }}>
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#D7B267]"><Sparkles size={13} /> MesaLink Partners</div><h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-[2.65rem]">Reserva o restaurante certo. A comissão fica registada.</h1><p className="mt-3 max-w-2xl text-xs leading-5 text-white/52 sm:text-sm">Disponibilidade real, confirmação imediata e todo o histórico numa única conta.</p></div><div className="grid grid-cols-3 gap-2"><PartnerHeroMetric label="Restaurantes" value={String(restaurantOptions.length)} /><PartnerHeroMetric label="Próximas" value={String(upcomingGroupsCount)} /><PartnerHeroMetric label="Recebido" value={formatMoney(paidRevenue)} /></div></div>
          <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[9px] font-semibold text-white/48"><span className="inline-flex items-center gap-1.5 text-[#9BC99D]"><ShieldCheck size={13} /> Contactos protegidos</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> Comissão definida pelo restaurante</span><span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Pagamentos acompanhados na app</span></div>
        </section>

        <div className="mt-5"><NewReferralGroupForm restaurants={restaurantOptions} publishingEnabled={partner.stripeOnboardingComplete} /></div>
        </>}

        {tab === "stats" && <>
        <section className="relative overflow-hidden rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_12px_34px_rgba(75,52,29,0.04)] sm:p-6">
          <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#D7B267] to-[#526F57]" /><p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Desempenho</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">O valor que já geraste.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">Faturação, pagamentos e reservas — com o próximo passo sempre visível.</p>
        </section>
        <section className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={<Euro size={15} />} label="Faturado · base" value={formatMoney(invoicedRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Por faturar" value={formatMoney(toInvoiceRevenue)} />
          <Kpi icon={<Clock3 size={15} />} label="Por receber" value={formatMoney(pendingRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Já recebido" value={formatMoney(paidRevenue)} />
          <Kpi icon={<UsersRound size={15} />} label="Reservas geradas" value={String(acceptedGroupsCount)} />
          <Kpi icon={<Clock3 size={15} />} label="Próximas reservas" value={String(upcomingGroupsCount)} />
        </section>
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <StatDetail title="Valor líquido" value="Automático" note="Comissão MesaLink, taxas e impostos são descontados no cálculo final." />
          <StatDetail title="Pagamento" value="Semanal" note="Inclui apenas faturas anexadas e verificadas." />
          <StatDetail title="Faturas por tratar" value={formatMoney(toInvoiceRevenue)} note="Tens 30 dias após a cobrança para anexar uma fatura válida." />
        </section>
        </>}

        {tab === "history" && <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_12px_34px_rgba(75,52,29,0.04)] sm:p-6">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Histórico e faturas</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">As tuas reservas</h2><p className="mt-2 text-xs text-[#6B6258]">Acompanha o restaurante, a visita, a fatura e o pagamento no mesmo registo.</p></div><span className="rounded-full bg-[#F1E6D5] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#795D38]">{partner.groups.length} registos</span></div>
          <div className="mt-6 space-y-3">
            {partner.groups.map((group) => {
              const type = isCommissionType(group.commissionType) ? group.commissionType : "TOTAL";
              const amounts = calculateReferralCommission({ guests: group.guests, commissionType: type, commissionAmount: Number(group.commissionAmount) });
              const accepted = group.acceptedRestaurant?.name;
              return <div key={group.id} className="grid gap-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFFDFC] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><Status status={group.status} /></div><p className="mt-2 text-sm text-[#6B6258]">{group.actualGuests != null ? `${group.actualGuests} pessoas confirmadas · reserva inicial ${group.guests}` : groupPeople(group)} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)} · {accepted || "Reserva em processamento"}</p><PartnerInvoiceState group={group} /></div>
                <div className="flex items-center justify-between gap-5 sm:text-right"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A7863]">{partnerPaymentLabel(group.payment?.status)}</p><p className="mt-1 font-semibold text-[#6C4B25]">{formatMoney(Number(group.payment?.partnerInvoiceTotal || group.payment?.partnerNet || amounts.partnerNet))}</p><p className="text-[9px] text-[#8A7863]">líquido · comissão e taxas descontadas</p></div><ArrowUpRight size={18} className="text-[#9B6F3B]" /></div>
              </div>;
            })}
            {partner.groups.length === 0 && <div className="rounded-[24px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-8 text-center text-sm text-[#6B6258]">A primeira reserva que criares aparece aqui.</div>}
          </div>
        </section>}

        {tab === "account" && <><div className="mb-4"><PushNotificationToggle apiPath="/api/partners/push" storageKey="mesalink:partner-notifications" title="Notificações da app Partners" description="Recebe avisos importantes sobre reservas, comissões e pagamentos." /></div><section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[26px] border border-[#E1D0B8] bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Dados de pagamento</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Conta bancária e verificação</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B6258]">O IBAN e os documentos são recolhidos diretamente pelo Stripe. O MesaLink não guarda nem mostra os teus dados bancários.</p>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-[20px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
              <div><p className="text-sm font-bold">Estado da conta</p><p className="mt-1 text-xs text-[#6B6258]">{partner.stripeOnboardingComplete ? "IBAN verificado e pagamentos ativos." : "Falta concluir a validação bancária."}</p></div>
              <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] ${partner.stripeOnboardingComplete ? "bg-[#E7F4E7] text-[#3F6A4D]" : "bg-[#FFF0CB] text-[#7A592F]"}`}>{partner.stripeOnboardingComplete ? "Verificado" : "Pendente"}</span>
            </div>
          </div>
          <div className="rounded-[26px] border border-[#2C2117] bg-[#17120D] p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D7B267]">Pagamentos</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.045em]">Pagamento semanal</p>
            <p className="mt-2 text-xs leading-5 text-white/55">O valor líquido considera a comissão MesaLink, taxas de processamento e impostos aplicáveis.</p>
            <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/55">Recebes semanalmente os valores com fatura verificada. A fatura tem de ser anexada até 30 dias após a cobrança; sem ela, o valor é devolvido ao restaurante e perdes esse montante.</div>
          </div>
        </section></>}
      </div>
    </main>
  );
}

type PartnerHistoryGroup = {
  id: string;
  status: string;
  desiredDate: Date;
  actualGuests: number | null;
  payment: null | {
    status: string;
    capturedAt: Date | null;
    refundedAt: Date | null;
    stripeInvoiceId: string | null;
    stripeInvoiceUrl: string | null;
    stripeInvoicePdfUrl: string | null;
    partnerInvoiceStatus: string;
    partnerInvoiceUrl: string | null;
    partnerInvoiceNumber: string | null;
    partnerInvoiceRejectionReason: string | null;
    partnerInvoiceBase: unknown;
    partnerInvoiceTax: unknown;
    partnerInvoiceTotal: unknown;
    currency: string;
  };
  acceptedRestaurant: null | {
    billingLegalName: string | null;
    billingTaxId: string | null;
    billingAddressLine1: string | null;
    billingPostalCode: string | null;
    billingCity: string | null;
    billingCountry: string | null;
  };
};

function PartnerInvoiceState({ group }: { group: PartnerHistoryGroup }) {
  const payment = group.payment;
  if (!payment) return null;
  const mesaLinkInvoiceUrl = payment.stripeInvoicePdfUrl || payment.stripeInvoiceUrl;
  const mesaLinkDocument = mesaLinkInvoiceUrl ? <a href={mesaLinkInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#D9C6A8] bg-white px-3 text-[10px] font-black text-[#6C4B25]"><FileText size={12} /> Fatura MesaLink · PDF</a> : null;
  const now = new Date();
  if (group.status === "REFUNDED" || payment.status === "REFUNDED_INVOICE_EXPIRED") {
    return <div className="mt-3 rounded-xl border border-[#E6B8A9] bg-[#FFF0EA] p-3 text-[11px] font-semibold leading-5 text-[#934A35]">Prazo de faturação terminado. Como não foi anexada uma fatura válida em 30 dias, o dinheiro foi devolvido ao restaurante e este montante deixou de estar disponível.</div>;
  }
  if (group.status === "BOOKED") {
    const attendanceDeadline = referralAttendanceDeadline(group.desiredDate);
    const text = group.desiredDate > now
      ? `Após a visita, o restaurante tem até ${formatDateTime(attendanceDeadline)} para confirmar as pessoas.`
      : attendanceDeadline > now
        ? `O restaurante está a confirmar a visita. O prazo termina em ${formatDateTime(attendanceDeadline)}.`
        : "O prazo de 3 dias terminou. A cobrança automática está a ser processada.";
    return <div className="mt-3 flex flex-wrap items-center gap-2">{mesaLinkDocument}<div className="w-fit rounded-full border border-[#E4D2B4] bg-[#FFF3DC] px-3 py-1.5 text-[10px] font-bold text-[#795D38]">{text}</div></div>;
  }
  if (!payment.capturedAt || !["COMPLETED", "PAID"].includes(group.status)) {
    return <div className="mt-3 flex flex-wrap items-center gap-2">{mesaLinkDocument}<div className="w-fit rounded-full border border-[#E4D2B4] bg-[#FFF3DC] px-3 py-1.5 text-[10px] font-bold text-[#795D38]">A cobrança está a ser regularizada pelo restaurante.</div></div>;
  }
  const invoiceDeadline = referralInvoiceDeadline(payment.capturedAt);
  const deadlineLabel = formatDateTime(invoiceDeadline);
  const recipient = group.acceptedRestaurant ? {
    legalName: group.acceptedRestaurant.billingLegalName,
    taxId: group.acceptedRestaurant.billingTaxId,
    addressLine1: group.acceptedRestaurant.billingAddressLine1,
    postalCode: group.acceptedRestaurant.billingPostalCode,
    city: group.acceptedRestaurant.billingCity,
    country: group.acceptedRestaurant.billingCountry,
  } : undefined;
  if (payment.partnerInvoiceStatus === "VERIFIED") return <div className="mt-3 flex flex-wrap items-center gap-2">{mesaLinkDocument}<a href={payment.partnerInvoiceUrl || "#"} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#BFD8C2] bg-[#F3FAF2] px-3 text-[10px] font-black text-[#3F6A4D]"><FileCheck2 size={12} /> A tua fatura {payment.partnerInvoiceNumber} · PDF</a><span className="rounded-full bg-[#E7F4E7] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#3F6A4D]">Verificada · pagamento semanal</span></div>;
  if (payment.partnerInvoiceStatus === "PENDING") return <div className="mt-3 flex flex-wrap items-center gap-2">{mesaLinkDocument}<a href={payment.partnerInvoiceUrl || "#"} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#D9C6A8] bg-white px-3 text-[10px] font-black text-[#6C4B25]"><FileText size={12} /> A tua fatura {payment.partnerInvoiceNumber} · PDF</a><span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#7A592F]">Em verificação · enviada dentro do prazo</span></div>;
  return <div className="mt-3">{mesaLinkDocument && <div className="mb-2">{mesaLinkDocument}</div>}<p className="mb-2 rounded-xl border border-[#E8C97D] bg-[#FFF7DF] p-3 text-[11px] font-semibold leading-5 text-[#715023]">Tens até <strong>{deadlineLabel}</strong> para anexar uma fatura válida. Depois desse prazo, o dinheiro é devolvido ao restaurante e perdes este montante.</p>{payment.partnerInvoiceStatus === "REJECTED" && <p className="mb-2 rounded-xl border border-[#E8C8B9] bg-[#FFF0EA] p-3 text-xs font-semibold text-[#934A35]">Fatura rejeitada: {payment.partnerInvoiceRejectionReason || "corrige os dados e volta a anexar."}</p>}<PartnerInvoiceUpload groupId={group.id} deadline={invoiceDeadline.toISOString()} recipient={recipient} amount={{ base: Number(payment.partnerInvoiceBase), tax: Number(payment.partnerInvoiceTax), total: Number(payment.partnerInvoiceTotal), currency: payment.currency }} /></div>;
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[16px] border border-[#E1D0B8] bg-white p-3"><div className="flex items-center gap-1.5 text-[#9B6F3B]">{icon}<p className="text-[7px] font-black uppercase tracking-[0.1em] text-[#8B7D6D]">{label}</p></div><p className="mt-1.5 text-lg font-semibold tracking-[-0.04em]">{value}</p></div>;
}

function PartnerHeroMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[76px] rounded-[16px] border border-white/10 bg-white/[0.055] px-3 py-2.5 backdrop-blur"><p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p><p className="mt-1 truncate text-base font-semibold tracking-[-0.035em] text-[#F2D79C]">{value}</p></div>;
}

function StatDetail({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="rounded-[22px] border border-[#E1D0B8] bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#8A7863]">{title}</p><p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{value}</p><p className="mt-2 text-xs leading-5 text-[#6B6258]">{note}</p></div>;
}

function Status({ status }: { status: string }) {
  const label = status === "OPEN" ? "À espera" : status === "ACCEPTED" || status === "BOOKED" ? "Aceite" : status === "COMPLETED" || status === "PAID" ? "Concluído" : status === "REFUNDED" ? "Reembolsado" : status === "PARTIALLY_REFUNDED" ? "Reembolso parcial" : status === "DISPUTED" ? "Pagamento contestado" : status === "CANCELLED" ? "Cancelado" : status;
  return <span className="rounded-full border border-[#DCCCAD] bg-[#FFF9ED] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#7D5B31]">{label}</span>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
}

function partnerPaymentLabel(status?: string) {
  if (["TRANSFERRED", "PAID"].includes(status || "")) return "Recebido";
  if (status === "CAPTURED_AWAITING_PAYOUT") return "Pagamento semanal";
  if (status === "AUTHORIZED") return "Garantido";
  if (status === "CANCELLED_NO_SHOW") return "Sem comissão";
  if (status === "REFUNDED_INVOICE_EXPIRED") return "Prazo perdido · devolvido";
  return "Comissão prevista";
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(value);
}

function groupPeople(group: { guests: number; adults: number | null; children: number }) {
  const children = Math.max(0, group.children || 0);
  const adults = group.adults ?? Math.max(1, group.guests - children);
  return `${adults} ${adults === 1 ? "adulto" : "adultos"}${children > 0 ? ` · ${children} ${children === 1 ? "criança" : "crianças"}` : ""}`;
}
