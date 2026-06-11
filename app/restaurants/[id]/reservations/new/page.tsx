import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function createReservation(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationMode = String(formData.get("reservationMode"));
  const tableIdValue = String(formData.get("tableId") || "");
  const customerName = String(formData.get("customerName"));
  const phone = String(formData.get("phone"));
  const guests = Number(formData.get("guests"));
  const dateValue = String(formData.get("date"));
  const timeValue = String(formData.get("time"));

  const tableId =
  reservationMode === "TABLES" && tableIdValue !== ""
    ? tableIdValue
    : null;
  const date = new Date(`${dateValue}T${timeValue}`);

  const startDate = date;
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  const conflictingReservation = tableId
    ? await prisma.reservation.findFirst({
        where: {
          tableId,
          status: {
            notIn: ["CANCELLED", "FINISHED", "REJECTED", "NO_SHOW"],
          },
          date: {
            gte: new Date(startDate.getTime() - 2 * 60 * 60 * 1000),
            lt: endDate,
          },
        },
      })
    : null;

  if (conflictingReservation) {
    redirect(`/restaurants/${restaurantId}/reservations?error=conflict`);
  }

  const customer = await prisma.customer.upsert({
    where: { phone },
    update: { name: customerName },
    create: { name: customerName, phone },
  });

  if (reservationMode === "TABLES" && tableId) {
  const tableExists = await prisma.table.findFirst({
    where: {
      id: tableId,
      restaurantId,
    },
  });

  if (!tableExists) {
    redirect(`/restaurants/${restaurantId}/reservations/new?error=invalid-table`);
  }
}


  await prisma.reservation.create({
    data: {
      restaurantId,
      customerId: customer.id,
      customerName,
      phone,
      guests,
      date,
      tableId,
      status: "CONFIRMED",
    },
  });

  redirect(`/restaurants/${restaurantId}/reservations`);
}

const times = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
];

export default async function NewReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#020617] p-10 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const usesTables = restaurant.reservationMode === "TABLES";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link
          href={`/restaurants/${id}/reservations`}
          className="text-sm font-bold text-slate-400 hover:text-white"
        >
          ← Voltar às reservas
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Nova reserva
            </p>

            <h1 className="mt-4 text-5xl font-black leading-[0.9] tracking-[-0.06em]">
              Criar reserva manual.
            </h1>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Adicione rapidamente uma reserva ao calendário de{" "}
              <span className="font-bold text-white">{restaurant.name}</span>.
            </p>

            <div className="mt-8 grid gap-3">
              <MiniCard label="Estado" value="Confirmada" />
              <MiniCard
                label="Modo"
                value={usesTables ? "Por mesas" : "Por capacidade"}
              />
              <MiniCard label="Duração" value="2 horas" />
            </div>
          </aside>

          <section className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <form action={createReservation} className="space-y-8">
              <input type="hidden" name="restaurantId" value={restaurant.id} />

              <input
                type="hidden"
                name="reservationMode"
                value={restaurant.reservationMode}
              />

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Cliente
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Nome do cliente">
                    <input
                      name="customerName"
                      placeholder="Ex: João Silva"
                      className="input-ai h-14"
                      required
                    />
                  </Field>

                  <Field label="Telefone">
                    <input
                      name="phone"
                      placeholder="Ex: 912345678"
                      className="input-ai h-14"
                      required
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  Reserva
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Número de pessoas">
                    <input
                      name="guests"
                      type="number"
                      min="1"
                      placeholder="Ex: 4"
                      className="input-ai h-14"
                      required
                    />
                  </Field>

                  <Field label="Data">
                    <input
                      name="date"
                      type="date"
                      className="input-ai h-14"
                      required
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="mb-4 text-sm font-bold text-slate-300">Hora</p>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                  {times.map((time) => (
                    <label key={time} className="group cursor-pointer">
                      <input
                        type="radio"
                        name="time"
                        value={time}
                        required
                        className="peer sr-only"
                      />

                      <span className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-sm font-black text-slate-300 transition peer-checked:border-cyan-300/70 peer-checked:bg-cyan-300 peer-checked:text-black group-hover:border-cyan-300/40">
                        {time}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {usesTables && (
                <div>
                  <p className="mb-4 text-sm font-bold text-slate-300">Mesa</p>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {restaurant.tables.map((table) => (
                      <label key={table.id} className="group cursor-pointer">
                        <input
                          type="radio"
                          name="tableId"
                          value={table.id}
                          required
                          className="peer sr-only"
                        />

                        <span className="block rounded-3xl border border-white/10 bg-black/25 p-5 transition peer-checked:border-cyan-300/70 peer-checked:bg-cyan-300/15 group-hover:border-cyan-300/40">
                          <span className="block text-xl font-black text-white">
                            Mesa {table.number}
                          </span>

                          <span className="mt-2 block text-sm text-slate-400">
                            {table.capacity} pessoas
                          </span>

                          <span className="mt-4 inline-flex rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
                            Disponível
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {!usesTables && (
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
                  Este restaurante está em modo <strong>capacidade</strong>. A
                  reserva será criada sem mesa atribuída.
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-6 md:flex-row">
                <button className="h-14 flex-1 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90">
                  Criar reserva
                </button>

                <Link
                  href={`/restaurants/${id}/reservations`}
                  className="flex h-14 flex-1 items-center justify-center rounded-full border border-cyan-300/25 bg-white/5 px-6 font-black text-white backdrop-blur hover:bg-white/10"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-cyan-300">{value}</p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}