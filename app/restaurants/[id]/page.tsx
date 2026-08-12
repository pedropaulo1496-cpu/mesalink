import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Globe2,
  Handshake,
  Plus,
  QrCode,
  Sparkles,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RecoveryOfferButton from "@/components/marketing/RecoveryOfferButton";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import SignOutButton from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";
import { canAccessApp, getUserWithSubscription } from "@/lib/check-subscription";
import { parsePriceBenchmark } from "@/lib/ai-visibility-pricing";
import { prisma } from "@/lib/prisma";

type TFunc = (key: string, values?: Record<string, string | number>) => string;

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

type ReservationSummary = {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  date: Date;
  guests: number;
  status: string;
};

function sameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("dashboardOverview.home");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const billingUser = await getUserWithSubscription(session.user.email);
  const subscription = billingUser?.subscription;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const trialEndsAt = subscription?.trialEndsAt ?? null;
  const trialActive = subscription?.status === "TRIAL" && Boolean(trialEndsAt && trialEndsAt > now);
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const trialProgress = trialEndsAt ? Math.min(100, Math.max(0, Math.round(((7 - trialDaysLeft) / 7) * 100))) : 0;
  const subscriptionPlan = String(subscription?.plan ?? "").toUpperCase();
  const subscriptionActive = subscription?.status === "ACTIVE";
  const growthAccess = trialActive || (subscriptionActive && subscriptionPlan === "GROWTH");
  const billingLabel = trialActive
    ? t("billing.trial")
    : subscriptionActive && subscriptionPlan === "GROWTH"
      ? t("billing.growth")
      : subscriptionActive && subscriptionPlan === "ESSENTIALS"
        ? t("billing.essentials")
        : t("billing.subscription");
  const billingSubLabel = trialActive
    ? t("billing.trialDaysLeft", { days: trialDaysLeft })
    : subscriptionActive
      ? t("billing.active")
      : t("billing.renew");
  const billingProgress = trialActive ? trialProgress : subscriptionActive ? 100 : 0;

  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: { include: { reservations: true } },
      reservations: true,
      orderingTableSessions: {
        where: { status: "OPEN" },
        include: { orders: { select: { status: true } } },
      },
    },
  });

  if (!restaurant) {
    return <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">{t("notFound")}</main>;
  }

  const hasConfiguredHours = [
    restaurant.mondayLunch,
    restaurant.mondayDinner,
    restaurant.tuesdayLunch,
    restaurant.tuesdayDinner,
    restaurant.wednesdayLunch,
    restaurant.wednesdayDinner,
    restaurant.thursdayLunch,
    restaurant.thursdayDinner,
    restaurant.fridayLunch,
    restaurant.fridayDinner,
    restaurant.saturdayLunch,
    restaurant.saturdayDinner,
    restaurant.sundayLunch,
    restaurant.sundayDinner,
  ].some(Boolean);
  if (!hasConfiguredHours) redirect(`/restaurants/${id}/settings?setup=true`);

  const [marketingActions, latestScan, pendingPartnerOffers, bookedPartnerGroups, openRevenueConversations] = await Promise.all([
    prisma.marketingAction.findMany({
      where: { restaurantId: id, sentAt: { gte: monthStart } },
      select: {
        status: true,
        openedAt: true,
        bookedAt: true,
        convertedAt: true,
        openCount: true,
        estimatedRevenue: true,
        actualRevenue: true,
      },
    }),
    prisma.aiVisibilityScan.findFirst({
      where: { restaurantId: id, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      select: { overallScore: true, mentionRate: true, sourceCount: true, priceBenchmark: true, completedAt: true },
    }),
    prisma.referralOffer.count({
      where: { restaurantId: id, status: "PENDING", group: { status: "OPEN" } },
    }),
    prisma.referralGroup.count({
      where: { acceptedRestaurantId: id, status: "BOOKED", desiredDate: { gte: now } },
    }),
    prisma.revenueConversation.count({
      where: { restaurantId: id, status: { notIn: ["RECOVERED", "LOST", "ARCHIVED"] } },
    }),
  ]);

  const tableReservations = restaurant.tables.flatMap((table) => table.reservations);
  const allReservations = [...tableReservations, ...restaurant.reservations].filter(
    (reservation, index, array) => array.findIndex((item) => item.id === reservation.id) === index,
  );
  const inactiveStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];
  const activeReservations = allReservations.filter((reservation) => !inactiveStatuses.includes(String(reservation.status)));
  const reservationsToday = activeReservations.filter((reservation) => sameDay(new Date(reservation.date), now));
  const pendingToday = reservationsToday.filter((reservation) => reservation.status === "PENDING");
  const guestsToday = reservationsToday.reduce((total, reservation) => total + reservation.guests, 0);
  const nextReservations: ReservationSummary[] = activeReservations
    .filter((reservation) => new Date(reservation.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)
    .map((reservation) => ({
      id: reservation.id,
      customerName: reservation.customerName,
      phone: reservation.phone,
      email: reservation.email,
      date: reservation.date,
      guests: reservation.guests,
      status: reservation.status,
    }));
  const totalCapacity = restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
    ? restaurant.totalCapacity
    : restaurant.tables.reduce((total, table) => total + table.capacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((guestsToday / totalCapacity) * 100)) : 0;
  const qrOrdersOpen = restaurant.orderingTableSessions.reduce(
    (total, tableSession) => total + tableSession.orders.filter((order) => ["ACCEPTED", "PREPARING", "READY"].includes(String(order.status).toUpperCase())).length,
    0,
  );

  const sentActions = marketingActions.filter((action) => action.status !== "FAILED");
  const openedActions = sentActions.filter((action) => action.openedAt || action.openCount > 0);
  const convertedActions = sentActions.filter(
    (action) => action.convertedAt || action.bookedAt || ["BOOKED", "CONVERTED"].includes(action.status),
  );
  const attributedRevenue = convertedActions.reduce(
    (total, action) => total + Number(action.actualRevenue || action.estimatedRevenue || 0),
    0,
  );
  const openRate = sentActions.length ? Math.round((openedActions.length / sentActions.length) * 100) : 0;
  const priceBenchmark = parsePriceBenchmark(latestScan?.priceBenchmark);
  const pricePosition = priceBenchmark?.position === "BELOW"
    ? t("summary.ai.priceBelow")
    : priceBenchmark?.position === "ABOVE"
      ? t("summary.ai.priceAbove")
      : priceBenchmark?.position === "ALIGNED"
        ? t("summary.ai.priceAligned")
        : null;
  const attentionCount = pendingToday.length + pendingPartnerOffers + openRevenueConversations + qrOrdersOpen;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt";
  const reservationUrl = `${appUrl}/reserve/${restaurant.slug}`;
  const websiteUrl = restaurant.customDomainVerified && restaurant.customDomain
    ? `https://${restaurant.customDomain}`
    : `https://${restaurant.slug}.mesalink.pt`;

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">{t("eyebrow")}</p>
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${restaurant.onlineReservationsEnabled ? "border-[#B7D7B8] bg-[#ECF7EC] text-[#3F6A4D]" : "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]"}`}>
                  {restaurant.onlineReservationsEnabled ? t("statusOnline") : t("statusOffline")}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.06em] sm:text-4xl">{restaurant.name}</h1>
              <p className="mt-2 text-sm capitalize text-[#6B6258]">{new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long" }).format(now)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {billingUser?.isAdmin && <Link href="/backoffice" className="rounded-full border border-[#C8A56A] bg-[#FFF7E8] px-4 py-3 text-xs font-bold text-[#7B5528]">MesaLink Admin</Link>}
              <SubscriptionStatusButton restaurantId={id} label={billingLabel} subLabel={billingSubLabel} progress={billingProgress} expired={!trialActive && !subscriptionActive} />
              <SignOutButton />
            </div>
          </header>

          <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
            <div className="overflow-hidden rounded-[28px] bg-[#17120D] text-white shadow-[0_22px_70px_rgba(42,28,16,0.14)]">
              <div className="flex flex-col gap-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D7B267]">{t("summary.today.eyebrow")}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{t("summary.today.title")}</h2></div>
                  <Link href={`/restaurants/${id}/day`} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#17120D]">{t("summary.today.openDay")} <ArrowUpRight size={13} /></Link>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <DarkMetric icon={<CalendarCheck2 size={16} />} value={String(reservationsToday.length)} label={t("summary.today.reservations")} />
                  <DarkMetric icon={<UsersRound size={16} />} value={String(guestsToday)} label={t("summary.today.guests")} />
                  <DarkMetric icon={<Clock3 size={16} />} value={String(pendingToday.length)} label={t("summary.today.pending")} alert={pendingToday.length > 0} />
                  <DarkMetric icon={<QrCode size={16} />} value={String(qrOrdersOpen)} label={t("summary.today.qrOrders")} alert={qrOrdersOpen > 0} />
                </div>
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-white/55"><span>{t("summary.today.occupancy")}</span><span>{guestsToday}/{totalCapacity || 0} · {occupancyRate}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#D7B267]" style={{ width: `${occupancyRate}%` }} /></div>
                </div>
              </div>
            </div>

            <AttentionCard
              t={t}
              restaurantId={id}
              total={attentionCount}
              pendingReservations={pendingToday.length}
              partnerOffers={pendingPartnerOffers}
              conversations={openRevenueConversations}
              qrOrders={qrOrdersOpen}
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.28fr)]">
            <UpcomingReservations t={t} intlLocale={intlLocale} restaurantId={id} reservations={nextReservations} />

            <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-4 shadow-[0_18px_55px_rgba(80,55,30,0.05)] sm:p-5">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">{t("summary.growth.eyebrow")}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{t("summary.growth.title")}</h2></div>
                <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em] ${growthAccess ? "bg-[#ECF7EC] text-[#3F6A4D]" : "bg-[#F1E6D5] text-[#795D38]"}`}>{growthAccess ? t("summary.growth.active") : t("summary.growth.available")}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <GrowthTile href={`/restaurants/${id}/marketing`} icon={<CircleDollarSign size={18} />} eyebrow={t("summary.marketing.eyebrow")} title={formatMoney(attributedRevenue, intlLocale)} description={sentActions.length ? t("summary.marketing.performance", { sent: sentActions.length, rate: openRate }) : t("summary.marketing.empty")} tone="gold" />
                <GrowthTile href={`/restaurants/${id}/ai-visibility`} icon={<Sparkles size={18} />} eyebrow={t("summary.ai.eyebrow")} title={latestScan?.overallScore != null ? `${latestScan.overallScore}/100` : t("summary.ai.noScan")} description={latestScan ? t("summary.ai.performance", { mentions: latestScan.mentionRate || 0, sources: latestScan.sourceCount || 0 }) : t("summary.ai.runScan")} badge={pricePosition} tone="blue" />
                <GrowthTile href={`/restaurants/${id}/partner-network`} icon={<Handshake size={18} />} eyebrow={t("summary.partners.eyebrow")} title={pendingPartnerOffers ? t("summary.partners.pending", { count: pendingPartnerOffers }) : t("summary.partners.clear")} description={t("summary.partners.booked", { count: bookedPartnerGroups })} alert={pendingPartnerOffers > 0} tone="green" />
                <GrowthTile href={`/restaurants/${id}/website`} icon={<Globe2 size={18} />} eyebrow={t("summary.website.eyebrow")} title={restaurant.websiteEnabled ? t("summary.website.published") : t("summary.website.draft")} description={restaurant.websiteEnabled ? websiteUrl.replace(/^https?:\/\//, "") : t("summary.website.finish")} tone="cream" />
              </div>
            </div>
          </section>

          <MarketingQuickActions t={t} restaurantId={id} growthAccess={growthAccess} />

          <section className="mt-4 flex flex-col gap-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="px-2"><p className="text-[10px] font-black uppercase tracking-[0.19em] text-[#9B6F3B]">{t("summary.quick.eyebrow")}</p><p className="mt-1 text-sm font-semibold">{t("summary.quick.title")}</p></div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <QuickLink href={`/restaurants/${id}/reservations/new`} icon={<Plus size={14} />} label={t("summary.quick.newReservation")} primary />
              <QuickLink href={`/restaurants/${id}/day`} icon={<CalendarClock size={14} />} label={t("summary.quick.day")} />
              <QuickLink href={reservationUrl} icon={<ArrowUpRight size={14} />} label={t("summary.quick.bookingPage")} external />
              {restaurant.websiteEnabled && <QuickLink href={websiteUrl} icon={<Globe2 size={14} />} label={t("summary.quick.website")} external />}
            </div>
          </section>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function MarketingQuickActions({ t, restaurantId, growthAccess }: { t: TFunc; restaurantId: string; growthAccess: boolean }) {
  return <section className="mt-4 flex flex-col gap-4 rounded-[24px] border border-[#E1D0B8] bg-white p-4 shadow-[0_14px_40px_rgba(80,55,30,0.04)] lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#FFF0D3] text-[#8A602C]"><Sparkles size={17} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">{t("summary.marketing.quickEyebrow")}</p><p className="mt-1 text-sm font-semibold">{t("summary.marketing.quickTitle")}</p></div></div><div className="grid grid-cols-2 gap-2 sm:flex">{growthAccess ? <RecoveryOfferButton restaurantId={restaurantId} label={t("summary.marketing.recover")} compact /> : <QuickLink href={`/restaurants/${restaurantId}/marketing`} icon={<Sparkles size={14} />} label={t("summary.marketing.open")} primary />}<QuickLink href={`/restaurants/${restaurantId}/marketing/campaigns/new`} icon={<Plus size={14} />} label={t("summary.marketing.newCampaign")} /><QuickLink href={`/restaurants/${restaurantId}/marketing/loyalty`} icon={<TicketCheck size={14} />} label={t("summary.marketing.cards")} /><QuickLink href={`/restaurants/${restaurantId}/marketing`} icon={<ArrowUpRight size={14} />} label={t("summary.marketing.results")} /></div></section>;
}

function AttentionCard({ t, restaurantId, total, pendingReservations, partnerOffers, conversations, qrOrders }: { t: TFunc; restaurantId: string; total: number; pendingReservations: number; partnerOffers: number; conversations: number; qrOrders: number }) {
  const items = [
    { count: pendingReservations, label: t("summary.attention.reservations"), href: `/restaurants/${restaurantId}/day` },
    { count: partnerOffers, label: t("summary.attention.groups"), href: `/restaurants/${restaurantId}/partner-network` },
    { count: conversations, label: t("summary.attention.conversations"), href: `/restaurants/${restaurantId}/revenue-ai/inbox` },
    { count: qrOrders, label: t("summary.attention.qrOrders"), href: `/restaurants/${restaurantId}/ordering` },
  ].filter((item) => item.count > 0);
  return <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.05)]"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">{t("summary.attention.eyebrow")}</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">{t("summary.attention.title")}</h2></div><span className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-black ${total ? "bg-[#FFF0EA] text-[#A14E36]" : "bg-[#ECF7EC] text-[#3F6A4D]"}`}>{total || <CheckCircle2 size={17} />}</span></div>{items.length ? <div className="mt-4 space-y-2">{items.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 rounded-[16px] border border-[#E8DCCB] bg-[#FFF9F0] px-3.5 py-3 transition hover:border-[#C8A56A] hover:bg-white"><span className="text-xs font-semibold">{item.label}</span><span className="flex items-center gap-2 text-sm font-black text-[#9B6F3B]">{item.count}<ArrowUpRight size={12} /></span></Link>)}</div> : <div className="mt-5 rounded-[18px] bg-[#ECF7EC] p-4 text-sm font-semibold text-[#3F6A4D]">{t("summary.attention.clear")}</div>}</div>;
}

function UpcomingReservations({ t, intlLocale, restaurantId, reservations }: { t: TFunc; intlLocale: string; restaurantId: string; reservations: ReservationSummary[] }) {
  return <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-4 shadow-[0_18px_55px_rgba(80,55,30,0.05)] sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">{t("summary.upcoming.eyebrow")}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{t("summary.upcoming.title")}</h2></div><Link href={`/restaurants/${restaurantId}/reservations/upcoming`} className="text-xs font-bold text-[#9B6F3B]">{t("summary.upcoming.all")} →</Link></div><div className="mt-4 overflow-hidden rounded-[20px] border border-[#E8DCCB]">{reservations.length ? reservations.map((reservation) => <details key={reservation.id} className="group border-b border-[#E8DCCB] bg-[#FFFDFC] last:border-b-0"><summary className="grid cursor-pointer list-none grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition hover:bg-white"><div className="rounded-xl bg-[#F1E6D5] py-2 text-center"><p className="text-[9px] font-black uppercase text-[#8A6D49]">{new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "short" }).format(reservation.date)}</p><p className="mt-0.5 text-xs font-black">{new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" }).format(reservation.date)}</p></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{reservation.customerName}</p><p className="mt-0.5 text-[10px] text-[#776B5F]">{t("summary.upcoming.guests", { count: reservation.guests })}{reservation.status === "PENDING" ? ` · ${t("summary.upcoming.pending")}` : ""}</p></div><span className="flex items-center gap-2 text-xs font-black text-[#9B6F3B]">{reservation.guests}p <span className="transition group-open:rotate-180">⌄</span></span></summary><div className="grid gap-2 border-t border-[#EEE3D3] bg-white px-3 py-3 text-xs sm:grid-cols-2"><div className="rounded-xl bg-[#FFF9F0] px-3 py-2"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8A7863]">{t("reservationsCard.mobile")}</p><a href={`tel:${reservation.phone}`} className="mt-1 block truncate font-semibold text-[#17120D]">{reservation.phone || t("reservationsCard.mobileEmpty")}</a></div><div className="rounded-xl bg-[#FFF9F0] px-3 py-2"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8A7863]">{t("reservationsCard.email")}</p>{reservation.email ? <a href={`mailto:${reservation.email}`} className="mt-1 block truncate font-semibold text-[#17120D]">{reservation.email}</a> : <p className="mt-1 font-semibold text-[#776B5F]">{t("reservationsCard.emailEmpty")}</p>}</div></div></details>) : <div className="p-6 text-center text-sm text-[#70665B]">{t("summary.upcoming.empty")}</div>}</div></div>;
}

function DarkMetric({ icon, value, label, alert = false }: { icon: ReactNode; value: string; label: string; alert?: boolean }) {
  return <div className={`rounded-[18px] border p-3 ${alert ? "border-[#D7B267]/45 bg-[#D7B267]/10" : "border-white/10 bg-white/[0.045]"}`}><div className="flex items-center justify-between text-[#D7B267]">{icon}<span className="text-xl font-semibold tracking-[-0.04em] text-white">{value}</span></div><p className="mt-2 text-[9px] font-black uppercase tracking-[0.09em] text-white/50">{label}</p></div>;
}

const toneClasses = {
  gold: "border-[#E4CEAA] bg-[#FFF8EC] text-[#8A602C]",
  blue: "border-[#C8DCE6] bg-[#F2F8FB] text-[#356C83]",
  green: "border-[#C8DEC5] bg-[#F1F8F0] text-[#47704B]",
  cream: "border-[#E1D0B8] bg-[#FFFDFC] text-[#8A6D49]",
};

function GrowthTile({ href, icon, eyebrow, title, description, badge, alert = false, tone }: { href: string; icon: ReactNode; eyebrow: string; title: string; description: string; badge?: string | null; alert?: boolean; tone: keyof typeof toneClasses }) {
  return <Link href={href} className={`group rounded-[20px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(80,55,30,0.07)] ${toneClasses[tone]}`}><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/75">{icon}</span><ArrowUpRight size={14} className="opacity-45 transition group-hover:opacity-100" /></div><div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-65">{eyebrow}</p>{alert && <span className="h-1.5 w-1.5 rounded-full bg-[#C65B3F]" />}</div><p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#17120D]">{title}</p><p className="mt-1 text-xs leading-5 text-[#6B6258]">{description}</p>{badge && <span className="mt-2 inline-block rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]">{badge}</span>}</Link>;
}

function QuickLink({ href, icon, label, primary = false, external = false }: { href: string; icon: ReactNode; label: string; primary?: boolean; external?: boolean }) {
  return <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold transition ${primary ? "bg-[#17120D] text-white" : "border border-[#D8C6A9] bg-white text-[#5E4B36] hover:border-[#B99056]"}`}>{icon}{label}</Link>;
}

function SubscriptionStatusButton({ restaurantId, label, subLabel, progress, expired = false }: { restaurantId: string; label: string; subLabel: string; progress: number; expired?: boolean }) {
  return <Link href={`/billing?restaurantId=${restaurantId}`} className={`flex items-center gap-3 rounded-full border bg-white px-3 py-2 shadow-[0_12px_35px_rgba(80,55,30,0.06)] ${expired ? "border-[#E7B7A8] text-[#A14E36]" : "border-[#E1D0B8] text-[#16120E]"}`}><div className="text-right"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#6B6258]">{label}</p><p className={`text-xs font-bold ${expired ? "text-[#A14E36]" : "text-[#9B6F3B]"}`}>{subLabel}</p></div><ProgressRing progress={progress} danger={expired} /></Link>;
}

function ProgressRing({ progress, danger = false }: { progress: number; danger?: boolean }) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  return <div className="relative flex h-9 w-9 items-center justify-center"><svg viewBox="0 0 40 40" className="h-9 w-9 -rotate-90"><circle cx="20" cy="20" r={radius} fill="none" stroke="#E8DCCB" strokeWidth="4" /><circle cx="20" cy="20" r={radius} fill="none" stroke={danger ? "#C55A42" : "#C8A56A"} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (safeProgress / 100) * circumference} /></svg><span className="absolute text-[8px] font-black">{safeProgress}%</span></div>;
}
