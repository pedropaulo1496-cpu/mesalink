import Link from "next/link";
import { createRestaurant } from "./actions";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-[#E1D0B8] pb-6">
          <Link href="/" className="text-2xl font-semibold tracking-[-0.04em]">
            Mesa<span className="text-[#9B6F3B]">Link</span>
          </Link>

          <span className="hidden rounded-full border border-[#D8C5A5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B] shadow-[0_12px_35px_rgba(80,55,30,0.045)] sm:inline-flex">
            7 dias grátis
          </span>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <SectionLabel>Onboarding</SectionLabel>

            <h1 className="mt-4 text-5xl font-semibold leading-[0.9] tracking-[-0.065em]">
              Configure o seu restaurante.
            </h1>

            <p className="mt-5 text-sm leading-6 text-[#6B6258]">
              Crie o painel inicial para começar a receber reservas, gerir
              clientes, publicar o website e preparar o crescimento com CRM,
              Marketing, QR Ordering e POS.
            </p>

            <div className="mt-8 grid gap-3">
              <Step number="01" text="Criar restaurante" />
              <Step number="02" text="Configurar horários e mesas" />
              <Step number="03" text="Ativar reservas, website e QR" />
            </div>

            <div className="mt-8 rounded-2xl border border-[#D8C5A5] bg-[#FFF9F0] p-5">
              <p className="text-sm font-semibold text-[#16120E]">
                Trial completo incluído
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">
                Durante 7 dias pode explorar a MesaLink sem compromisso.
              </p>
            </div>
          </aside>

          <section className="rounded-[32px] border border-[#E1D0B8] bg-white p-7 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <SectionLabel>Dados do restaurante</SectionLabel>

            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.055em]">
              Criar restaurante
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              Estes dados aparecem no painel, no website e na página pública de
              reservas. Pode alterar tudo mais tarde.
            </p>

            <form action={createRestaurant} className="mt-8 space-y-4">
              <input
                name="name"
                required
                placeholder="Nome do restaurante"
                className="input-premium h-14"
              />

              <input
                name="email"
                type="email"
                placeholder="Email do restaurante"
                className="input-premium h-14"
              />

              <input
                name="phone"
                placeholder="Telefone"
                className="input-premium h-14"
              />

              <input
                name="address"
                placeholder="Morada"
                className="input-premium h-14"
              />

              <button
                type="submit"
                className="mt-4 h-14 w-full rounded-full bg-[#16120E] px-5 font-semibold text-white shadow-[0_18px_45px_rgba(80,55,30,0.12)] transition hover:bg-[#2A2118]"
              >
                Criar restaurante →
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-[#6B6258]">
              A faturação fiscal é tratada externamente pelo Moloni ou por outro
              software certificado. A MesaLink liga reservas, website, QR
              Ordering, clientes, marketing e operação.
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