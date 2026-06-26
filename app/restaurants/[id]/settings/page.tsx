import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

async function createPrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "KITCHEN");
  const method = String(formData.get("method") || "BROWSER");
  const ipAddress = String(formData.get("ipAddress") || "").trim();
  const portValue = String(formData.get("port") || "").trim();

  if (!restaurantId || !name) return;

  await prisma.restaurantPrinter.create({
    data: {
      restaurantId,
      name,
      type,
      method,
      ipAddress: ipAddress || null,
      port: portValue ? Number(portValue) : null,
      active: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function updatePrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const printerId = String(formData.get("printerId"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "KITCHEN");
  const method = String(formData.get("method") || "BROWSER");
  const ipAddress = String(formData.get("ipAddress") || "").trim();
  const portValue = String(formData.get("port") || "").trim();
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !printerId || !name) return;

  await prisma.restaurantPrinter.update({
    where: { id: printerId },
    data: {
      name,
      type,
      method,
      ipAddress: ipAddress || null,
      port: portValue ? Number(portValue) : null,
      active,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function deletePrinter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const printerId = String(formData.get("printerId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !printerId || !confirmDelete) return;

  await prisma.productionCenter.updateMany({
    where: { printerId },
    data: { printerId: null },
  });

  await prisma.restaurantPrinter.delete({
    where: { id: printerId },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function createProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !name) return;

  await prisma.productionCenter.create({
    data: {
      restaurantId,
      name,
      printerId,
      position,
      active: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function updateProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productionCenterId = String(formData.get("productionCenterId"));
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !productionCenterId || !name) return;

  await prisma.productionCenter.update({
    where: { id: productionCenterId },
    data: {
      name,
      printerId,
      position,
      active,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function deleteProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  const productionCenterId = String(formData.get("productionCenterId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !productionCenterId || !confirmDelete) return;

 await prisma.productProductionCenter.deleteMany({
  where: { productionCenterId },
});

  await prisma.productionCenter.delete({
    where: { id: productionCenterId },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
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
    include: {
      printers: {
        orderBy: { name: "asc" },
      },
      productProductionCenters: {
        include: { printer: true },
        orderBy: { position: "asc" },
      },
    },
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

        <PrinterComingSoonCard />
         </section>
  </div>
</main>
  );
}

function PrinterCard({ restaurant }: { restaurant: any }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        Impressoras
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Impressoras do restaurante
      </h2>

      <form action={createPrinter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder="Ex: Epson Cozinha"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select name="type" defaultValue="KITCHEN" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="KITCHEN">Cozinha</option>
            <option value="BAR">Bar</option>
            <option value="ROOM">Sala</option>
            <option value="CASHIER">Caixa</option>
            <option value="OTHER">Outra</option>
          </select>

          <select name="method" defaultValue="BROWSER" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="BROWSER">Browser / Tablet</option>
            <option value="BLUETOOTH">Bluetooth</option>
            <option value="BRIDGE">Print Bridge</option>
            <option value="NETWORK">Rede/IP</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="ipAddress" placeholder="IP opcional" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
          <input name="port" type="number" placeholder="Porta" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
        </div>

        <p className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3 text-xs font-semibold leading-5 text-[#6B6258]">
          Browser/Tablet abre a impressão normal do dispositivo. Bluetooth serve para tablets/Android com impressora emparelhada ou app/bridge de impressão. Rede/IP usa o endereço da impressora.
        </p>

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white">
          Criar impressora
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.printers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            Ainda não tens impressoras.
          </p>
        ) : (
          restaurant.printers.map((printer: any) => (
            <details key={printer.id} className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#16120E]">{printer.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                      {printer.type} · {printer.method}
                      {printer.ipAddress ? ` · ${printer.ipAddress}:${printer.port || ""}` : ""}
                    </p>
                  </div>

                  <ChannelBadge label={printer.active ? "Ativa" : "Inativa"} active={printer.active} />
                </div>
              </summary>

              <form action={updatePrinter} className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <input name="name" defaultValue={printer.name} className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="type" defaultValue={printer.type} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="KITCHEN">Cozinha</option>
                    <option value="BAR">Bar</option>
                    <option value="ROOM">Sala</option>
                    <option value="CASHIER">Caixa</option>
                    <option value="OTHER">Outra</option>
                  </select>

                  <select name="method" defaultValue={printer.method} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="BROWSER">Browser / Tablet</option>
                    <option value="BLUETOOTH">Bluetooth</option>
                    <option value="BRIDGE">Print Bridge</option>
                    <option value="NETWORK">Rede/IP</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="ipAddress" defaultValue={printer.ipAddress || ""} placeholder="IP" className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                  <input name="port" type="number" defaultValue={printer.port || ""} placeholder="Porta" className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                </div>

                <p className="rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-xs font-semibold leading-5 text-[#6B6258]">
                  Para Bluetooth, emparelha a impressora no tablet/Android e usa a impressão do dispositivo ou uma app/bridge compatível. IP/porta só é necessário em Rede/IP.
                </p>

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>Ativa</span>
                  <input name="active" type="checkbox" defaultChecked={printer.active} className="h-4 w-4 accent-[#16120E]" />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  Guardar impressora
                </button>
              </form>

              <form action={deletePrinter} className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                  <input name="confirmDelete" type="checkbox" className="h-4 w-4 accent-red-400" />
                  Confirmo apagar impressora
                </label>

                <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                  Apagar
                </button>
              </form>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function ProductionCenterCard({ restaurant }: { restaurant: any }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        Produção
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Centros de produção
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B6258]">
        Cria zonas como Cozinha, Bar, Sala 1 ou Cozinha 2. Depois associas cada
        produto a uma destas zonas.
      </p>

      <form action={createProductionCenter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder="Ex: Cozinha, Bar, Sala 1"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

       <select
  name="printerId"
  defaultValue=""
  className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">Sem impressora</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

        <input
          name="position"
          type="number"
          placeholder="Ordem"
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          Criar produção
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.productProductionCenters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            Ainda não tens centros de produção.
          </p>
        ) : (
          restaurant.productProductionCenters.map((center: any) => (
            <details
              key={center.id}
              className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#16120E]">
                      {center.name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#6B6258]">
                      Impressora: {center.printer?.name || "Não definida"} · Ordem{" "}
                      {center.position}
                    </p>
                  </div>

                  <ChannelBadge
                    label={center.active ? "Ativa" : "Inativa"}
                    active={center.active}
                  />
                </div>
              </summary>

              <form
                action={updateProductionCenter}
                className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4"
              >
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input
                  type="hidden"
                  name="productionCenterId"
                  value={center.id}
                />

                <input
                  name="name"
                  defaultValue={center.name}
                  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
                />

                <select
  name="printerId"
  defaultValue={center.printerId || ""}
  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">Sem impressora</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

                <input
                  name="position"
                  type="number"
                  defaultValue={center.position}
                  className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E] outline-none focus:border-[#C8A56A]"
                />

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>Ativa</span>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={center.active}
                    className="h-4 w-4 accent-[#16120E]"
                  />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  Guardar produção
                </button>
              </form>

              <details className="mt-3">
                <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase text-[#A14E36]">
                  Eliminar produção
                </summary>

                <form
                  action={deleteProductionCenter}
                  className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3"
                >
                  <input
                    type="hidden"
                    name="restaurantId"
                    value={restaurant.id}
                  />
                  <input
                    type="hidden"
                    name="productionCenterId"
                    value={center.id}
                  />

                  <p className="text-xs font-bold text-[#A14E36]">
                    Os produtos associados ficam sem produção.
                  </p>

                  <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                    <input
                      name="confirmDelete"
                      type="checkbox"
                      className="h-4 w-4 accent-red-400"
                    />
                    Confirmo que quero apagar
                  </label>

                  <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                    Apagar
                  </button>
                </form>
              </details>
            </details>
          ))
        )}
      </div>
    </div>
  );
}


function ChannelBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#3F6A4D]"
          : "rounded-full border border-red-300/20 bg-[#FFF0EA] px-2 py-0.5 text-[9px] font-semibold uppercase text-[#A14E36]"
      }
    >
      {label}
    </span>
  );
}


function PrinterComingSoonCard() {
  return (
    <section className="mt-6 rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            Impressoras
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
            Impressoras Coming Soon
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6258]">
            A configuração de impressoras e centros de produção ainda está em
            desenvolvimento. Vamos disponibilizar esta área quando a impressão
            estiver pronta para uso real em restaurantes.
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#E1C48C] bg-[#FFF4DF] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          Em breve
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ComingSoonFeature title="Cozinha" text="Tickets enviados para a impressora da cozinha." />
        <ComingSoonFeature title="Bar" text="Bebidas e pedidos separados por centro de produção." />
        <ComingSoonFeature title="Sala" text="Impressão para sala, balcão ou caixa." />
        <ComingSoonFeature title="Bluetooth" text="Preparado para tablet/app bridge Bluetooth." />
        <ComingSoonFeature title="Rede/IP" text="Impressoras por endereço IP e porta." />
        <ComingSoonFeature title="Print Bridge" text="Serviço local para impressão automática." />
      </div>

      <div className="mt-6 rounded-[24px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
        <p className="text-sm font-semibold text-[#16120E]">
          Nota importante
        </p>

        <p className="mt-2 text-sm leading-6 text-[#6B6258]">
          Enquanto esta funcionalidade não estiver finalizada, a impressão por
          produção, Bluetooth e bridge não deve ser considerada pronta para
          operação diária.
        </p>
      </div>
    </section>
  );
}

function ComingSoonFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
      <p className="text-lg font-semibold tracking-[-0.04em] text-[#16120E]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p>
    </div>
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
