import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RestaurantSidebar from "@/components/RestaurantSidebar";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  const { id, customerId } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      reservations: {
        where: { restaurantId: id },
        orderBy: { date: "desc" },
        include: { table: true },
      },
      marketingActions: {
        where: { restaurantId: id },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const averageTicket = Number(restaurant.averageTicket || 25);
  const totalVisits = customer.totalVisits || customer.visitCount || 0;
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

  const riskScore = customer.riskScore ?? 0;

  const totalGuests = customer.reservations.reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  const noShows = customer.reservations.filter(
    (reservation) => reservation.status === "NO_SHOW",
  ).length;

  const lastReservation = customer.reservations[0];

  const lastVisit = lastReservation
    ? new Date(lastReservation.date).toLocaleDateString("pt-PT")
    : "-";

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
              <Link
                href={`/restaurants/${id}/customers`}
                className="text-sm font-semibold text-[#9B6F3B]"
              >
                ← Voltar aos clientes
              </Link>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <h1 className="text-5xl font-semibold tracking-[-0.065em]">
                  {customer.name}
                </h1>

                {vipTier && <VipBadge tier={vipTier} />}

                {riskScore >= 75 && <RiskBadge label="Risco alto" />}
                {riskScore >= 50 && riskScore < 75 && (
                  <RiskBadge label="Risco médio" />
                )}
              </div>

              <p className="mt-3 text-sm text-[#6B6258]">
                {customer.email || "Sem email"} · {customer.phone || "Sem telefone"}
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/marketing/campaigns/new`}
              className="w-fit rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
            >
              Criar campanha
            </Link>
          </header>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Valor" value={`${estimatedValue.toFixed(0)}€`} tone="gold" />
            <MetricCard label="Visitas" value={totalVisits} />
            <MetricCard label="Covers" value={totalGuests} tone="green" />
            <MetricCard label="No-shows" value={noShows} tone="red" />
            <MetricCard label="Risk Score" value={riskScore} tone={riskScore >= 50 ? "red" : "green"} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <SectionLabel>Perfil</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Dados do cliente
              </h2>

              <div className="mt-6 grid gap-3">
                <ProfileLine label="Email" value={customer.email || "Sem email"} />
                <ProfileLine label="Telefone" value={customer.phone || "Sem telefone"} />
                <ProfileLine label="Última visita" value={lastVisit} />
                <ProfileLine label="VIP Tier" value={vipTier || "Cliente"} />
                <ProfileLine
                  label="Marketing"
                  value={customer.marketingOptIn ? "Autorizado" : "Não autorizado"}
                />
              </div>
            </Panel>

            <Panel>
              <SectionLabel>Histórico</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Reservas
              </h2>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {customer.reservations.slice(0, 8).map((reservation) => (
                  <ReservationLine
                    key={reservation.id}
                    date={reservation.date}
                    guests={reservation.guests}
                    status={reservation.status}
                    table={reservation.table?.number}
                  />
                ))}

                {customer.reservations.length === 0 && (
                  <EmptyLine text="Ainda não existem reservas deste cliente." />
                )}
              </div>
            </Panel>
          </section>

          <section className="mt-6">
  <Panel>
    <SectionLabel>Notas internas</SectionLabel>

    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
      Conhecimento da equipa
    </h2>

    <p className="mt-2 text-sm text-[#6B6258]">
      Informação privada sobre preferências e histórico deste cliente.
    </p>

    <form
      action={async (formData) => {
        "use server";

        await prisma.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            notes:
              String(formData.get("notes") || "") || null,
          },
        });
      }}
      className="mt-6"
    >
      <textarea
        name="notes"
        defaultValue={customer.notes ?? ""}
        rows={8}
        placeholder="Ex: Prefere mesa junto à janela..."
        className="w-full rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 text-sm font-medium text-[#16120E] outline-none focus:border-[#C8A56A]"
      />

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#16120E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          Guardar notas
        </button>
      </div>
    </form>
  </Panel>
</section>

<section className="mt-6">
  <Panel>
    <SectionLabel>Tags</SectionLabel>

    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
      Segmentação
    </h2>

    <p className="mt-2 text-sm text-[#6B6258]">
      Use tags para identificar clientes locais, turistas, empresas,
      influencers ou clientes de alto valor.
    </p>

    <div className="mt-5 flex flex-wrap gap-2">
      {(customer.tags ?? []).length > 0 ? (
        customer.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#E8DFC9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9B6F3B]"
          >
            {tag}
          </span>
        ))
      ) : (
        <p className="text-sm text-[#6B6258]">
          Ainda não existem tags neste cliente.
        </p>
      )}
    </div>

    <form
      action={async (formData) => {
        "use server";

        const tagsRaw = String(formData.get("tags") || "");

        const tags = tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        await prisma.customer.update({
          where: {
            id: customer.id,
          },
          data: {
            tags,
          },
        });
      }}
      className="mt-6"
    >
      <input
        name="tags"
        defaultValue={(customer.tags ?? []).join(", ")}
        placeholder="Ex: local, alto valor, influencer"
        className="h-13 min-h-[52px] w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
      />

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#16120E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          Guardar tags
        </button>
      </div>
    </form>
  </Panel>
</section>

          <section className="mt-6">
            <Panel>
              <SectionLabel>Growth</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                Atividade de marketing
              </h2>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {customer.marketingActions.slice(0, 10).map((action) => (
                  <MarketingLine
                    key={action.id}
                    type={action.type}
                    status={action.status}
                    sentAt={action.sentAt}
                    revenue={Number(action.estimatedRevenue || 0)}
                  />
                ))}

                {customer.marketingActions.length === 0 && (
                  <EmptyLine text="Ainda não existem ações de marketing para este cliente." />
                )}
              </div>
            </Panel>
          </section>
        </section>
      </div>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[34px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3">
      <span className="text-sm text-[#6B6258]">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ReservationLine({
  date,
  guests,
  status,
  table,
}: {
  date: Date;
  guests: number;
  status: string;
  table?: number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div>
        <p className="font-semibold">
          {new Date(date).toLocaleDateString("pt-PT")}
        </p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {guests} pessoas · {table ? `Mesa ${table}` : "Sem mesa"}
        </p>
      </div>

      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
        {status}
      </span>
    </div>
  );
}

function MarketingLine({
  type,
  status,
  sentAt,
  revenue,
}: {
  type: string;
  status: string;
  sentAt: Date;
  revenue: number;
}) {
  const label =
    type === "VIP_UPGRADE"
      ? "Upgrade VIP"
      : type === "INACTIVE_RECOVERY"
        ? "Recuperação"
        : type === "BIRTHDAY"
          ? "Aniversário"
          : type === "MANUAL_CAMPAIGN"
            ? "Campanha"
            : type === "REVIEW_REQUEST"
              ? "Review"
              : type;

  return (
    <div className="flex items-center justify-between border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {new Date(sentAt).toLocaleDateString("pt-PT")} · {status}
        </p>
      </div>

      <p className="text-sm font-semibold">{revenue.toFixed(0)}€</p>
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

function EmptyLine({ text }: { text: string }) {
  return <p className="p-6 text-sm text-[#6B6258]">{text}</p>;
}