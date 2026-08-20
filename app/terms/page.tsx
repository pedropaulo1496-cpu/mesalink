import type { Metadata } from "next";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description: "Termos e condições de utilização do software para restaurantes MesaLink.",
  alternates: { canonical: "https://www.mesalink.pt/terms" },
};

export default async function TermsPage() {
  const t = await getTranslations("staticPages.terms");

  return (
    <LegalPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      lastUpdated={t("lastUpdated", { year: 2026 })}
      backLink={t("backLink")}
    >
      <LegalSection title={t("sections.service.title")}>
        {t("sections.service.text")}
      </LegalSection>

      <LegalSection title={t("sections.usage.title")}>
        {t("sections.usage.text")}
      </LegalSection>

      <LegalSection title={t("sections.payments.title")}>
        {t("sections.payments.text")}
      </LegalSection>

      <LegalSection title={t("sections.partnerNetwork.title")}>
        {t("sections.partnerNetwork.text")}
      </LegalSection>

      <LegalSection title="Catálogo aberto de restaurantes">
        A pesquisa de restaurantes na aplicação Partners utiliza a Geoapify e dados do OpenStreetMap. Fotografias, horários, descrições ou classificações adicionais podem ter origem no site oficial publicamente associado ao estabelecimento. Quando não existe uma fotografia oficial, o MesaLink pode apresentar uma imagem de rua captada nas proximidades através da KartaView, identificada como “Vista da rua”; esta imagem representa a zona e pode não mostrar o interior, a fachada atual ou o próprio restaurante. A origem da classificação é identificada sempre que disponível e não deve ser interpretada como uma avaliação própria do MesaLink. A utilização está sujeita aos <a href="https://www.geoapify.com/terms-and-conditions/" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">Termos da Geoapify</a>, à <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">licença OpenStreetMap</a> e aos <a href="https://kartaview.org/terms" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">Termos da KartaView (CC BY-SA 4.0)</a>. Um restaurante apresentado no catálogo só fica reservado depois de confirmação imediata pela rede MesaLink ou de aceitação expressa do pedido pelo próprio restaurante.
      </LegalSection>

      <LegalSection title={t("sections.cancellation.title")}>
        {t("sections.cancellation.text")}
      </LegalSection>

      <LegalSection title={t("sections.liability.title")}>
        {t("sections.liability.text")}
      </LegalSection>

      <LegalSection title={t("sections.contact.title")}>
        {t("sections.contact.text")}
        <br />
        <span className="font-semibold text-[#9B6F3B]">info@mesalink.pt</span>
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
