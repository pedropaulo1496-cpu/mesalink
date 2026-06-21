import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import Link from "next/link";

export default async function MarketingRecommendationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  const customers = await prisma.customer.findMany({
    where: {
      marketingOptIn: true,
      email: {
        not: null,
      },
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
  });

  const averageTicket = Number(restaurant.averageTicket || 25);

  const now = new Date();

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

    return new Date(customer.birthDate).getMonth() === now.getMonth();
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

  const riskyPotential = riskyCustomers.reduce(
    (total, customer) =>
      total +
      Math.max(customer.totalVisits ?? 0, customer.visitCount ?? 0, 1) *
        averageTicket,
    0,
  );

  const birthdayPotential = birthdayCustomers.length * averageTicket;
  const inactivePotential = inactiveCustomers.length * averageTicket;

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
                MesaLink Recommendations
              </p>

              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
                O que fazer hoje
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                Recomendações automáticas com base em clientes VIP, risco de
                abandono, aniversários e inatividade.
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/marketing`}
              className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
            >
              Voltar ao Growth
            </Link>
          </header>

          <section className="mt-8 rounded-[44px] border border-[#2C2117] bg-[#17120D] p-7 text-white shadow-[0_35px_100px_rgba(44,31,18,0.28)] lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#D7B267]">
              Prioridade recomendada
            </p>

            <h2 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.075em]">
              {riskyCustomers.length > 0
                ? "Recupere clientes em risco antes que desapareçam."
                : vipCustomers.length > 0
                  ? "Ative os seus melhores clientes com uma campanha VIP."
                  : birthdayCustomers.length > 0
                    ? "Envie uma campanha de aniversário este mês."
                    : "Ainda não há recomendações críticas."}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#EADBC5]">
              O MesaLink analisa a base de clientes e sugere ações comerciais
              com maior impacto imediato.
            </p>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <RecommendationCard
              label="Recuperação"
              title="Clientes em risco"
              description="Clientes com risco elevado ou médio de abandono."
              count={riskyCustomers.length}
              potential={riskyPotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=INACTIVE`}
              cta="Criar campanha de recuperação"
              priority={riskyCustomers.length > 0}
            />

            <RecommendationCard
              label="VIP Club"
              title="Gold & Platinum"
              description="Clientes de maior valor que merecem uma campanha exclusiva."
              count={vipCustomers.length}
              potential={vipPotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=VIP`}
              cta="Criar campanha VIP"
              priority={riskyCustomers.length === 0 && vipCustomers.length > 0}
            />

            <RecommendationCard
              label="Aniversários"
              title="Aniversários do mês"
              description="Clientes com aniversário este mês e autorização de marketing."
              count={birthdayCustomers.length}
              potential={birthdayPotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=BIRTHDAYS`}
              cta="Criar campanha aniversário"
              priority={
                riskyCustomers.length === 0 &&
                vipCustomers.length === 0 &&
                birthdayCustomers.length > 0
              }
            />

            <RecommendationCard
              label="Inativos"
              title="Clientes sem visita"
              description="Clientes sem visita há mais de 60 dias."
              count={inactiveCustomers.length}
              potential={inactivePotential}
              href={`/restaurants/${id}/marketing/campaigns/new?segment=INACTIVE`}
              cta="Criar campanha de reativação"
            />
          </section>
        </section>
      </div>
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
}: {
  label: string;
  title: string;
  description: string;
  count: number;
  potential: number;
  href: string;
  cta: string;
  priority?: boolean;
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
            Prioridade
          </span>
        )}
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <MiniStat label="Clientes" value={count} priority={priority} />
        <MiniStat
          label="Potencial"
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