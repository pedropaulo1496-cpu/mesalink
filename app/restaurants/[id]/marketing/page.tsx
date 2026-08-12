import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import BirthdayAutomationCard from "@/components/marketing/BirthdayAutomationCard";
import ReviewAutomationCard from "@/components/marketing/ReviewAutomationCard";
import MarketingAutopilotCard from "@/components/marketing/MarketingAutopilotCard";
import RecoveryAutomationCard from "@/components/marketing/RecoveryAutomationCard";
import NegativeReviewRecoveryCard from "@/components/marketing/NegativeReviewRecoveryCard";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const t = await getTranslations("dashboardMarketing");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const billingUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  const subscription = billingUser?.subscription;
  const now = new Date();
  const trialActive =
    subscription?.status === "TRIAL" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now;

  const hasGrowth =
    subscription?.status === "ACTIVE" &&
    String(subscription.plan ?? "").toUpperCase() === "GROWTH";

  const canUseMarketing = Boolean(trialActive || hasGrowth);

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
  });

  if (!restaurant) notFound();

  if (!canUseMarketing) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
        <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
          <RestaurantSidebar
            id={id}
            restaurantName={restaurant.name}
            active="marketing"
          />

          <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#E1D0B8] bg-white shadow-[0_20px_60px_rgba(80,55,30,0.07)]">
              <div className="bg-[#17120D] p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
                  {t("upsell.eyebrow")}
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                  {t("upsell.title")}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-5 text-[#EADBC5]">
                  {t("upsell.description")}
                </p>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2">
                <LockedFeature title={t("upsell.features.recovery.title")} text={t("upsell.features.recovery.text")} />
                <LockedFeature title={t("upsell.features.campaigns.title")} text={t("upsell.features.campaigns.text")} />
                <LockedFeature title={t("upsell.features.risk.title")} text={t("upsell.features.risk.text")} />
                <LockedFeature title={t("upsell.features.roi.title")} text={t("upsell.features.roi.text")} />
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#6B6258]">
                  {t("upsell.footerNote")}
                </p>

                <Link
                  href={`/billing?restaurantId=${id}`}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#16120E] px-6 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  {t("upsell.upgradeCta")}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const customers = await prisma.customer.findMany({
   where: {
  restaurantId: id,
  marketingOptIn: true,
  email: {
    not: null,
  },
},
    include: {
      reservations: {
        where: { restaurantId: id },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const reviewFeedbacks = await prisma.reviewFeedback.findMany({
    where: { restaurantId: id },
    orderBy: { createdAt: "desc" },
  });

  const reviewReservationIds = reviewFeedbacks
    .map((review) => review.reservationId)
    .filter((value): value is string => Boolean(value));

  const reviewReservations = reviewReservationIds.length
    ? await prisma.reservation.findMany({
        where: { id: { in: reviewReservationIds } },
        select: { id: true, customerName: true, email: true },
      })
    : [];

  const issuedReviewCards = await prisma.marketingPromoCard.findMany({
    where: { restaurantId: id, reviewFeedbackId: { not: null } },
    select: { reviewFeedbackId: true },
  });
  const issuedReviewIds = new Set(issuedReviewCards.map((card) => card.reviewFeedbackId).filter(Boolean));
  const reviewReservationById = new Map(reviewReservations.map((reservation) => [reservation.id, reservation]));
  const eligibleReviewEmails3 = new Set<string>();
  const eligibleReviewEmails4 = new Set<string>();
  for (const review of reviewFeedbacks) {
    if (review.rating > 4 || issuedReviewIds.has(review.id) || !review.reservationId) continue;
    const email = reviewReservationById.get(review.reservationId)?.email?.trim().toLowerCase();
    if (!email) continue;
    eligibleReviewEmails4.add(email);
    if (review.rating <= 3) eligibleReviewEmails3.add(email);
  }

  const reviewerNameByReservationId = new Map(
    reviewReservations.map((reservation) => [reservation.id, reservation.customerName]),
  );

  const recentReviews = reviewFeedbacks.slice(0, 8).map((review) => ({
    ...review,
    customerName:
      (review.reservationId && reviewerNameByReservationId.get(review.reservationId)) ||
      t("main.reviews.anonymousCustomer"),
  }));

  const marketingActions = await prisma.marketingAction.findMany({
    where: { restaurantId: id },
    orderBy: { createdAt: "desc" },
  });

  const vipCustomers = customers.filter(
    (customer) =>
      customer.vipTier ||
      customer.marketingOptIn ||
      customer.visitCount >= 5 ||
      customer.totalVisits >= 5,
  );

  const bronzeCustomers = customers.filter(
    (customer) => customer.vipTier === "BRONZE",
  ).length;

  const silverCustomers = customers.filter(
    (customer) => customer.vipTier === "SILVER",
  ).length;

  const goldCustomers = customers.filter(
    (customer) => customer.vipTier === "GOLD",
  ).length;

  const platinumCustomers = customers.filter(
    (customer) => customer.vipTier === "PLATINUM",
  ).length;

  const birthdayCustomers = customers.filter((customer) => {
    if (!customer.birthDate) return false;
    const birthDate = new Date(customer.birthDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) nextBirthday.setFullYear(now.getFullYear() + 1);
    const difference = nextBirthday.getTime() - today.getTime();
    return difference >= 0 && difference <= 7 * 24 * 60 * 60 * 1000;
  });

  const googleReviews = reviewFeedbacks.filter(
    (review) => review.redirectedToGoogle,
  );

  const positiveReviews = reviewFeedbacks.filter(
    (review) => review.rating >= (restaurant.reviewRedirectThreshold || 4),
  );

  const campaignActions = marketingActions.filter((action) =>
    ["BIRTHDAY", "VIP_UPGRADE", "MANUAL_CAMPAIGN", "AI_CAMPAIGN", "REVIEW_REQUEST", "REVIEW_RECOVERY", "CARD_GIFT"].includes(action.type),
  );

  const convertedActions = campaignActions.filter(
    (action) => action.status === "CONVERTED" || action.convertedAt,
  );

  const estimatedRevenue = convertedActions.reduce((total, action) => {
    return total + Number(action.estimatedRevenue || 0);
  }, 0);

  const growthPlanPrice = 20;

  const roiGrowth =
    estimatedRevenue > 0
      ? (estimatedRevenue / growthPlanPrice).toFixed(1)
      : "0.0";

  const averageRating =
    reviewFeedbacks.length > 0
      ? (
          reviewFeedbacks.reduce((total, review) => total + review.rating, 0) /
          reviewFeedbacks.length
        ).toFixed(1)
      : "0.0";

  const googleRate =
    reviewFeedbacks.length > 0
      ? Math.round((googleReviews.length / reviewFeedbacks.length) * 100)
      : 0;

  const birthdayRevenue = campaignActions
    .filter(
      (action) =>
        action.type === "BIRTHDAY" &&
        (action.status === "CONVERTED" || action.convertedAt),
    )
    .reduce((total, action) => total + Number(action.estimatedRevenue || 0), 0);

  const manualCampaigns = campaignActions.filter(
    (action) => action.type === "MANUAL_CAMPAIGN",
  );

  const manualCampaignRevenue = manualCampaigns.filter((action) => action.status === "CONVERTED" || action.convertedAt).reduce(
    (total, action) => total + Number(action.estimatedRevenue || 0),
    0,
  );

  const manualCampaignConversions = manualCampaigns.filter(
    (action) => action.status === "CONVERTED" || action.convertedAt,
  ).length;

  const fiveStars = reviewFeedbacks.filter((review) => review.rating === 5).length;
  const fourStars = reviewFeedbacks.filter((review) => review.rating === 4).length;
  const threeStars = reviewFeedbacks.filter((review) => review.rating === 3).length;
  const twoStars = reviewFeedbacks.filter((review) => review.rating === 2).length;
  const oneStar = reviewFeedbacks.filter((review) => review.rating === 1).length;

  const topCustomers = [...customers]
  .sort(
    (a, b) =>
      (b.totalVisits ?? 0) -
      (a.totalVisits ?? 0),
  )
  .slice(0, 10);

  const maxReviewCount = Math.max(
    fiveStars,
    fourStars,
    threeStars,
    twoStars,
    oneStar,
    1,
  );

  const recentCampaigns = campaignActions.slice(0, 12);
  const latestAiCampaign = await prisma.aiMarketingCampaign.findFirst({
    where: { restaurantId: id },
    orderBy: { createdAt: "desc" },
    select: { subject: true, aiReason: true, emailsSent: true, audienceSize: true, cardToken: true, createdAt: true },
  });

  const revenueBars = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const revenue = campaignActions
      .filter((action) => {
        if (!(action.status === "CONVERTED" || action.convertedAt)) return false;

        const actionDate = new Date(action.convertedAt || action.sentAt);

        return actionDate.getMonth() === month && actionDate.getFullYear() === year;
      })
      .reduce((total, action) => total + Number(action.estimatedRevenue || 0), 0);

    return {
      label: date.toLocaleDateString(intlLocale, { month: "short" }),
      revenue,
    };
  });

  const maxRevenue = Math.max(...revenueBars.map((bar) => bar.revenue), 1);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="marketing"
        />

        <section className="px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9B6F3B]">
                {t("main.eyebrow")}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                {t("main.title")}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-5 text-[#6B6258]">
                Cria campanhas, ativa a IA e mantém os clientes a voltar.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/restaurants/${id}/marketing/loyalty`} className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2.5 text-xs font-semibold">Cartões & ofertas</Link>
              <Link href={`/restaurants/${id}/marketing/recommendations`} className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2.5 text-xs font-semibold">Sugestões</Link>
              <Link
                href={`/restaurants/${id}/marketing/campaigns/new`}
                className="rounded-full bg-[#16120E] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#2A2118]"
              >
                {t("main.actions.newCampaign")}
              </Link>
            </div>
          </header>

          <section className="mt-5 overflow-hidden rounded-[26px] border border-[#2C2117] bg-[#17120D] p-5 text-white shadow-[0_20px_55px_rgba(44,31,18,0.16)]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
                  {t("main.hero.eyebrow")}
                </p>

                <h2 className="mt-2 text-4xl font-semibold tracking-[-0.065em]">
                  {estimatedRevenue.toFixed(0)}€
                </h2>

                <p className="mt-1 text-xs text-[#EADBC5]/70">
                  {t("main.hero.subtitle")}
                </p>
              </div>

              <div className="grid gap-2 grid-cols-2 lg:grid-cols-4 xl:min-w-[580px]">
                <HeroMetric value={`${roiGrowth}x`} label={t("main.hero.metrics.roi")} />
                <HeroMetric value={convertedActions.length} label={t("main.hero.metrics.conversions")} />
                <HeroMetric value={googleReviews.length} label={t("main.hero.metrics.googleReviews")} />
                <HeroMetric value={averageRating} label={t("main.hero.metrics.avgRating")} />
              </div>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              <DarkInsight
                label={t("main.hero.insights.birthday.label")}
                value={`${birthdayRevenue.toFixed(0)}€`}
                sub={t("main.hero.insights.birthday.sub", { count: birthdayCustomers.length })}
              />

              <DarkInsight
                label={t("main.hero.insights.campaigns.label")}
                value={`${manualCampaignRevenue.toFixed(0)}€`}
                sub={t("main.hero.insights.campaigns.sub", { count: manualCampaigns.length })}
              />
            </div>
          </section>

          <details className="group mt-5 rounded-[24px] border border-[#E1D0B8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold"><span>Estatísticas e desempenho</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Ver detalhes ↓</span><span className="hidden text-xs text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
            <div className="border-t border-[#E8DCCB] p-5">
          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>{t("main.revenue.eyebrow")}</SectionLabel>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                    {t("main.revenue.title")}
                  </h2>
                </div>

                <p className="text-sm font-semibold text-[#9B6F3B]">
                  {t("main.revenue.period")}
                </p>
              </div>

              <div className="mt-8 flex h-72 items-end gap-3 rounded-[30px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
                {revenueBars.map((bar) => (
                  <div key={bar.label} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      className="rounded-t-2xl bg-[#17120D] shadow-[0_14px_35px_rgba(44,31,18,0.18)]"
                      style={{
                        height: `${Math.max(8, (bar.revenue / maxRevenue) * 100)}%`,
                      }}
                    />

                    <p className="mt-3 text-center text-xs font-semibold uppercase text-[#8A7C6D]">
                      {bar.label}
                    </p>

                    <p className="mt-1 text-center text-xs font-bold text-[#16120E]">
                      {bar.revenue.toFixed(0)}€
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionLabel>{t("main.reviews.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("main.reviews.title")}
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SmallStat value={reviewFeedbacks.length} label={t("main.reviews.stats.received")} />
                <SmallStat value={`${googleRate}%`} label={t("main.reviews.stats.googleRate")} />
              </div>

              <div className="mt-5 rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
                <ReviewBar stars="5★" value={fiveStars} max={maxReviewCount} />
                <ReviewBar stars="4★" value={fourStars} max={maxReviewCount} />
                <ReviewBar stars="3★" value={threeStars} max={maxReviewCount} />
                <ReviewBar stars="2★" value={twoStars} max={maxReviewCount} />
                <ReviewBar stars="1★" value={oneStar} max={maxReviewCount} />
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B58A45]">
                  {t("main.reviews.recentLabel")}
                </p>

                <div className="mt-3 space-y-2">
                  {recentReviews.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#E8DCCB] p-4 text-sm text-[#6B6258]">
                      {t("main.reviews.empty")}
                    </p>
                  ) : (
                    recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-[#E8DCCB] bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#16120E]">
                              {review.customerName}
                            </p>
                            <p className="mt-0.5 text-xs font-bold text-[#9B6F3B]">
                              {"★".repeat(review.rating)}
                              {"☆".repeat(Math.max(0, 5 - review.rating))} ·{" "}
                              {new Date(review.createdAt).toLocaleDateString(intlLocale)}
                            </p>
                          </div>

                          {review.redirectedToGoogle && (
                            <span className="shrink-0 rounded-full bg-[#ECF7EC] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#3F6A4D]">
                              {t("main.reviews.googleBadge")}
                            </span>
                          )}
                        </div>

                        {review.comment && (
                          <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Panel>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <GrowthModule
              title={t("main.modules.reviews.title")}
              emoji="⭐"
              value={googleReviews.length}
              label={t("main.modules.reviews.label")}
              sub={t("main.modules.reviews.sub", { count: positiveReviews.length })}
              activeLabel={t("main.badges.active")}
            />

            <GrowthModule
              title={t("main.modules.vip.title")}
              emoji="👑"
              value={vipCustomers.length}
              label={t("main.modules.vip.label")}
              sub={t("main.modules.vip.sub", { count: goldCustomers + platinumCustomers })}
              activeLabel={t("main.badges.active")}
            />

            <Link href={`/restaurants/${id}/marketing/campaigns/new`}>
              <GrowthModule
                title={t("main.modules.campaigns.title")}
                emoji="📨"
                value={manualCampaigns.length}
                label={t("main.modules.campaigns.label")}
                sub={t("main.modules.campaigns.sub", { count: manualCampaignConversions })}
                activeLabel={t("main.badges.active")}
                dark
              />
            </Link>
          </section>

<section className="mt-6">
  <Panel>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SectionLabel>{t("main.leaderboard.eyebrow")}</SectionLabel>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
          {t("main.leaderboard.title")}
        </h2>

        <p className="mt-2 text-sm text-[#6B6258]">
          {t("main.leaderboard.subtitle")}
        </p>
      </div>

      <div className="w-fit rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          {t("main.leaderboard.estimatedRevenueLabel")}
        </p>

        <p className="mt-1 text-2xl font-semibold">
          {topCustomers
            .reduce(
              (total, customer) =>
                total +
                (customer.totalVisits ?? 0) *
                  Number(restaurant.averageTicket || 25),
              0,
            )
            .toFixed(0)}
          €
        </p>
      </div>
    </div>

    <div className="mt-6 grid gap-3">
      {topCustomers.slice(0, 5).map((customer, index) => (
        <TopCustomerRow
          key={customer.id}
          position={index + 1}
          name={customer.name}
          vipTier={customer.vipTier}
          customerFallback={t("main.leaderboard.customerFallback")}
          visitsLabel={t("main.leaderboard.visits", { count: customer.totalVisits ?? 0 })}
          valueLabel={t("main.leaderboard.valueLabel")}
          value={
            (customer.totalVisits ?? 0) *
            Number(restaurant.averageTicket || 25)
          }
        />
      ))}
    </div>
  </Panel>
</section>
            </div>
          </details>

          <section className="mt-6">
            <MarketingAutopilotCard
              restaurantId={id}
              initialEnabled={restaurant.marketingAutopilotEnabled}
              initialFrequencyDays={restaurant.marketingAutopilotFrequencyDays}
              initialMaxDiscount={restaurant.marketingAutopilotMaxDiscount}
              aiCredits={subscription?.aiCredits || 0}
              latestCampaign={latestAiCampaign ? { ...latestAiCampaign, createdAt: latestAiCampaign.createdAt.toISOString() } : null}
            />
          </section>

          <details className="group mt-5 rounded-[24px] border border-[#E1D0B8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold"><span>Clientes VIP e histórico de campanhas</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Ver detalhes ↓</span><span className="hidden text-xs text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
            <div className="border-t border-[#E8DCCB] p-5">
          <section>
            <Panel compact>
              <SectionLabel>{t("main.vipClub.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("main.vipClub.title")}
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <VipTierCard label={t("main.vipClub.tiers.platinum")} count={platinumCustomers} min={t("main.vipClub.minVisits", { count: 50 })} />
                <VipTierCard label={t("main.vipClub.tiers.gold")} count={goldCustomers} min={t("main.vipClub.minVisits", { count: 20 })} />
                <VipTierCard label={t("main.vipClub.tiers.silver")} count={silverCustomers} min={t("main.vipClub.minVisits", { count: 10 })} />
                <VipTierCard label={t("main.vipClub.tiers.bronze")} count={bronzeCustomers} min={t("main.vipClub.minVisits", { count: 5 })} />
              </div>
            </Panel>
          </section>

          <section className="mt-5">
            <Panel compact>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <SectionLabel>{t("main.timeline.eyebrow")}</SectionLabel>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                    {t("main.timeline.title")}
                  </h2>
                </div>

                <Link
                  href={`/restaurants/${id}/marketing/campaigns/new`}
                  className="w-fit rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  {t("main.actions.newCampaign")}
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {recentCampaigns.map((action) => (
                  <TimelineLine
                    key={action.id}
                    action={action}
                    intlLocale={intlLocale}
                    typeLabels={{
                      INACTIVE_RECOVERY: t("main.timeline.types.recovery"),
                      BIRTHDAY: t("main.timeline.types.birthday"),
                      VIP_UPGRADE: t("main.timeline.types.vipUpgrade"),
                      MANUAL_CAMPAIGN: t("main.timeline.types.campaign"),
                      AI_CAMPAIGN: t("main.timeline.types.aiCampaign"),
                      REVIEW_REQUEST: t("main.timeline.types.review"),
                      REVIEW_RECOVERY: "Cartão de recuperação enviado",
                      CARD_GIFT: "Cartão oferecido a cliente",
                    }}
                    statusLabels={{
                      CONVERTED: t("main.timeline.status.converted"),
                      BOOKED: t("main.timeline.status.booked"),
                      CLICKED: t("main.timeline.status.clicked"),
                      OPENED: t("main.timeline.status.opened"),
                      DEFAULT: t("main.timeline.status.sent"),
                    }}
                  />
                ))}

                {recentCampaigns.length === 0 && (
                  <EmptyLine text={t("main.timeline.empty")} />
                )}
              </div>
            </Panel>
          </section>
            </div>
          </details>

          <section className="mt-6">
            <Panel>
              <SectionLabel>{t("main.automations.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("main.automations.title")}
              </h2>

              <div className="mt-6 grid gap-4">
                <ReviewAutomationCard
                  restaurantId={id}
                  initialEnabled={restaurant.reviewAutomationEnabled}
                  labels={{
                    title: t("main.automations.reviewRequest.title"), description: t("main.automations.reviewRequest.description"),
                    delay: t("main.automations.reviewRequest.delay"), noShow: t("main.automations.reviewRequest.noShow"),
                    automatic: t("main.automations.reviewRequest.automatic"), active: t("main.badges.active"),
                    inactive: t("main.badges.inactive"), toggle: t("main.automations.reviewRequest.toggle"),
                    balance: t("main.automations.reviewRequest.balance", { count: subscription?.emailBalance || 0 }), error: t("main.automations.reviewRequest.error"),
                    enabledMessage: t("main.automations.reviewRequest.enabledMessage"), disabledMessage: t("main.automations.reviewRequest.disabledMessage"),
                  }}
                />

                <NegativeReviewRecoveryCard
                  restaurantId={id}
                  eligibleCount3={eligibleReviewEmails3.size}
                  eligibleCount4={eligibleReviewEmails4.size}
                  emailsRemaining={subscription?.emailBalance || 0}
                />

                <AutomationCard
                  title={t("main.automations.vipClub.title")}
                  description={t("main.automations.vipClub.description")}
                  activeLabel={t("main.badges.active")}
                />

                <BirthdayAutomationCard birthdayCustomers={birthdayCustomers.length} restaurantId={id} emailsRemaining={subscription?.emailBalance || 0} />

                <RecoveryAutomationCard inactiveCustomers={customers.filter((customer) => {
                  const lastVisit = customer.lastVisitAt || customer.lastReservationAt || customer.reservations[0]?.date;
                  return Boolean(lastVisit && lastVisit < new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000));
                }).length} restaurantId={id} emailsRemaining={subscription?.emailBalance || 0} />

                <Link
                  href={`/restaurants/${id}/marketing/campaigns/new`}
                  className="flex min-h-[112px] flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{t("main.automations.campaigns.title")}</p>

                    <p className="mt-1 text-sm text-[#6B6258]">
                      {t("main.automations.campaigns.summary", {
                        sent: manualCampaigns.length,
                        conversions: manualCampaignConversions,
                        revenue: manualCampaignRevenue.toFixed(0),
                      })}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-[#16120E] px-4 py-2 text-sm font-semibold text-white">
                    {t("main.actions.newCampaign")}
                  </span>
                </Link>
              </div>
            </Panel>
          </section>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function LockedFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
      <p className="text-lg font-semibold tracking-[-0.04em]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p>
    </div>
  );
}

function Panel({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`${compact ? "rounded-[22px] p-4" : "rounded-[28px] p-5"} border border-[#E1D0B8] bg-white shadow-[0_18px_55px_rgba(80,55,30,0.045)]`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function HeroMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/8 p-5 backdrop-blur">
      <p className="text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#D8C9B3]">
        {label}
      </p>
    </div>
  );
}

function DarkInsight({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D7B267]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.045em]">{value}</p>
      <p className="mt-1 text-sm text-[#D8C9B3]">{sub}</p>
    </div>
  );
}

function SmallStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
      <p className="text-3xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-sm text-[#6B6258]">{label}</p>
    </div>
  );
}

function GrowthModule({
  title,
  emoji,
  value,
  label,
  sub,
  activeLabel,
  dark,
}: {
  title: string;
  emoji: string;
  value: string | number;
  label: string;
  sub: string;
  activeLabel: string;
  dark?: boolean;
}) {
  return (
    <div
      className={
        dark
          ? "h-full rounded-[34px] border border-[#2C2117] bg-[#17120D] p-6 text-white shadow-[0_24px_80px_rgba(80,55,30,0.18)]"
          : "h-full rounded-[34px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]"
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-3xl">{emoji}</p>

        <span
          className={
            dark
              ? "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F4E7D2]"
              : "rounded-full bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]"
          }
        >
          {activeLabel}
        </span>
      </div>

      <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-[#9B6F3B]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-semibold tracking-[-0.055em]">{value}</p>

      <p className={dark ? "mt-2 text-sm text-[#D8C9B3]" : "mt-2 text-sm text-[#6B6258]"}>
        {label}
      </p>

      <p className={dark ? "mt-4 text-xs text-[#AFA08E]" : "mt-4 text-xs text-[#9B8F82]"}>
        {sub}
      </p>
    </div>
  );
}

function VipTierCard({
  label,
  count,
  min,
}: {
  label: string;
  count: number;
  min: string;
}) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B]">
        {label}
      </p>

      <p className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
        {count}
      </p>

      <p className="mt-2 text-sm text-[#6B6258]">
        {min}
      </p>
    </div>
  );
}

function ReviewBar({
  stars,
  value,
  max,
}: {
  stars: string;
  value: number;
  max: number;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-[#16120E]">{stars}</span>
        <span className="text-[#6B6258]">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[#17120D]"
          style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function TimelineLine({
  action,
  intlLocale,
  typeLabels,
  statusLabels,
}: {
  action: {
    type: string;
    status: string;
    sentAt: Date;
    estimatedRevenue: unknown;
  };
  intlLocale: string;
  typeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
}) {
  const typeLabel = typeLabels[action.type] ?? action.type;
  const statusLabel = statusLabels[action.status] ?? statusLabels.DEFAULT;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div className="h-3 w-3 rounded-full bg-[#C8A56A]" />

      <div>
        <p className="font-semibold">{typeLabel}</p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {new Date(action.sentAt).toLocaleDateString(intlLocale)} · {statusLabel}
        </p>
      </div>

      <p className="text-sm font-semibold text-[#16120E]">
        {Number(action.estimatedRevenue || 0).toFixed(0)}€
      </p>
    </div>
  );
}

function AutomationCard({
  title,
  description,
  note,
  activeLabel,
}: {
  title: string;
  description: string;
  note?: string;
  activeLabel: string;
}) {
  return (
    <div className="flex min-h-[112px] flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#6B6258]">{description}</p>

        {note && (
          <p className="mt-3 rounded-2xl border border-[#E1D0B8] bg-white px-4 py-3 text-xs leading-5 text-[#6B6258]">
            {note}
          </p>
        )}
      </div>

      <span className="w-fit rounded-full bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]">
        {activeLabel}
      </span>
    </div>
  );
}

function TopCustomerRow({
  position,
  name,
  vipTier,
  value,
  customerFallback,
  visitsLabel,
  valueLabel,
}: {
  position: number;
  name: string;
  vipTier: string | null;
  value: number;
  customerFallback: string;
  visitsLabel: string;
  valueLabel: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16120E] text-sm font-bold text-white">
          #{position}
        </div>

        <div>
          <p className="font-semibold">{name}</p>

          <p className="mt-1 text-xs text-[#6B6258]">
            {vipTier || customerFallback} • {visitsLabel}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold">{value.toFixed(0)}€</p>

        <p className="text-xs text-[#9B8F82]">
          {valueLabel}
        </p>
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="p-6 text-sm text-[#6B6258]">{text}</div>;
}
