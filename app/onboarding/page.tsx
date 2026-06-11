import Link from "next/link";
import { createRestaurant } from "./actions";

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="mb-12 flex items-center justify-between border-b border-cyan-300/10 pb-8">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <span className="hidden rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 sm:inline-flex">
            Setup inicial
          </span>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Onboarding
            </p>

            <h1 className="mt-4 text-5xl font-black leading-[0.9] tracking-[-0.06em]">
              Configure o seu restaurante.
            </h1>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Preencha os dados principais para criar o painel, gerar a página
              pública de reservas e começar a receber pedidos online.
            </p>

            <div className="mt-8 grid gap-3">
              <Step number="01" text="Criar restaurante" />
              <Step number="02" text="Definir horários" />
              <Step number="03" text="Partilhar link ou QR Code" />
            </div>
          </aside>

          <section className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Dados do restaurante
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              Criar restaurante
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Estes dados aparecem no painel e ajudam a identificar o restaurante.
            </p>

            <form action={createRestaurant} className="mt-8 space-y-4">
              <input
                name="name"
                required
                placeholder="Nome do restaurante"
                className="input-ai h-14"
              />

              <input
                name="email"
                type="email"
                placeholder="Email do restaurante"
                className="input-ai h-14"
              />

              <input
                name="phone"
                placeholder="Telefone"
                className="input-ai h-14"
              />

              <input
                name="address"
                placeholder="Morada"
                className="input-ai h-14"
              />

              <button
                type="submit"
                className="mt-4 h-14 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] transition hover:opacity-90"
              >
                Criar restaurante →
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-black text-cyan-300">{number}</p>
      <p className="mt-2 font-bold text-white">{text}</p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}