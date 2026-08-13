import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowUpRight, Clock3, Euro, ShieldCheck, UsersRound } from "lucide-react";
import NewReferralGroupForm from "@/components/partners/NewReferralGroupForm";
import PartnerInvoiceUpload from "@/components/partners/PartnerInvoiceUpload";
import PartnerOnboardingForm from "@/components/partners/PartnerOnboardingForm";
import { authOptions } from "@/lib/auth";
import { buildPartnerProfile } from "@/lib/partner-profile";
import { calculateReferralCommission, isCommissionType } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";

export default async function PartnerAppPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const { connect } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/partners/app");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      referralPartner: {
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
      },
    },
  });

  if (!user) redirect("/login?callbackUrl=/partners/app");
  const partner = user.referralPartner;

  if (!partner) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] px-4 py-8 text-[#17120D]">
        <div className="mx-auto max-w-xl">
          <Link href="/partners" className="text-3xl font-black tracking-[-0.08em]"><span className="text-[#C8A56A]">Mesa</span>Link <span className="text-sm font-semibold tracking-normal text-[#8A6130]">Partners</span></Link>
          <div className="mt-8 rounded-[36px] border border-[#E1D0B8] bg-white p-7 shadow-[0_28px_90px_rgba(80,55,30,0.1)] sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Ativar Partner</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Cria o perfil da tua organização.</h1>
            <p className="mt-3 text-sm leading-6 text-[#6B6258]">Esta conta já existe no MesaLink. Só precisamos dos dados profissionais e da comissão sugerida.</p>
            <PartnerOnboardingForm />
          </div>
        </div>
      </main>
    );
  }

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
          <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{partner.businessName}</p><p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#8A7863]">{partner.status === "ACTIVE" ? "Verificado" : "Verificação pendente"}</p></div><Link href="/dashboard" className="rounded-full border border-[#D8C6A9] bg-white px-4 py-2 text-xs font-bold">MesaLink</Link></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6">
        <nav className="mb-7 inline-flex rounded-full border border-[#D9C7AA] bg-white p-1"><Link href="/partners/app" className="rounded-full bg-[#17120D] px-5 py-2.5 text-xs font-bold text-white">Grupos e pagamentos</Link></nav>
        {!partner.stripeOnboardingComplete && (
          <section className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#2C2117] bg-[#17120D] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.23em] text-[#D7B267]">Pagamentos</p>
              <h2 className="mt-2 text-xl font-semibold">Ativa a conta verificada para receber os 85%.</h2>
              <p className="mt-1 text-xs leading-5 text-white/50">Introduz o teu IBAN no ambiente seguro Stripe Connect. O MesaLink nunca mostra os teus dados bancários aos restaurantes e os pagamentos são processados semanalmente.</p>
              {connect === "pending" && <p className="mt-2 text-xs font-semibold text-[#E8C985]">Ainda faltam dados no processo de verificação.</p>}
            </div>
            <form action="/api/partners/connect" method="POST">
              <button className="h-12 w-full whitespace-nowrap rounded-full bg-[#D7B267] px-6 text-sm font-black text-[#17120D] sm:w-auto">Adicionar IBAN e verificar</button>
            </form>
          </section>
        )}

        {partner.stripeOnboardingComplete && connect === "complete" && (
          <div className="mb-6 rounded-[22px] border border-[#A8D3A6] bg-[#EFF9EF] px-5 py-4 text-sm font-semibold text-[#3F6A4D]">Pagamentos verificados. A conta está pronta para receber comissões.</div>
        )}
        {connect === "platform-not-enabled" && <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-[#E8C8B9] bg-[#FFF0EA] px-5 py-4 text-sm text-[#934A35] sm:flex-row sm:items-center sm:justify-between"><p><strong>O Stripe Connect já foi ativado.</strong> A tentativa anterior ficou desatualizada; inicia novamente a validação do IBAN.</p><form action="/api/partners/connect" method="POST"><button className="h-10 whitespace-nowrap rounded-full bg-[#17120D] px-5 text-xs font-bold text-white">Tentar novamente</button></form></div>}
        {connect === "retry" && <div className="mb-6 flex flex-col gap-3 rounded-[20px] border border-[#D8C29E] bg-[#FFF7E8] px-5 py-4 text-sm text-[#795D38] sm:flex-row sm:items-center sm:justify-between"><p><strong>O Connect está ativo.</strong> Não foi possível concluir aquela tentativa; abre uma ligação nova e segura.</p><form action="/api/partners/connect" method="POST"><button className="h-10 whitespace-nowrap rounded-full bg-[#17120D] px-5 text-xs font-bold text-white">Adicionar IBAN</button></form></div>}
        {connect === "unavailable" && <div className="mb-6 rounded-[22px] border border-[#E8C8B9] bg-[#FFF0EA] px-5 py-4 text-sm font-semibold text-[#934A35]">Não foi possível abrir agora a verificação bancária Stripe. Nenhum dado foi perdido; tenta novamente dentro de alguns minutos.</div>}

        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Partner app</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">Encontra o restaurante certo para cada grupo.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">Sem partilhar a identidade do cliente. O restaurante vê apenas o que precisa para aceitar e preparar o serviço.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#BAD8B7] bg-[#EFF9EF] px-4 py-2 text-xs font-bold text-[#3F6A4D]"><ShieldCheck size={16} /> Privacidade ativa</div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={<Euro size={15} />} label="Faturado · base" value={formatMoney(invoicedRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Por faturar" value={formatMoney(toInvoiceRevenue)} />
          <Kpi icon={<Clock3 size={15} />} label="Por receber" value={formatMoney(pendingRevenue)} />
          <Kpi icon={<Euro size={15} />} label="Já recebido" value={formatMoney(paidRevenue)} />
          <Kpi icon={<UsersRound size={15} />} label="Grupos aceites" value={String(acceptedGroupsCount)} />
          <Kpi icon={<Clock3 size={15} />} label="A aguardar" value={String(pendingGroupsCount)} />
        </section>

        <NewReferralGroupForm restaurants={restaurantOptions} defaultCommissionType={partner.defaultCommissionType} defaultCommissionAmount={1} publishingEnabled={partner.stripeOnboardingComplete} />

        <section className="mt-7 rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Histórico</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Grupos publicados</h2></div></div>
          <div className="mt-6 space-y-3">
            {partner.groups.map((group) => {
              const type = isCommissionType(group.commissionType) ? group.commissionType : "TOTAL";
              const amounts = calculateReferralCommission({ guests: group.guests, commissionType: type, commissionAmount: Number(group.commissionAmount) });
              const accepted = group.acceptedRestaurant?.name;
              return <div key={group.id} className="grid gap-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFFDFC] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{group.publicCode}</p><Status status={group.status} /></div><p className="mt-2 text-sm text-[#6B6258]">{group.actualGuests != null ? `${group.actualGuests} pessoas confirmadas · pedido inicial ${group.guests}` : groupPeople(group)} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(group.desiredDate)} · {accepted || `${group.offers.filter((offer) => offer.status === "PENDING").length} respostas pendentes`}</p><PartnerInvoiceState group={group} /></div>
                <div className="flex items-center justify-between gap-5 sm:text-right"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A7863]">{partnerPaymentLabel(group.payment?.status)}</p><p className="mt-1 font-semibold text-[#6C4B25]">{formatMoney(Number(group.payment?.partnerInvoiceTotal || group.payment?.partnerNet || amounts.partnerNet))}</p><p className="text-[9px] text-[#8A7863]">total a faturar/receber</p></div><ArrowUpRight size={18} className="text-[#9B6F3B]" /></div>
              </div>;
            })}
            {partner.groups.length === 0 && <div className="rounded-[24px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-8 text-center text-sm text-[#6B6258]">O primeiro grupo que publicares aparece aqui.</div>}
          </div>
        </section>
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
