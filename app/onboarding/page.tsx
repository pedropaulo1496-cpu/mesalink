import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createRestaurant } from "./actions";
import PhoneField from "@/components/PhoneField";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; partnerRestaurantInvite?: string }>;
}) {
  const query = searchParams ? await searchParams : {};
  const t = await getTranslations("onboarding");

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-[#E1D0B8] pb-6">
          <Link href="/" className="text-2xl font-semibold tracking-[-0.04em]">
            Mesa<span className="text-[#9B6F3B]">Link</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[#D8C5A5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B] shadow-[0_12px_35px_rgba(80,55,30,0.045)] sm:inline-flex">
              {t("badge")}
            </span>
            <LanguageSwitcher />
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <SectionLabel>{t("aside.label")}</SectionLabel>

            <h1 className="mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.065em]">
              {t("aside.title")}
            </h1>

            <p className="mt-5 text-sm leading-6 text-[#6B6258]">
              {t("aside.description")}
            </p>

            <div className="mt-8 grid gap-3">
              <Step number="01" text={t("aside.steps.step1")} />
              <Step number="02" text={t("aside.steps.step2")} />
              <Step number="03" text={t("aside.steps.step3")} />
            </div>

            <div className="mt-8 rounded-2xl border border-[#D8C5A5] bg-[#FFF9F0] p-5">
              <p className="text-sm font-semibold text-[#16120E]">
                {t("aside.trial.title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                {t("aside.trial.text")}
              </p>
            </div>
          </aside>

          <section className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <SectionLabel>{t("form.label")}</SectionLabel>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">
              {t("form.title")}
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              {t("form.description")}
            </p>

            <form action={createRestaurant} className="mt-8 space-y-4">
              {query.partnerRestaurantInvite && <input type="hidden" name="partnerRestaurantInvite" value={query.partnerRestaurantInvite} />}
              {query.error === "email" && (
                <div className="rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] px-4 py-3 text-sm font-semibold text-[#A14E36]">
                  {t("form.errorEmail")}
                </div>
              )}
              {query.error === "invite" && <div className="rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] px-4 py-3 text-sm font-semibold text-[#A14E36]">O convite do parceiro expirou ou já foi utilizado. Pede um novo convite e tenta novamente.</div>}

              <input
                name="name"
                required
                placeholder={t("form.namePlaceholder")}
                className="input-premium h-14"
              />

              <input
                name="email"
                type="email"
                placeholder={t("form.emailPlaceholder")}
                className="input-premium h-14"
              />

              <PhoneField name="phone" placeholder={t("form.phonePlaceholder")} />

              <input
                name="address"
                placeholder={t("form.addressPlaceholder")}
                className="input-premium h-14"
              />

              <button
                type="submit"
                className="mt-4 h-14 w-full rounded-full bg-[#16120E] px-5 font-semibold text-white shadow-[0_18px_45px_rgba(80,55,30,0.12)] transition hover:bg-[#2A2118]"
              >
                {t("form.submit")}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-[#6B6258]">
              {t("form.footnote")}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="text-xs font-semibold text-[#9B6F3B]">{number}</p>
      <p className="mt-2 font-semibold text-[#16120E]">{text}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9B6F3B]">
      {children}
    </p>
  );
}
