import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

type BillingSuccessPageProps = {
  searchParams?: Promise<{
    product?: string;
    billing?: string;
  }>;
};

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const t = await getTranslations("dashboardBilling.success");

  const params = searchParams ? await searchParams : {};
  const product = String(params?.product || "").toUpperCase();
  const billing = String(params?.billing || "").toUpperCase();

  const planName = product === "GROWTH" ? "Growth" : "Essentials";
  const billingLabel = billing === "YEARLY" ? t("billingCycle.yearly") : t("billingCycle.monthly");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5EFE6] text-[#16120E]">
      <Background />

      <div className="fixed right-4 top-4 z-30">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-14 text-center sm:px-8">
        <div className="w-full overflow-hidden rounded-[42px] border border-[#D8C5A5] bg-white p-7 shadow-[0_30px_110px_rgba(80,55,30,0.12)] sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#B7D7B8] bg-[#ECF7EC] text-4xl text-[#3F6A4D]">
            ✓
          </div>

          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
            {t("kicker")}
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
            {t("title", { plan: planName })}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6B6258]">
            {t("subtitle")}
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <SuccessStat value={planName} label={t("stats.plan")} />
            <SuccessStat value={billingLabel} label={t("stats.cycle")} />
            <SuccessStat value="0€" label={t("stats.commissions")} />
          </div>

          <div className="mt-8 grid gap-5 text-left md:grid-cols-2">
            <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
              <h2 className="font-semibold text-[#16120E]">
                {t("available.title")}
              </h2>

              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#6B6258]">
                <li>✓ {t("available.items.reservations")}</li>
                <li>✓ {t("available.items.website")}</li>
                <li>✓ {t("available.items.qrOrdering")}</li>
                <li>✓ {t("available.items.crm")}</li>
                <li>✓ {t("available.items.googleReviews")}</li>
                {planName === "Growth" && <li>✓ {t("available.items.marketingGrowth")}</li>}
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
              <h2 className="font-semibold text-[#16120E]">
                {t("nextSteps.title")}
              </h2>

              <ol className="mt-4 space-y-2 text-sm leading-6 text-[#6B6258]">
                <li>1. {t("nextSteps.items.reviewHours")}</li>
                <li>2. {t("nextSteps.items.confirmTables")}</li>
                <li>3. {t("nextSteps.items.publishWebsite")}</li>
                <li>4. {t("nextSteps.items.shareLink")}</li>
                <li>5. {t("nextSteps.items.trackResults")}</li>
              </ol>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] px-8 font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function SuccessStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em] text-[#16120E]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D8C5A5]/35 blur-[130px]" />
      <div className="absolute right-[-180px] top-[260px] h-[420px] w-[420px] rounded-full bg-[#C8A56A]/18 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,197,165,0.22),transparent_34%)]" />
    </div>
  );
}
