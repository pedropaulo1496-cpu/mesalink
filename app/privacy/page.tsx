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

      <LegalSection title="Pesquisa no catálogo aberto de restaurantes">
        Na aplicação MesaLink Partners, utilizamos a Geoapify e dados do OpenStreetMap para apresentar restaurantes relevantes. A pesquisa, a zona indicada e, apenas quando autorizada pelo utilizador, a localização aproximada podem ser transmitidas à Geoapify para devolver resultados. Para enriquecer o mini-perfil e confirmar que existe um email público utilizável para o pedido de reserva, podemos consultar informação pública do site oficial associado ao restaurante. Quando não existe uma fotografia oficial, as coordenadas públicas do estabelecimento podem ser consultadas na KartaView para obter uma imagem de rua próxima, sempre identificada como tal; sem cobertura, pode ser usada uma imagem genérica identificada como ilustrativa. O MesaLink conserva os identificadores dos locais, contactos e elementos públicos em cache, bem como os dados necessários para gerir pedidos de reserva. Aplicam-se também a <a href="https://www.geoapify.com/privacy-policy/" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">Política de Privacidade da Geoapify</a>, a <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">Política de Privacidade do OpenStreetMap</a> e a <a href="https://kartaview.org/privacy-policy" target="_blank" rel="noreferrer" className="font-semibold text-[#9B6F3B] underline">Política de Privacidade da KartaView</a>.
      </LegalSection>

      <LegalSection title="Candidaturas comerciais / Sales partner applications">
        Os dados fornecidos numa candidatura, incluindo CV, contacto, experiência, mercados, idiomas e respostas profissionais, são usados para avaliar uma possível parceria comercial. O MesaLink pode atribuir uma pontuação explicável baseada apenas em critérios relevantes para a função, para ordenar a revisão; nenhuma candidatura é recusada automaticamente e a decisão final é humana. Não usamos idade, género, nacionalidade, fotografia, estado civil, deficiência ou outros dados sensíveis para esta avaliação. O candidato pode pedir acesso, correção ou eliminação através de info@mesalink.pt.
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
