import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Eliminação de conta | MesaLink",
  description: "Como pedir a eliminação da conta MesaLink e dos dados associados.",
  alternates: { canonical: "https://www.mesalink.pt/account-deletion" },
};

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <Link href="/" className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]">
          ← Voltar
        </Link>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">Privacidade</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Eliminar a conta MesaLink</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B6258]">
          Esta página aplica-se às apps MesaLink Restaurante, MesaLink Partners e MesaLink HQ e explica como pedir a eliminação da conta e dos dados associados.
        </p>

        <div className="mt-10 space-y-8 rounded-[32px] border border-[#E1D0B8] bg-white p-6 text-[#6B6258] shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">Como pedir a eliminação</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
              <li>Abra <strong>Definições</strong> na aplicação e escolha <strong>Eliminar conta</strong>.</li>
              <li>Leia o aviso e confirme expressamente que tem a certeza.</li>
              <li>Em alternativa, envie um email a partir do endereço associado à conta para <a className="font-semibold text-[#9B6F3B] underline" href="mailto:info@mesalink.pt?subject=Eliminar%20conta%20MesaLink">info@mesalink.pt</a>.</li>
            </ol>
            <p className="mt-3 leading-relaxed">O pedido é concluído no prazo máximo de 30 dias e é confirmado por email.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">Dados eliminados</h2>
            <p className="mt-3 leading-relaxed">São eliminados ou anonimizados os dados do perfil e credenciais de acesso, configurações do restaurante, mensagens de suporte, ficheiros carregados e dados operacionais, incluindo reservas e contactos de clientes, quando já não exista uma obrigação legítima de retenção.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">Dados que podem ser conservados</h2>
            <p className="mt-3 leading-relaxed">Faturas, registos fiscais, transações e elementos necessários para cumprir obrigações legais, resolver litígios, prevenir fraude ou demonstrar segurança podem ser conservados apenas durante o período exigido pela legislação aplicável. Cópias residuais em backups protegidos são removidas através do ciclo normal de retenção, até 90 dias.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">Eliminar apenas alguns dados</h2>
            <p className="mt-3 leading-relaxed">Também pode pedir a correção ou eliminação de dados específicos sem eliminar a conta. Envie o pedido para <a className="font-semibold text-[#9B6F3B] underline" href="mailto:info@mesalink.pt?subject=Pedido%20de%20dados%20MesaLink">info@mesalink.pt</a> e identifique os dados em causa.</p>
          </section>

          <section lang="en">
            <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#16120E]">English summary</h2>
            <p className="mt-3 leading-relaxed">To delete your MesaLink account and associated data, open Settings in the app, choose Delete account and explicitly confirm the request. You may also email <strong>info@mesalink.pt</strong> from the address linked to your account. Requests are completed within 30 days. Legally required billing, tax, fraud-prevention and dispute records may be retained for the applicable statutory period; protected backup copies are removed within 90 days.</p>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}
