import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import RecoveryAutomationCard from "@/components/marketing/RecoveryAutomationCard";
import BirthdayAutomationCard from "@/components/marketing/BirthdayAutomationCard";
import Link from "next/link";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  if (!canUseMarketing) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
        <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
          <RestaurantSidebar
            id={id}
            restaurantName={restaurant.name}
            active="Marketing"
          />

          <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
            <div className="w-full max-w-4xl overflow-hidden rounded-[44px] border border-[#E1D0B8] bg-white shadow-[0_28px_90px_rgba(80,55,30,0.08)]">
              <div className="bg-[#17120D] p-8 text-white lg:p-10">
                <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
                  MesaLink Growth
                </p>

                <h1 className="mt-5 text-5xl font-semibold leading-[0.92] tracking-[-0.07em]">
                  Marketing disponível no plano Growth.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-6 text-[#EADBC5]">
                  O Essentials mantém reservas, website, QR Ordering, CRM e reviews.
                  Para recuperar clientes, criar campanhas e aumentar visitas recorrentes,
                  ative o Growth.
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:p-8">
                <LockedFeature title="Recuperação de clientes" text="Identifique clientes inativos e traga-os de volta." />
                <LockedFeature title="Campanhas automáticas" text="Promova dias fracos, aniversários e ocasiões especiais." />
                <LockedFeature title="Clientes em risco" text="Veja quem pode deixar de voltar e aja antes." />
                <LockedFeature title="ROI Growth" text="Acompanhe receita recuperada e impacto das campanhas." />
              </div>

              <div className="flex flex-col gap-3 border-t border-[#E1D0B8] bg-[#FFF9F0] p-6 sm:flex-row sm:items-center sm:justify-between lg:p-8">
                <p className="text-sm leading-6 text-[#6B6258]">
                  Growth inclui tudo do Essentials + Marketing.
                </p>

                <Link
                  href={`/billing?restaurantId=${id}`}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#16120E] px-6 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  Upgrade para Growth →
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

  const marketingActions = await prisma.marketingAction.findMany({
    where: { restaurantId: id },
    orderBy: { createdAt: "desc" },
  });

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const inactiveCustomers = customers.filter((customer) => {
    const lastVisit =
      customer.lastVisitAt ||
      customer.lastReservationAt ||
      customer.reservations[0]?.date;

    return lastVisit && new Date(lastVisit) < sixtyDaysAgo;
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
    return new Date(customer.birthDate).getMonth() === now.getMonth();
  });

  const googleReviews = reviewFeedbacks.filter(
    (review) => review.redirectedToGoogle,
  );

  const positiveReviews = reviewFeedbacks.filter(
    (review) => review.rating >= (restaurant.reviewRedirectThreshold || 4),
  );

  const convertedActions = marketingActions.filter(
    (action) => action.status === "CONVERTED" || action.convertedAt,
  );

  const estimatedRevenue = marketingActions.reduce((total, action) => {
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

  const recoveredCustomers = marketingActions.filter(
    (action) =>
      action.type === "INACTIVE_RECOVERY" &&
      (action.status === "CONVERTED" || action.convertedAt),
  ).length;

  const recoveryRevenue = marketingActions
    .filter(
      (action) =>
        action.type === "INACTIVE_RECOVERY" &&
        (action.status === "CONVERTED" || action.convertedAt),
    )
    .reduce((total, action) => total + Number(action.estimatedRevenue || 0), 0);

  const birthdayRevenue = marketingActions
    .filter(
      (action) =>
        action.type === "BIRTHDAY" &&
        (action.status === "CONVERTED" || action.convertedAt),
    )
    .reduce((total, action) => total + Number(action.estimatedRevenue || 0), 0);

  const manualCampaigns = marketingActions.filter(
    (action) => action.type === "MANUAL_CAMPAIGN",
  );

  const manualCampaignRevenue = manualCampaigns.reduce(
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

  const inactiveRevenuePotential =
    inactiveCustomers.length * Number(restaurant.averageTicket || 25);

    const riskyCustomers = customers.filter(
  (customer) => (customer.riskScore ?? 0) >= 50,
);

const criticalCustomers = customers.filter(
  (customer) => (customer.riskScore ?? 0) >= 75,
);

const riskRevenue =
  riskyCustomers.length * Number(restaurant.averageTicket || 25);

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

  const recentCampaigns = marketingActions.slice(0, 12);

  const revenueBars = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const revenue = marketingActions
      .filter((action) => {
        if (!(action.status === "CONVERTED" || action.convertedAt)) return false;

        const actionDate = new Date(action.convertedAt || action.sentAt);

        return actionDate.getMonth() === month && actionDate.getFullYear() === year;
      })
      .reduce((total, action) => total + Number(action.estimatedRevenue || 0), 0);

    return {
      label: date.toLocaleDateString("pt-PT", { month: "short" }),
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
          active="Marketing"
        />

        <section className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9B6F3B]">
                MesaLink Growth
              </p>

              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
                Growth Engine
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                Receita recuperada, reviews Google, clientes VIP, campanhas e
                automações num só motor de crescimento.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/restaurants/${id}/marketing/settings`}
                className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
              >
                Configurações
              </Link>

<Link
  href={`/restaurants/${id}/marketing/recommendations`}
  className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
>
  Recomendações
</Link>

              <Link
                href={`/restaurants/${id}/marketing/campaigns/new`}
                className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
              >
                Criar campanha
              </Link>
            </div>
          </header>

          <section className="mt-8 overflow-hidden rounded-[44px] border border-[#2C2117] bg-[#17120D] p-7 text-white shadow-[0_35px_100px_rgba(44,31,18,0.28)] lg:p-10">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
                  Performance do Growth
                </p>

                <h2 className="mt-5 text-6xl font-semibold tracking-[-0.08em] lg:text-7xl">
                  {estimatedRevenue.toFixed(0)}€
                </h2>

                <p className="mt-3 text-lg text-[#EADBC5]">
                  Receita atribuída ao MesaLink
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[620px]">
                <HeroMetric value={`${roiGrowth}x`} label="ROI Growth" />
                <HeroMetric value={convertedActions.length} label="Conversões" />
                <HeroMetric value={googleReviews.length} label="Google Reviews" />
                <HeroMetric value={averageRating} label="Média reviews" />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <DarkInsight
                label="Recuperação"
                value={`${recoveryRevenue.toFixed(0)}€`}
                sub={`${recoveredCustomers} clientes recuperados`}
              />

              <DarkInsight
                label="Aniversários"
                value={`${birthdayRevenue.toFixed(0)}€`}
                sub={`${birthdayCustomers.length} aniversários este mês`}
              />

              <DarkInsight
                label="Campanhas"
                value={`${manualCampaignRevenue.toFixed(0)}€`}
                sub={`${manualCampaigns.length} campanhas enviadas`}
              />
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>Receita</SectionLabel>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                    Receita gerada
                  </h2>
                </div>

                <p className="text-sm font-semibold text-[#9B6F3B]">
                  Últimos 6 meses
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
              <SectionLabel>Reviews</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Reputação
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <SmallStat value={reviewFeedbacks.length} label="Reviews recebidas" />
                <SmallStat value={`${googleRate}%`} label="Taxa Google" />
              </div>

              <div className="mt-5 rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
                <ReviewBar stars="5★" value={fiveStars} max={maxReviewCount} />
                <ReviewBar stars="4★" value={fourStars} max={maxReviewCount} />
                <ReviewBar stars="3★" value={threeStars} max={maxReviewCount} />
                <ReviewBar stars="2★" value={twoStars} max={maxReviewCount} />
                <ReviewBar stars="1★" value={oneStar} max={maxReviewCount} />
              </div>
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <GrowthModule
              title="Reviews"
              emoji="⭐"
              value={googleReviews.length}
              label="Google Reviews"
              sub={`${positiveReviews.length} reviews positivas`}
            />

            <GrowthModule
              title="Recuperação"
              emoji="🎯"
              value={`${recoveryRevenue.toFixed(0)}€`}
              label="Receita recuperada"
              sub={`${inactiveCustomers.length} clientes elegíveis`}
            />

            <GrowthModule
              title="VIP"
              emoji="👑"
              value={vipCustomers.length}
              label="Membros preferenciais"
              sub={`${goldCustomers + platinumCustomers} clientes Gold/Platinum`}
            />

            <GrowthModule
  title="Risco"
  emoji="🚨"
  value={riskyCustomers.length}
  label="Clientes em risco"
  sub={`${riskRevenue.toFixed(0)}€ potencial em risco`}
/>

            <Link href={`/restaurants/${id}/marketing/campaigns/new`}>
              <GrowthModule
                title="Campanhas"
                emoji="📨"
                value={manualCampaigns.length}
                label="Campanhas enviadas"
                sub={`${manualCampaignConversions} conversões`}
                dark
              />
            </Link>
          </section>

<section className="mt-6">
  <Panel>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <SectionLabel>Leaderboard</SectionLabel>

        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
          Top Clientes
        </h2>

        <p className="mt-2 text-sm text-[#6B6258]">
          Clientes mais valiosos do restaurante.
        </p>
      </div>

      <div className="w-fit rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          Receita estimada
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
          visits={customer.totalVisits ?? 0}
          vipTier={customer.vipTier}
          value={
            (customer.totalVisits ?? 0) *
            Number(restaurant.averageTicket || 25)
          }
        />
      ))}
    </div>
  </Panel>
</section>

          <section className="mt-6">
            <Panel>
              <SectionLabel>VIP Club</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Clientes fidelizados
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <VipTierCard label="Platinum" count={platinumCustomers} min="50+ visitas" />
                <VipTierCard label="Gold" count={goldCustomers} min="20+ visitas" />
                <VipTierCard label="Silver" count={silverCustomers} min="10+ visitas" />
                <VipTierCard label="Bronze" count={bronzeCustomers} min="5+ visitas" />
              </div>
            </Panel>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <SectionLabel>Oportunidades</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Clientes a recuperar
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                Potencial estimado de{" "}
                <span className="font-semibold text-[#16120E]">
                  {inactiveRevenuePotential.toFixed(0)}€
                </span>{" "}
                com clientes sem visita há mais de 60 dias.
              </p>

              {criticalCustomers.length > 0 && (
  <div className="mt-4 rounded-2xl border border-[#F1D5A4] bg-[#FFF7E8] px-4 py-3">
    <p className="font-semibold text-[#8A5A00]">
      🚨 {criticalCustomers.length} clientes apresentam risco elevado de abandono.
    </p>
  </div>
)}

              <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {inactiveCustomers.slice(0, 6).map((customer) => {
                  const lastVisit =
                    customer.lastVisitAt ||
                    customer.lastReservationAt ||
                    customer.reservations[0]?.date;

                  const daysSince = lastVisit
                    ? Math.max(
                        0,
                        Math.round(
                          (now.getTime() - new Date(lastVisit).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )
                    : null;

                  return (
                    <CustomerLine
                      key={customer.id}
                      name={customer.name}
                      email={customer.email}
                      value={daysSince ? `${daysSince} dias` : "Sem data"}
                    />
                  );
                })}

                {inactiveCustomers.length === 0 && (
                  <EmptyLine text="Ainda não existem clientes elegíveis para recuperação." />
                )}
              </div>
            </Panel>

            <Panel>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <SectionLabel>Timeline</SectionLabel>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                    Atividade recente
                  </h2>
                </div>

                <Link
                  href={`/restaurants/${id}/marketing/campaigns/new`}
                  className="w-fit rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  Criar campanha
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {recentCampaigns.map((action) => (
                  <TimelineLine key={action.id} action={action} />
                ))}

                {recentCampaigns.length === 0 && (
                  <EmptyLine text="Ainda não existem ações de marketing." />
                )}
              </div>
            </Panel>
          </section>

          <section className="mt-6">
            <Panel>
              <SectionLabel>Automações</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Motor automático
              </h2>

              <div className="mt-6 grid gap-4">
                <AutomationCard
                  title="Review Pós-Visita"
                  description="Pedido automático de avaliação quando a reserva é marcada como Finalizada."
                  note="Importante: para o cliente receber o email, a reserva precisa de ser marcada como Finalizada no Serviço do Dia."
                />

                <RecoveryAutomationCard inactiveCustomers={inactiveCustomers.length} />

                <AutomationCard
                  title="Clube VIP"
                  description="Clientes satisfeitos podem receber convites, novidades e vantagens exclusivas."
                />

                <BirthdayAutomationCard birthdayCustomers={birthdayCustomers.length} />

                <Link
                  href={`/restaurants/${id}/marketing/campaigns/new`}
                  className="flex min-h-[112px] flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">Campanhas</p>

                    <p className="mt-1 text-sm text-[#6B6258]">
                      {manualCampaigns.length} campanhas enviadas •{" "}
                      {manualCampaignConversions} conversões •{" "}
                      {manualCampaignRevenue.toFixed(0)}€ gerados
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-[#16120E] px-4 py-2 text-sm font-semibold text-white">
                    Criar campanha
                  </span>
                </Link>
              </div>
            </Panel>
          </section>
        </section>
      </div>
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

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]">
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
  dark,
}: {
  title: string;
  emoji: string;
  value: string | number;
  label: string;
  sub: string;
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
          Ativo
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

function CustomerLine({
  name,
  email,
  value,
}: {
  name: string;
  email: string | null;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        <p className="mt-1 truncate text-xs text-[#6B6258]">{email || "Sem email"}</p>
      </div>

      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
        {value}
      </span>
    </div>
  );
}

function TimelineLine({
  action,
}: {
  action: {
    type: string;
    status: string;
    sentAt: Date;
    estimatedRevenue: unknown;
  };
}) {
  const typeLabel =
  action.type === "INACTIVE_RECOVERY"
    ? "Cliente recuperado"
    : action.type === "BIRTHDAY"
      ? "Aniversário enviado"
      : action.type === "VIP_UPGRADE"
        ? "Upgrade VIP enviado"
        : action.type === "MANUAL_CAMPAIGN"
          ? "Campanha enviada"
          : action.type === "REVIEW_REQUEST"
            ? "Review enviada"
            : action.type;

  const statusLabel =
    action.status === "CONVERTED"
      ? "Convertido"
      : action.status === "BOOKED"
        ? "Reserva"
        : action.status === "CLICKED"
          ? "Clique"
          : action.status === "OPENED"
            ? "Aberto"
            : "Enviado";

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div className="h-3 w-3 rounded-full bg-[#C8A56A]" />

      <div>
        <p className="font-semibold">{typeLabel}</p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {new Date(action.sentAt).toLocaleDateString("pt-PT")} · {statusLabel}
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
}: {
  title: string;
  description: string;
  note?: string;
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
        Ativo
      </span>
    </div>
  );
}

function TopCustomerRow({
  position,
  name,
  visits,
  vipTier,
  value,
}: {
  position: number;
  name: string;
  visits: number;
  vipTier: string | null;
  value: number;
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
            {vipTier || "Cliente"} • {visits} visitas
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-lg font-bold">{value.toFixed(0)}€</p>

        <p className="text-xs text-[#9B8F82]">
          valor estimado
        </p>
      </div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="p-6 text-sm text-[#6B6258]">{text}</div>;
}