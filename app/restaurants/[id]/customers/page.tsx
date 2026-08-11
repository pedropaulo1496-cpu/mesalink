import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import { redirect } from "next/navigation";
import { isValidEmail } from "@/lib/validation";
import PhoneField from "@/components/PhoneField";
import { getLocale, getTranslations } from "next-intl/server";

const dashboardDateLocales: Record<string, string> = {
  pt: "pt-PT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
  es: "es-ES",
};

type SortKey = "recent" | "name" | "visits" | "value" | "birthday" | "risk";

const sampleCsv =
  "\uFEFFname;email;phone;birthday;notes;tags\nJoão Silva;joao@email.com;912345678;1990-05-12;Cliente VIP;VIP|Aniversário\nMaria Costa;maria@email.com;919999999;1988-11-03;Prefere janela;Regular|Empresa";

async function createCustomer(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const birthDateValue = String(formData.get("birthDate") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const tagsValue = String(formData.get("tags") || "").trim();
  const marketingOptIn = true;

  if (!name || (!email && !phone)) {
    redirect(`/restaurants/${restaurantId}/customers?error=missing`);
  }

  if (email && !isValidEmail(email)) {
    redirect(`/restaurants/${restaurantId}/customers?error=email`);
  }

  const birthDate = birthDateValue
    ? new Date(`${birthDateValue}T12:00:00`)
    : null;

  const tags = tagsValue
    ? tagsValue
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const existing = await prisma.customer.findFirst({
    where: {
      restaurantId,
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existing) {
    await prisma.customer.update({
      where: { id: existing.id },
      data: {
        name,
        email: email || existing.email,
        phone: phone || existing.phone,
        birthDate,
        notes: notes || existing.notes,
        tags,
        marketingOptIn,
        marketingJoinedAt: existing.marketingJoinedAt || new Date(),
        source: existing.source || "MANUAL",
      },
    });
  } else {
    await prisma.customer.create({
      data: {
        restaurantId,
        name,
        email: email || null,
        phone,
        birthDate,
        notes: notes || null,
        tags,
        marketingOptIn,
        marketingJoinedAt: new Date(),
        source: "MANUAL",
      },
    });
  }

  redirect(`/restaurants/${restaurantId}/customers`);
}

async function importCustomers(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    redirect(`/restaurants/${restaurantId}/customers?import=empty`);
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    redirect(`/restaurants/${restaurantId}/customers?import=empty`);
  }

const separator = lines[0].includes(";") ? ";" : ",";

const headers = lines[0]
  .replace(/^\uFEFF/, "")
  .split(separator)
  .map((h) => h.trim().toLowerCase());

  let created = 0;
  let updated = 0;
  let skipped = 0;

  function value(row: string[], key: string) {
    const index = headers.indexOf(key);
    return index >= 0 ? String(row[index] || "").trim() : "";
  }

  for (const line of lines.slice(1)) {
    const row = line.split(separator).map((cell) => cell.trim());

    const name = value(row, "name");
    const email = value(row, "email").toLowerCase();
    const phone = value(row, "phone");
    const birthday = value(row, "birthday");
    const notes = value(row, "notes");
    const tagsValue = value(row, "tags");
    const marketingOptIn = true;

    if (!name || (!email && !phone)) {
      skipped++;
      continue;
    }

    const birthDate = birthday ? new Date(`${birthday}T12:00:00`) : null;

    const tags = tagsValue
      ? tagsValue
          .split("|")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    const existing = await prisma.customer.findFirst({
      where: {
        restaurantId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name,
          email: email || existing.email,
          phone: phone || existing.phone,
          birthDate,
          notes: notes || existing.notes,
          tags: tags.length ? tags : existing.tags,
          marketingOptIn,
          marketingJoinedAt: existing.marketingJoinedAt || new Date(),
          source: existing.source || "IMPORT",
        },
      });

      updated++;
    } else {
      await prisma.customer.create({
        data: {
          restaurantId,
          name,
          email: email || null,
          phone,
          birthDate,
          notes: notes || null,
          tags,
          marketingOptIn,
          marketingJoinedAt: new Date(),
          source: "IMPORT",
        },
      });

      created++;
    }
  }

  redirect(
    `/restaurants/${restaurantId}/customers?created=${created}&updated=${updated}&skipped=${skipped}`,
  );
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    sort?: SortKey;
    created?: string;
    updated?: string;
    skipped?: string;
    error?: string;
    import?: string;
  }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const sort = query.sort || "recent";

  const t = await getTranslations("dashboardCrm.customers.list");
  const locale = await getLocale();
  const intlLocale = dashboardDateLocales[locale] ?? "pt-PT";

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#F5EFE6] p-6 text-[#16120E]">
        {t("notFound")}
      </main>
    );
  }

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { restaurantId: id },
        {
          reservations: {
            some: {
              restaurantId: id,
            },
          },
        },
      ],
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
  });

  const averageTicket = Number(restaurant.averageTicket || 25);

  let enrichedCustomers = customers.map((customer) => {
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

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      birthDate: customer.birthDate,
      notes: customer.notes,
      tags: customer.tags || [],
      marketingOptIn: customer.marketingOptIn,
      totalReservations,
      totalGuests,
      totalVisits,
      estimatedValue,
      noShows,
      lastReservation,
      vipTier,
      riskScore: customer.riskScore ?? 0,
      updatedAt: customer.updatedAt,
    };
  });

  enrichedCustomers = enrichedCustomers.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "visits") return b.totalVisits - a.totalVisits;
    if (sort === "value") return b.estimatedValue - a.estimatedValue;
    if (sort === "risk") return b.riskScore - a.riskScore;
    if (sort === "birthday") {
      const aDate = a.birthDate ? new Date(a.birthDate).getTime() : 0;
      const bDate = b.birthDate ? new Date(b.birthDate).getTime() : 0;
      return bDate - aDate;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const totalGuests = enrichedCustomers.reduce(
    (total, customer) => total + customer.totalGuests,
    0,
  );

  const vipCustomers = enrichedCustomers.filter((customer) => customer.vipTier);

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
          active="customers"
        />

        <section className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
                {t("title")}
              </h1>

              <p className="mt-3 text-sm text-[#6B6258]">
                {restaurant.name} · {t("subtitleSuffix")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="#novo-cliente"
                className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
              >
                {t("newCustomerLink")}
              </Link>

              <Link
                href="#importar-clientes"
                className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E]"
              >
                {t("importCsvLink")}
              </Link>
            </div>
          </header>

          {(query.created || query.updated || query.skipped) && (
            <div className="mt-5 rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4 text-sm font-semibold text-[#6B6258]">
              {t("importResult", {
                created: query.created || 0,
                updated: query.updated || 0,
                skipped: query.skipped || 0,
              })}
            </div>
          )}

          {query.error === "missing" && (
            <div className="mt-5 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] px-5 py-4 text-sm font-semibold text-[#A14E36]">
              {t("errors.missing")}
            </div>
          )}

          {query.error === "email" && (
            <div className="mt-5 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] px-5 py-4 text-sm font-semibold text-[#A14E36]">
              {t("errors.email")}
            </div>
          )}

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label={t("metrics.customers")} value={enrichedCustomers.length} />
            <MetricCard label={t("metrics.vips")} value={vipCustomers.length} tone="gold" />
            <MetricCard
              label={t("metrics.atRisk")}
              value={riskyCustomers.length}
              tone="red"
            />
            <MetricCard label={t("metrics.covers")} value={totalGuests} tone="green" />
            <MetricCard
              label={t("metrics.value")}
              value={`${estimatedCustomerValue.toFixed(0)}€`}
              tone="gold"
            />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-2">
            <div
              id="novo-cliente"
              className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]"
            >
              <SectionTitle
                title={t("newCustomerForm.title")}
                subtitle={t("newCustomerForm.subtitle")}
              />

              <form
                action={createCustomer}
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="restaurantId" value={id} />

                <Input name="name" placeholder={t("newCustomerForm.fields.name")} required />
                <PhoneField name="phone" placeholder={t("newCustomerForm.fields.phone")} />
                <Input name="email" type="email" placeholder={t("newCustomerForm.fields.email")} />
                <Input name="birthDate" type="date" placeholder={t("newCustomerForm.fields.birthDate")} />
                <Input
                  name="tags"
                  placeholder={t("newCustomerForm.fields.tags")}
                />
                <Input name="notes" placeholder={t("newCustomerForm.fields.notes")} />

                <button className="h-12 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white sm:col-span-2">
                  {t("newCustomerForm.submit")}
                </button>
              </form>
            </div>

            <div
              id="importar-clientes"
              className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]"
            >
              <SectionTitle
                title={t("importForm.title")}
                subtitle={t("importForm.subtitle")}
              />

              <form action={importCustomers} className="mt-5 space-y-3">
                <input type="hidden" name="restaurantId" value={id} />

                <input
                  name="file"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-3 text-sm font-semibold text-[#6B6258]"
                />

               <div className="overflow-hidden rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0]">
  <div className="grid grid-cols-6 border-b border-[#E1D0B8] bg-white text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
    <div className="px-3 py-2">name</div>
    <div className="px-3 py-2">email</div>
    <div className="px-3 py-2">phone</div>
    <div className="px-3 py-2">birthday</div>
    <div className="px-3 py-2">notes</div>
    <div className="px-3 py-2">tags</div>
  </div>

  <div className="grid grid-cols-6 text-xs font-semibold text-[#6B6258]">
    <div className="px-3 py-3">João Silva</div>
    <div className="px-3 py-3">joao@email.com</div>
    <div className="px-3 py-3">912345678</div>
    <div className="px-3 py-3">1990-05-12</div>
    <div className="px-3 py-3">Cliente VIP</div>
    <div className="px-3 py-3">VIP|Aniversário</div>
  </div>

  <div className="flex items-center justify-between gap-3 border-t border-[#E1D0B8] bg-white px-4 py-3">
    <p className="text-xs text-[#6B6258]">
      {t("importForm.formatHelp.prefix")} <strong>|</strong>{t("importForm.formatHelp.suffix")}
    </p>

    <a
      href={`data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`}
      download="modelo-clientes-mesalink.csv"
      className="shrink-0 rounded-full bg-[#16120E] px-4 py-2 text-xs font-semibold text-white"
    >
      {t("importForm.downloadSample")}
    </a>
  </div>
</div>

                <button className="h-12 w-full rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">
                  {t("importForm.submit")}
                </button>
              </form>
            </div>
          </section>

          <section className="mt-5 rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SectionTitle
                title={t("table.title")}
                subtitle={t("table.subtitle", { count: enrichedCustomers.length })}
              />

              <div className="flex flex-wrap gap-2">
                <SortLink id={id} active={sort} value="recent" label={t("sort.recent")} />
                <SortLink id={id} active={sort} value="name" label={t("sort.name")} />
                <SortLink id={id} active={sort} value="visits" label={t("sort.visits")} />
                <SortLink id={id} active={sort} value="value" label={t("sort.value")} />
                <SortLink
                  id={id}
                  active={sort}
                  value="birthday"
                  label={t("sort.birthday")}
                />
                <SortLink id={id} active={sort} value="risk" label={t("sort.risk")} />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E8DCCB]">
              {enrichedCustomers.map((customer) => {
                const lastVisit = customer.lastReservation
                  ? new Date(customer.lastReservation.date).toLocaleDateString(
                      intlLocale,
                    )
                  : "-";

                return (
                  <Link
                    key={customer.id}
                    href={`/restaurants/${id}/customers/${customer.id}`}
                    className="grid gap-3 border-b border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3 text-sm transition last:border-b-0 hover:bg-white lg:grid-cols-[1.4fr_1fr_0.55fr_0.65fr_0.75fr_0.6fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">
                          {customer.name}
                        </p>

                        {customer.vipTier && (
                          <VipBadge tier={customer.vipTier} />
                        )}

                        {customer.marketingOptIn && (
                          <SmallBadge label="Marketing" />
                        )}
                      </div>

                      <p className="truncate text-xs text-[#6B6258]">
                        {customer.email || t("table.noEmail")} ·{" "}
                        {customer.phone || t("table.noPhone")}
                      </p>
                    </div>

                    <CompactInfo
                      label={t("table.columns.tags")}
                      value={
                        customer.tags.length ? customer.tags.join(", ") : "-"
                      }
                    />
                    <CompactInfo
                      label={t("table.columns.visits")}
                      value={String(customer.totalVisits)}
                    />
                    <CompactInfo
                      label={t("table.columns.value")}
                      value={`${customer.estimatedValue.toFixed(0)}€`}
                    />
                    <CompactInfo label={t("table.columns.lastVisit")} value={lastVisit} />
                    <CompactInfo label={t("table.columns.risk")} value={`${customer.riskScore}%`} />

                    <span className="rounded-full bg-[#16120E] px-3 py-1.5 text-center text-xs font-semibold text-white">
                      {t("table.view")}
                    </span>
                  </Link>
                );
              })}

              {enrichedCustomers.length === 0 && (
                <div className="bg-[#FFF9F0] p-8 text-center">
                  <p className="text-2xl font-semibold tracking-[-0.04em]">
                    {t("table.empty.title")}
                  </p>

                  <p className="mt-2 text-sm text-[#6B6258]">
                    {t("table.empty.subtitle")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function Input({
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8B7A] focus:border-[#C8A56A] focus:bg-white"
    />
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
        {title}
      </p>
      <p className="mt-1 text-sm text-[#6B6258]">{subtitle}</p>
    </div>
  );
}

function SortLink({
  id,
  active,
  value,
  label,
}: {
  id: string;
  active: string;
  value: SortKey;
  label: string;
}) {
  const isActive = active === value;

  return (
    <Link
      href={`/restaurants/${id}/customers?sort=${value}`}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
        isActive
          ? "bg-[#16120E] text-white"
          : "border border-[#E1D0B8] bg-[#FFF9F0] text-[#6B6258] hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );
}

function CompactInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
        {label}
      </p>
      <p className="truncate text-xs font-semibold text-[#16120E]">{value}</p>
    </div>
  );
}

function VipBadge({ tier }: { tier: string }) {
  return (
    <span className="rounded-full bg-[#E8DFC9] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9B6F3B]">
      {tier}
    </span>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#EAF3E2] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#607A45]">
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
    <div className="flex items-center justify-between rounded-[22px] border border-[#E1D0B8] bg-white px-4 py-3 shadow-[0_14px_44px_rgba(80,55,30,0.035)]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-[-0.055em]">
          {value}
        </p>
      </div>

      <span className={`h-3 w-3 rounded-full ${dot}`} />
    </div>
  );
}