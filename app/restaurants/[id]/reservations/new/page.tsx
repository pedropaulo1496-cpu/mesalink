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

  const tableId = reservationMode === "TABLES" ? tableIdValue : null;
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

      <section className="relative z-10 mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <Link
          href={`/restaurants/${id}/reservations`}
          className="text-sm font-bold text-slate-400 hover:text-white"
        >
          ← Voltar às reservas
        </Link>

        <div className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Nova reserva
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Criar reserva
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Adicione uma reserva manualmente para {restaurant.name}.
            </p>
          </div>

          <form action={createReservation} className="space-y-5">
            <input type="hidden" name="restaurantId" value={restaurant.id} />

            <input
              type="hidden"
              name="reservationMode"
              value={restaurant.reservationMode}
            />

            <Field label="Nome do cliente">
              <input
                name="customerName"
                placeholder="Ex: João Silva"
                className="input-ai"
                required
              />
            </Field>

            <Field label="Telefone">
              <input
                name="phone"
                placeholder="Ex: 912345678"
                className="input-ai"
                required
              />
            </Field>

            <Field label="Número de pessoas">
              <input
                name="guests"
                type="number"
                min="1"
                placeholder="Ex: 4"
                className="input-ai"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Data">
                <input name="date" type="date" className="input-ai" required />
              </Field>

              <Field label="Hora">
                <select name="time" className="input-ai" required>
                  <option value="">Escolha uma hora</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="19:00">19:00</option>
                  <option value="19:30">19:30</option>
                  <option value="20:00">20:00</option>
                  <option value="20:30">20:30</option>
                  <option value="21:00">21:00</option>
                  <option value="21:30">21:30</option>
                  <option value="22:00">22:00</option>
                  <option value="22:30">22:30</option>
                </select>
              </Field>
            </div>

            {usesTables && (
              <Field label="Mesa">
                <select name="tableId" className="input-ai" required>
                  <option value="">Escolha uma mesa</option>
                  {restaurant.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Mesa {table.number} ({table.capacity} pessoas)
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {!usesTables && (
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-100">
                Este restaurante está em modo <strong>capacidade</strong>. A
                reserva será criada sem mesa atribuída.
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 md:flex-row">
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

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}