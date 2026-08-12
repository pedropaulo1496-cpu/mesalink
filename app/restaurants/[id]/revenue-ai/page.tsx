import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import {
  ArrowUpRight,
  ChevronRight,
  CalendarX2,
  CheckCircle2,
  CircleDollarSign,
  Mail,
  MessageCircleMore,
  PhoneMissed,
  Sparkles,
  UserRoundX,
  UsersRound,
  Workflow,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import RevenueActivityFeed from "@/components/revenue-ai/RevenueActivityFeed";
import GrowthWorkspaceSwitcher from "@/components/growth/GrowthWorkspaceSwitcher";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRevenueChannelStatus } from "@/lib/revenue-twilio";

const localeMap: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  zh: "zh-CN",
};

export default async function RevenueAiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboardRevenueAi");
  const locale = await getLocale();
  const intlLocale = localeMap[locale] ?? "pt-PT";
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) redirect("/login");

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, userId: user.id },
  });

  if (!restaurant) notFound();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [reservations, customers, marketingActions] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        restaurantId: id,
        date: { gte: ninetyDaysAgo },
        status: { in: ["CANCELLED", "REJECTED", "NO_SHOW"] },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        customerName: true,
        email: true,
        phone: true,
        date: true,
        guests: true,
        status: true,
      },
    }),
    prisma.customer.findMany({
      where: { restaurantId: id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        marketingOptIn: true,
        lastVisitAt: true,
        lastReservationAt: true,
        visitCount: true,
        totalVisits: true,
        source: true,
        createdAt: true,
        reservations: {
          where: { restaurantId: id },
          select: { id: true, date: true, status: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.marketingAction.findMany({
      where: { restaurantId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { id: true, name: true } },
      },
    }),
  ]);

  const subscription = user.subscription;
  const revenueChannelStatus = getRevenueChannelStatus(restaurant);
  const trialActive =
    subscription?.status === "TRIAL" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now;
  const hasGrowth =
    subscription?.status === "ACTIVE" &&
    String(subscription.plan ?? "").toUpperCase() === "GROWTH";
  const canUseRevenueAi = Boolean(trialActive || hasGrowth);

  const averageTicket = Number(restaurant.averageTicket || 25);
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  const revenueActions = marketingActions.filter((action) => ["INACTIVE_RECOVERY", "FOLLOW_UP"].includes(action.type));
  const activityActions = revenueActions.map((action) => ({
    id: action.id,
    customerId: action.customer?.id ?? action.customerId,
    customerName: action.customer?.name ?? null,
    type: action.type,
    status: action.status,
    channel: action.channel,
    sentAt: action.sentAt.toISOString(),
    openedAt: action.openedAt?.toISOString() ?? null,
    lastOpenedAt: action.lastOpenedAt?.toISOString() ?? null,
    clickedAt: action.clickedAt?.toISOString() ?? null,
    lastClickedAt: action.lastClickedAt?.toISOString() ?? null,
    bookedAt: action.bookedAt?.toISOString() ?? null,
    convertedAt: action.convertedAt?.toISOString() ?? null,
    repliedAt: action.repliedAt?.toISOString() ?? null,
    nextFollowUpAt: action.nextFollowUpAt?.toISOString() ?? null,
    openCount: action.openCount,
    clickCount: action.clickCount,
    estimatedRevenue: action.estimatedRevenue === null ? null : Number(action.estimatedRevenue),
    actualRevenue: action.actualRevenue === null ? null : Number(action.actualRevenue),
    failureReason: action.failureReason,
  }));

  const cancelledReservations = reservations.filter((item) =>
    ["CANCELLED", "REJECTED"].includes(item.status),
  );
  const noShows = reservations.filter((item) => item.status === "NO_SHOW");
  const inactiveCustomers = customers.filter((customer) => {
    if (!customer.marketingOptIn || !customer.email) return false;
    const lastContact =
      customer.lastVisitAt ||
      customer.lastReservationAt ||
      customer.reservations[0]?.date;
    return Boolean(lastContact && lastContact < sixtyDaysAgo);
  });
  const abandonedLeads = customers.filter(
    (customer) =>
      customer.createdAt < fortyEightHoursAgo &&
      customer.totalVisits === 0 &&
      customer.visitCount === 0 &&
      customer.reservations.length === 0 &&
      Boolean(customer.email || customer.phone),
  );

  const recoveredActions = revenueActions.filter(
    (action) =>
      (action.status === "CONVERTED" || Boolean(action.convertedAt)) &&
      (action.convertedAt || action.createdAt) >= startOfMonth,
  );
  const recoveredRevenue = recoveredActions.reduce(
    (total, action) => total + Number(action.estimatedRevenue || 0),
    0,
  );
  const activePipeline = revenueActions.filter((action) =>
    ["SENT", "OPENED", "CLICKED", "BOOKED"].includes(action.status),
  );
  const pipelineRevenue = activePipeline.reduce(
    (total, action) => total + Number(action.estimatedRevenue || 0),
    0,
  );
  const cancellationValue = cancelledReservations.reduce(
    (total, reservation) => total + reservation.guests * averageTicket,
    0,
  );
  const noShowValue = noShows.reduce(
    (total, reservation) => total + reservation.guests * averageTicket,
    0,
  );
  const inactiveValue = inactiveCustomers.length * averageTicket * 2;
  const abandonedValue = abandonedLeads.length * averageTicket * 2;
  const revenueAtRisk = cancellationValue + noShowValue + inactiveValue + abandonedValue;
  const openOpportunityCount = [
    cancelledReservations.length,
    noShows.length,
    inactiveCustomers.length,
    abandonedLeads.length,
  ].filter((count) => count > 0).length;

  const opportunities = [
    {
      icon: <CalendarX2 size={20} />,
      title: t("opportunities.cancelled.title"),
      description: t("opportunities.cancelled.description"),
      count: cancelledReservations.length,
      amount: cancellationValue,
      href: `/restaurants/${id}/revenue-ai/inbox`,
      cta: t("opportunities.cancelled.cta"),
      tone: "red" as const,
    },
    {
      icon: <UserRoundX size={20} />,
      title: t("opportunities.inactive.title"),
      description: t("opportunities.inactive.description"),
      count: inactiveCustomers.length,
      amount: inactiveValue,
      href: `/restaurants/${id}/revenue-ai/inbox`,
      cta: t("opportunities.inactive.cta"),
      tone: "gold" as const,
    },
    {
      icon: <UsersRound size={20} />,
      title: t("opportunities.leads.title"),
      description: t("opportunities.leads.description"),
      count: abandonedLeads.length,
      amount: abandonedValue,
      href: `/restaurants/${id}/revenue-ai/inbox`,
      cta: t("opportunities.leads.cta"),
      tone: "blue" as const,
    },
    {
      icon: <PhoneMissed size={20} />,
      title: t("opportunities.noShows.title"),
      description: t("opportunities.noShows.description"),
      count: noShows.length,
      amount: noShowValue,
      href: `/restaurants/${id}/revenue-ai/inbox`,
      cta: t("opportunities.noShows.cta"),
      tone: "red" as const,
    },
  ];

  if (!canUseRevenueAi) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
        <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
          <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenueAi" />
          <section className="flex items-center justify-center px-4 pb-28 pt-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#E1D0B8] bg-white shadow-[0_20px_60px_rgba(80,55,30,0.08)]">
              <div className="bg-[#17120D] p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">{t("upsell.eyebrow")}</p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">{t("upsell.title")}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-5 text-[#EADBC5]">{t("upsell.description")}</p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <LockedFeature icon={<CalendarX2 size={20} />} text={t("upsell.feature1")} />
                <LockedFeature icon={<UserRoundX size={20} />} text={t("upsell.feature2")} />
                <LockedFeature icon={<Workflow size={20} />} text={t("upsell.feature3")} />
                <LockedFeature icon={<CircleDollarSign size={20} />} text={t("upsell.feature4")} />
              </div>
              <div className="border-t border-[#E1D0B8] bg-[#FFF9F0] p-5">
                <Link href={`/billing?restaurantId=${id}`} className="inline-flex h-12 items-center justify-center rounded-full bg-[#16120E] px-6 text-sm font-semibold text-white">{t("upsell.cta")}</Link>
              </div>
            </div>
          </section>
        </div>
        <BottomNav id={id} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="revenueAi" />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">{t("eyebrow")}</p>
                <span className="rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#3F6A4D]">{t("live")}</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">{t("title")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-[#6B6258]">Encontra vendas perdidas, prepara o contacto e mostra o valor recuperado.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/restaurants/${id}/revenue-ai/inbox`} className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
                <MessageCircleMore size={16} /> Inbox de oportunidades
              </Link>
              <Link href={`/restaurants/${id}/revenue-ai/integrations`} className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full border border-[#D8C6A9] bg-white px-5 text-sm font-semibold transition hover:bg-[#FFF9F0]">
                <Workflow size={16} />
                {t("rulesCta")}
              </Link>
            </div>
          </header>

          <GrowthWorkspaceSwitcher restaurantId={id} active="revenue" locale={locale} />

          <section className="mt-5 overflow-hidden rounded-[26px] border border-[#2C2117] bg-[#17120D] text-white shadow-[0_20px_55px_rgba(44,31,18,0.16)]">
            <div className="grid lg:grid-cols-[1fr_1.2fr]">
              <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.27em] text-[#D7B267]"><Sparkles size={15} />{t("hero.recoveredLabel")}</div>
                <p className="mt-3 text-4xl font-semibold tracking-[-0.065em]">{formatMoney(recoveredRevenue)}</p>
                <p className="mt-1 text-xs text-white/50">{t("hero.recoveredHint", { count: recoveredActions.length })}</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/10">
                <HeroMetric label={t("hero.atRisk")} value={formatMoney(revenueAtRisk)} />
                <HeroMetric label={t("hero.pipeline")} value={formatMoney(pipelineRevenue)} />
                <HeroMetric label={t("hero.opportunities")} value={String(openOpportunityCount)} />
                <HeroMetric label={t("hero.activeFollowups")} value={String(activePipeline.length)} />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_50px_rgba(80,55,30,0.05)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("opportunities.eyebrow")}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">{t("opportunities.title")}</h2>
              </div>
              <p className="text-sm text-[#6B6258]">{t("opportunities.updated")}</p>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.title} {...opportunity} amountLabel={formatMoney(opportunity.amount)} countLabel={t("opportunities.items", { count: opportunity.count })} />
              ))}
            </div>
          </section>

          <section className="mt-5">
            <div className="rounded-[26px] border border-[#2C2117] bg-[#17120D] p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">{t("channels.eyebrow")}</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">{t("channels.title")}</h2><Link href={`/restaurants/${id}/revenue-ai/integrations`} className="text-xs font-bold text-[#E8C985]">Gerir canais →</Link></div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <ChannelRow href={`/restaurants/${id}/revenue-ai/inbox`} icon={<Mail size={18} />} name={t("channels.email")} status={process.env.RESEND_API_KEY ? t("channels.ready") : t("channels.configure")} active={Boolean(process.env.RESEND_API_KEY)} />
                <ChannelRow href={`/restaurants/${id}/website`} icon={<CheckCircle2 size={18} />} name={t("channels.website")} status={restaurant.websiteEnabled ? t("channels.connected") : t("channels.configure")} active={restaurant.websiteEnabled} />
                <ChannelRow href={`/restaurants/${id}/revenue-ai/integrations`} icon={<MessageCircleMore size={18} />} name={t("channels.whatsapp")} status={revenueChannelStatus.whatsappReady ? revenueChannelStatus.whatsappProactiveReady ? t("channels.ready") : t("channels.receiveOnly") : revenueChannelStatus.whatsappConfigured ? t("channels.waitingProvider") : t("channels.configure")} active={revenueChannelStatus.whatsappReady} />
                <ChannelRow href={`/restaurants/${id}/revenue-ai/integrations`} icon={<PhoneMissed size={18} />} name={t("channels.calls")} status={revenueChannelStatus.voiceReady ? t("channels.ready") : revenueChannelStatus.voiceConfigured ? restaurant.revenueChannelsLastError ? t("channels.paused") : t("channels.waitingProvider") : t("channels.configure")} active={revenueChannelStatus.voiceReady} />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("activity.eyebrow")}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">{t("activity.title")}</h2>
              </div>
              <Link href={`/restaurants/${id}/revenue-ai/inbox`} className="hidden items-center gap-1 text-sm font-semibold text-[#7A542A] sm:flex">{t("activity.viewAll")}<ArrowUpRight size={16} /></Link>
            </div>
            <RevenueActivityFeed
              restaurantId={id}
              locale={intlLocale}
              actions={activityActions}
            />
          </section>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#17120D] p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{label}</p><p className="mt-3 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">{value}</p></div>;
}

function OpportunityCard({ icon, title, description, count, amountLabel, countLabel, href, cta, tone }: { icon: ReactNode; title: string; description: string; count: number; amountLabel: string; countLabel: string; href: string; cta: string; tone: "red" | "gold" | "blue" }) {
  const tones = {
    red: "border-[#EDC7BB] bg-[#FFF5F0] text-[#A14E36]",
    gold: "border-[#E6D0A8] bg-[#FFF9ED] text-[#8A6130]",
    blue: "border-[#C9DCE8] bg-[#F3F9FC] text-[#3C6B82]",
  };
  return (
    <div className={`rounded-[20px] border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80">{icon}</div><p className="text-2xl font-semibold tracking-[-0.045em]">{amountLabel}</p></div>
      <h3 className="mt-3 text-base font-semibold text-[#16120E]">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#6B6258]">{description}</p>
      <div className="mt-3 flex items-center justify-between gap-4"><span className="text-[10px] font-black uppercase tracking-[0.13em]">{countLabel}</span><Link href={href} aria-disabled={count === 0} className={`inline-flex items-center gap-1 text-xs font-semibold ${count === 0 ? "pointer-events-none opacity-40" : ""}`}>{cta}<ArrowUpRight size={14} /></Link></div>
    </div>
  );
}

function ChannelRow({ href, icon, name, status, active = false }: { href: string; icon: ReactNode; name: string; status: string; active?: boolean }) {
  return <Link href={href} className="group flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.045] p-3 transition hover:border-white/20 hover:bg-white/[0.075]"><div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[#D7B267]">{icon}</div><p className="flex-1 text-xs font-semibold">{name}</p><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${active ? "bg-[#9CCB9B]/15 text-[#AEE0AD]" : "bg-white/8 text-white/45"}`}>{status}</span><ChevronRight size={13} className="text-white/35" /></Link>;
}

function LockedFeature({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-3 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 text-sm font-semibold"><span className="text-[#9B6F3B]">{icon}</span>{text}</div>;
}
