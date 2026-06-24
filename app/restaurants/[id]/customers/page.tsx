import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { redirect } from "next/navigation";

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
                {restaurant.name} · clientes, campanhas, VIPs e risco de abandono.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="#novo-cliente"
                className="rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
              >
                Novo cliente
              </Link>

              <Link
                href="#importar-clientes"
                className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E]"
              >
                Importar CSV
              </Link>
            </div>
          </header>

          {(query.created || query.updated || query.skipped) && (
            <div className="mt-5 rounded-2xl border border-[#D8C3A5] bg-white px-5 py-4 text-sm font-semibold text-[#6B6258]">
              Importação concluída: {query.created || 0} criados ·{" "}
              {query.updated || 0} atualizados · {query.skipped || 0} ignorados.
            </div>
          )}

          {query.error === "missing" && (
            <div className="mt-5 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] px-5 py-4 text-sm font-semibold text-[#A14E36]">
              Preenche pelo menos nome e email ou telefone.
            </div>
          )}

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Clientes" value={enrichedCustomers.length} />
            <MetricCard label="VIPs" value={vipCustomers.length} tone="gold" />
            <MetricCard
              label="Em risco"
              value={riskyCustomers.length}
              tone="red"
            />
            <MetricCard label="Covers" value={totalGuests} tone="green" />
            <MetricCard
              label="Valor"
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
                title="Novo cliente"
                subtitle="Adicionar manualmente ao CRM."
              />

              <form
                action={createCustomer}
                className="mt-5 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="restaurantId" value={id} />

                <Input name="name" placeholder="Nome" required />
                <Input name="phone" placeholder="Telefone" />
                <Input name="email" type="email" placeholder="Email" />
                <Input name="birthDate" type="date" placeholder="Nascimento" />
                <Input
                  name="tags"
                  placeholder="Tags: VIP, aniversário, empresa"
                />
                <Input name="notes" placeholder="Notas" />

                <button className="h-12 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white sm:col-span-2">
                  Criar cliente
                </button>
              </form>
            </div>

            <div
              id="importar-clientes"
              className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]"
            >
              <SectionTitle
                title="Importar clientes"
                subtitle="Importe clientes por CSV. Compatível com Excel."
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
      Este é o formato que o CSV deve ter. As tags usam <strong>|</strong>.
    </p>

    <a
      href={`data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsv)}`}
      download="modelo-clientes-mesalink.csv"
      className="shrink-0 rounded-full bg-[#16120E] px-4 py-2 text-xs font-semibold text-white"
    >
      Download exemplo
    </a>
  </div>
</div>

                <button className="h-12 w-full rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">
                  Importar clientes
                </button>
              </form>
            </div>
          </section>

          <section className="mt-5 rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SectionTitle
                title="Base de clientes"
                subtitle={`${enrichedCustomers.length} clientes registados`}
              />

              <div className="flex flex-wrap gap-2">
                <SortLink id={id} active={sort} value="recent" label="Recentes" />
                <SortLink id={id} active={sort} value="name" label="Nome" />
                <SortLink id={id} active={sort} value="visits" label="Visitas" />
                <SortLink id={id} active={sort} value="value" label="Valor" />
                <SortLink
                  id={id}
                  active={sort}
                  value="birthday"
                  label="Aniversário"
                />
                <SortLink id={id} active={sort} value="risk" label="Risco" />
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[22px] border border-[#E8DCCB]">
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
                        {customer.email || "Sem email"} ·{" "}
                        {customer.phone || "Sem telefone"}
                      </p>
                    </div>

                    <CompactInfo
                      label="Tags"
                      value={
                        customer.tags.length ? customer.tags.join(", ") : "-"
                      }
                    />
                    <CompactInfo
                      label="Visitas"
                      value={String(customer.totalVisits)}
                    />
                    <CompactInfo
                      label="Valor"
                      value={`${customer.estimatedValue.toFixed(0)}€`}
                    />
                    <CompactInfo label="Última" value={lastVisit} />
                    <CompactInfo label="Risco" value={`${customer.riskScore}%`} />

                    <span className="rounded-full bg-[#16120E] px-3 py-1.5 text-center text-xs font-semibold text-white">
                      Ver
                    </span>
                  </Link>
                );
              })}

              {enrichedCustomers.length === 0 && (
                <div className="bg-[#FFF9F0] p-8 text-center">
                  <p className="text-2xl font-semibold tracking-[-0.04em]">
                    Ainda não existem clientes.
                  </p>

                  <p className="mt-2 text-sm text-[#6B6258]">
                    Cria clientes manualmente, importa CSV ou recebe reservas.
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