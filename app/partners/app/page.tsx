import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, Clock3, Euro, FileText, Landmark, ShieldCheck, UsersRound } from "lucide-react";
import NewReferralGroupForm from "@/components/partners/NewReferralGroupForm";
import PartnerInvoiceUpload from "@/components/partners/PartnerInvoiceUpload";
import PartnerSignOutButton from "@/components/partners/PartnerSignOutButton";
import { requirePartner } from "@/lib/partner-auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { calculateReferralCommission, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

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
          offers: { select: { status: true } },
        },
      },
    },
  });
  if (!partner) redirect("/partners/login");

  const requestTime = new Date();
  const invoiceCutoff = new Date(requestTime.getTime() - 24 * 60 * 60 * 1000);
  const [restaurants, paidTotals, pendingTotals, invoicedTotals, toInvoiceTotals, acceptedGroupsCount, pendingGroupsCount] = await Promise.all([
    prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
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
        partnerInvoiceStatus: { in: ["MISSING", "REJECTED"] },
        group: { status: { in: ["COMPLETED", "PAID"] }, desiredDate: { lte: invoiceCutoff } },
      },
      _sum: { partnerInvoiceTotal: true },
    }),
    prisma.referralGroup.count({ where: { partnerId: partner.id, status: { in: ["BOOKED", "COMPLETED", "PAID"] } } }),
    prisma.referralGroup.count({ where: { partnerId: partner.id, status: "OPEN" } }),
  ]);

  const restaurantOptions = restaurants.map((restaurant) => {
    const profile = buildPartnerProfile(restaurant);
    return {
      id: restaurant.id,
      name: restaurant.name,
      isDemo: restaurant.slug.includes("demo"),
      cuisine: profile.cuisine,
      address: restaurant.address || "",
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      description: profile.description,
      heroImage: profile.heroImage,
      galleryImages: profile.galleryImages,
      highlights: profile.highlights,
      menuUrl: profile.menuUrl,
      menuSections: profile.menuSections,
      averageTicket: Number(restaurant.averageTicket || 0),
    };
  });

  const paidRevenue = Math.max(0, Number(paidTotals._sum.partnerInvoiceTotal || 0) - Number(paidTotals._sum.reversedAmount || 0));
  const pendingRevenue = Number(pendingTotals._sum.partnerInvoiceTotal || 0);
  const invoicedRevenue = Number(invoicedTotals._sum.partnerInvoiceTotal || 0);
  const toInvoiceRevenue = Number(toInvoiceTotals._sum.partnerInvoiceTotal || 0);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <header className="sticky top-0 z-40 border-b border-[#E1D0B8] bg-[#F5EFE6]/92 px-4 py-4 backdrop-blur-2xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/partners/app" className="text-2xl font-black tracking-[-0.08em] sm:text-3xl"><span className="text-[#C8A56A]">Mesa</span>Link <span className="text-xs font-semibold tracking-normal text-[#8A6130]">Partners</span></Link>
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{partner.businessName}</p><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A7863]">{partner.status === "ACTIVE" ? "Verificado" : "Verificação pendente"}</p></div><PartnerSignOutButton /></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6">
        <nav className="mb-6 grid grid-cols-2 gap-1.5 rounded-[22px] border border-[#D9C7AA] bg-[#EDE2D1] p-1.5 shadow-[0_10px_30px_rgba(79,56,32,0.06)] sm:grid-cols-4 lg:w-fit">
          {[
            { id: "groups", label: "Novo pedido", icon: <UsersRound size={14} /> },
            { id: "history", label: "Reservas", icon: <FileText size={14} /> },
            { id: "stats", label: "Resultados", icon: <BarChart3 size={14} /> },
            { id: "account", label: "Pagamentos", icon: <Landmark size={14} /> },
          ].map((item) => (
            <Link key={item.id} href={`/partners/app?tab=${item.id}`} className={`relative flex min-h-11 items-center gap-2 rounded-[16px] px-3 py-2 text-[11px] font-bold transition ${tab === item.id ? "bg-[#17120D] text-white shadow-[0_8px_20px_rgba(23,18,13,0.18)]" : "bg-white/45 text-[#6B6258] hover:bg-white"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl ${tab === item.id ? "bg-[#D7B267] text-[#17120D]" : "bg-white text-[#8A6130]"}`}>{item.icon}</span><span className="truncate">{item.label}</span>
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
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Partner app</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Encontra o restaurante certo para cada grupo.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">Sem partilhar a identidade do cliente. O restaurante vê apenas o que precisa para aceitar e preparar o serviço.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#BAD8B7] bg-[#EFF9EF] px-4 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={16} /> Privacidade ativa</div>
        </section>

        <NewReferralGroupForm restaurants={restaurantOptions} publishingEnabled={partner.stripeOnboardingComplete} />
        </>}

        {tab === "stats" && <>
        <section className="flex flex-col gap-2">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Desempenho</p>
          <h1 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">O que já geraste com a rede.</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#6B6258]">Valores de faturação, pagamentos e grupos num resumo simples.</p>
        </section>
        <section className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={<Euro size={15} />} label="Faturado · base" value={formatMoney(invoicedRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Por faturar" value={formatMoney(toInvoiceRevenue)} />
          <Kpi icon={<Clock3 size={15} />} label="Por receber" value={formatMoney(pendingRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Já recebido" value={formatMoney(paidRevenue)} />
          <Kpi icon={<UsersRound size={15} />} label="Grupos aceites" value={String(acceptedGroupsCount)} />
          <Kpi icon={<Clock3 size={15} />} label="A aguardar" value={String(pendingGroupsCount)} />
        </section>
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <StatDetail title="Valor líquido" value="Automático" note="Comissão MesaLink, taxas e impostos são descontados no cálculo final." />
          <StatDetail title="Pagamento" value="Semanal" note="Inclui apenas faturas anexadas e verificadas." />
          <StatDetail title="Faturas por tratar" value={formatMoney(toInvoiceRevenue)} note="Ficam disponíveis 24h após a reserva." />
        </section>
        </>}

        {tab === "history" && <section className="rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Histórico</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Grupos publicados</h2></div></div>
          <div className="mt-6 space-y-3">
            {partner.groups.map((group) => {
              const type = isCommissionType(group.commissionType) ? group.commissionType : "TOTAL";
              const amounts = calculateReferralCommission({ guests: group.guests, commissionType: type, commissionAmount: Number(group.commissionAmount) });
              const accepted = group.acceptedRestaurant?.name;
              return <div key={group.id} className="grid gap-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFFDFC] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><Status status={group.status} /></div><p className="mt-2 text-sm text-[#6B6258]">{group.actualGuests != null ? `${group.actualGuests} pessoas confirmadas · pedido inicial ${group.guests}` : groupPeople(group)} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)} · {accepted || `${group.offers.filter((offer) => offer.status === "PENDING").length} respostas pendentes`}</p><PartnerInvoiceState group={group} /></div>
                <div className="flex items-center justify-between gap-5 sm:text-right"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A7863]">{partnerPaymentLabel(group.payment?.status)}</p><p className="mt-1 font-semibold text-[#6C4B25]">{formatMoney(Number(group.payment?.partnerInvoiceTotal || group.payment?.partnerNet || amounts.partnerNet))}</p><p className="text-[9px] text-[#8A7863]">líquido · comissão e taxas descontadas</p></div><ArrowUpRight size={18} className="text-[#9B6F3B]" /></div>
              </div>;
            })}
            {partner.groups.length === 0 && <div className="rounded-[24px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-8 text-center text-sm text-[#6B6258]">O primeiro grupo que publicares aparece aqui.</div>}
          </div>
        </section>}

        {tab === "account" && <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
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
            <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/55">Disponível após a visita e a verificação da respetiva fatura.</div>
          </div>
        </section>}
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
  const invoiceAvailableAt = new Date(group.desiredDate.getTime() + 24 * 60 * 60 * 1000);
  if (invoiceAvailableAt > new Date()) {
    return <div className="mt-3 w-fit rounded-full border border-[#D8C6A9] bg-[#FFF9F0] px-3 py-1.5 text-[10px] font-bold text-[#795D38]">Fatura disponível após {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(invoiceAvailableAt)} · tempo para o restaurante confirmar as pessoas</div>;
  }
  if (!["COMPLETED", "PAID"].includes(group.status)) {
    return <div className="mt-3 w-fit rounded-full border border-[#E4D2B4] bg-[#FFF3DC] px-3 py-1.5 text-[10px] font-bold text-[#795D38]">24h concluídas · a aguardar o restaurante confirmar o número final de pessoas</div>;
  }
  const recipient = group.acceptedRestaurant ? {
    legalName: group.acceptedRestaurant.billingLegalName,
    taxId: group.acceptedRestaurant.billingTaxId,
    addressLine1: group.acceptedRestaurant.billingAddressLine1,
    postalCode: group.acceptedRestaurant.billingPostalCode,
    city: group.acceptedRestaurant.billingCity,
    country: group.acceptedRestaurant.billingCountry,
  } : undefined;
  if (payment.partnerInvoiceStatus === "VERIFIED") return <div className="mt-3 flex flex-wrap items-center gap-2"><a href={payment.partnerInvoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-[#3F6A4D] underline">Fatura {payment.partnerInvoiceNumber} · abrir PDF</a><span className="rounded-full bg-[#E7F4E7] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#3F6A4D]">Verificada · pagamento autorizado</span></div>;
  if (payment.partnerInvoiceStatus === "PENDING") return <div className="mt-3 flex flex-wrap items-center gap-2"><a href={payment.partnerInvoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-[#6C4B25] underline">Fatura {payment.partnerInvoiceNumber} · abrir PDF</a><span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#7A592F]">Em verificação</span></div>;
  return <>{payment.partnerInvoiceStatus === "REJECTED" && <p className="mt-3 rounded-xl border border-[#E8C8B9] bg-[#FFF0EA] p-3 text-xs font-semibold text-[#934A35]">Fatura rejeitada: {payment.partnerInvoiceRejectionReason || "corrige os dados e volta a anexar."}</p>}<PartnerInvoiceUpload groupId={group.id} recipient={recipient} amount={{ base: Number(payment.partnerInvoiceBase), tax: Number(payment.partnerInvoiceTax), total: Number(payment.partnerInvoiceTotal), currency: payment.currency }} /></>;
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-[16px] border border-[#E1D0B8] bg-white p-3"><div className="flex items-center gap-1.5 text-[#9B6F3B]">{icon}<p className="text-[7px] font-black uppercase tracking-[0.1em] text-[#8B7D6D]">{label}</p></div><p className="mt-1.5 text-lg font-semibold tracking-[-0.04em]">{value}</p></div>;
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
  return "Comissão prevista";
}

function groupPeople(group: { guests: number; adults: number | null; children: number }) {
  const children = Math.max(0, group.children || 0);
  const adults = group.adults ?? Math.max(1, group.guests - children);
  return `${adults} ${adults === 1 ? "adulto" : "adultos"}${children > 0 ? ` · ${children} ${children === 1 ? "criança" : "crianças"}` : ""}`;
}
