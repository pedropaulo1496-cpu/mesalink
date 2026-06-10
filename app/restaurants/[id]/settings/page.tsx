import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplyMondayButton from "./ApplyMondayButton";

async function updateSettings(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const reservationMode = String(formData.get("reservationMode"));
  const totalCapacity = Number(formData.get("totalCapacity"));
  const manualApprovalGuests = Number(formData.get("manualApprovalGuests"));

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data: {
      reservationMode,

      totalCapacity:
        reservationMode === "CAPACITY" && totalCapacity > 0
          ? totalCapacity
          : null,

      manualApprovalGuests:
        manualApprovalGuests > 0 ? manualApprovalGuests : null,

      approvalOnTableMerge:
        formData.get("approvalOnTableMerge") === "on",

      onlineReservationsEnabled:
        formData.get("onlineReservationsEnabled") === "on",

      mondayOpen: formData.get("mondayOpen") === "on",
      mondayLunch: String(formData.get("mondayLunch") || ""),
      mondayDinner: String(formData.get("mondayDinner") || ""),

      tuesdayOpen: formData.get("tuesdayOpen") === "on",
      tuesdayLunch: String(formData.get("tuesdayLunch") || ""),
      tuesdayDinner: String(formData.get("tuesdayDinner") || ""),

      wednesdayOpen: formData.get("wednesdayOpen") === "on",
      wednesdayLunch: String(formData.get("wednesdayLunch") || ""),
      wednesdayDinner: String(formData.get("wednesdayDinner") || ""),

      thursdayOpen: formData.get("thursdayOpen") === "on",
      thursdayLunch: String(formData.get("thursdayLunch") || ""),
      thursdayDinner: String(formData.get("thursdayDinner") || ""),

      fridayOpen: formData.get("fridayOpen") === "on",
      fridayLunch: String(formData.get("fridayLunch") || ""),
      fridayDinner: String(formData.get("fridayDinner") || ""),

      saturdayOpen: formData.get("saturdayOpen") === "on",
      saturdayLunch: String(formData.get("saturdayLunch") || ""),
      saturdayDinner: String(formData.get("saturdayDinner") || ""),

      sundayOpen: formData.get("sundayOpen") === "on",
      sundayLunch: String(formData.get("sundayLunch") || ""),
      sundayDinner: String(formData.get("sundayDinner") || ""),
    },
  });

  redirect(`/restaurants/${restaurantId}`);
}

const weekdays = [
  { label: "Segunda", key: "monday" },
  { label: "Terça", key: "tuesday" },
  { label: "Quarta", key: "wednesday" },
  { label: "Quinta", key: "thursday" },
  { label: "Sexta", key: "friday" },
  { label: "Sábado", key: "saturday" },
  { label: "Domingo", key: "sunday" },
] as const;

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-[#0f0f0f] p-10 text-white">
        Restaurante não encontrado
      </main>
    );
  }

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
              Configurações
            </h1>

            <p className="mt-2 text-[#9e9e9e]">
              {restaurant.name}
            </p>
          </div>

          <div className="rounded-full border border-[#2b2b2b] bg-[#181818] px-5 py-3 text-sm font-bold text-[#f0c36a]">
            Gestão operacional
          </div>
        </header>

        <form
          id="settings-form"
          action={updateSettings}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="restaurantId"
            value={restaurant.id}
          />

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                Reservas
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Regras principais
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#9e9e9e]">
                Defina se o restaurante trabalha por mesas ou por capacidade,
                e quando uma reserva deve ficar pendente.
              </p>

              <div className="mt-6 space-y-5">
                <Field label="Modo de reservas">
                  <select
                    name="reservationMode"
                    defaultValue={restaurant.reservationMode}
                    className="input-dark"
                  >
                    <option value="TABLES">Por Mesas</option>
                    <option value="CAPACITY">Por Capacidade</option>
                  </select>
                </Field>

                <Field label="Capacidade total">
                  <input
                    type="number"
                    name="totalCapacity"
                    defaultValue={restaurant.totalCapacity ?? ""}
                    placeholder="Ex: 60"
                    className="input-dark"
                  />

                  <p className="mt-2 text-xs text-[#7d7d7d]">
                    Usado apenas quando o modo é Por Capacidade.
                  </p>
                </Field>

                <Field label="Aprovação manual a partir de">
                  <input
                    type="number"
                    name="manualApprovalGuests"
                    defaultValue={restaurant.manualApprovalGuests ?? ""}
                    placeholder="Ex: 8"
                    className="input-dark"
                  />

                  <p className="mt-2 text-xs text-[#7d7d7d]">
                    Reservas com este número de pessoas ou mais ficam pendentes.
                  </p>
                </Field>

                <ToggleBox
                  name="approvalOnTableMerge"
                  defaultChecked={restaurant.approvalOnTableMerge}
                  title="Aprovação ao juntar mesas"
                  text="Pedidos que exijam junção de mesas ficam pendentes."
                />

                <ToggleBox
                  name="onlineReservationsEnabled"
                  defaultChecked={restaurant.onlineReservationsEnabled}
                  title="Aceitar reservas online"
                  text="Se estiver desligado, a página pública informa que o restaurante não está a aceitar reservas."
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#2b2b2b] bg-[#181818] p-6">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
                    Horários
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    Funcionamento semanal
                  </h2>
                </div>

                <ApplyMondayButton />
              </div>

              <div className="space-y-3">
                {weekdays.map((day) => {
                  const openKey = `${day.key}Open` as keyof typeof restaurant;
                  const lunchKey = `${day.key}Lunch` as keyof typeof restaurant;
                  const dinnerKey = `${day.key}Dinner` as keyof typeof restaurant;

                  return (
                    <div
                      key={day.key}
                      className="grid grid-cols-1 gap-4 rounded-3xl border border-[#2b2b2b] bg-[#111111] p-4 md:grid-cols-[160px_1fr_1fr]"
                    >
                      <label className="flex items-center gap-3 font-black">
                        <input
                          type="checkbox"
                          name={`${day.key}Open`}
                          defaultChecked={Boolean(restaurant[openKey])}
                          className="h-4 w-4 accent-[#f0c36a]"
                        />

                        {day.label}
                      </label>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7d7d7d]">
                          Almoço
                        </p>

                        <input
                          name={`${day.key}Lunch`}
                          defaultValue={String(restaurant[lunchKey] ?? "")}
                          placeholder="12:00-15:00"
                          className="input-dark"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#7d7d7d]">
                          Jantar
                        </p>

                        <input
                          name={`${day.key}Dinner`}
                          defaultValue={String(restaurant[dinnerKey] ?? "")}
                          placeholder="19:00-23:00"
                          className="input-dark"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="sticky bottom-6 z-20 flex justify-end">
            <button className="rounded-full bg-[#f0c36a] px-8 py-4 font-black text-black shadow-2xl hover:bg-[#ffd982]">
              Guardar alterações
            </button>
          </div>
        </form>
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
      <span className="mb-2 block text-sm font-bold text-[#d6d6d6]">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleBox({
  name,
  defaultChecked,
  title,
  text,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#111111] p-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-4 w-4 accent-[#f0c36a]"
        />

        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm text-[#9e9e9e]">{text}</p>
        </div>
      </label>
    </div>
  );
}