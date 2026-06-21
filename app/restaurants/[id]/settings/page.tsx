import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplyMondayButton from "./ApplyMondayButton";
import RestaurantSidebar from "@/components/RestaurantSidebar";

const inputClass =
  "h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

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

  const googleReviewUrl = String(formData.get("googleReviewUrl") || "").trim();

const reviewRedirectThreshold = Number(
  formData.get("reviewRedirectThreshold") || 4,
);

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data: {
      googleReviewUrl: googleReviewUrl || null,
reviewRedirectThreshold:
  reviewRedirectThreshold >= 1 && reviewRedirectThreshold <= 5
    ? reviewRedirectThreshold
    : 4,
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

            totalCapacity: totalCapacity > 0 ? totalCapacity : null,

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
    subscription?.status === "ACTIVE" && subscription.plan === "PRO";

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
      <main className="min-h-screen bg-[#F5EFE6] p-10 text-[#16120E]">
        Restaurante não encontrado
      </main>
    );
  }

  const canUseAdvancedReservations =
    await canUseAdvancedReservationSettings(restaurant.userId);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
  <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
    <RestaurantSidebar
  id={id}
  restaurantName={restaurant.name}
  active="Definições"
/>

    <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
      MesaLink Control
    </p>

    <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
      Configurações
    </h1>

    <p className="mt-3 text-[#6B6258]">
      {restaurant.name}
    </p>
  </div>

  <div className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#9B6F3B]">
    Gestão operacional
  </div>
</header>

        <form id="settings-form" action={updateSettings} className="space-y-6">
          <input type="hidden" name="restaurantId" value={restaurant.id} />

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                Reservas
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                Regras principais
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#6B6258]">
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
                        className={inputClass}
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
                        className={inputClass}
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        Usado apenas quando o modo é Por Capacidade.
                      </p>
                    </Field>

                    <Field label="Aprovação manual a partir de">
                      <input
                        type="number"
                        name="manualApprovalGuests"
                        defaultValue={restaurant.manualApprovalGuests ?? ""}
                        placeholder="Ex: 8"
                        className={inputClass}
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        Reservas com este número de pessoas ou mais ficam
                        pendentes.
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
                    <input
                      type="hidden"
                      name="reservationMode"
                      value="CAPACITY"
                    />

                    <Field label="Capacidade total">
                      <input
                        type="number"
                        name="totalCapacity"
                        defaultValue={restaurant.totalCapacity ?? ""}
                        placeholder="Ex: 60"
                        className={inputClass}
                        required
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        Número máximo de pessoas que pode aceitar por horário.
                      </p>
                    </Field>

                    <div className="rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                        Funcionalidade Pro
                      </p>

                      <h3 className="mt-3 text-xl font-semibold">
                        Gestão de mesas disponível no Pro
                      </h3>

                      <ul className="mt-4 space-y-2 text-sm text-[#6B6258]">
                        <li>✓ Mapa da sala</li>
                        <li>✓ Reservas por mesa</li>
                        <li>✓ Junção de mesas</li>
                        <li>✓ Reservas ilimitadas</li>
                      </ul>

                      <Link
                        href="/billing?feature=tables"
                        className="mt-5 inline-flex rounded-full bg-[#16120E] px-5 py-3 font-semibold text-white transition hover:bg-[#2A2118]"
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

            <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    Horários
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
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
                      className="grid grid-cols-1 gap-4 rounded-3xl border border-[#E8DCCB] bg-[#FFF9F0] p-4 md:grid-cols-[160px_1fr_1fr]"
                    >
                      <label className="flex items-center gap-3 font-semibold">
                        <input
                          type="checkbox"
                          name={`${day.key}Open`}
                          defaultChecked={Boolean(restaurant[openKey])}
                          className="h-4 w-4 accent-[#16120E]"
                        />

                        {day.label}
                      </label>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8F82]">
                          Almoço
                        </p>

                        <input
                          name={`${day.key}Lunch`}
                          defaultValue={String(restaurant[lunchKey] ?? "")}
                          placeholder="12:00-15:00"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8F82]">
                          Jantar
                        </p>

                        <input
                          name={`${day.key}Dinner`}
                          defaultValue={String(restaurant[dinnerKey] ?? "")}
                          placeholder="19:00-23:00"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
<section className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
    Marketing & Reviews
  </p>

  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
    Google Reviews
  </h2>

  <p className="mt-2 text-sm leading-relaxed text-[#6B6258]">
    Configure o link para onde os clientes satisfeitos podem partilhar a experiência no Google.
  </p>

  <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
    <Field label="Google Reviews URL">
      <input
        name="googleReviewUrl"
        defaultValue={restaurant.googleReviewUrl ?? ""}
        placeholder="https://search.google.com/local/writereview?placeid=..."
        className={inputClass}
      />

      <p className="mt-2 text-xs text-[#9B8F82]">
        Este botão só aparece ao cliente quando este link estiver preenchido.
      </p>
    </Field>

    <Field label="Mínimo para sugerir Google">
      <select
        name="reviewRedirectThreshold"
        defaultValue={restaurant.reviewRedirectThreshold ?? 4}
        className={inputClass}
      >
        <option value={5}>5 estrelas</option>
        <option value={4}>4 estrelas ou mais</option>
        <option value={3}>3 estrelas ou mais</option>
      </select>
    </Field>
  </div>
</section>
          <div className="sticky bottom-6 z-20 flex justify-end">
            <button className="rounded-full bg-[#16120E] px-8 py-4 font-semibold text-white shadow-[0_18px_55px_rgba(80,55,30,0.18)] transition hover:bg-[#2A2118]">
              Guardar alterações
            </button>
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
      <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
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
    <div className="rounded-3xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="mt-1 h-4 w-4 accent-[#16120E]"
        />

        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#6B6258]">{text}</p>
        </div>
      </label>
    </div>
  );
}
