import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { assertRestaurantOwner } from "@/lib/restaurant-auth";
import { BIRTHDAY_RESERVATION_IGNORED_STATUSES, birthdayIsUpcomingThisMonth, calendarMonthRange } from "@/lib/birthday-marketing";

export default async function MarketingRecommendationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await assertRestaurantOwner(id);

  const t = await getTranslations("dashboardMarketing.recommendations");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  const now = new Date();
  const birthdayMonth = calendarMonthRange(now);
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
        where: {
          date: { gte: birthdayMonth.start, lt: birthdayMonth.end },
          status: { notIn: [...BIRTHDAY_RESERVATION_IGNORED_STATUSES] },
        },
        select: { id: true },
      },
    },
  });

  const averageTicket = Number(restaurant.averageTicket || 25);

  const vipCustomers = customers.filter(
    (customer) =>
      customer.vipTier === "GOLD" ||
      customer.vipTier === "PLATINUM",
  );

  const riskyCustomers = customers.filter(
    (customer) => (customer.riskScore ?? 0) >= 50,
  );

  const birthdayCustomers = customers.filter((customer) => {
    if (!customer.birthDate) return false;

    return birthdayIsUpcomingThisMonth(customer.birthDate, now) && customer.reservations.length === 0;
  });

  const inactiveCustomers = customers.filter((customer) => {
    const lastVisit = customer.lastVisitAt || customer.lastReservationAt;

    if (!lastVisit) return false;

    const daysSinceLastVisit = Math.round(
      (now.getTime() - new Date(lastVisit).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return daysSinceLastVisit >= 60;
  });

  const vipPotential = vipCustomers.reduce(
    (total, customer) =>
      total +
      Math.max(customer.totalVisits ?? 0, customer.visitCount ?? 0, 1) *
        averageTicket,
    0,
  );

  const birthdayPotential = birthdayCustomers.length * averageTicket;

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
                {t("eyebrow")}
              </p>

              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
                {t("title")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                {t("subtitle")}
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/marketing`}
              className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
            >
              {t("backToGrowth")}
            </Link>
          </header>

          <section className="mt-8 rounded-[44px] border border-[#2C2117] bg-[#17120D] p-7 text-white shadow-[0_35px_100px_rgba(44,31,18,0.28)] lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
              {t("priority.eyebrow")}
            </p>

            <h2 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.075em]">
              {vipCustomers.length > 0
                  ? t("priority.messages.vip")
                  : birthdayCustomers.length > 0
                    ? t("priority.messages.birthday")
                    : t("priority.messages.none")}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#EADBC5]">
              {t("priority.description")}
            </p>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <RecommendationCard
              label={t("cards.vip.label")}
              title={t("cards.vip.title")}
              description={t("cards.vip.description")}
              count={vipCustomers.length}
              potential={vipPotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=VIP`}
              cta={t("cards.vip.cta")}
              priority={vipCustomers.length > 0}
              priorityLabel={t("priorityBadge")}
              customersLabel={t("miniStats.customers")}
              potentialLabel={t("miniStats.potential")}
            />

            <RecommendationCard
              label={t("cards.birthday.label")}
              title={t("cards.birthday.title")}
              description={t("cards.birthday.description")}
              count={birthdayCustomers.length}
              potential={birthdayPotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=BIRTHDAYS`}
              cta={t("cards.birthday.cta")}
              priority={
                vipCustomers.length === 0 &&
                birthdayCustomers.length > 0
              }
              priorityLabel={t("priorityBadge")}
              customersLabel={t("miniStats.customers")}
              potentialLabel={t("miniStats.potential")}
            />

          </section>

          <Link href={`/restaurants/${id}/revenue-ai`} className="mt-6 flex flex-col gap-5 rounded-[34px] border border-[#2C2117] bg-[#17120D] p-6 text-white shadow-[0_24px_70px_rgba(45,31,18,0.14)] sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D7B267]">Revenue AI · Oportunidades individuais</p><h2 className="mt-2 text-2xl font-semibold">{riskyCustomers.length + inactiveCustomers.length} casos para tratar numa conversa</h2><p className="mt-2 text-sm text-white/55">{t("cards.risky.title")} · {t("cards.inactive.title")} · follow-up e receita recuperada vivem no Revenue AI.</p></div>
            <span className="w-fit shrink-0 rounded-full bg-[#D7B267] px-5 py-3 text-sm font-black text-[#17120D]">Abrir Revenue AI →</span>
          </Link>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function RecommendationCard({
  label,
  title,
  description,
  count,
  potential,
  href,
  cta,
  priority,
  priorityLabel,
  customersLabel,
  potentialLabel,
}: {
  label: string;
  title: string;
  description: string;
  count: number;
  potential: number;
  href: string;
  cta: string;
  priority?: boolean;
  priorityLabel: string;
  customersLabel: string;
  potentialLabel: string;
}) {
  return (
    <div
      className={
        priority
          ? "rounded-[36px] border border-[#2C2117] bg-[#17120D] p-6 text-white shadow-[0_24px_80px_rgba(80,55,30,0.18)]"
          : "rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={
              priority
                ? "text-xs font-black uppercase tracking-[0.26em] text-[#D7B267]"
                : "text-xs font-black uppercase tracking-[0.26em] text-[#9B6F3B]"
            }
          >
            {label}
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
            {title}
          </h2>

          <p
            className={
              priority
                ? "mt-2 text-sm leading-6 text-[#EADBC5]"
                : "mt-2 text-sm leading-6 text-[#6B6258]"
            }
          >
            {description}
          </p>
        </div>

        {priority && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#F4E7D2]">
            {priorityLabel}
          </span>
        )}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <MiniStat label={customersLabel} value={count} priority={priority} />
        <MiniStat
          label={potentialLabel}
          value={`${potential.toFixed(0)}€`}
          priority={priority}
        />
      </div>

      <Link
        href={href}
        className={
          priority
            ? "mt-6 flex h-12 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#16120E] transition hover:bg-[#F5EFE6]"
            : "mt-6 flex h-12 items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        }
      >
        {cta}
      </Link>
    </div>
  );
}

function MiniStat({
  label,
  value,
  priority,
}: {
  label: string;
  value: number | string;
  priority?: boolean;
}) {
  return (
    <div
      className={
        priority
          ? "rounded-2xl border border-white/10 bg-white/8 p-4"
          : "rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4"
      }
    >
      <p
        className={
          priority
            ? "text-xs text-[#D8C9B3]"
            : "text-xs text-[#6B6258]"
        }
      >
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-[-0.055em]">
        {value}
      </p>
    </div>
  );
}
