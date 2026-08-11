import type { Metadata } from "next";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade e tratamento de dados da plataforma MesaLink.",
  alternates: { canonical: "https://www.mesalink.pt/privacy" },
};

export default async function PrivacyPage() {
  const t = await getTranslations("staticPages.privacy");

  return (
    <LegalPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      lastUpdated={t("lastUpdated", { year: 2026 })}
      backLink={t("backLink")}
    >
      <LegalSection title={t("sections.dataCollected.title")}>
        {t("sections.dataCollected.text")}
      </LegalSection>

      <LegalSection title={t("sections.purpose.title")}>
        {t("sections.purpose.text")}
      </LegalSection>

      <LegalSection title={t("sections.customerData.title")}>
        {t("sections.customerData.text")}
      </LegalSection>

      <LegalSection title={t("sections.dataSharing.title")}>
        {t("sections.dataSharing.text")}
      </LegalSection>

      <LegalSection title={t("sections.partnerNetwork.title")}>
        {t("sections.partnerNetwork.text")}
      </LegalSection>

      <LegalSection title={t("sections.rights.title")}>
        {t("sections.rights.text")}
        <br />
        <span className="font-semibold text-[#9B6F3B]">info@mesalink.pt</span>
      </LegalSection>

      <LegalSection title={t("sections.security.title")}>
        {t("sections.security.text")}
      </LegalSection>
    </LegalPage>
  );
}

function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  backLink,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  backLink: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]"
        >
          {backLink}
        </Link>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
          {title}
        </h1>

        <p className="mt-4 text-sm text-[#9B8F82]">{lastUpdated}</p>

        <div className="mt-10 space-y-8 rounded-[32px] border border-[#E1D0B8] bg-white p-6 text-[#6B6258] shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
          {children}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">
        {title}
      </h2>

      <p className="mt-3 leading-relaxed text-[#6B6258]">{children}</p>
    </section>
  );
}
