import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplyMondayButton from "./ApplyMondayButton";

async function updateSettings(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));

  const currentRestaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { userId: true },
  });

  if (!currentRestaurant) {
    redirect("/dashboard");
  }

  const canUseAdvancedReservations =
    await canUseAdvancedReservationSettings(currentRestaurant.userId);

  const reservationMode = String(formData.get("reservationMode") || "TABLES");
  const totalCapacity = Number(formData.get("totalCapacity"));
  const manualApprovalGuests = Number(formData.get("manualApprovalGuests"));

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data: {
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

      ...(canUseAdvancedReservations
  ? {
      reservationMode:
        reservationMode === "CAPACITY" ? "CAPACITY" : "TABLES",

      totalCapacity:
        totalCapacity > 0 ? totalCapacity : null,

      manualApprovalGuests:
        manualApprovalGuests > 0 ? manualApprovalGuests : null,

      approvalOnTableMerge:
        formData.get("approvalOnTableMerge") === "on",
    }
  : {
      reservationMode: "CAPACITY",
      totalCapacity: totalCapacity > 0 ? totalCapacity : null,
      manualApprovalGuests: null,
      approvalOnTableMerge: false,
    }),
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

async function canUseAdvancedReservationSettings(userId?: string | null) {
  if (!userId) return false;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const trialActive =
    subscription?.status === "TRIAL" &&
    subscription.trialEndsAt &&
    new Date() <= subscription.trialEndsAt;

  const isPro =
    subscription?.status === "ACTIVE" &&
    subscription.plan === "PRO";

  return Boolean(trialActive || isPro);
}


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
      <main className="min-h-screen bg-[#020617] p-10 text-white">
        Restaurante não encontrado
      </main>
    );
  }

  const canUseAdvancedReservations =
    await canUseAdvancedReservationSettings(restaurant.userId);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-6 border-b border-cyan-300/10 pb-8 md:flex-row md:items-center">
          <div>
            <Link
              href={`/restaurants/${id}`}
              className="text-sm font-bold text-slate-400 hover:text-white"
            >
              ← Voltar ao dashboard
            </Link>

            <p className="mt-8 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              MesaLink Control
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-[-0.06em]">
              Configurações
            </h1>

            <p className="mt-2 text-slate-400">{restaurant.name}</p>
          </div>

          <div className="w-fit rounded-full border border-cyan-300/20 bg-cyan-500/10 px-5 py-3 text-sm font-black text-cyan-300">
            Gestão operacional
          </div>
        </header>

        <form id="settings-form" action={updateSettings} className="space-y-6">
          <input type="hidden" name="restaurantId" value={restaurant.id} />

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.1)] backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Reservas
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                Regras principais
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Defina se o restaurante trabalha por mesas ou por capacidade, e
                quando uma reserva deve ficar pendente.
              </p>

              <div className="mt-6 space-y-5">
                {canUseAdvancedReservations ? (
                  <>
                    <Field label="Modo de reservas">
                      <select
                        name="reservationMode"
                        defaultValue={restaurant.reservationMode}
                        className="input-ai"
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
                        className="input-ai"
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        Usado apenas quando o modo é Por Capacidade.
                      </p>
                    </Field>

                    <Field label="Aprovação manual a partir de">
                      <input
                        type="number"
                        name="manualApprovalGuests"
                        defaultValue={restaurant.manualApprovalGuests ?? ""}
                        placeholder="Ex: 8"
                        className="input-ai"
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        Reservas com este número de pessoas ou mais ficam pendentes.
                      </p>
                    </Field>

                    <ToggleBox
                      name="approvalOnTableMerge"
                      defaultChecked={restaurant.approvalOnTableMerge}
                      title="Aprovação ao juntar mesas"
                      text="Pedidos que exijam junção de mesas ficam pendentes."
                    />
                  </>
                ) : (
  <>
    <input type="hidden" name="reservationMode" value="CAPACITY" />

    <Field label="Capacidade total">
      <input
        type="number"
        name="totalCapacity"
        defaultValue={restaurant.totalCapacity ?? ""}
        placeholder="Ex: 60"
        className="input-ai"
        required
      />

      <p className="mt-2 text-xs text-slate-500">
        Número máximo de pessoas que pode aceitar por horário.
      </p>
    </Field>

    <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/5 p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        Funcionalidade Pro
      </p>

      <h3 className="mt-3 text-xl font-black">
        Gestão de mesas disponível no Pro
      </h3>

      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        <li>✓ Mapa da sala</li>
        <li>✓ Reservas por mesa</li>
        <li>✓ Junção de mesas</li>
        <li>✓ Reservas ilimitadas</li>
      </ul>

      <Link
        href="/billing?feature=tables"
        className="mt-5 inline-flex rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 font-black text-black"
      >
        Upgrade para Pro
      </Link>
    </div>
  </>
)}

                <ToggleBox
                  name="onlineReservationsEnabled"
                  defaultChecked={restaurant.onlineReservationsEnabled}
                  title="Aceitar reservas online"
                  text="Se estiver desligado, a página pública informa que o restaurante não está a aceitar reservas."
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.1)] backdrop-blur-2xl">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                    Horários
                  </p>

                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                    Funcionamento semanal
                  </h2>
                </div>

                <ApplyMondayButton />
              </div>

              <div className="space-y-3">
                {weekdays.map((day) => {
                  const openKey = `${day.key}Open` as keyof typeof restaurant;
                  const lunchKey =
                    `${day.key}Lunch` as keyof typeof restaurant;
                  const dinnerKey =
                    `${day.key}Dinner` as keyof typeof restaurant;

                  return (
                    <div
                      key={day.key}
                      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-black/25 p-4 md:grid-cols-[160px_1fr_1fr]"
                    >
                      <label className="flex items-center gap-3 font-black">
                        <input
                          type="checkbox"
                          name={`${day.key}Open`}
                          defaultChecked={Boolean(restaurant[openKey])}
                          className="h-4 w-4 accent-cyan-300"
                        />

                        {day.label}
                      </label>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                          Almoço
                        </p>

                        <input
                          name={`${day.key}Lunch`}
                          defaultValue={String(restaurant[lunchKey] ?? "")}
                          placeholder="12:00-15:00"
                          className="input-ai"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                          Jantar
                        </p>

                        <input
                          name={`${day.key}Dinner`}
                          defaultValue={String(restaurant[dinnerKey] ?? "")}
                          placeholder="19:00-23:00"
                          className="input-ai"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="sticky bottom-6 z-20 flex justify-end">
            <button className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 py-4 font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90">
              Guardar alterações
            </button>
          </div>
        </form>
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
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-4 w-4 accent-cyan-300"
        />

        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
        </div>
      </label>
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