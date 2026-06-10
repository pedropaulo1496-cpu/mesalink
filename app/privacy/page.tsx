import Footer from "@/components/Footer";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="mx-auto max-w-4xl px-8 py-16">
        <Link href="/" className="text-[#a99a82] hover:text-white">
          ← Voltar
        </Link>

        <h1 className="mt-10 text-5xl font-black">
          Política de Privacidade
        </h1>

        <p className="mt-4 text-[#a99a82]">
          Última atualização: 2026
        </p>

        <div className="mt-10 space-y-8 rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 text-[#d6c7ad]">
          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              1. Dados recolhidos
            </h2>
            <p className="mt-3">
              Podemos recolher dados como nome, email, telefone, informações do restaurante,
              reservas criadas, horários, clientes e dados necessários à utilização da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              2. Finalidade
            </h2>
            <p className="mt-3">
              Os dados são usados para fornecer o serviço MesaLink, processar reservas,
              gerir contas, comunicar com utilizadores e melhorar a plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              3. Dados dos clientes dos restaurantes
            </h2>
            <p className="mt-3">
              Os dados dos clientes finais são usados apenas para gerir reservas e comunicações
              relacionadas com essas reservas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              4. Partilha de dados
            </h2>
            <p className="mt-3">
              Não vendemos dados pessoais. Poderemos usar serviços terceiros necessários para
              alojamento, pagamentos, autenticação, email ou suporte técnico.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              5. Direitos
            </h2>
            <p className="mt-3">
              Pode solicitar acesso, correção ou eliminação dos seus dados através do email:
              <br />
              <span className="text-[#f0c36a]">info@mesalink.pt</span>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              6. Segurança
            </h2>
            <p className="mt-3">
              Aplicamos medidas técnicas e organizativas para proteger os dados tratados na
              plataforma.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}