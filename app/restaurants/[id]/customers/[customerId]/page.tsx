import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import { getLocale, getTranslations } from "next-intl/server";

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>;
}) {
  const { id, customerId } = await params;

  const t = await getTranslations("dashboardCrm.customers.detail");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";
  const historyStatusLabels = t.raw("history.statusLabels" as never) as Record<
    string,
    string
  >;
  const marketingTypeLabels = t.raw("marketingTypes" as never) as Record<
    string,
    string
  >;

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
    ? new Date(lastReservation.date).toLocaleDateString(intlLocale)
    : "-";

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="customers"
        />

        <section className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href={`/restaurants/${id}/customers`}
                className="text-sm font-semibold text-[#9B6F3B]"
              >
                ← {t("back")}
              </Link>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <h1 className="text-5xl font-semibold tracking-[-0.065em]">
                  {customer.name}
                </h1>

                {vipTier && <VipBadge tier={vipTier} />}

                {riskScore >= 75 && <RiskBadge label={t("riskBadge.high")} />}
                {riskScore >= 50 && riskScore < 75 && (
                  <RiskBadge label={t("riskBadge.medium")} />
                )}
              </div>

              <p className="mt-3 text-sm text-[#6B6258]">
                {customer.email || t("noEmail")} · {customer.phone || t("noPhone")}
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/marketing/campaigns/new`}
              className="w-fit rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
            >
              {t("createCampaign")}
            </Link>
          </header>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={t("metrics.value")} value={`${estimatedValue.toFixed(0)}€`} tone="gold" />
            <MetricCard label={t("metrics.visits")} value={totalVisits} />
            <MetricCard label={t("metrics.covers")} value={totalGuests} tone="green" />
            <MetricCard label={t("metrics.noShows")} value={noShows} tone="red" />
            <MetricCard label={t("metrics.riskScore")} value={riskScore} tone={riskScore >= 50 ? "red" : "green"} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <SectionLabel>{t("profile.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("profile.heading")}
              </h2>

              <div className="mt-6 grid gap-3">
                <ProfileLine label={t("profile.fields.email")} value={customer.email || t("noEmail")} />
                <ProfileLine label={t("profile.fields.phone")} value={customer.phone || t("noPhone")} />
                <ProfileLine label={t("profile.fields.lastVisit")} value={lastVisit} />
                <ProfileLine label={t("profile.fields.vipTier")} value={vipTier || t("profile.defaultTier")} />
                <ProfileLine
                  label={t("profile.fields.marketing")}
                  value={customer.marketingOptIn ? t("profile.marketingYes") : t("profile.marketingNo")}
                />
              </div>
            </Panel>

            <Panel>
              <SectionLabel>{t("history.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("history.heading")}
              </h2>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {customer.reservations.slice(0, 8).map((reservation) => (
                  <ReservationLine
                    key={reservation.id}
                    date={reservation.date}
                    guests={reservation.guests}
                    status={reservation.status}
                    table={reservation.table?.number}
                    intlLocale={intlLocale}
                    guestsLabel={(count: number) => t("history.guests", { count })}
                    tableLabel={(number: number) => t("history.table", { number })}
                    noTableLabel={t("history.noTable")}
                    statusLabels={historyStatusLabels}
                  />
                ))}

                {customer.reservations.length === 0 && (
                  <EmptyLine text={t("history.empty")} />
                )}
              </div>
            </Panel>
          </section>

          <section className="mt-6">
  <Panel>
    <SectionLabel>{t("notes.eyebrow")}</SectionLabel>

    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
      {t("notes.heading")}
    </h2>

    <p className="mt-2 text-sm text-[#6B6258]">
      {t("notes.description")}
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
        placeholder={t("notes.placeholder")}
        className="w-full rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 text-sm font-medium text-[#16120E] outline-none focus:border-[#C8A56A]"
      />

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#16120E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          {t("notes.submit")}
        </button>
      </div>
    </form>
  </Panel>
</section>

<section className="mt-6">
  <Panel>
    <SectionLabel>{t("tags.eyebrow")}</SectionLabel>

    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
      {t("tags.heading")}
    </h2>

    <p className="mt-2 text-sm text-[#6B6258]">
      {t("tags.description")}
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
          {t("tags.empty")}
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
        placeholder={t("tags.inputPlaceholder")}
        className="h-13 min-h-[52px] w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
      />

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-[#16120E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          {t("tags.submit")}
        </button>
      </div>
    </form>
  </Panel>
</section>

          <section className="mt-6">
            <Panel>
              <SectionLabel>{t("growth.eyebrow")}</SectionLabel>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                {t("growth.heading")}
              </h2>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {customer.marketingActions.slice(0, 10).map((action) => (
                  <MarketingLine
                    key={action.id}
                    type={action.type}
                    status={action.status}
                    sentAt={action.sentAt}
                    revenue={Number(action.estimatedRevenue || 0)}
                    intlLocale={intlLocale}
                    marketingTypeLabels={marketingTypeLabels}
                  />
                ))}

                {customer.marketingActions.length === 0 && (
                  <EmptyLine text={t("growth.empty")} />
                )}
              </div>
            </Panel>
          </section>
        </section>
      </div>

      <BottomNav id={id} />
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
  intlLocale,
  guestsLabel,
  tableLabel,
  noTableLabel,
  statusLabels,
}: {
  date: Date;
  guests: number;
  status: string;
  table?: number;
  intlLocale: string;
  guestsLabel: (count: number) => string;
  tableLabel: (number: number) => string;
  noTableLabel: string;
  statusLabels: Record<string, string>;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div>
        <p className="font-semibold">
          {new Date(date).toLocaleDateString(intlLocale)}
        </p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {guestsLabel(guests)} · {table ? tableLabel(table) : noTableLabel}
        </p>
      </div>

      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
        {statusLabels[status] ?? status}
      </span>
    </div>
  );
}

function MarketingLine({
  type,
  status,
  sentAt,
  revenue,
  intlLocale,
  marketingTypeLabels,
}: {
  type: string;
  status: string;
  sentAt: Date;
  revenue: number;
  intlLocale: string;
  marketingTypeLabels: Record<string, string>;
}) {
  const label = marketingTypeLabels[type] ?? type;

  return (
    <div className="flex items-center justify-between border-b border-[#E8DCCB] px-5 py-4 last:border-b-0">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-[#6B6258]">
          {new Date(sentAt).toLocaleDateString(intlLocale)} · {status}
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
