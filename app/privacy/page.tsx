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
        <span className="text-cyan-300">info@mesalink.pt</span>
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
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Voltar
        </Link>

        <h1 className="mt-10 text-5xl font-black tracking-[-0.06em]">
          {title}
        </h1>

        <p className="mt-4 text-sm text-slate-500">
          Última atualização: 2026
        </p>

        <div className="mt-10 space-y-8 rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 text-slate-300 backdrop-blur-2xl sm:p-8">
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
      <h2 className="text-2xl font-black tracking-[-0.03em] text-cyan-300">
        {title}
      </h2>
      <p className="mt-3 leading-relaxed text-slate-400">{children}</p>
    </section>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}