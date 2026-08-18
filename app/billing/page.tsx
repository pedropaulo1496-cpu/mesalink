import CheckoutButton from "@/components/CheckoutButton";
import AiCreditCheckoutButton from "@/components/AiCreditCheckoutButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import UpgradeToGrowthButton from "@/components/UpgradeToGrowthButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { authOptions } from "@/lib/auth";
import { listMesaLinkInvoices, type MesaLinkInvoiceDocument } from "@/lib/billing-documents";
import { prisma } from "@/lib/prisma";
import { ensureMonthlyEmailAllowance } from "@/lib/email-billing";
import { getServerSession } from "next-auth";
import { Download, ExternalLink, FileCheck2, ReceiptText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

type TFunc = (key: string, values?: Record<string, string | number>) => string;

type BillingPageProps = {
  searchParams?: Promise<{
    restaurantId?: string;
    credits?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const t = await getTranslations("dashboardBilling.main");
  const locale = await getLocale();
  const formatNumber = new Intl.NumberFormat(locale);
  const formatEuro = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const restaurantId = params?.restaurantId;
  const creditsPurchased = params?.credits === "success";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscription: true,
      restaurants: {
        select: {
          id: true,
          name: true,
          email: true,
          billingEmail: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const initialSubscription =
    user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "ESSENTIALS",
        status: "TRIAL",
        trialEndsAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
      },
    }));
  const subscription =
    (await ensureMonthlyEmailAllowance(user.id)) ?? initialSubscription;

  const now = new Date();

  const trialActive =
    subscription.status === "TRIAL" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now;

  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const activePlan = String(subscription.plan || "").toUpperCase();
  const isEssentials =
    subscription.status === "ACTIVE" && activePlan === "ESSENTIALS";
  const isGrowth = subscription.status === "ACTIVE" && activePlan === "GROWTH";
  const hasActiveSubscription = isEssentials || isGrowth;

  const currentPlan = trialActive
    ? t("planStatus.trialFull")
    : isGrowth
      ? "Growth"
      : isEssentials
        ? "Essentials"
        : t("planStatus.noPlan");

  const backHref = restaurantId ? `/restaurants/${restaurantId}` : "/dashboard";
  const trialProgress = trialActive ? Math.min(100, Math.round(((7 - trialDaysLeft) / 7) * 100)) : 0;
  const selectedRestaurants = restaurantId
    ? user.restaurants.filter((restaurant) => restaurant.id === restaurantId)
    : user.restaurants;
  const sidebarRestaurant = selectedRestaurants[0] || user.restaurants[0];
  const restaurantIds = selectedRestaurants.map((restaurant) => restaurant.id);
  const referralPayments = restaurantIds.length
    ? await prisma.referralPayment.findMany({
        where: { group: { acceptedRestaurantId: { in: restaurantIds } } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          partner: { select: { businessName: true, partnerCode: true } },
          group: {
            select: {
              publicCode: true,
              desiredDate: true,
              acceptedRestaurant: { select: { name: true } },
            },
          },
        },
      })
    : [];
  const mesaLinkInvoices = await listMesaLinkInvoices({
    stripeCustomerId: subscription.stripeCustomerId,
    emails: [user.email, ...selectedRestaurants.flatMap((restaurant) => [restaurant.email, restaurant.billingEmail])],
    referralInvoices: referralPayments
      .filter((payment) => Boolean(payment.stripeInvoiceId))
      .map((payment) => ({
        id: payment.stripeInvoiceId!,
        createdAt: payment.capturedAt || payment.createdAt,
        description: `Serviço MesaLink Partners · reserva ${payment.group.publicCode}`,
        totalCents: Math.round((
          Number(payment.platformFee)
          + Number(payment.serviceFee)
          + Math.max(0, Number(payment.taxAmount) - Number(payment.partnerInvoiceTax))
        ) * 100),
        currency: payment.currency,
        status: payment.status === "FAILED" ? "uncollectible" : "paid",
        hostedUrl: payment.stripeInvoiceUrl,
        pdfUrl: payment.stripeInvoicePdfUrl,
      })),
  });
  const partnerInvoices = referralPayments
    .filter((payment) => Boolean(payment.partnerInvoiceUrl))
    .map((payment) => ({
      id: payment.id,
      number: payment.partnerInvoiceNumber || payment.group.publicCode,
      createdAt: payment.partnerInvoiceUploadedAt || payment.createdAt,
      visitDate: payment.group.desiredDate,
      restaurant: payment.group.acceptedRestaurant?.name || "Restaurante",
      partner: payment.partner.businessName,
      partnerCode: payment.partner.partnerCode,
      total: Number(payment.partnerInvoiceTotal),
      currency: payment.currency,
      status: payment.partnerInvoiceStatus,
      url: payment.partnerInvoiceUrl!,
    }));

  return (
    <>
      <section className="play-store-consumption-note hidden min-h-screen bg-[#F5EFE6] px-6 py-16 text-[#16120E]">
        <div className="mx-auto max-w-xl rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_24px_70px_rgba(80,55,30,0.10)] sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">MesaLink Android</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">Faturação fora da aplicação</h1>
          <p className="mt-4 text-sm leading-6 text-[#6B6258]">
            Nesta versão Android pode utilizar normalmente a sua conta e as funcionalidades já ativas. A gestão de planos, créditos e pagamentos não está disponível dentro da aplicação.
          </p>
        </div>
      </section>
      <div className="play-store-billing-content">
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className={sidebarRestaurant ? "grid min-h-screen lg:grid-cols-[286px_1fr]" : "min-h-screen"}>
        {sidebarRestaurant && <RestaurantSidebar id={sidebarRestaurant.id} restaurantName={sidebarRestaurant.name} active="billing" />}
      <section className="mx-auto w-full min-w-0 max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-sm font-semibold text-[#6B6258] transition hover:text-[#16120E]"
          >
            {t("nav.back")}
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <span className="hidden rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B] sm:inline-flex">
              {t("nav.badge")}
            </span>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[44px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_30px_110px_rgba(80,55,30,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9B6F3B]">
                {t("hero.kicker")}
              </p>

              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">
                {t("hero.title")}
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6B6258]">
                {t("hero.description")}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Info label={t("stats.currentPlan.label")} value={currentPlan} />
                <Info
                  label={t("stats.trial.label")}
                  value={trialActive ? t("stats.trial.daysLeft", { days: trialDaysLeft }) : t("stats.trial.ended")}
                />
                <Info label={t("stats.aiCredits.label")} value={String(subscription.aiCredits)} />
                <Info label={t("stats.emailBalance.label")} value={String(subscription.emailBalance)} />
                <Info label={t("stats.whatsappBalance.label")} value={String(subscription.whatsappMessageBalance)} />
                <Info label={t("stats.yearlyPayment.label")} value={t("stats.yearlyPayment.value")} />
              </div>
            </div>

            <div className="border-t border-[#D8C5A5] bg-[#17130F] p-7 text-white lg:border-l lg:border-t-0 sm:p-10">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D8C5A5]">
                    {t("accountState.kicker")}
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
                    {currentPlan}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {trialActive
                      ? t("accountState.trialText")
                      : hasActiveSubscription
                        ? t("accountState.activeText")
                        : t("accountState.noPlanText")}
                  </p>
                </div>

                <TrialRing
                  percentage={trialActive ? trialProgress : hasActiveSubscription ? 100 : 0}
                  label={trialActive ? `${trialDaysLeft}d` : undefined}
                />
              </div>

              {trialActive && (
                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.07] p-5">
                  <p className="font-semibold text-[#D8C5A5]">
                    {t("trialBox.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    {t("trialBox.text", { days: trialDaysLeft })}
                  </p>
                </div>
              )}

              {isEssentials && (
                <div className="mt-8 rounded-[28px] border border-[#D8C5A5]/30 bg-[#D8C5A5]/10 p-5">
                  <p className="font-semibold text-[#D8C5A5]">
                    {t("upgradeBox.title")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    {t("upgradeBox.text")}
                  </p>
                  <div className="mt-4">
                    <UpgradeToGrowthButton />
                  </div>
                </div>
              )}

              {hasActiveSubscription && (
                <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-semibold text-[#D8C5A5]">Faturas MesaLink</p>
                  <p className="mb-4 mt-1 text-xs leading-5 text-white/55">Consulta, descarrega e atualiza os dados fiscais das faturas emitidas automaticamente pelo Stripe.</p>
                  <ManageSubscriptionButton />
                </div>
              )}
            </div>
          </div>
        </section>

        {creditsPurchased && <div className="mt-6 rounded-[24px] border border-[#9CCB9B] bg-[#ECF7EC] px-5 py-4 text-sm font-semibold text-[#31583D]">{t("credits.success")}</div>}

        <InvoiceArchive
          locale={locale}
          mesaLinkInvoices={mesaLinkInvoices}
          partnerInvoices={partnerInvoices}
          showStripePortal={hasActiveSubscription}
        />

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <PlanCard
            t={t}
            title="Essentials"
            badge={isEssentials ? t("badges.currentPlan") : t("badges.basePlan")}
            price="55€"
            yearlyPrice="605€"
            description={t("planCard.essentials.description")}
            features={t.raw("planCard.essentials.features") as string[]}
            active={trialActive || isEssentials}
            action={
              isEssentials ? (
                <Link
                  href={backHref}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
                >
                  {t("planCard.currentPlanCta")}
                </Link>
              ) : (
               <div className="grid gap-2 sm:grid-cols-2">
                  <CheckoutButton
                    product="ESSENTIALS"
                    billing="MONTHLY"
                    label={t("planCard.ctaMonthly", { price: "55€" })}
                    variant="dark"
                  />
                  <CheckoutButton
                    product="ESSENTIALS"
                    billing="YEARLY"
                    label={t("planCard.ctaYearly", { price: "605€" })}
                    variant="outline"
                  />
                </div>
              )
            }
          />

          <PlanCard
            t={t}
            title="Growth"
            badge={isGrowth ? t("badges.currentPlan") : t("badges.recommended")}
            price="75€"
            yearlyPrice="825€"
            description={t("planCard.growth.description")}
            features={t.raw("planCard.growth.features") as string[]}
            active={trialActive || isGrowth}
            highlighted
            action={
              isGrowth ? (
                <Link
                  href={backHref}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
                >
                  {t("planCard.currentPlanCta")}
                </Link>
              ) : isEssentials ? (
                <div className="rounded-[24px] border border-[#D8C5A5]/35 bg-white/[0.06] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D8C5A5]">
                        {t("planCard.growth.upgrade.kicker")}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                        {t("planCard.growth.upgrade.price")}
                      </p>
                      <p className="mt-1 text-xs text-white/62">
                        {t("planCard.growth.upgrade.note")}
                      </p>
                    </div>

                    <UpgradeToGrowthButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <CheckoutButton
                    product="GROWTH"
                    billing="MONTHLY"
                    label={t("planCard.ctaMonthly", { price: "75€" })}
                    variant="gold"
                  />
                  <CheckoutButton
                    product="GROWTH"
                    billing="YEARLY"
                    label={t("planCard.ctaYearly", { price: "825€" })}
                    variant="goldOutline"
                  />
                </div>
              )
            }
          />
        </section>

        <section className="mt-7 overflow-hidden rounded-[36px] border border-[#2C2117] bg-[#17120D] p-6 text-white shadow-[0_30px_90px_rgba(44,31,18,0.2)] sm:p-8">
          <div className="grid gap-7 xl:grid-cols-[0.72fr_1.28fr] xl:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">{t("credits.kicker")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">{t("credits.title", { credits: subscription.aiCredits })}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{t("credits.description")}</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D7B267]">{t("credits.usageTitle")}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <CreditUsageGroup
                  title={t("credits.aiActions")}
                  rows={[
                    { label: `1 ${t("credits.costs.visibility")}`, value: `10 ${t("credits.unitPlural")}` },
                    { label: `1 ${t("credits.costs.website")}`, value: `5 ${t("credits.unitPlural")}` },
                    { label: `1 ${t("credits.costs.draft")}`, value: `1 ${t("credits.unitSingular")}` },
                  ]}
                />
                <CreditUsageGroup
                  title={t("credits.communications")}
                  rows={[
                    { label: `1 ${t("credits.unitSingular")}`, value: `75 ${t("credits.costs.email")}` },
                    { label: `1 ${t("credits.unitSingular")}`, value: `8 ${t("credits.costs.whatsapp")}` },
                  ]}
                  note={t("credits.freeIncoming")}
                />
              </div>
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <CreditPack credits={formatNumber.format(100)} creditsLabel={t("credits.unitPlural")} price="29€" unit={`${formatEuro.format(0.29)}/${t("credits.unitSingular")}`} capacityLabel={t("credits.packCapacity")} capacity={`${formatNumber.format(7_500)} ${t("credits.costs.email")} ${t("credits.or")} ${formatNumber.format(800)} ${t("credits.costs.whatsapp")}`} action={<AiCreditCheckoutButton packId="STARTER" label={t("credits.buy")} />} />
            <CreditPack credits={formatNumber.format(300)} creditsLabel={t("credits.unitPlural")} price="69€" unit={`${formatEuro.format(0.23)}/${t("credits.unitSingular")}`} capacityLabel={t("credits.packCapacity")} capacity={`${formatNumber.format(22_500)} ${t("credits.costs.email")} ${t("credits.or")} ${formatNumber.format(2_400)} ${t("credits.costs.whatsapp")}`} featured action={<AiCreditCheckoutButton packId="GROWTH" label={t("credits.buy")} featured />} />
            <CreditPack credits={formatNumber.format(1_000)} creditsLabel={t("credits.unitPlural")} price="179€" unit={`${formatEuro.format(0.18)}/${t("credits.unitSingular")}`} capacityLabel={t("credits.packCapacity")} capacity={`${formatNumber.format(75_000)} ${t("credits.costs.email")} ${t("credits.or")} ${formatNumber.format(8_000)} ${t("credits.costs.whatsapp")}`} action={<AiCreditCheckoutButton packId="SCALE" label={t("credits.buy")} />} />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/45">{t("credits.taxNote")}</p>
        </section>

        <section className="mt-7">
          <div className="rounded-[34px] border border-[#D8C5A5] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
              {t("platformSection.kicker")}
            </p>

            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
              {t("platformSection.title")}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              {t("platformSection.text")}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniFeature title={t("platformSection.features.revenue.title")} text={t("platformSection.features.revenue.text")} />
              <MiniFeature title={t("platformSection.features.visibility.title")} text={t("platformSection.features.visibility.text")} />
              <MiniFeature title={t("platformSection.features.control.title")} text={t("platformSection.features.control.text")} />
              <MiniFeature title={t("platformSection.features.commissions.title")} text={t("platformSection.features.commissions.text")} />
            </div>
          </div>

        </section>
      </section>
      </div>
    </main>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold leading-6 tracking-[-0.035em] text-[#16120E] sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function TrialRing({ percentage, label }: { percentage: number; label?: string }) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const circle = 2 * Math.PI * 22;
  const offset = circle - (safePercentage / 100) * circle;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="22"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r="22"
          stroke="#D8C5A5"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circle}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#D8C5A5]">
        {label ?? `${safePercentage}%`}
      </div>
    </div>
  );
}

function PlanCard({
  t,
  title,
  badge,
  price,
  yearlyPrice,
  description,
  features,
  active,
  action,
  highlighted,
}: {
  t: TFunc;
  title: string;
  badge: string;
  price: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  active: boolean;
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  const saving = title === "Growth" ? "75€" : "55€";
  const yearlyNote = t("planCard.yearlyNote", { saving }).replace(/^[·\s]+/, "");

  return (
    <div
      data-plan-card={title.toLowerCase()}
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border p-5 shadow-[0_24px_80px_rgba(80,55,30,0.08)] sm:min-h-[660px] sm:rounded-[38px] sm:p-8 ${
        highlighted
          ? "border-[#2C2117] bg-[#17130F] text-white"
          : "border-[#D8C5A5] bg-white text-[#16120E]"
      }`}
    >
      {highlighted && (
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C8A56A]/16 blur-[80px]" />
      )}

      <div className="relative flex h-full flex-col">
        <div className="flex flex-col items-start gap-3 sm:min-h-[94px] sm:flex-row sm:justify-between sm:gap-4">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.28em] ${
                highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
              }`}
            >
              MesaLink
            </p>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
              {title}
            </h2>
          </div>

          <span
            className={`w-fit max-w-full rounded-full border px-3 py-1.5 text-center text-[10px] font-black uppercase leading-tight tracking-[0.14em] ${
              active
                ? "border-[#A7D8AA] bg-[#E9F7EA] text-[#3F6A4D]"
                : highlighted
                  ? "border-[#D8C5A5]/30 bg-[#F4E9D5] text-[#17130F]"
                  : "border-[#D8C5A5] bg-[#FFF9F0] text-[#9B6F3B]"
            }`}
          >
            {badge}
          </span>
        </div>

        <p
          className={`mt-4 text-sm leading-7 sm:mt-5 sm:min-h-[72px] ${
            highlighted ? "text-white/68" : "text-[#6B6258]"
          }`}
        >
          {description}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-6xl font-semibold tracking-[-0.08em] sm:text-7xl">
            {price}
          </span>
          <span
            className={`mb-3 text-sm ${
              highlighted ? "text-white/62" : "text-[#6B6258]"
            }`}
          >
            {t("planCard.perMonth")}
          </span>
        </div>

        <div
          className={`mt-5 rounded-[24px] px-5 py-4 text-sm ${
            highlighted
              ? "border border-white/10 bg-white/[0.07] text-white/76"
              : "border border-[#D8C5A5] bg-[#FFF9F0] text-[#6B6258]"
          }`}
        >
          <p
            className={
              highlighted
                ? "font-semibold text-[#D8C5A5]"
                : "font-semibold text-[#9B6F3B]"
            }
          >
            {t("planCard.yearlyLabel")}
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-5">
            <span
              className={
                highlighted ? "font-black text-white" : "font-black text-[#16120E]"
              }
            >
              {yearlyPrice}{t("planCard.yearlySuffix")}
            </span>
            <span>{yearlyNote}</span>
          </div>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature}
              className={`flex gap-2 text-sm leading-6 ${
                highlighted ? "text-white/84" : "text-[#4F463B]"
              }`}
            >
              <span className={highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"}>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">{action}</div>
      </div>
    </div>
  );
}


function MiniFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="font-semibold text-[#16120E]">{title}</p>
      <p className="mt-1 text-sm text-[#6B6258]">{text}</p>
    </div>
  );
}

type PartnerInvoiceDocument = {
  id: string;
  number: string;
  createdAt: Date;
  visitDate: Date;
  restaurant: string;
  partner: string;
  partnerCode: string;
  total: number;
  currency: string;
  status: string;
  url: string;
};

function InvoiceArchive({
  locale,
  mesaLinkInvoices,
  partnerInvoices,
  showStripePortal,
}: {
  locale: string;
  mesaLinkInvoices: MesaLinkInvoiceDocument[];
  partnerInvoices: PartnerInvoiceDocument[];
  showStripePortal: boolean;
}) {
  return (
    <section className="mt-7 overflow-hidden rounded-[34px] border border-[#D8C5A5] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
      <div className="flex flex-col gap-4 border-b border-[#E8DAC5] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div>
          <div className="flex items-center gap-2 text-[#9B6F3B]"><ReceiptText size={17} /><p className="text-[10px] font-black uppercase tracking-[0.24em]">Faturação</p></div>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Todos os documentos num só lugar.</h2>
          <p className="mt-1 text-sm text-[#6B6258]">As faturas MesaLink são emitidas automaticamente pelo Stripe. As dos parceiros aparecem quando são anexadas à reserva.</p>
        </div>
        {showStripePortal && <div className="shrink-0"><ManageSubscriptionButton /></div>}
      </div>

      <div className="grid lg:grid-cols-2">
        <InvoiceColumn
          title="Faturas MesaLink"
          note="Planos, créditos, domínios e serviços Partners"
          empty="Ainda não existem faturas MesaLink emitidas."
        >
          {mesaLinkInvoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              title={invoice.description}
              number={invoice.number}
              date={formatInvoiceDate(invoice.createdAt, locale)}
              amount={invoice.totalCents == null ? null : formatInvoiceMoney(invoice.totalCents / 100, invoice.currency, locale)}
              status={stripeInvoiceStatus(invoice.status)}
              url={invoice.pdfUrl || invoice.hostedUrl}
              secondaryUrl={invoice.pdfUrl && invoice.hostedUrl ? invoice.hostedUrl : null}
            />
          ))}
          {mesaLinkInvoices.length === 0 && <InvoiceEmpty text="Ainda não existem faturas MesaLink emitidas." />}
        </InvoiceColumn>

        <InvoiceColumn
          title="Faturas dos parceiros"
          note="Documentos emitidos pelos parceiros após cada visita"
          empty="Ainda não foram anexadas faturas de parceiros."
          bordered
        >
          {partnerInvoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              title={`${invoice.partner} · ${invoice.restaurant}`}
              number={invoice.number}
              date={`${formatInvoiceDate(invoice.createdAt, locale)} · visita ${formatInvoiceDate(invoice.visitDate, locale)}`}
              amount={formatInvoiceMoney(invoice.total, invoice.currency, locale)}
              status={partnerInvoiceStatus(invoice.status)}
              url={invoice.url}
            />
          ))}
          {partnerInvoices.length === 0 && <InvoiceEmpty text="Ainda não foram anexadas faturas de parceiros." />}
        </InvoiceColumn>
      </div>
    </section>
  );
}

function InvoiceColumn({ title, note, children, bordered }: { title: string; note: string; empty: string; children: React.ReactNode; bordered?: boolean }) {
  return <div className={`p-5 sm:p-7 ${bordered ? "border-t border-[#E8DAC5] lg:border-l lg:border-t-0" : ""}`}><div className="mb-4"><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-[#7B7065]">{note}</p></div><div className="space-y-2">{children}</div></div>;
}

function InvoiceRow({ title, number, date, amount, status, url, secondaryUrl }: { title: string; number: string; date: string; amount: string | null; status: string; url: string | null; secondaryUrl?: string | null }) {
  return <div className="flex flex-col gap-3 rounded-[18px] border border-[#E7D8C0] bg-[#FFFDFC] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{title}</p><span className="rounded-full bg-[#EDF5EA] px-2 py-1 text-[8px] font-black uppercase tracking-[0.11em] text-[#477052]">{status}</span></div><p className="mt-1 text-[10px] text-[#817568]">{number} · {date}</p></div><div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end"><p className="text-sm font-black text-[#6C4B25]">{amount || "Ver documento"}</p>{url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17130F] px-3 text-[10px] font-bold text-white"><Download size={12} /> PDF</a> : <span className="text-[10px] font-bold text-[#9A8D7D]">A preparar</span>}{secondaryUrl && <a href={secondaryUrl} target="_blank" rel="noreferrer" aria-label="Abrir fatura online" className="grid h-9 w-9 place-items-center rounded-full border border-[#D8C5A5] text-[#795D38]"><ExternalLink size={13} /></a>}</div></div>;
}

function InvoiceEmpty({ text }: { text: string }) {
  return <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-[#D8C5A5] bg-[#FFF9F0] p-4 text-xs text-[#75695D]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#9B6F3B]"><FileCheck2 size={16} /></span>{text}</div>;
}

function formatInvoiceDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatInvoiceMoney(value: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currency.toUpperCase() }).format(value);
}

function stripeInvoiceStatus(status: string) {
  if (status === "paid") return "Paga";
  if (status === "void") return "Anulada";
  if (status === "uncollectible") return "Por regularizar";
  return "Emitida";
}

function partnerInvoiceStatus(status: string) {
  if (status === "VERIFIED") return "Verificada";
  if (status === "REJECTED") return "A corrigir";
  return "Em verificação";
}

function CreditUsageGroup({ title, rows, note }: { title: string; rows: Array<{ label: string; value: string }>; note?: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.055] p-4">
      <p className="text-xs font-bold text-white/75">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={`${row.label}-${row.value}`} className="flex items-center justify-between gap-4 rounded-xl bg-black/15 px-3 py-2.5 text-xs">
            <span className="text-white/62">{row.label}</span>
            <strong className="text-right text-[#E7C98D]">= {row.value}</strong>
          </div>
        ))}
      </div>
      {note && <p className="mt-3 text-[10px] leading-4 text-white/42">{note}</p>}
    </div>
  );
}

function CreditPack({ credits, creditsLabel, price, unit, capacityLabel, capacity, action, featured = false }: { credits: string; creditsLabel: string; price: string; unit: string; capacityLabel: string; capacity: string; action: React.ReactNode; featured?: boolean }) {
  return <div className={`flex h-full flex-col rounded-[28px] border p-5 ${featured ? "border-[#D7B267] bg-[#D7B267]/10" : "border-white/10 bg-white/[0.045]"}`}><div className="flex items-end justify-between gap-3"><div><p className="text-3xl font-semibold tracking-[-0.05em]">{credits}</p><p className="mt-1 text-xs uppercase tracking-[0.13em] text-white/50">{creditsLabel}</p></div><div className="text-right"><p className="text-2xl font-semibold text-[#E7C98D]">{price}</p><p className="text-[10px] text-white/45">{unit}</p></div></div><div className="mt-5 rounded-2xl border border-white/8 bg-black/15 p-3"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/42">{capacityLabel}</p><p className="mt-1.5 text-xs leading-5 text-white/72">{capacity}</p></div><div className="mt-auto pt-5">{action}</div></div>;
}
