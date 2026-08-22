import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { assertRestaurantOwner } from "@/lib/restaurant-auth";
import ApplyMondayButton from "./ApplyMondayButton";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import RestaurantPushNotifications from "@/components/RestaurantPushNotifications";
import AccountDeletionButton from "@/components/AccountDeletionButton";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const inputClass =
  "h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

async function getOwnedPrinterId(restaurantId: string, printerId: string | null) {
  if (!printerId) return null;
  const printer = await prisma.restaurantPrinter.findFirst({
    where: { id: printerId, restaurantId },
    select: { id: true },
  });
  return printer?.id ?? null;
}

async function updateSettings(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  await assertRestaurantOwner(restaurantId);

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
  await assertRestaurantOwner(restaurantId);
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
  await assertRestaurantOwner(restaurantId);
  const printerId = String(formData.get("printerId"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "KITCHEN");
  const method = String(formData.get("method") || "BROWSER");
  const ipAddress = String(formData.get("ipAddress") || "").trim();
  const portValue = String(formData.get("port") || "").trim();
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !printerId || !name) return;

  await prisma.restaurantPrinter.updateMany({
    where: { id: printerId, restaurantId },
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
  await assertRestaurantOwner(restaurantId);
  const printerId = String(formData.get("printerId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !printerId || !confirmDelete) return;

  await prisma.productionCenter.updateMany({
    where: { printerId, restaurantId },
    data: { printerId: null },
  });

  await prisma.restaurantPrinter.deleteMany({
    where: { id: printerId, restaurantId },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function createProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  await assertRestaurantOwner(restaurantId);
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);

  if (!restaurantId || !name) return;

  const ownedPrinterId = await getOwnedPrinterId(restaurantId, printerId);

  await prisma.productionCenter.create({
    data: {
      restaurantId,
      name,
      printerId: ownedPrinterId,
      position,
      active: true,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function updateProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  await assertRestaurantOwner(restaurantId);
  const productionCenterId = String(formData.get("productionCenterId"));
  const name = String(formData.get("name") || "").trim();
  const printerId = String(formData.get("printerId") || "") || null;
  const position = Number(formData.get("position") || 0);
  const active = String(formData.get("active")) === "on";

  if (!restaurantId || !productionCenterId || !name) return;

  const ownedPrinterId = await getOwnedPrinterId(restaurantId, printerId);

  await prisma.productionCenter.updateMany({
    where: { id: productionCenterId, restaurantId },
    data: {
      name,
      printerId: ownedPrinterId,
      position,
      active,
    },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}

async function deleteProductionCenter(formData: FormData) {
  "use server";

  const restaurantId = String(formData.get("restaurantId"));
  await assertRestaurantOwner(restaurantId);
  const productionCenterId = String(formData.get("productionCenterId"));
  const confirmDelete = String(formData.get("confirmDelete") || "") === "on";

  if (!restaurantId || !productionCenterId || !confirmDelete) return;

  const ownedCenter = await prisma.productionCenter.findFirst({
    where: { id: productionCenterId, restaurantId },
    select: { id: true },
  });
  if (!ownedCenter) return;

 await prisma.productProductionCenter.deleteMany({
  where: { productionCenterId: ownedCenter.id },
});

  await prisma.productionCenter.deleteMany({
    where: { id: ownedCenter.id, restaurantId },
  });

  revalidatePath(`/restaurants/${restaurantId}/settings`);
}


const weekdays = [
  { key: "monday" },
  { key: "tuesday" },
  { key: "wednesday" },
  { key: "thursday" },
  { key: "friday" },
  { key: "saturday" },
  { key: "sunday" },
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
  const t = await getTranslations("dashboardSettings.general");

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
        {t("notFound")}
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
  active="settings"
/>

    <section className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
      {t("header.eyebrow")}
    </p>

    <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">
      {t("header.title")}
    </h1>

    <p className="mt-3 text-[#6B6258]">
      {restaurant.name}
    </p>
  </div>

  <div className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#9B6F3B]">
    {t("header.badge")}
  </div>
</header>

        <RestaurantPushNotifications variant="settings" />

        <form id="settings-form" action={updateSettings} className="space-y-6">
          <input type="hidden" name="restaurantId" value={restaurant.id} />

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                {t("reservations.eyebrow")}
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                {t("reservations.title")}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#6B6258]">
                {t("reservations.description")}
              </p>

              <div className="mt-6 space-y-5">
                {canUseAdvancedReservations ? (
                  <>
                    <Field label={t("reservations.modeLabel")}>
                      <select
                        name="reservationMode"
                        defaultValue={restaurant.reservationMode}
                        className={inputClass}
                      >
                        <option value="TABLES">{t("reservations.modeTables")}</option>
                        <option value="CAPACITY">{t("reservations.modeCapacity")}</option>
                      </select>
                    </Field>

                    <Field label={t("reservations.totalCapacityLabel")}>
                      <input
                        type="number"
                        name="totalCapacity"
                        defaultValue={restaurant.totalCapacity ?? ""}
                        placeholder={t("reservations.totalCapacityPlaceholder")}
                        className={inputClass}
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        {t("reservations.totalCapacityHintAdvanced")}
                      </p>
                    </Field>

                    <Field label={t("reservations.manualApprovalLabel")}>
                      <input
                        type="number"
                        name="manualApprovalGuests"
                        defaultValue={restaurant.manualApprovalGuests ?? ""}
                        placeholder={t("reservations.manualApprovalPlaceholder")}
                        className={inputClass}
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        {t("reservations.manualApprovalHint")}
                      </p>
                    </Field>

                    <ToggleBox
                      name="approvalOnTableMerge"
                      defaultChecked={restaurant.approvalOnTableMerge}
                      title={t("reservations.tableMergeTitle")}
                      text={t("reservations.tableMergeText")}
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="hidden"
                      name="reservationMode"
                      value="CAPACITY"
                    />

                    <Field label={t("reservations.totalCapacityLabel")}>
                      <input
                        type="number"
                        name="totalCapacity"
                        defaultValue={restaurant.totalCapacity ?? ""}
                        placeholder={t("reservations.totalCapacityPlaceholder")}
                        className={inputClass}
                        required
                      />

                      <p className="mt-2 text-xs text-[#9B8F82]">
                        {t("reservations.totalCapacityHintBasic")}
                      </p>
                    </Field>

                    <div className="rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                        {t("reservations.proBadge")}
                      </p>

                      <h3 className="mt-3 text-xl font-semibold">
                        {t("reservations.proTitle")}
                      </h3>

                      <ul className="mt-4 space-y-2 text-sm text-[#6B6258]">
                        <li>✓ {t("reservations.proFeatures.map")}</li>
                        <li>✓ {t("reservations.proFeatures.byTable")}</li>
                        <li>✓ {t("reservations.proFeatures.merge")}</li>
                        <li>✓ {t("reservations.proFeatures.unlimited")}</li>
                      </ul>

                      <Link
                        href="/billing?feature=tables"
                        className="mt-5 inline-flex rounded-full bg-[#16120E] px-5 py-3 font-semibold text-white transition hover:bg-[#2A2118]"
                      >
                        {t("reservations.upgradeButton")}
                      </Link>
                    </div>
                  </>
                )}

                <ToggleBox
                  name="onlineReservationsEnabled"
                  defaultChecked={restaurant.onlineReservationsEnabled}
                  title={t("reservations.onlineTitle")}
                  text={t("reservations.onlineText")}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    {t("hours.eyebrow")}
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
                    {t("hours.title")}
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

                        {t(`hours.days.${day.key}`)}
                      </label>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9B8F82]">
                          {t("hours.lunch")}
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
                          {t("hours.dinner")}
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
    {t("reviews.eyebrow")}
  </p>

  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
    {t("reviews.title")}
  </h2>

  <p className="mt-2 text-sm leading-relaxed text-[#6B6258]">
    {t("reviews.description")}
  </p>

  <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_220px]">
    <Field label={t("reviews.urlLabel")}>
      <input
        name="googleReviewUrl"
        defaultValue={restaurant.googleReviewUrl ?? ""}
        placeholder="https://search.google.com/local/writereview?placeid=..."
        className={inputClass}
      />

      <p className="mt-2 text-xs text-[#9B8F82]">
        {t("reviews.urlHint")}
      </p>
    </Field>

    <Field label={t("reviews.thresholdLabel")}>
      <select
        name="reviewRedirectThreshold"
        defaultValue={restaurant.reviewRedirectThreshold ?? 4}
        className={inputClass}
      >
        <option value={5}>{t("reviews.threshold5")}</option>
        <option value={4}>{t("reviews.threshold4")}</option>
        <option value={3}>{t("reviews.threshold3")}</option>
      </select>
    </Field>
  </div>
</section>
          <div className="sticky bottom-6 z-20 flex justify-end">
            <button className="rounded-full bg-[#16120E] px-8 py-4 font-semibold text-white shadow-[0_18px_55px_rgba(80,55,30,0.18)] transition hover:bg-[#2A2118]">
              {t("saveButton")}
            </button>
          </div>
        </form>
        <div className="mt-6"><AccountDeletionButton accountLabel="MesaLink Restaurante" /></div>
         </section>
  </div>

  <BottomNav id={id} />
</main>
  );
}

function PrinterCard({ restaurant, t }: { restaurant: any; t: Translator }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("printers.eyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("printers.title")}
      </h2>

      <form action={createPrinter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder={t("printers.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <select name="type" defaultValue="KITCHEN" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="KITCHEN">{t("printers.typeKitchen")}</option>
            <option value="BAR">{t("printers.typeBar")}</option>
            <option value="ROOM">{t("printers.typeRoom")}</option>
            <option value="CASHIER">{t("printers.typeCashier")}</option>
            <option value="OTHER">{t("printers.typeOther")}</option>
          </select>

          <select name="method" defaultValue="BROWSER" className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]">
            <option value="BROWSER">{t("printers.methodBrowser")}</option>
            <option value="BLUETOOTH">{t("printers.methodBluetooth")}</option>
            <option value="BRIDGE">{t("printers.methodBridge")}</option>
            <option value="NETWORK">{t("printers.methodNetwork")}</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input name="ipAddress" placeholder={t("printers.ipPlaceholder")} className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
          <input name="port" type="number" placeholder={t("printers.portPlaceholder")} className="h-12 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E]" />
        </div>

        <p className="rounded-2xl border border-[#E8DCCB] bg-[#FFF9F0] px-4 py-3 text-xs font-semibold leading-5 text-[#6B6258]">
          {t("printers.methodHint")}
        </p>

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white">
          {t("printers.createButton")}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.printers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            {t("printers.emptyState")}
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

                  <ChannelBadge label={printer.active ? t("printers.statusActive") : t("printers.statusInactive")} active={printer.active} />
                </div>
              </summary>

              <form action={updatePrinter} className="mt-4 space-y-3 border-t border-[#E8DCCB] pt-4">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <input name="name" defaultValue={printer.name} className="h-11 w-full rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select name="type" defaultValue={printer.type} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="KITCHEN">{t("printers.typeKitchen")}</option>
                    <option value="BAR">{t("printers.typeBar")}</option>
                    <option value="ROOM">{t("printers.typeRoom")}</option>
                    <option value="CASHIER">{t("printers.typeCashier")}</option>
                    <option value="OTHER">{t("printers.typeOther")}</option>
                  </select>

                  <select name="method" defaultValue={printer.method} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]">
                    <option value="BROWSER">{t("printers.methodBrowser")}</option>
                    <option value="BLUETOOTH">{t("printers.methodBluetooth")}</option>
                    <option value="BRIDGE">{t("printers.methodBridge")}</option>
                    <option value="NETWORK">{t("printers.methodNetwork")}</option>
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="ipAddress" defaultValue={printer.ipAddress || ""} placeholder={t("printers.editIpPlaceholder")} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                  <input name="port" type="number" defaultValue={printer.port || ""} placeholder={t("printers.editPortPlaceholder")} className="h-11 rounded-2xl border border-[#E1D0B8] bg-white px-4 text-sm font-bold text-[#16120E]" />
                </div>

                <p className="rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-xs font-semibold leading-5 text-[#6B6258]">
                  {t("printers.editMethodHint")}
                </p>

                <label className="flex items-center justify-between rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3 text-sm font-bold text-[#6B6258]">
                  <span>{t("printers.activeLabel")}</span>
                  <input name="active" type="checkbox" defaultChecked={printer.active} className="h-4 w-4 accent-[#16120E]" />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  {t("printers.saveButton")}
                </button>
              </form>

              <form action={deletePrinter} className="mt-3 rounded-2xl border border-red-300/20 bg-[#FFF0EA] p-3">
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="printerId" value={printer.id} />

                <label className="flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                  <input name="confirmDelete" type="checkbox" className="h-4 w-4 accent-red-400" />
                  {t("printers.confirmDeleteLabel")}
                </label>

                <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                  {t("printers.deleteButton")}
                </button>
              </form>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function ProductionCenterCard({ restaurant, t }: { restaurant: any; t: Translator }) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
        {t("productionCenters.eyebrow")}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        {t("productionCenters.title")}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B6258]">
        {t("productionCenters.description")}
      </p>

      <form action={createProductionCenter} className="mt-5 space-y-3">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <input
          name="name"
          placeholder={t("productionCenters.namePlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

       <select
  name="printerId"
  defaultValue=""
  className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-bold text-[#16120E]"
>
  <option value="">{t("productionCenters.noPrinterOption")}</option>
  {restaurant.printers.map((printer: any) => (
    <option key={printer.id} value={printer.id}>
      {printer.name} · {printer.method}
    </option>
  ))}
</select>

        <input
          name="position"
          type="number"
          placeholder={t("productionCenters.positionPlaceholder")}
          className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
        />

        <button className="h-12 w-full rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:opacity-90">
          {t("productionCenters.createButton")}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {restaurant.productProductionCenters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#E8DCCB] bg-[#FFF9F0] p-4 text-sm text-[#6B6258]">
            {t("productionCenters.emptyState")}
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
                      {t("productionCenters.printerLabel")}: {center.printer?.name || t("productionCenters.printerNotSet")} · {t("productionCenters.orderLabel")}{" "}
                      {center.position}
                    </p>
                  </div>

                  <ChannelBadge
                    label={center.active ? t("productionCenters.statusActive") : t("productionCenters.statusInactive")}
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
  <option value="">{t("productionCenters.noPrinterOption")}</option>
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
                  <span>{t("productionCenters.activeLabel")}</span>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={center.active}
                    className="h-4 w-4 accent-[#16120E]"
                  />
                </label>

                <button className="h-10 w-full rounded-full bg-[#16120E] text-xs font-semibold text-white">
                  {t("productionCenters.saveButton")}
                </button>
              </form>

              <details className="mt-3">
                <summary className="inline-flex cursor-pointer list-none rounded-full border border-red-300/20 bg-[#FFF0EA] px-4 py-2 text-xs font-semibold uppercase text-[#A14E36]">
                  {t("productionCenters.deleteToggleLabel")}
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
                    {t("productionCenters.deleteWarning")}
                  </p>

                  <label className="mt-3 flex items-center gap-2 text-xs font-bold text-[#A14E36]">
                    <input
                      name="confirmDelete"
                      type="checkbox"
                      className="h-4 w-4 accent-red-400"
                    />
                    {t("productionCenters.confirmDeleteLabel")}
                  </label>

                  <button className="mt-3 h-9 rounded-full border border-red-300/30 bg-red-400/20 px-4 text-xs font-semibold uppercase text-[#A14E36]">
                    {t("productionCenters.deleteButton")}
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


function PrinterComingSoonCard({ t }: { t: Translator }) {
  return (
    <section className="mt-6 rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.045)] lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
            {t("printersComingSoon.eyebrow")}
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
            {t("printersComingSoon.title")}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6258]">
            {t("printersComingSoon.description")}
          </p>
        </div>

        <span className="w-fit rounded-full border border-[#E1C48C] bg-[#FFF4DF] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          {t("printersComingSoon.badge")}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ComingSoonFeature title={t("printersComingSoon.features.kitchen.title")} text={t("printersComingSoon.features.kitchen.text")} />
        <ComingSoonFeature title={t("printersComingSoon.features.bar.title")} text={t("printersComingSoon.features.bar.text")} />
        <ComingSoonFeature title={t("printersComingSoon.features.room.title")} text={t("printersComingSoon.features.room.text")} />
        <ComingSoonFeature title={t("printersComingSoon.features.bluetooth.title")} text={t("printersComingSoon.features.bluetooth.text")} />
        <ComingSoonFeature title={t("printersComingSoon.features.network.title")} text={t("printersComingSoon.features.network.text")} />
        <ComingSoonFeature title={t("printersComingSoon.features.bridge.title")} text={t("printersComingSoon.features.bridge.text")} />
      </div>

      <div className="mt-6 rounded-[24px] border border-[#E8DCCB] bg-[#FFF9F0] p-5">
        <p className="text-sm font-semibold text-[#16120E]">
          {t("printersComingSoon.noteTitle")}
        </p>

        <p className="mt-2 text-sm leading-6 text-[#6B6258]">
          {t("printersComingSoon.noteText")}
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
