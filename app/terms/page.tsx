import Footer from "@/components/Footer";
import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalPage title="Termos e Condições">
      <LegalSection title="1. Serviço">
        O MesaLink é uma plataforma online para gestão de reservas em
        restaurantes, incluindo página pública de reservas, calendário,
        clientes, QR Code e ferramentas de operação.
      </LegalSection>

      <LegalSection title="2. Utilização">
        O utilizador compromete-se a fornecer informação verdadeira e a utilizar
        a plataforma apenas para fins legais e relacionados com a gestão do seu
        restaurante.
      </LegalSection>

      <LegalSection title="3. Pagamentos">
        Os planos pagos são cobrados mensalmente ou anualmente, conforme
        selecionado. Os preços apresentados não incluem IVA, salvo indicação em
        contrário.
      </LegalSection>

      <LegalSection title="4. Cancelamento">
        O cliente pode cancelar a subscrição. O acesso ao serviço poderá
        manter-se até ao final do período já pago.
      </LegalSection>

      <LegalSection title="5. Responsabilidade">
        O MesaLink não se responsabiliza por informações incorretas introduzidas
        pelo restaurante, falhas externas de internet, serviços terceiros ou
        utilização indevida da plataforma.
      </LegalSection>

      <LegalSection title="6. Contacto">
        Para questões relacionadas com estes termos, contacte:
        <br />
        <span className="font-semibold text-[#9B6F3B]">info@mesalink.pt</span>
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