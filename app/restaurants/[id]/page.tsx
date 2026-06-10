import CopyButton from "@/components/CopyButton";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { canAccessApp } from "@/lib/check-subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const hasAccess = await canAccessApp(session.user.email);

  if (!hasAccess) {
    redirect("/trial-expired");
  }

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        include: {
          reservations: true,
        },
      },
      reservations: true,
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#070504] p-10 text-[#fff7ea]">
        Restaurante não encontrado
      </main>
    );
  }

  const tableReservations = restaurant.tables.flatMap((table) =>
    table.reservations.map((reservation) => ({
      ...reservation,
      tableNumber: table.number,
    }))
  );

  const directReservations = restaurant.reservations.map((reservation) => ({
    ...reservation,
    tableNumber: null as number | null,
  }));

  const allReservations = [...tableReservations, ...directReservations].filter(
    (reservation, index, array) =>
      array.findIndex((item) => item.id === reservation.id) === index
  );

  const today = new Date();

  const reservationsToday = allReservations.filter((reservation) => {
    const reservationDate = new Date(reservation.date);

    return (
      reservationDate.getDate() === today.getDate() &&
      reservationDate.getMonth() === today.getMonth() &&
      reservationDate.getFullYear() === today.getFullYear() &&
      reservation.status !== "CANCELLED" &&
      reservation.status !== "REJECTED" &&
      reservation.status !== "NO_SHOW"
    );
  });

  const guestsToday = reservationsToday.reduce(
    (total, reservation) => total + reservation.guests,
    0
  );

  const occupiedTables = new Set(
    reservationsToday
      .filter((reservation) => reservation.tableId)
      .map((reservation) => reservation.tableId)
  ).size;

  const occupancyRate =
    restaurant.reservationMode === "CAPACITY" && restaurant.totalCapacity
      ? Math.round((guestsToday / restaurant.totalCapacity) * 100)
      : restaurant.tables.length > 0
      ? Math.round((occupiedTables / restaurant.tables.length) * 100)
      : 0;

  const totalCustomers = await prisma.customer.count({
    where: {
      reservations: {
        some: {
          restaurantId: id,
        },
      },
    },
  });

  const nextReservations = allReservations
    .filter((reservation) => {
      const reservationDate = new Date(reservation.date);

      return (
        reservationDate >= new Date() &&
        reservation.status !== "CANCELLED" &&
        reservation.status !== "REJECTED" &&
        reservation.status !== "NO_SHOW"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    .slice(0, 5);

  const publicUrl = `http://localhost:3000/reserve/${restaurant.slug}`;

  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-7xl px-8 py-8">
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-[#f0c36a]/10 pb-8 md:flex-row md:items-center">
          <div>
            <Link href="/" className="mb-6 inline-block text-2xl font-black">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </Link>

            <h1 className="text-5xl font-black tracking-tight">
              {restaurant.name}
            </h1>

            <p className="mt-2 text-[#a99a82]">
              {restaurant.address || "Dashboard do restaurante"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <DashboardLink href={`/restaurants/${id}/calendar`}>
              Calendário
            </DashboardLink>

            <DashboardLink href={`/restaurants/${id}/day`}>
              Serviço do dia
            </DashboardLink>

            <DashboardLink href={`/reserve/${restaurant.slug}`}>
              Página pública
            </DashboardLink>

            <DashboardLink href="/billing">
              Billing
            </DashboardLink>

            <SignOutButton />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <StatCard label="Mesas" value={restaurant.tables.length} />
          <StatCard label="Clientes" value={totalCustomers} />
          <StatCard label="Reservas totais" value={allReservations.length} />
          <StatCard label="Reservas hoje" value={reservationsToday.length} />
          <StatCard label="Clientes hoje" value={guestsToday} />

          <div className="rounded-[1.5rem] border border-[#f0c36a]/10 bg-[#15100b] p-5">
            <p className="text-sm text-[#a99a82]">Ocupação</p>

            <p className="mt-2 text-3xl font-black text-[#f0c36a]">
              {occupancyRate}%
            </p>

            <div className="mt-4 h-2 rounded-full bg-black/40">
              <div
                className="h-2 rounded-full bg-[#f0c36a]"
                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
              />
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                    Link público
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    Receba reservas pelo Google Maps
                  </h2>

                  <p className="mt-3 text-[#a99a82]">
                    Use este link no perfil Google, Instagram, WhatsApp ou website.
                  </p>
                </div>

                <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm font-bold text-green-300">
                  Ativo
                </span>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex-1 rounded-2xl border border-[#f0c36a]/10 bg-black/25 p-4 text-[#d6c7ad]">
                  {publicUrl}
                </div>

                <CopyButton text={publicUrl} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                  Ações rápidas
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Gestão do restaurante
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <ActionLink href={`/restaurants/${id}/tables`} title="Gerir Mesas" />
                <ActionLink href={`/restaurants/${id}/reservations`} title="Gerir Reservas" />
                <ActionLink href={`/restaurants/${id}/customers`} title="Clientes" />
                <ActionLink href={`/restaurants/${id}/settings`} title="Configurações" />
                <ActionLink href={`/restaurants/${id}/qr`} title="QR Code" />
                <ActionLink href={`/restaurants/${id}/calendar`} title="Calendário" />
                <ActionLink href="/billing" title="Billing" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8">
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                Próximas reservas
              </p>

              <h2 className="mt-3 text-3xl font-black">Agenda</h2>
            </div>

            <div className="space-y-3">
              {nextReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold">{reservation.customerName}</p>

                      <p className="mt-1 text-sm text-[#a99a82]">
                        {reservation.tableNumber
                          ? `Mesa ${reservation.tableNumber}`
                          : "Sem mesa atribuída"}{" "}
                        · {reservation.guests} pessoas
                      </p>

                      <span className="mt-3 inline-block rounded-full bg-[#f0c36a]/10 px-3 py-1 text-xs font-bold text-[#f0c36a]">
                        {reservation.status}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-[#a99a82]">
                        {new Date(reservation.date).toLocaleDateString("pt-PT")}
                      </p>

                      <p className="mt-1 text-xl font-black text-[#f0c36a]">
                        {new Date(reservation.date).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {nextReservations.length === 0 && (
                <p className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4 text-[#a99a82]">
                  Ainda não há próximas reservas.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
            Configuração de reservas
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <InfoItem
              label="Modo"
              value={
                restaurant.reservationMode === "TABLES"
                  ? "Por Mesas"
                  : "Por Capacidade"
              }
            />

            <InfoItem
              label="Capacidade"
              value={
                restaurant.totalCapacity
                  ? `${restaurant.totalCapacity} lugares`
                  : "Não definida"
              }
            />

            <InfoItem
              label="Aprovação manual"
              value={
                restaurant.manualApprovalGuests
                  ? `A partir de ${restaurant.manualApprovalGuests} pessoas`
                  : "Automática"
              }
            />

            <InfoItem
              label="Reservas online"
              value={restaurant.onlineReservationsEnabled ? "Ativas" : "Desativadas"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <p className="text-sm text-[#a99a82]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}

function DashboardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[#f0c36a]/20 px-5 py-3 text-sm font-bold text-[#d6c7ad] hover:border-[#f0c36a]/50 hover:text-white"
    >
      {children}
    </Link>
  );
}

function ActionLink({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-5 font-bold text-[#fff7ea] transition hover:-translate-y-1 hover:border-[#f0c36a]/40"
    >
      {title}
    </Link>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-5">
      <p className="text-sm text-[#a99a82]">{label}</p>
      <p className="mt-2 font-bold text-[#fff7ea]">{value}</p>
    </div>
  );
}