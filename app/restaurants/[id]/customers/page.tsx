import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RestaurantSidebar from "@/components/RestaurantSidebar";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        Restaurante não encontrado.
      </main>
    );
  }

  const customers = await prisma.customer.findMany({
    where: {
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
    include: {
      reservations: {
        where: {
          restaurantId: id,
        },
        orderBy: {
          date: "desc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const averageTicket = Number(restaurant.averageTicket || 25);

  const enrichedCustomers = customers.map((customer) => {
    const totalReservations = customer.reservations.length;

    const totalGuests = customer.reservations.reduce(
      (total, reservation) => total + reservation.guests,
      0,
    );

    const noShows = customer.reservations.filter(
      (reservation) => reservation.status === "NO_SHOW",
    ).length;

    const lastReservation = customer.reservations[0];

    const totalVisits =
      customer.totalVisits || customer.visitCount || totalReservations;

    const estimatedValue = totalVisits * averageTicket;

    const vipTier =
      customer.vipTier ||
      (totalVisits >= 50
        ? "PLATINUM"
        : totalVisits >= 20
          ? "GOLD"
          : totalVisits >= 10
            ? "SILVER"
            : totalVisits >= 5
              ? "BRONZE"
              : null);

    const isVip = Boolean(vipTier);

    const riskScore = customer.riskScore ?? 0;

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalReservations,
      totalGuests,
      totalVisits,
      estimatedValue,
      noShows,
      lastReservation,
      isVip,
      vipTier,
      riskScore,
    };
  });

  const totalGuests = enrichedCustomers.reduce(
    (total, customer) => total + customer.totalGuests,
    0,
  );

  const totalNoShows = enrichedCustomers.reduce(
    (total, customer) => total + customer.noShows,
    0,
  );

  const vipCustomers = enrichedCustomers.filter((customer) => customer.isVip);

  const riskyCustomers = enrichedCustomers.filter(
    (customer) => customer.riskScore >= 50,
  );

  const estimatedCustomerValue = enrichedCustomers.reduce(
    (total, customer) => total + customer.estimatedValue,
    0,
  );

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="Clientes"
        />

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                Clientes
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                CRM
              </h1>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.name} · clientes, valor estimado, VIP tiers e risco de abandono.
              </p>
            </div>

            <div className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#6B6258] shadow-[0_14px_44px_rgba(80,55,30,0.045)]">
              {enrichedCustomers.length} clientes registados
            </div>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Clientes" value={enrichedCustomers.length} />
            <MetricCard label="VIPs" value={vipCustomers.length} tone="gold" />
            <MetricCard label="Em risco" value={riskyCustomers.length} tone="red" />
            <MetricCard label="Covers" value={totalGuests} tone="green" />
            <MetricCard
              label="Valor"
              value={`${estimatedCustomerValue.toFixed(0)}€`}
              tone="gold"
            />
          </section>

          <section className="mt-5 rounded-[34px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                  Lista
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                  Base de clientes
                </h2>
              </div>

              <div className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-5 py-3 text-sm text-[#6B6258]">
                Ordenado por atividade recente
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {enrichedCustomers.map((customer) => {
                const lastVisit = customer.lastReservation
                  ? new Date(customer.lastReservation.date).toLocaleDateString(
                      "pt-PT",
                    )
                  : "-";

                return (
                  <Link
                    key={customer.id}
                    href={`/restaurants/${id}/customers/${customer.id}`}
                    className="grid gap-4 rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0] p-4 transition hover:border-[#C8A56A] hover:bg-white xl:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr_0.7fr_0.7fr_auto] xl:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-lg font-semibold">
                          {customer.name}
                        </p>

                        {customer.vipTier && (
                          <VipBadge tier={customer.vipTier} />
                        )}

                        {customer.riskScore >= 75 && (
                          <RiskBadge label="Risco alto" />
                        )}

                        {customer.riskScore >= 50 &&
                          customer.riskScore < 75 && (
                            <RiskBadge label="Risco médio" />
                          )}
                      </div>

                      <p className="mt-1 text-sm text-[#6B6258]">
                        {customer.email || "Sem email"}
                      </p>
                    </div>

                    <InfoBlock label="Telefone" value={customer.phone} />
                    <InfoBlock
                      label="Visitas"
                      value={String(customer.totalVisits)}
                    />
                    <InfoBlock
                      label="Valor"
                      value={`${customer.estimatedValue.toFixed(0)}€`}
                    />
                    <InfoBlock label="Covers" value={String(customer.totalGuests)} />
                    <InfoBlock label="Última visita" value={lastVisit} />

                    <span className="rounded-full bg-[#16120E] px-4 py-2 text-center text-sm font-semibold text-white">
                      Ver
                    </span>
                  </Link>
                );
              })}

              {enrichedCustomers.length === 0 && (
                <div className="rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0] p-8 text-center">
                  <p className="text-2xl font-semibold tracking-[-0.04em]">
                    Ainda não existem clientes.
                  </p>

                  <p className="mt-2 text-sm text-[#6B6258]">
                    Quando houver reservas, os clientes aparecem aqui
                    automaticamente.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#16120E]">{value}</p>
    </div>
  );
}

function VipBadge({ tier }: { tier: string }) {
  return (
    <span className="rounded-full bg-[#E8DFC9] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
      {tier}
    </span>
  );
}

function RiskBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#FFF0EA] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A14E36]">
      {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "gold" | "green" | "red";
}) {
  const dot =
    tone === "green"
      ? "bg-[#86A969]"
      : tone === "red"
        ? "bg-[#A14E36]"
        : tone === "gold"
          ? "bg-[#C8A56A]"
          : "bg-[#DCC9AE]";

  return (
    <div className="flex items-center justify-between rounded-[24px] border border-[#E1D0B8] bg-white px-4 py-4 shadow-[0_14px_44px_rgba(80,55,30,0.035)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
          {label}
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-[-0.055em]">
          {value}
        </p>
      </div>

      <span className={`h-3.5 w-3.5 rounded-full ${dot}`} />
    </div>
  );
}