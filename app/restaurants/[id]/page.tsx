import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import CopyButton from "@/components/CopyButton";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import UpgradeToGrowthButton from "@/components/UpgradeToGrowthButton";
import DashboardRecoveryButton from "@/components/marketing/DashboardRecoveryButton";

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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

async function safePosCashRegisters(restaurantId: string) {
  try {
    const delegate = (prisma as any).pOSCashRegister;
    if (!delegate?.findMany) return [];

    return await delegate.findMany({
      where: { restaurantId },
      include: { payments: { include: { tableSession: true } }, movements: true },
      orderBy: { openedAt: "desc" },
    });
  } catch (error) {
    console.error("DASHBOARD POS CASH REGISTERS ERROR:", error);
    return [];
  }
}

async function safePosOpenSessions(restaurantId: string) {
  try {
    const delegate = (prisma as any).pOSTableSession;
    if (!delegate?.findMany) return [];

    return await delegate.findMany({
      where: { restaurantId, status: "OPEN" },
      include: { table: true, orders: { include: { items: true } } },
      orderBy: { openedAt: "desc" },
    });
  } catch (error) {
    console.error("DASHBOARD POS SESSIONS ERROR:", error);
    return [];
  }
}

async function safePosOrdersForDashboard(restaurantId: string) {
  try {
    const delegate = (prisma as any).pOSOrder;
    if (!delegate?.findMany) return [];

    return await delegate.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 800,
    });
  } catch (error) {
    console.error("DASHBOARD POS ORDERS ERROR:", error);
    return [];
  }
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ vat?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const billingUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

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
    ? "Trial"
    : subscriptionActive && subscriptionPlan === "GROWTH"
      ? "Growth"
      : subscriptionActive && subscriptionPlan === "ESSENTIALS"
        ? "Essentials"
        : "Subscrição";

  const billingSubLabel = trialActive
    ? `${trialDaysLeft} dia(s)`
    : subscriptionActive
      ? "Ativo"
      : "Renovar";

  const billingProgress = trialActive ? trialProgress : subscriptionActive ? 100 : 0;

  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const includeVat = query?.vat !== "net";

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
        Restaurante não encontrado
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
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const [cashRegisters, openPosSessions, posOrders, customers] = await Promise.all([
    safePosCashRegisters(id),
    safePosOpenSessions(id),
    safePosOrdersForDashboard(id),
    prisma.customer.findMany({
      where: {
        reservations: {
          some: {
            restaurantId: id,
          },
        },
      },
    }),
  ]);

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

  const getQrOrderTotal = (order: any) =>
    Number(order.total ?? order.subtotal ?? order.amount ?? 0);

  const revenueToday = qrRevenueOrders
    .filter((order: any) => new Date(order.createdAt) >= todayStart)
    .reduce((sum: number, order: any) => sum + getQrOrderTotal(order), 0);

  const revenueMonth = qrRevenueOrders
    .filter((order: any) => new Date(order.createdAt) >= monthStart)
    .reduce((sum: number, order: any) => sum + getQrOrderTotal(order), 0);

  const revenueYear = qrRevenueOrders
    .filter((order: any) => new Date(order.createdAt) >= yearStart)
    .reduce((sum: number, order: any) => sum + getQrOrderTotal(order), 0);

  const paymentsToday = qrRevenueOrders.filter((order: any) =>
    new Date(order.createdAt) >= todayStart,
  );

  const cardMonth = revenueToday;
  const cashMonth = revenueMonth;
  const transferMonth = revenueYear;

  const averageTicket = paymentsToday.length
    ? revenueToday / paymentsToday.length
    : 0;

  const paidTodaySessionGuests = paymentsToday.length;

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

  const openTables = openPosSessions.filter((item: any) => item.tableId).length;
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

  const todaySalesStats = buildSalesStats(todayStart);
  const monthSalesStats = buildSalesStats(monthStart);
  const yearSalesStats = buildSalesStats(yearStart);

  function valueWithoutFlatVat(value: number, stats: { gross: number; net: number }) {
    if (includeVat) return value;
    if (stats.gross <= 0) return value;
    return value * (stats.net / stats.gross);
  }

  const displayToday = valueWithoutFlatVat(revenueToday, todaySalesStats);
  const displayMonth = valueWithoutFlatVat(revenueMonth, monthSalesStats);
  const displayYear = valueWithoutFlatVat(revenueYear, yearSalesStats);
  const displayAverageTicket = valueWithoutFlatVat(averageTicket, todaySalesStats);
  const averagePerGuest = paidTodaySessionGuests > 0 ? revenueToday / paidTodaySessionGuests : 0;
  const displayAveragePerGuest = valueWithoutFlatVat(averagePerGuest, todaySalesStats);

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;
  const websiteUrl = `https://${restaurant.slug}.mesalink.pt`;

  const lastSevenDays = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(todayStart);
    day.setDate(day.getDate() - (6 - index));

    const total = qrRevenueOrders
      .filter((order: any) => sameDay(new Date(order.createdAt), day))
      .reduce((sum: number, order: any) => sum + getQrOrderTotal(order), 0);

    return {
      label: day.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
      total,
    };
  });

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} />

        <section className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
                Dashboard
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
                  {restaurant.onlineReservationsEnabled ? "Online" : "Offline"}
                </span>
              </div>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.address || "Resumo operacional do restaurante."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <SubscriptionStatusButton
                restaurantId={id}
                label={billingLabel}
                subLabel={billingSubLabel}
                progress={billingProgress}
                expired={!trialActive && !subscriptionActive}
              />
              <VatToggle id={id} includeVat={includeVat} />
              <SignOutButton />
            </div>
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="QR hoje" value={money(displayToday)} sub={`${paymentsToday.length} pedidos QR`} strong />
            <MetricCard label="QR mês" value={money(displayMonth)} sub="vendas QR Ordering" />
            <MetricCard label="Ticket QR" value={money(displayAveragePerGuest)} sub={`${paidTodaySessionGuests || 0} pedidos hoje`} />
            <MetricCard label="Reservas hoje" value={reservationsToday.length} sub={`${guestsToday} covers`} />
            <MetricCard label="QR ativos" value={qrOrdersOpen} sub="pedidos em aberto" />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <RevenueCard
              today={displayToday}
              month={displayMonth}
              year={displayYear}
              card={valueWithoutFlatVat(cardMonth, monthSalesStats)}
              cash={valueWithoutFlatVat(cashMonth, monthSalesStats)}
              transfer={valueWithoutFlatVat(transferMonth, monthSalesStats)}
              payments={paymentsToday.length}
              averagePerGuest={displayAveragePerGuest}
              includeVat={includeVat}
              points={lastSevenDays.map((point) => ({
                ...point,
                total: valueWithoutFlatVat(point.total, monthSalesStats),
              }))}
            />

            <CompactOpsCard
              reservationsToday={reservationsToday.length}
              pendingToday={pendingToday.length}
              guestsToday={guestsToday}
              totalCapacity={totalCapacity}
              occupancyRate={occupancyRate}
              openTables={openTables}
              tablesCount={restaurant.tables.length}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <ReservationsCompactCard reservations={nextReservations} />
            <MarketingRoiCard
              restaurantId={id}
              isGrowth={isGrowthPlan}
              riskyCustomers={riskyCustomers}
              riskyRevenue={valueWithoutFlatVat(riskyRevenue, monthSalesStats)}
              averageTicket={valueWithoutFlatVat(Number(restaurant.averageTicket || 25), monthSalesStats)}
            />
          </section>

          <section className="mt-6 grid items-stretch gap-6 xl:grid-cols-2">
            <ReservationLinkCard id={id} publicUrl={publicUrl} websiteUrl={websiteUrl} />
            <SalesIntelligenceCard
              categories={monthSalesStats.categories}
              products={monthSalesStats.products}
              includeVat={includeVat}
              total={includeVat ? monthSalesStats.gross : monthSalesStats.net}
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

function VatToggle({ id, includeVat }: { id: string; includeVat: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#E1D0B8] bg-white p-1">
      <Link
        href={`/restaurants/${id}`}
        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
          includeVat
            ? "bg-[#16120E] text-white"
            : "text-[#6B6258] hover:text-[#16120E]"
        }`}
      >
        c/ IVA
      </Link>

      <Link
        href={`/restaurants/${id}?vat=net`}
        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
          !includeVat
            ? "bg-[#16120E] text-white"
            : "text-[#6B6258] hover:text-[#16120E]"
        }`}
      >
        s/ IVA
      </Link>
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

function RevenueCard({
  today,
  month,
  year,
  card,
  cash,
  transfer,
  payments,
  averagePerGuest,
  includeVat,
  points,
}: {
  today: number;
  month: number;
  year: number;
  card: number;
  cash: number;
  transfer: number;
  payments: number;
  averagePerGuest: number;
  includeVat: boolean;
  points: { label: string; total: number }[];
}) {
  const max = Math.max(...points.map((point) => point.total), 1);
  const chartPoints = points
    .map((point, index) => {
      const x = index * 90;
      const y = 130 - (point.total / max) * 105;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <SectionLabel>QR Ordering</SectionLabel>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
            Performance de vendas
          </h2>
          <p className="mt-2 text-sm text-[#6B6258]">
  Dados reais dos pedidos aceites no QR Ordering · {includeVat ? "com IVA" : "sem IVA estimado por taxa"}.
          </p>
        </div>

        <div className="rounded-[24px] bg-[#16120E] px-5 py-4 text-right text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D8AE62]">
            Hoje
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-[-0.07em]">
            {money(today)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <FinanceStat title="Mês" value={money(month)} sub="total mensal" />
        <FinanceStat title="Ano" value={money(year)} sub="total anual" />
        <FinanceStat title="Pagamentos" value={payments} sub="hoje" />
        <FinanceStat title="Ticket/mesa" value={money(averagePerGuest)} sub="por mesa pago" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
          <svg viewBox="0 0 540 150" className="h-44 w-full overflow-visible">
            <defs>
              <linearGradient id="revenueDashboardFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#C8A56A" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#C8A56A" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[30, 60, 90, 120].map((y) => (
              <line key={y} x1="0" x2="540" y1={y} y2={y} stroke="#E1D0B8" strokeWidth="1" />
            ))}

            <polygon points={`0,150 ${chartPoints} 540,150`} fill="url(#revenueDashboardFill)" />
            <polyline points={chartPoints} fill="none" stroke="#C8A56A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

            {points.map((point, index) => (
              <text key={point.label} x={index * 90} y="148" fill="#6B6258" fontSize="12">
                {point.label}
              </text>
            ))}
          </svg>
        </div>

        <div className="grid gap-3">
          <PaymentBreakdown label="Hoje" value={card} total={Math.max(year, 1)} />
          <PaymentBreakdown label="Mês" value={cash} total={Math.max(year, 1)} />
          <PaymentBreakdown label="Ano" value={transfer} total={Math.max(year, 1)} />
        </div>
      </div>
    </Panel>
  );
}

function FinanceStat({ title, value, sub }: { title: string; value: number | string; sub: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white p-4">
      <p className="text-sm text-[#6B6258]">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#16120E]">
        {value}
      </p>
      <p className="mt-2 text-xs text-[#6B6258]">{sub}</p>
    </div>
  );
}

function PaymentBreakdown({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#16120E]">{label}</p>
        <p className="text-sm font-bold text-[#9B6F3B]">{money(value)}</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
        <div className="h-full rounded-full bg-[#C8A56A]" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[10px] font-bold text-[#6B6258]">{percentage}% do ano</p>
    </div>
  );
}

function CompactOpsCard({
  reservationsToday,
  pendingToday,
  guestsToday,
  totalCapacity,
  occupancyRate,
  openTables,
  tablesCount,
}: {
  reservationsToday: number;
  pendingToday: number;
  guestsToday: number;
  totalCapacity: number;
  occupancyRate: number;
  openTables: number;
  tablesCount: number;
}) {
  return (
    <Panel>
      <SectionLabel>Operação</SectionLabel>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
        Agora
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <SmallStat value={openTables} label="mesas POS abertas" />
        <SmallStat value={reservationsToday} label="reservas hoje" />
        <SmallStat value={guestsToday} label="covers reservados" />
        <SmallStat value={pendingToday} label="pendentes" />
      </div>

      <div className="mt-5 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B6258]">
            Ocupação reservas
          </p>
          <p className="text-lg font-semibold">{occupancyRate}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
          <div className="h-full rounded-full bg-[#C8A56A]" style={{ width: `${Math.min(occupancyRate, 100)}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-[#6B6258]">
          {guestsToday}/{totalCapacity || 0} lugares · {tablesCount} mesas
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E1D0B8] bg-white p-4">
        <p className="text-sm font-semibold">Capacidade útil</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
          {totalCapacity || 0}
        </p>
        <p className="text-xs text-[#6B6258]">lugares configurados</p>
      </div>
    </Panel>
  );
}

function ReservationsCompactCard({ reservations }: { reservations: any[] }) {
  return (
    <Panel compact>
      <div className="flex items-center justify-between gap-4">
        <div>
          <SectionLabel>Reservas</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            Próximas
          </h2>
        </div>
        <Link href="reservations" className="text-sm font-semibold text-[#9B6F3B]">
          Ver reservas
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-[#E8DCCB] bg-[#FFF9F0]">
        {reservations.length === 0 ? (
          <div className="p-4 text-sm text-[#6B6258]">
            Ainda não há próximas reservas.
          </div>
        ) : (
          reservations.map((reservation) => (
            <ReservationMiniLine key={reservation.id} reservation={reservation} />
          ))
        )}
      </div>
    </Panel>
  );
}

function ReservationMiniLine({ reservation }: { reservation: any }) {
  return (
    <div className="grid grid-cols-[70px_1fr_auto] items-center gap-3 border-b border-[#E8DCCB] px-4 py-3 last:border-b-0">
      <p className="font-semibold">
        {new Date(reservation.date).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="min-w-0">
        <p className="truncate font-semibold">{reservation.customerName}</p>
        <p className="text-xs text-[#6B6258]">
          {new Date(reservation.date).toLocaleDateString("pt-PT")}
        </p>
      </div>
      <p className="text-sm font-bold text-[#9B6F3B]">{reservation.guests} pax</p>
    </div>
  );
}

function MarketingRoiCard({
  restaurantId,
  isGrowth,
  riskyCustomers,
  riskyRevenue,
  averageTicket,
}: {
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
              <SectionLabel>Marketing Growth</SectionLabel>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
                Recupere clientes e aumente visitas recorrentes.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">
                Desbloqueie campanhas automáticas, clientes em risco,
                aniversários, segmentação VIP e ROI das campanhas.
              </p>
            </div>

            <span className="w-fit rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
              Growth
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <GrowthFeature text="Clientes em risco" />
            <GrowthFeature text="Campanhas automáticas" />
            <GrowthFeature text="Aniversários automáticos" />
            <GrowthFeature text="ROI das campanhas" />
          </div>

          <div className="mt-auto pt-5">
            <div className="flex flex-col gap-4 rounded-[24px] border border-[#D8C5A5] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B]">
                  Upgrade
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">
                  +20€/mês
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                  Mantém a mesma data de renovação e o Stripe calcula a diferença.
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
          <SectionLabel>Marketing</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            ROI e retenção
          </h2>
          <p className="mt-2 text-sm text-[#6B6258]">
            Mede o impacto das campanhas sobre clientes em risco.
          </p>
        </div>

        <Link
          href={`/restaurants/${restaurantId}/marketing`}
          className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          Ver marketing
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <SmallStat value={targetCustomers} label="clientes em risco" />
        <SmallStat value={money(riskyRevenue)} label="valor em risco" />
        <SmallStat value={money(expectedRevenue)} label="receita estimada" />
        <SmallStat value={`${roi}%`} label="ROI estimado" />
      </div>

           <div className="mt-5 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Campanha recomendada</p>
            <p className="mt-1 text-xs font-bold text-[#6B6258]">
              Recuperar clientes sem visita recente com incentivo controlado.
            </p>
          </div>

          <p className="text-right text-2xl font-semibold tracking-[-0.05em] text-[#9B6F3B]">
            {expectedRecoveredCustomers}
          </p>
        </div>

        <div className="mt-4">
          <DashboardRecoveryButton />
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
  id,
  publicUrl,
  websiteUrl,
}: {
  id: string;
  publicUrl: string;
  websiteUrl: string;
}) {
  return (
    <Panel compact>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Reservas online</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
              Link público
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B6258]">
              Usa este link nos canais onde os clientes procuram mesa.
            </p>
          </div>

          <span className="rounded-full border border-[#B7D7B8] bg-[#ECF7EC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3F6A4D]">
            Ativo
          </span>
        </div>

        <div className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
              URL de reservas
            </p>

            <Link
              href={publicUrl}
              target="_blank"
              className="text-xs font-semibold text-[#9B6F3B] hover:text-[#16120E]"
            >
              Abrir
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
        </div>

        <div className="mt-4 flex-1 rounded-[26px] border border-[#E1D0B8] bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
            Como usar
          </p>

          <div className="mt-4 grid gap-3">
            <InstructionStep
              number="1"
              title="Google Maps"
              text="Cole no botão de reservas do Google Business Profile."
            />
            <InstructionStep
              number="2"
              title="Instagram e Facebook"
              text="Use na bio, stories fixos e respostas automáticas."
            />
            <InstructionStep
              number="3"
              title="Website"
              text="Coloque como botão principal de reserva online."
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

function SalesIntelligenceCard({
  categories,
  products,
  includeVat,
  total,
}: {
  categories: { name: string; gross: number; net: number; quantity: number }[];
  products: { name: string; category: string; gross: number; net: number; quantity: number }[];
  includeVat: boolean;
  total: number;
}) {
  const topCategories = categories.slice(0, 5);
  const topProducts = products.slice(0, 5);

  return (
    <Panel compact>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>QR Ordering</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            Categorias e rentabilidade
          </h2>
          <p className="mt-2 text-sm text-[#6B6258]">
            Dados ligados aos pedidos aceites no QR Ordering: categorias vendidas e produtos com maior receita.
          </p>
        </div>

        <span className="rounded-full bg-[#EFE5D6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
          {includeVat ? "Com IVA" : "Sem IVA"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <p className="font-semibold">Categorias vendidas</p>

          <div className="mt-4 space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-sm text-[#6B6258]">Ainda sem vendas por categoria.</p>
            ) : (
              topCategories.map((category) => {
                const value = includeVat ? category.gross : category.net;
                const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

                return (
                  <div key={category.name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-semibold">{category.name}</p>
                      <p className="font-bold text-[#9B6F3B]">
                        {percentage}% · {money(value)}
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
                      <div
                        className="h-full rounded-full bg-[#C8A56A]"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-[#6B6258]">
                      {category.quantity} unidades
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
          <p className="font-semibold">Produtos mais rentáveis</p>
          <p className="mt-1 text-xs text-[#6B6258]">
            Ordenado por receita dos pedidos aceites no QR Ordering. Para margem real, falta custo do produto.
          </p>

          <div className="mt-4 space-y-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-[#6B6258]">Ainda sem produtos vendidos.</p>
            ) : (
              topProducts.map((product, index) => {
                const value = includeVat ? product.gross : product.net;

                return (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{product.name}</p>
                      <p className="text-xs text-[#6B6258]">
                        {product.category} · {product.quantity} uni
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-[#9B6F3B]">
                      {money(value)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Panel>
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

function BottomNav({ id }: { id: string }) {
  const items = [
    { href: `/restaurants/${id}`, icon: "⌂", label: "Dash" },
    { href: `/restaurants/${id}/day`, icon: "⚡", label: "Hoje" },
    { href: `/restaurants/${id}/calendar`, icon: "📅", label: "Calend." },
    { href: `/restaurants/${id}/ordering`, icon: "📲", label: "QR" },
    { href: `/restaurants/${id}/tables`, icon: "▦", label: "Sala" },
    { href: `/restaurants/${id}/settings`, icon: "⚙️", label: "Def." },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/95 px-1.5 py-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[#6B6258] active:bg-[#FFF9F0] active:text-[#16120E]"
          >
            <span className="text-[20px] leading-none">{item.icon}</span>
            <span className="text-[9px] font-black leading-none">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}