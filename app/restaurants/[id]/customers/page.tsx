import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
    return <div className="p-10">Restaurante não encontrado</div>;
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

  const totalReservations = customers.reduce(
    (total, customer) => total + customer.reservations.length,
    0
  );

  const totalNoShows = customers.reduce(
    (total, customer) =>
      total +
      customer.reservations.filter(
        (reservation) => reservation.status === "NO_SHOW"
      ).length,
    0
  );

  const totalGuests = customers.reduce(
    (total, customer) =>
      total +
      customer.reservations.reduce(
        (sum, reservation) => sum + reservation.guests,
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-[#0f0f0f] p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-6 border-b border-[#2b2b2b] pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm text-[#9e9e9e] hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Clientes
            </h1>

            <p className="mt-2 text-[#9e9e9e]">{restaurant.name}</p>
          </div>

          <div className="rounded-full border border-[#2b2b2b] bg-[#181818] px-5 py-3 text-sm font-bold text-[#f0c36a]">
            CRM do restaurante
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard label="Clientes" value={customers.length} />
          <StatCard label="Reservas" value={totalReservations} />
          <StatCard label="Pessoas recebidas" value={totalGuests} />
          <StatCard label="No-shows" value={totalNoShows} />
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-[#2b2b2b] bg-[#181818]">
          <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr] gap-4 border-b border-[#2b2b2b] bg-[#141414] px-5 py-4 text-sm font-bold text-[#9e9e9e]">
            <div>Cliente</div>
            <div>Telefone</div>
            <div>Reservas</div>
            <div>No-shows</div>
            <div>Pessoas</div>
            <div>Última visita</div>
          </div>

          <div>
            {customers.map((customer) => {
              const totalCustomerReservations = customer.reservations.length;

              const noShows = customer.reservations.filter(
                (reservation) => reservation.status === "NO_SHOW"
              ).length;

              const customerGuests = customer.reservations.reduce(
                (total, reservation) => total + reservation.guests,
                0
              );

              const lastReservation = customer.reservations[0];

              return (
                <div
                  key={customer.id}
                  className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_1fr_1fr] items-center gap-4 border-b border-[#2b2b2b] px-5 py-4 last:border-b-0 hover:bg-[#1f1f1f]"
                >
                  <div>
                    <p className="font-black">{customer.name}</p>

                    {totalCustomerReservations >= 5 && (
                      <span className="mt-2 inline-block rounded-full bg-[#f0c36a]/15 px-3 py-1 text-xs font-bold text-[#f0c36a]">
                        Cliente frequente
                      </span>
                    )}
                  </div>

                  <div className="text-[#d6d6d6]">{customer.phone}</div>

                  <div className="font-black text-[#f0c36a]">
                    {totalCustomerReservations}
                  </div>

                  <div
                    className={
                      noShows > 0
                        ? "font-black text-orange-300"
                        : "font-black text-[#7d7d7d]"
                    }
                  >
                    {noShows}
                  </div>

                  <div className="font-black">{customerGuests}</div>

                  <div className="text-[#9e9e9e]">
                    {lastReservation
                      ? new Date(lastReservation.date).toLocaleDateString(
                          "pt-PT"
                        )
                      : "-"}
                  </div>
                </div>
              );
            })}

            {customers.length === 0 && (
              <p className="p-6 text-[#9e9e9e]">
                Ainda não existem clientes.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#181818] p-6">
      <p className="text-sm text-[#9e9e9e]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}