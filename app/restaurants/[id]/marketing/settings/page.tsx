import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function MarketingSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const t = await getTranslations("dashboardMarketing.settings");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  async function saveGrowthSettings(formData: FormData) {
    "use server";

    await prisma.restaurant.update({
      where: { id },
      data: {
        averageTicket: Number(formData.get("averageTicket")) || 25,
        googleReviewUrl: String(formData.get("googleReviewUrl") || "") || null,
        reviewRedirectThreshold:
          Number(formData.get("reviewRedirectThreshold")) || 4,
        birthdayOffer: String(formData.get("birthdayOffer") || "") || null,
        recoveryOffer: String(formData.get("recoveryOffer") || "") || null,
        vipOffer: String(formData.get("vipOffer") || "") || null,
        bronzeVipOffer: String(formData.get("bronzeVipOffer") || "") || null,
        silverVipOffer: String(formData.get("silverVipOffer") || "") || null,
        goldVipOffer: String(formData.get("goldVipOffer") || "") || null,
        platinumVipOffer:
          String(formData.get("platinumVipOffer") || "") || null,
      },
    });

    redirect(`/restaurants/${id}/marketing?saved=1`);
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar
          id={id}
          restaurantName={restaurant.name}
          active="marketing"
        />

        <section className="px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-7">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9B6F3B]">
                {t("eyebrow")}
              </p>

              <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
                {t("title")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">
                {t("subtitle")}
              </p>
            </div>

            <Link
              href={`/restaurants/${id}/marketing`}
              className="rounded-full border border-[#E1D0B8] bg-white px-5 py-3 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
            >
              {t("backToGrowth")}
            </Link>
          </header>

          <form action={saveGrowthSettings} className="mt-8 max-w-5xl space-y-6">
            <section className="rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]">
              <SectionLabel>{t("sections.revenue.eyebrow")}</SectionLabel>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
                {t("sections.revenue.title")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                {t("sections.revenue.description")}
              </p>

              <div className="mt-6 max-w-xs">
                <label className="mb-2 block text-sm font-semibold text-[#6B6258]">
                  {t("sections.revenue.fieldLabel")}
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="averageTicket"
                  defaultValue={restaurant.averageTicket ?? 25}
                  className={inputClass}
                />
              </div>
            </section>

            <section className="rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]">
              <SectionLabel>{t("sections.reviews.eyebrow")}</SectionLabel>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
                {t("sections.reviews.title")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                {t("sections.reviews.description")}
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_240px]">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
                    {t("sections.reviews.urlLabel")}
                  </span>

                  <input
                    name="googleReviewUrl"
                    defaultValue={restaurant.googleReviewUrl ?? ""}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
                    {t("sections.reviews.thresholdLabel")}
                  </span>

                  <select
                    name="reviewRedirectThreshold"
                    defaultValue={restaurant.reviewRedirectThreshold ?? 4}
                    className={inputClass}
                  >
                    <option value="3">{t("sections.reviews.stars", { count: 3 })}</option>
                    <option value="4">{t("sections.reviews.stars", { count: 4 })}</option>
                    <option value="5">{t("sections.reviews.stars", { count: 5 })}</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]">
              <SectionLabel>{t("sections.offers.eyebrow")}</SectionLabel>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
                {t("sections.offers.title")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                {t("sections.offers.description")}
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <OfferField
                  label={t("sections.offers.birthday.label")}
                  name="birthdayOffer"
                  defaultValue={restaurant.birthdayOffer ?? ""}
                  placeholder={t("sections.offers.birthday.placeholder")}
                />

                <OfferField
                  label={t("sections.offers.recovery.label")}
                  name="recoveryOffer"
                  defaultValue={restaurant.recoveryOffer ?? ""}
                  placeholder={t("sections.offers.recovery.placeholder")}
                />
              </div>
            </section>

            <section className="rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.055)]">
              <SectionLabel>{t("sections.vip.eyebrow")}</SectionLabel>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
                {t("sections.vip.title")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                {t("sections.vip.description")}
              </p>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <OfferField
                  label={t("sections.vip.tiers.bronze")}
                  name="bronzeVipOffer"
                  defaultValue={restaurant.bronzeVipOffer ?? ""}
                  placeholder={t("sections.vip.placeholders.bronze")}
                />

                <OfferField
                  label={t("sections.vip.tiers.silver")}
                  name="silverVipOffer"
                  defaultValue={restaurant.silverVipOffer ?? ""}
                  placeholder={t("sections.vip.placeholders.silver")}
                />

                <OfferField
                  label={t("sections.vip.tiers.gold")}
                  name="goldVipOffer"
                  defaultValue={restaurant.goldVipOffer ?? ""}
                  placeholder={t("sections.vip.placeholders.gold")}
                />

                <OfferField
                  label={t("sections.vip.tiers.platinum")}
                  name="platinumVipOffer"
                  defaultValue={restaurant.platinumVipOffer ?? ""}
                  placeholder={t("sections.vip.placeholders.platinum")}
                />
              </div>
            </section>

            <div className="sticky bottom-6 z-20 flex justify-end">
              <button
                type="submit"
                className="rounded-full bg-[#16120E] px-7 py-4 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(22,18,14,0.22)] transition hover:bg-[#2A2118]"
              >
                {t("submit")}
              </button>
            </div>
          </form>
        </section>
      </div>

      <BottomNav id={id} />
    </main>
  );
}

const inputClass =
  "h-13 min-h-[52px] w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function OfferField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
        {label}
      </span>

      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={5}
        className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm font-semibold text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
      />
    </label>
  );
}