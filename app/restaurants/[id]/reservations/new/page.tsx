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
      <main className="min-h-screen bg-[#070504] p-10 text-[#fff7ea]">
        Restaurante não encontrado
      </main>
    );
  }

  const usesTables = restaurant.reservationMode === "TABLES";

  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-3xl px-8 py-8">
        <Link
          href={`/restaurants/${id}/reservations`}
          className="text-sm font-bold text-[#a99a82] hover:text-white"
        >
          ← Voltar às reservas
        </Link>

        <section className="mt-8 rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
              Nova reserva
            </p>

            <h1 className="mt-3 text-4xl font-black">Criar reserva</h1>

            <p className="mt-2 text-[#a99a82]">
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
                className="input-dark"
                required
              />
            </Field>

            <Field label="Telefone">
              <input
                name="phone"
                placeholder="Ex: 912345678"
                className="input-dark"
                required
              />
            </Field>

            <Field label="Número de pessoas">
              <input
                name="guests"
                type="number"
                min="1"
                placeholder="Ex: 4"
                className="input-dark"
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Data">
                <input name="date" type="date" className="input-dark" required />
              </Field>

              <Field label="Hora">
                <select name="time" className="input-dark" required>
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
                <select name="tableId" className="input-dark" required>
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
              <div className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4 text-sm text-[#a99a82]">
                Este restaurante está em modo <strong>capacidade</strong>. A
                reserva será criada sem mesa atribuída.
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 md:flex-row">
              <button className="h-14 flex-1 rounded-full bg-[#f0c36a] px-6 font-black text-black hover:bg-[#ffd982]">
                Criar reserva
              </button>

              <Link
                href={`/restaurants/${id}/reservations`}
                className="flex h-14 flex-1 items-center justify-center rounded-full border border-[#f0c36a]/10 bg-black/20 px-6 font-bold text-[#d6c7ad] hover:border-[#f0c36a]/40 hover:text-white"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
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
      <span className="mb-2 block font-bold text-[#d6c7ad]">{label}</span>
      {children}
    </label>
  );
}