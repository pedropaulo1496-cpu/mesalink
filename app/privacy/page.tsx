import Footer from "@/components/Footer";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade">
      <LegalSection title="1. Dados recolhidos">
        Podemos recolher dados como nome, email, telefone, informações do
        restaurante, reservas criadas, horários, clientes e dados necessários à
        utilização da plataforma.
      </LegalSection>

      <LegalSection title="2. Finalidade">
        Os dados são usados para fornecer o serviço MesaLink, processar
        reservas, gerir contas, comunicar com utilizadores e melhorar a
        plataforma.
      </LegalSection>

      <LegalSection title="3. Dados dos clientes dos restaurantes">
        Os dados dos clientes finais são usados apenas para gerir reservas e
        comunicações relacionadas com essas reservas.
      </LegalSection>

      <LegalSection title="4. Partilha de dados">
        Não vendemos dados pessoais. Poderemos usar serviços terceiros
        necessários para alojamento, pagamentos, autenticação, email ou suporte
        técnico.
      </LegalSection>

      <LegalSection title="5. Direitos">
        Pode solicitar acesso, correção ou eliminação dos seus dados através do
        email:
        <br />
        <span className="font-semibold text-[#9B6F3B]">info@mesalink.pt</span>
      </LegalSection>

      <LegalSection title="6. Segurança">
        Aplicamos medidas técnicas e organizativas para proteger os dados
        tratados na plataforma.
      </LegalSection>
    </LegalPage>
  );
}

function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]"
        >
          ← Voltar
        </Link>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
          Legal
        </p>

        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.065em]">
          {title}
        </h1>

        <p className="mt-4 text-sm text-[#9B8F82]">
          Última atualização: 2026
        </p>

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