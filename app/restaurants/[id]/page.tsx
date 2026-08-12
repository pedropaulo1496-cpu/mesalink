import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp, getUserWithSubscription } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import CopyButton from "@/components/CopyButton";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import UpgradeToGrowthButton from "@/components/UpgradeToGrowthButton";
import DashboardRecoveryButton from "@/components/marketing/DashboardRecoveryButton";
import { getLocale, getTranslations } from "next-intl/server";

type TFunc = (key: string, values?: Record<string, string | number>) => string;

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

function money(value: number) {
  return `${value.toFixed(2)}€`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getLineGross(item: any) {
  return Number(
    item.totalPrice ??
      item.lineTotal ??
      Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
  );
}

function getLineVatRate(item: any, product?: any) {
  return Number(item.vatRate ?? product?.vatRate ?? 0);
}

function getLineNet(gross: number, vatRate: number) {
  if (!vatRate || vatRate <= 0) return gross;
  return gross / (1 + vatRate / 100);
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("dashboardOverview.home");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const billingUser = await getUserWithSubscription(session.user.email);

  const subscription = billingUser?.subscription;
  const trialEndsAt = subscription?.trialEndsAt ?? null;
  const nowForBilling = new Date();

  const trialActive =
    subscription?.status === "TRIAL" &&
    trialEndsAt &&
    trialEndsAt > nowForBilling;

  const trialDaysTotal = 7;
  const trialDaysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (trialEndsAt.getTime() - nowForBilling.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const trialProgress = trialEndsAt
    ? Math.min(
        100,
        Math.max(0, Math.round(((trialDaysTotal - trialDaysLeft) / trialDaysTotal) * 100)),
      )
    : 0;

  const subscriptionPlan = String(subscription?.plan ?? "").toUpperCase();
  const subscriptionActive = subscription?.status === "ACTIVE";
const isGrowthPlan =
  trialActive || (subscriptionActive && subscriptionPlan === "GROWTH");
  const isEssentialsPlan = subscriptionActive && subscriptionPlan === "ESSENTIALS";
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
  const includeVat = true;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: { include: { reservations: true } },
      reservations: true,
      orderingOrders: {
        orderBy: { createdAt: "desc" },
        take: 800,
        include: { items: true },
      },
      orderingTableSessions: {
        where: { status: "OPEN" },
        include: { orders: { include: { items: true } } },
      },
      orderingCategories: {
        include: { products: true },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        {t("notFound")}
      </main>
    );
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

  if (!hasConfiguredHours) {
    redirect(`/restaurants/${id}/settings?setup=true`);
  }

  const now = new Date();
  const monthStart = startOfMonth(now);

  const customers = await prisma.customer.findMany({
    where: {
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
  });

  const acceptedQrStatuses = [
    "ACCEPTED",
    "PREPARING",
    "READY",
    "DELIVERED",
    "COMPLETED",
    "PAID",
    "CONFIRMED",
  ];

  const qrRevenueOrders = (restaurant.orderingOrders ?? []).filter((order: any) => {
    const status = String(order.status ?? "").toUpperCase();

    return acceptedQrStatuses.includes(status);
  });

  const tableReservations = restaurant.tables.flatMap((table) =>
    table.reservations.map((reservation) => ({
      ...reservation,
      tableNumber: table.number,
    })),
  );

  const directReservations = restaurant.reservations.map((reservation) => ({
    ...reservation,
    tableNumber: null as number | null,
  }));

  const allReservations = [...tableReservations, ...directReservations].filter(
    (reservation, index, array) =>
      array.findIndex((item) => item.id === reservation.id) === index,
  );

  const inactiveStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];

  const activeReservations = allReservations.filter(
    (reservation) => !inactiveStatuses.includes(String(reservation.status)),
  );

  const reservationsToday = activeReservations.filter((reservation) =>
    sameDay(new Date(reservation.date), now),
  );

  const pendingToday = reservationsToday.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const guestsToday = reservationsToday.reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  const nextReservations = activeReservations
    .filter((reservation) => new Date(reservation.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const totalCapacity =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? restaurant.totalCapacity
      : restaurant.tables.reduce((total, table) => total + table.capacity, 0);

  const occupancyRate =
    totalCapacity > 0 ? Math.round((guestsToday / totalCapacity) * 100) : 0;

  const qrOrdersOpen = restaurant.orderingTableSessions.reduce(
    (total, tableSession) =>
      total +
      tableSession.orders.filter((order) => {
        const status = String(order.status ?? "").toUpperCase();

        return ["ACCEPTED", "PREPARING", "READY"].includes(status);
      }).length,
    0,
  );

  const riskyCustomers = customers.filter(
    (customer) => (customer.riskScore ?? 0) >= 50,
  );

  const riskyRevenue = riskyCustomers.reduce(
    (total, customer) =>
      total +
      (customer.totalVisits ?? customer.visitCount ?? 0) *
        Number(restaurant.averageTicket || 25),
    0,
  );

  const productMap = new Map<string, any>();

  for (const category of restaurant.orderingCategories ?? []) {
    for (const product of category.products ?? []) {
      productMap.set(product.id, {
        ...product,
        categoryName: category.name,
      });
    }
  }

  function buildSalesStats(from: Date) {
    const categoryMap = new Map<string, { name: string; gross: number; net: number; vat: number; quantity: number }>();
    const productSalesMap = new Map<string, { name: string; category: string; gross: number; net: number; vat: number; quantity: number }>();

    let gross = 0;
    let net = 0;
    let vat = 0;

    for (const order of qrRevenueOrders ?? []) {
      const createdAt = new Date(order.createdAt ?? 0);
      if (createdAt < from) continue;

      for (const item of order.items ?? []) {
        const product = item.productId ? productMap.get(item.productId) : null;
        const lineGross = getLineGross(item);
        const vatRate = getLineVatRate(item, product);
        const lineNet = getLineNet(lineGross, vatRate);
        const lineVat = Math.max(0, lineGross - lineNet);
        const quantity = Number(item.quantity ?? 0);
        const productName = item.productName ?? product?.name ?? "Produto";
        const categoryName = product?.categoryName ?? "Sem categoria";

        gross += lineGross;
        net += lineNet;
        vat += lineVat;

        const categoryCurrent = categoryMap.get(categoryName) ?? {
          name: categoryName,
          gross: 0,
          net: 0,
          vat: 0,
          quantity: 0,
        };

        categoryCurrent.gross += lineGross;
        categoryCurrent.net += lineNet;
        categoryCurrent.vat += lineVat;
        categoryCurrent.quantity += quantity;
        categoryMap.set(categoryName, categoryCurrent);

        const productKey = item.productId ?? productName;
        const productCurrent = productSalesMap.get(productKey) ?? {
          name: productName,
          category: categoryName,
          gross: 0,
          net: 0,
          vat: 0,
          quantity: 0,
        };

        productCurrent.gross += lineGross;
        productCurrent.net += lineNet;
        productCurrent.vat += lineVat;
        productCurrent.quantity += quantity;
        productSalesMap.set(productKey, productCurrent);
      }
    }

    return {
      gross,
      net,
      vat,
      categories: Array.from(categoryMap.values()).sort((a, b) => b.gross - a.gross),
      products: Array.from(productSalesMap.values()).sort((a, b) => b.net - a.net),
    };
  }

  const monthSalesStats = buildSalesStats(monthStart);

  function valueWithoutFlatVat(value: number, stats: { gross: number; net: number }) {
    if (includeVat) return value;
    if (stats.gross <= 0) return value;
    return value * (stats.net / stats.gross);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mesalink.pt";
  const publicUrl = `${appUrl}/reserve/${restaurant.slug}`;
  const websiteUrl =
    restaurant.customDomainVerified && restaurant.customDomain
      ? `https://${restaurant.customDomain}`
      : `https://${restaurant.slug}.mesalink.pt`;

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} />

        <section className="px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-7 lg:pt-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
                {t("eyebrow")}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold leading-none tracking-[-0.065em] sm:text-5xl">
                  {restaurant.name}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    restaurant.onlineReservationsEnabled
                      ? "border-[#B7D7B8] bg-[#ECF7EC] text-[#3F6A4D]"
                      : "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]"
                  }`}
                >
                  {restaurant.onlineReservationsEnabled ? t("statusOnline") : t("statusOffline")}
                </span>
              </div>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.address || t("addressFallback")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {billingUser?.isAdmin && (
                <Link
            href="/backoffice"
                  className="rounded-full border border-[#C8A56A] bg-[#FFF7E8] px-4 py-3 text-xs font-bold text-[#7B5528] transition hover:bg-white"
                >
                  MesaLink Admin
                </Link>
              )}
              <SubscriptionStatusButton
                restaurantId={id}
                label={billingLabel}
                subLabel={billingSubLabel}
                progress={billingProgress}
                expired={!trialActive && !subscriptionActive}
              />
              <SignOutButton />
            </div>
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2">
            <MetricCard label={t("metrics.reservationsToday")} value={reservationsToday.length} sub={t("metrics.coversToday", { count: guestsToday })} strong />
            <MetricCard label={t("metrics.qrActive")} value={qrOrdersOpen} sub={t("metrics.qrOpenOrders")} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <CompactOpsCard
              t={t}
              reservationsToday={reservationsToday.length}
              pendingToday={pendingToday.length}
              guestsToday={guestsToday}
              totalCapacity={totalCapacity}
              occupancyRate={occupancyRate}
              tablesCount={restaurant.tables.length}
            />

            <ReservationLinkCard t={t} id={id} publicUrl={publicUrl} websiteUrl={websiteUrl} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <ReservationsCompactCard t={t} intlLocale={intlLocale} id={id} reservations={nextReservations} />
            <MarketingRoiCard
              t={t}
              restaurantId={id}
              isGrowth={isGrowthPlan}
              riskyCustomers={riskyCustomers}
              riskyRevenue={valueWithoutFlatVat(riskyRevenue, monthSalesStats)}
              averageTicket={valueWithoutFlatVat(Number(restaurant.averageTicket || 25), monthSalesStats)}
            />
          </section>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function SubscriptionStatusButton({
  restaurantId,
  label,
  subLabel,
  progress,
  expired = false,
}: {
  restaurantId: string;
  label: string;
  subLabel: string;
  progress: number;
  expired?: boolean;
}) {
  return (
    <Link
      href={`/billing?restaurantId=${restaurantId}`}
      className={`flex items-center gap-3 rounded-full border bg-white px-3 py-2 shadow-[0_12px_35px_rgba(80,55,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(80,55,30,0.10)] ${
        expired
          ? "border-[#E7B7A8] text-[#A14E36]"
          : "border-[#E1D0B8] text-[#16120E]"
      }`}
    >
      <div className="text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6258]">
          {label}
        </p>
        <p className={`text-xs font-bold ${expired ? "text-[#A14E36]" : "text-[#9B6F3B]"}`}>
          {subLabel}
        </p>
      </div>

      <ProgressRing progress={progress} danger={expired} />
    </Link>
  );
}

function ProgressRing({
  progress,
  danger = false,
}: {
  progress: number;
  danger?: boolean;
}) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative flex h-11 w-11 items-center justify-center">
      <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#E8DCCB"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={danger ? "#C55A42" : "#C8A56A"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <span className="absolute text-[10px] font-black text-[#16120E]">
        {safeProgress}%
      </span>
    </div>
  );
}

function Panel({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <div className={`h-full rounded-[32px] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)] ${compact ? "p-4 lg:p-5" : "p-5 lg:p-6"}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  sub,
  strong,
}: {
  label: string;
  value: number | string;
  sub: string;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${strong ? "border-[#C8A56A] bg-[#16120E] text-white" : "border-[#E1D0B8] bg-[#FFF9F0]"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${strong ? "text-[#D8AE62]" : "text-[#6B6258]"}`}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold leading-none tracking-[-0.05em]">
        {value}
      </p>
      <p className={`mt-1 text-[10px] font-bold ${strong ? "text-white/65" : "text-[#6B6258]"}`}>
        {sub}
      </p>
    </div>
  );
}

function CompactOpsCard({
  t,
  reservationsToday,
  pendingToday,
  guestsToday,
  totalCapacity,
  occupancyRate,
  tablesCount,
}: {
  t: TFunc;
  reservationsToday: number;
  pendingToday: number;
  guestsToday: number;
  totalCapacity: number;
  occupancyRate: number;
  tablesCount: number;
}) {
  return (
    <Panel>
      <SectionLabel>{t("ops.sectionLabel")}</SectionLabel>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
        {t("ops.title")}
      </h2>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <SmallStat value={reservationsToday} label={t("ops.reservationsToday")} />
        <SmallStat value={guestsToday} label={t("ops.guestsReserved")} />
        <SmallStat value={pendingToday} label={t("ops.pending")} />
      </div>

      <div className="mt-5 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B6258]">
            {t("ops.occupancy")}
          </p>
          <p className="text-lg font-semibold">{occupancyRate}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
          <div className="h-full rounded-full bg-[#C8A56A]" style={{ width: `${Math.min(occupancyRate, 100)}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-[#6B6258]">
          {t("ops.seatsAndTables", { guests: guestsToday, capacity: totalCapacity || 0, tables: tablesCount })}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E1D0B8] bg-white p-4">
        <p className="text-sm font-semibold">{t("ops.usefulCapacity")}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
          {totalCapacity || 0}
        </p>
        <p className="text-xs text-[#6B6258]">{t("ops.seatsConfigured")}</p>
      </div>
    </Panel>
  );
}

function ReservationsCompactCard({
  t,
  intlLocale,
  id,
  reservations,
}: {
  t: TFunc;
  intlLocale: string;
  id: string;
  reservations: any[];
}) {
  return (
    <Panel compact>
      <div className="flex items-center justify-between gap-4">
        <div>
          <SectionLabel>{t("reservationsCard.sectionLabel")}</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            {t("reservationsCard.title")}
          </h2>
        </div>
        <Link
          href={`/restaurants/${id}/reservations/upcoming`}
          className="text-sm font-semibold text-[#9B6F3B]"
        >
          {t("reservationsCard.viewAll")}
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E8DCCB] bg-[#FFF9F0]">
        {reservations.length === 0 ? (
          <div className="p-4 text-sm text-[#6B6258]">
            {t("reservationsCard.empty")}
          </div>
        ) : (
          reservations.map((reservation) => (
            <ReservationMiniLine key={reservation.id} t={t} intlLocale={intlLocale} reservation={reservation} />
          ))
        )}
      </div>
    </Panel>
  );
}

function ReservationMiniLine({
  t,
  intlLocale,
  reservation,
}: {
  t: TFunc;
  intlLocale: string;
  reservation: any;
}) {
  return (
    <details className="group border-b border-[#E8DCCB] last:border-b-0">
      <summary className="grid cursor-pointer list-none grid-cols-[70px_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-white">
        <p className="font-semibold">
          {new Date(reservation.date).toLocaleTimeString(intlLocale, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <div className="min-w-0">
          <p className="truncate font-semibold">{reservation.customerName}</p>
          <p className="text-xs text-[#6B6258]">
            {new Date(reservation.date).toLocaleDateString(intlLocale)}
          </p>
        </div>
        <p className="text-sm font-bold text-[#9B6F3B]">{t("reservationsCard.pax", { count: reservation.guests })}</p>
      </summary>

      <div className="grid gap-2 border-t border-[#E8DCCB] bg-white px-4 py-3 text-xs text-[#6B6258] sm:grid-cols-2">
        <div>
          <p className="font-semibold text-[#16120E]">{t("reservationsCard.mobile")}</p>
          <p className="mt-1">{reservation.phone || t("reservationsCard.mobileEmpty")}</p>
        </div>

        <div>
          <p className="font-semibold text-[#16120E]">{t("reservationsCard.email")}</p>
          <p className="mt-1 break-all">{reservation.email || t("reservationsCard.emailEmpty")}</p>
        </div>
      </div>
    </details>
  );
}

function MarketingRoiCard({
  t,
  restaurantId,
  isGrowth,
  riskyCustomers,
  riskyRevenue,
  averageTicket,
}: {
  t: TFunc;
  restaurantId: string;
  isGrowth: boolean;
  riskyCustomers: any[];
  riskyRevenue: number;
  averageTicket: number;
}) {
  if (!isGrowth) {
    return (
      <Panel compact>
        <div className="flex h-full flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <SectionLabel>{t("marketingTeaser.sectionLabel")}</SectionLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
                {t("marketingTeaser.title")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">
                {t("marketingTeaser.text")}
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
              {t("marketingTeaser.badge")}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <GrowthFeature text={t("marketingTeaser.features.riskyCustomers")} />
            <GrowthFeature text={t("marketingTeaser.features.autoCampaigns")} />
            <GrowthFeature text={t("marketingTeaser.features.autoBirthdays")} />
            <GrowthFeature text={t("marketingTeaser.features.campaignRoi")} />
          </div>

          <div className="mt-auto pt-5">
            <div className="flex flex-col gap-4 rounded-[24px] border border-[#D8C5A5] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B]">
                  {t("marketingTeaser.upgradeLabel")}
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                  {t("marketingTeaser.price", { price: 20 })}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                  {t("marketingTeaser.priceNote")}
                </p>
              </div>

              <UpgradeToGrowthButton />
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  const targetCustomers = riskyCustomers.length;
  const expectedRecoveredCustomers = Math.max(0, Math.round(targetCustomers * 0.18));
  const expectedRevenue = expectedRecoveredCustomers * averageTicket;
  const roi = riskyRevenue > 0 ? Math.round((expectedRevenue / riskyRevenue) * 100) : 0;

  return (
    <Panel compact>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <SectionLabel>{t("marketingActive.sectionLabel")}</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            {t("marketingActive.title")}
          </h2>
          <p className="mt-2 text-sm text-[#6B6258]">
            {t("marketingActive.text")}
          </p>
        </div>

        <Link
          href={`/restaurants/${restaurantId}/marketing`}
          className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          {t("marketingActive.viewMarketing")}
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <SmallStat value={targetCustomers} label={t("marketingActive.riskyCustomers")} />
        <SmallStat value={money(riskyRevenue)} label={t("marketingActive.riskyValue")} />
        <SmallStat value={money(expectedRevenue)} label={t("marketingActive.estimatedRevenue")} />
        <SmallStat value={`${roi}%`} label={t("marketingActive.estimatedRoi")} />
      </div>

           <div className="mt-5 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">{t("marketingActive.recommendedCampaign")}</p>
            <p className="mt-1 text-xs font-bold text-[#6B6258]">
              {t("marketingActive.recommendedCampaignText")}
            </p>
          </div>

          <p className="text-right text-2xl font-semibold tracking-[-0.05em] text-[#9B6F3B]">
            {expectedRecoveredCustomers}
          </p>
        </div>

        <div className="mt-4">
          <DashboardRecoveryButton restaurantId={restaurantId} />
        </div>
      </div>
    </Panel>
  );
}

function GrowthFeature({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white px-4 py-3 text-sm font-semibold text-[#16120E]">
      ✓ {text}
    </div>
  );
}

function ReservationLinkCard({
  t,
  id,
  publicUrl,
  websiteUrl,
}: {
  t: TFunc;
  id: string;
  publicUrl: string;
  websiteUrl: string;
}) {
  return (
    <Panel compact>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>{t("reservationLink.sectionLabel")}</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
              {t("reservationLink.title")}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B6258]">
              {t("reservationLink.text")}
            </p>
          </div>

          <span className="rounded-full border border-[#B7D7B8] bg-[#ECF7EC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3F6A4D]">
            {t("reservationLink.active")}
          </span>
        </div>

        <div className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
              {t("reservationLink.urlLabel")}
            </p>

            <Link
              href={publicUrl}
              target="_blank"
              className="text-xs font-semibold text-[#9B6F3B] hover:text-[#16120E]"
            >
              {t("reservationLink.open")}
            </Link>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3">
              <p className="truncate text-sm font-bold text-[#16120E]">
                {publicUrl}
              </p>
            </div>

            <CopyButton text={publicUrl} />
          </div>

          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
                {t("reservationLink.steps.website.title")}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-[#16120E]">
                {websiteUrl}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={websiteUrl}
                target="_blank"
                className="rounded-full border border-[#E1D0B8] px-4 py-2 text-xs font-semibold text-[#9B6F3B] transition hover:bg-[#FFF9F0]"
              >
                {t("reservationLink.open")}
              </Link>
              <CopyButton text={websiteUrl} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1 rounded-[26px] border border-[#E1D0B8] bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
            {t("reservationLink.howToUse")}
          </p>

          <div className="mt-4 grid gap-3">
            <InstructionStep
              number="1"
              title={t("reservationLink.steps.googleMaps.title")}
              text={t("reservationLink.steps.googleMaps.text")}
            />
            <InstructionStep
              number="2"
              title={t("reservationLink.steps.socials.title")}
              text={t("reservationLink.steps.socials.text")}
            />
            <InstructionStep
              number="3"
              title={t("reservationLink.steps.website.title")}
              text={t("reservationLink.steps.website.text")}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
}

function InstructionStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3 rounded-2xl bg-[#FFF9F0] p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16120E] text-xs font-semibold text-white">
        {number}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#16120E]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#6B6258]">{text}</p>
      </div>
    </div>
  );
}

function ActionLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 transition hover:border-[#C8A56A] hover:bg-white">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[#6B6258]">{sub}</p>
    </Link>
  );
}

function SmallStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-xs text-[#6B6258]">{label}</p>
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="rounded-full bg-[#16120E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
      {children}
    </Link>
  );
}
