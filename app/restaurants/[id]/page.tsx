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

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const hasAccess = await canAccessApp(session.user.email);
  if (!hasAccess) redirect("/billing");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: { include: { reservations: true } },
      reservations: true,
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

  const today = new Date();

  const isToday = (date: Date | string) => {
    const d = new Date(date);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const inactiveStatuses = ["CANCELLED", "REJECTED", "NO_SHOW"];

  const activeReservations = allReservations.filter(
    (reservation) => !inactiveStatuses.includes(String(reservation.status)),
  );

  const reservationsToday = activeReservations.filter((reservation) =>
    isToday(reservation.date),
  );

  const confirmedToday = reservationsToday.filter(
    (reservation) => reservation.status === "CONFIRMED",
  );

  const pendingToday = reservationsToday.filter(
    (reservation) => reservation.status === "PENDING",
  );

  const guestsToday = reservationsToday.reduce(
    (total, reservation) => total + reservation.guests,
    0,
  );

  const totalCapacity =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? restaurant.totalCapacity
      : restaurant.tables.reduce((total, table) => total + table.capacity, 0);

  const occupancyRate =
    totalCapacity > 0 ? Math.round((guestsToday / totalCapacity) * 100) : 0;

  const todayReservationsList = reservationsToday
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const nextReservations = activeReservations
    .filter((reservation) => new Date(reservation.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const listToShow =
    todayReservationsList.length > 0 ? todayReservationsList : nextReservations;

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reserve/${restaurant.slug}`;
  const websiteUrl = `https://${restaurant.slug}.mesalink.pt`;
  const customers = await prisma.customer.findMany({
  where: {
    reservations: {
      some: {
        restaurantId: id,
      },
    },
  },
});

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

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[276px_1fr]">
        <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
/>

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

            <div className="flex flex-wrap gap-2">
              <PrimaryLink href={`/restaurants/${id}/reservations/new`}>
                + Nova reserva
              </PrimaryLink>
              <SignOutButton />
            </div>
          </header>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <Panel>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <SectionLabel>
                    {todayReservationsList.length > 0 ? "Hoje" : "Agenda"}
                  </SectionLabel>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
                    {todayReservationsList.length > 0
                      ? "Reservas de hoje"
                      : "Próximas reservas"}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <InlineStat label="Reservas" value={reservationsToday.length} />
                  <InlineStat label="Covers" value={guestsToday} />
                  <InlineStat label="Pendentes" value={pendingToday.length} />
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E8DCCB] bg-[#FFF9F0]">
                {listToShow.map((reservation, index) => (
                  <ReservationLine
                    key={reservation.id}
                    reservation={reservation}
                    isNext={todayReservationsList.length > 0 && index === 0}
                    showDate={todayReservationsList.length === 0}
                  />
                ))}

                {listToShow.length === 0 && (
                  <div className="p-6 text-sm text-[#6B6258]">
                    Ainda não há reservas. Partilhe o link público para começar.
                  </div>
                )}
              </div>
            </Panel>

            <TableMapCard
              tablesCount={restaurant.tables.length}
              occupancyRate={occupancyRate}
              guestsToday={guestsToday}
              totalCapacity={totalCapacity}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <RevenueCard />
            <MarketingCard />
          </section>

          {riskyCustomers.length > 0 && (
  <section className="mt-6">
    <Panel>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <SectionLabel>Clientes em risco</SectionLabel>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
            {riskyCustomers.length} clientes podem abandonar
          </h2>

          <p className="mt-2 text-sm text-[#6B6258]">
            Valor potencial em risco:{" "}
            <span className="font-bold text-[#16120E]">
              {riskyRevenue.toFixed(0)}€
            </span>
          </p>
        </div>

        <form action="/api/marketing/run-recovery" method="POST">
          <button className="rounded-full bg-[#16120E] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
            Recuperar agora
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-3">
        {riskyCustomers.slice(0, 5).map((customer) => (
          <div
            key={customer.id}
            className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3"
          >
            <div>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-xs text-[#6B6258]">
                Risk Score {customer.riskScore}
              </p>
            </div>

            <p className="font-bold">
              {(
                (customer.totalVisits ?? customer.visitCount ?? 0) *
                Number(restaurant.averageTicket || 25)
              ).toFixed(0)}
              €
            </p>
          </div>
        ))}
      </div>
    </Panel>
  </section>
)}

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_0.9fr_1.1fr]">
            <QrEfficiencyCard />
            <AiCard />
            <ReservationLinkCard
              id={id}
              publicUrl={publicUrl}
              websiteUrl={websiteUrl}
            />
          </section>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-5 shadow-[0_22px_70px_rgba(80,55,30,0.055)] lg:p-6">
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

function InlineStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-[82px] rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-3 py-2">
      <p className="text-lg font-semibold tracking-[-0.04em]">{value}</p>
      <p className="text-[11px] text-[#6B6258]">{label}</p>
    </div>
  );
}

function ReservationLine({
  reservation,
  isNext,
  showDate,
}: {
  reservation: {
    customerName: string;
    guests: number;
    date: Date | string;
    status: string | null;
    tableNumber: number | null;
  };
  isNext: boolean;
  showDate: boolean;
}) {
  const status = String(reservation.status);

  const statusLabel =
    status === "PENDING"
      ? "Pendente"
      : status === "CONFIRMED"
        ? "Confirmada"
        : status === "SEATED"
          ? "Sentada"
          : status;

  const statusClass =
    status === "PENDING"
      ? "bg-[#FFF1D0] text-[#9B6F3B]"
      : status === "CONFIRMED"
        ? "bg-[#ECF7EC] text-[#3F6A4D]"
        : "bg-[#EFE5D6] text-[#6B6258]";

  return (
    <div className="grid grid-cols-[76px_1fr_auto_auto] items-center gap-4 border-b border-[#E8DCCB] px-4 py-4 last:border-b-0">
      <p className="text-lg font-semibold">
        {new Date(reservation.date).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {isNext && (
            <span className="rounded-full bg-[#2A2118] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
              Próxima
            </span>
          )}

          <p className="truncate font-semibold">{reservation.customerName}</p>
        </div>

        {showDate && (
          <p className="mt-1 text-xs text-[#7A7166]">
            {new Date(reservation.date).toLocaleDateString("pt-PT")}
          </p>
        )}
      </div>

      <p className="hidden text-sm text-[#6B6258] sm:block">
        {reservation.tableNumber ? `Mesa ${reservation.tableNumber}` : "Sem mesa"} ·{" "}
        {reservation.guests} pax
      </p>

      <span
        className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:block ${statusClass}`}
      >
        {statusLabel}
      </span>
    </div>
  );
}

function TableMapCard({
  tablesCount,
  occupancyRate,
  guestsToday,
  totalCapacity,
}: {
  tablesCount: number;
  occupancyRate: number;
  guestsToday: number;
  totalCapacity: number;
}) {
  const tables = [
    ["1", "Livre"],
    ["2", "Reserva"],
    ["3", "Ocupada"],
    ["4", "Livre"],
    ["5", "QR"],
    ["6", "Conta"],
    ["7", "Livre"],
    ["8", "Reserva"],
  ];

  return (
    <Panel>
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Sala</SectionLabel>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
            Tempo real
          </h2>
        </div>

        <Link
          href="#"
          className="text-sm font-semibold text-[#9B6F3B] hover:text-[#16120E]"
        >
          {tablesCount || 0} mesas
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-5">
        {tables.map(([table, status]) => (
          <div key={table} className="flex flex-col items-center gap-2">
            <div
              className={
                status === "Ocupada"
                  ? "flex h-16 w-16 items-center justify-center rounded-full bg-[#2A2118] text-white"
                  : status === "QR" || status === "Conta"
                    ? "flex h-16 w-16 items-center justify-center rounded-full border border-[#B9965E] bg-[#FFF1D0]"
                    : "flex h-16 w-16 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0]"
              }
            >
              <span className="font-semibold">{table}</span>
            </div>
            <span className="text-[11px] text-[#6B6258]">{status}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6B6258]">
            {guestsToday}/{totalCapacity || 0} lugares
          </p>
          <p className="text-lg font-semibold">{occupancyRate}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8DCCB]">
          <div
            className="h-full rounded-full bg-[#C8A56A]"
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>
      </div>
    </Panel>
  );
}

function RevenueCard() {
  const points = "0,126 60,104 120,82 180,111 240,64 300,76 360,38 420,58 480,29 540,48";

  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>POS</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            Faturação
          </h2>
        </div>
        <ComingSoon />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <FinanceStat title="Hoje" value="€0,00" sub="Ontem: €344,43" neutral />
        <FinanceStat title="Mensal" value="€13.197,28" sub="-66,3% vs anterior" down />
        <FinanceStat title="Anual" value="€197.101,73" sub="+4,87% vs anterior" />
      </div>

      <div className="mt-7 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
        <svg viewBox="0 0 540 150" className="h-44 w-full">
          <defs>
            <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#C8A56A" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#C8A56A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[30, 60, 90, 120].map((y) => (
            <line
              key={y}
              x1="0"
              x2="540"
              y1={y}
              y2={y}
              stroke="#E1D0B8"
              strokeWidth="1"
            />
          ))}

          <polygon
            points={`0,150 ${points} 540,150`}
            fill="url(#revenueFill)"
          />

          <polyline
            points={points}
            fill="none"
            stroke="#C8A56A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {[
            ["19-05", 0],
            ["23-05", 120],
            ["27-05", 240],
            ["31-05", 360],
            ["04-06", 480],
          ].map(([label, x]) => (
            <text
              key={label}
              x={Number(x)}
              y="146"
              fill="#6B6258"
              fontSize="12"
            >
              {label}
            </text>
          ))}
        </svg>
      </div>
    </Panel>
  );
}

function FinanceStat({
  title,
  value,
  sub,
  down,
  neutral,
}: {
  title: string;
  value: string;
  sub: string;
  down?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white p-4">
      <p className="text-sm text-[#6B6258]">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#16120E]">
        {value}
      </p>
      <p
        className={`mt-2 text-xs ${
          neutral
            ? "text-[#6B6258]"
            : down
              ? "text-[#B85C5C]"
              : "text-[#3F6A4D]"
        }`}
      >
        {sub}
      </p>
    </div>
  );
}

function MarketingCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Marketing</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            ROI & IA
          </h2>
        </div>
        <ComingSoon />
      </div>

      <div className="mt-6 grid gap-3">
        <SmallStat value="+€680" label="receita recuperada" />
        <SmallStat value="18" label="reviews geradas" />
        <SmallStat value="7" label="clientes reativados" />
      </div>
    </Panel>
  );
}

function QrEfficiencyCard() {
  return (
    <Panel>
      <SectionLabel>QR Ordering</SectionLabel>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
        Eficiência
      </h2>

      <div className="mt-6 grid gap-3">
        <SmallStat value="9" label="pedidos ativos" />
        <SmallStat value="4" label="contas pedidas" />
        <SmallStat value="-32%" label="chamadas à equipa" />
      </div>
    </Panel>
  );
}

function AiCard() {
  return (
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>IA</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            Sugestão
          </h2>
        </div>
        <ComingSoon />
      </div>

      <div className="mt-6 rounded-[24px] bg-[#FFF9F0] p-5">
        <p className="text-sm leading-6 text-[#6B6258]">
          Enviar campanha a clientes sem visita há 45 dias. Estimativa: 8 a 12
          reservas recuperadas.
        </p>
      </div>
    </Panel>
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
    <Panel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Link público</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
            Reservas 24/7
          </h2>
        </div>

        <span className="rounded-full bg-[#EFE5D6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
          Ativo
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#6B6258]">
        Coloque este link no botão de reservas do Google Maps, Instagram,
        Facebook, website ou bio das redes sociais.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-3 text-sm text-[#3D362F]">
        <p className="truncate">{publicUrl}</p>
      </div>

      <div className="mt-3">
  <CopyButton text={publicUrl} />
</div>

      <div className="mt-5 rounded-2xl bg-[#FFF9F0] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
          Como usar
        </p>

        <div className="mt-3 space-y-2 text-sm leading-6 text-[#6B6258]">
          <p>1. Abra o Google Business Profile.</p>
          <p>2. Vá a Reservas / Links de marcação.</p>
          <p>3. Cole este link como botão principal.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/restaurants/${id}/website`}
          className="flex h-11 items-center justify-center rounded-full bg-[#16120E] px-4 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          Website
        </Link>

        <Link
          href={websiteUrl}
          target="_blank"
          className="flex h-11 items-center justify-center rounded-full border border-[#C8A56A] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] transition hover:bg-white"
        >
          Ver página
        </Link>
      </div>
    </Panel>
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

function ComingSoon() {
  return (
    <span className="rounded-full bg-[#EFE5D6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9B6F3B]">
      Soon
    </span>
  );
}

function SideLink({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "block rounded-2xl bg-[#16120E] px-4 py-3 text-sm font-semibold text-white"
          : "block rounded-2xl px-4 py-3 text-sm font-semibold text-[#5C5348] transition hover:bg-[#FFF9F0] hover:text-[#16120E]"
      }
    >
      {children}
    </Link>
  );
}

function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full bg-[#16120E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
    >
      {children}
    </Link>
  );
}

function BottomNav({ id }: { id: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/95 px-4 py-3 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-5 text-center text-xs font-semibold text-[#6B6258]">
        <Link href={`/restaurants/${id}`} className="text-[#16120E]">
          <p className="text-xl">⌂</p>
          Dashboard
        </Link>
        <Link href={`/restaurants/${id}/day`}>
          <p className="text-xl">⚡</p>
          Hoje
        </Link>
        <Link href={`/restaurants/${id}/ordering`}>
          <p className="text-xl">📲</p>
          QR
        </Link>
        <Link href={`/restaurants/${id}/tables`}>
          <p className="text-xl">▦</p>
          Sala
        </Link>
        <Link href={`/restaurants/${id}/website`}>
          <p className="text-xl">🌐</p>
          Website
        </Link>
      </div>
    </nav>
  );
}