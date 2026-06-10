import Footer from "@/components/Footer";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="mx-auto max-w-4xl px-8 py-16">
        <Link href="/" className="text-[#a99a82] hover:text-white">
          ← Voltar
        </Link>

        <h1 className="mt-10 text-5xl font-black">
          Termos e Condições
        </h1>

        <p className="mt-4 text-[#a99a82]">
          Última atualização: 2026
        </p>

        <div className="mt-10 space-y-8 rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 text-[#d6c7ad]">
          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              1. Serviço
            </h2>
            <p className="mt-3">
              O MesaLink é uma plataforma online para gestão de reservas em restaurantes,
              incluindo página pública de reservas, calendário, clientes, QR Code e ferramentas
              de operação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              2. Utilização
            </h2>
            <p className="mt-3">
              O utilizador compromete-se a fornecer informação verdadeira e a utilizar a
              plataforma apenas para fins legais e relacionados com a gestão do seu restaurante.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              3. Pagamentos
            </h2>
            <p className="mt-3">
              Os planos pagos são cobrados mensalmente ou anualmente, conforme selecionado.
              Os preços apresentados não incluem IVA, salvo indicação em contrário.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              4. Cancelamento
            </h2>
            <p className="mt-3">
              O cliente pode cancelar a subscrição. O acesso ao serviço poderá manter-se até ao
              final do período já pago.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              5. Responsabilidade
            </h2>
            <p className="mt-3">
              O MesaLink não se responsabiliza por informações incorretas introduzidas pelo
              restaurante, falhas externas de internet, serviços terceiros ou utilização indevida
              da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#f0c36a]">
              6. Contacto
            </h2>
            <p className="mt-3">
              Para questões relacionadas com estes termos, contacte:
              <br />
              <span className="text-[#f0c36a]">info@mesalink.pt</span>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}