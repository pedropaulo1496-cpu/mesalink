import Footer from "@/components/Footer";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-5 pb-16 pt-5">
        <nav className="mx-auto mb-14 flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/25 bg-white/5 px-5 py-2 text-sm font-black text-cyan-200 backdrop-blur hover:bg-white/10"
          >
            Entrar
          </Link>
        </nav>

        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <Badge>Preço de lançamento</Badge>

            <h1 className="mt-5 text-[48px] font-black leading-[0.9] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
              Reservas online,{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
                sem comissões.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-300">
              Transforme Google Maps, Instagram, website e QR Code num sistema
              inteligente de reservas para restaurantes.
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[40px] border border-cyan-300/25 bg-[#06111f]/90 p-6 shadow-[0_0_100px_rgba(34,211,238,0.18)] backdrop-blur-2xl sm:p-8 lg:p-10">
              <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
              <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-500/20 blur-[90px]" />

              <div className="relative">

                <div className="text-center">
                  <Badge>Plano Starter</Badge>

                  <h2 className="mt-5 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                    Tudo para começar.
                  </h2>

                  <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
                    Para restaurantes que querem trocar chamadas, mensagens e
                    papel por uma experiência moderna de reservas online.
                  </p>

                  <div className="mt-8">
                    <span className="text-7xl font-black tracking-[-0.08em] text-cyan-300 sm:text-8xl">
                      17,50€
                    </span>

                    <p className="mt-3 text-sm font-bold text-slate-400">
                      + IVA / mês · Por restaurante · Sem comissões
                    </p>

                    <div className="mx-auto mt-5 max-w-md rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4 text-sm text-violet-100">
                      <strong className="text-white">
                        Anual: 192,50€ + IVA / ano
                      </strong>
                      <br />
                      Pague 11 meses e use 12.
                    </div>
                  </div>
                </div>

                <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3">
                  <HeroStat value="0%" label="comissões" />
                  <HeroStat value="24h" label="online" />
                  <HeroStat value="10min" label="setup" />
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    "Página pública de reservas",
                    "Link para Google Maps",
                    "Link para Instagram",
                    "QR Code incluído",
                    "Dashboard do restaurante",
                    "Calendário mensal",
                    "Serviço do dia",
                    "Gestão de clientes",
                    "Gestão de mesas",
                    "Horários de funcionamento",
                    "Aprovação manual",
                    "Sem comissão por reserva",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300"
                    >
                      <span className="text-cyan-300">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mx-auto mt-10 grid max-w-xl gap-3">
                  <CheckoutButton />

                  <Link
                    href="/contact"
                    className="flex h-14 items-center justify-center rounded-full border border-cyan-300/25 bg-white/5 text-base font-black text-white backdrop-blur hover:bg-white/10"
                  >
                    Falar connosco →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <section className="mx-auto mt-10 max-w-5xl">
            <div className="grid gap-4 md:grid-cols-2">
              <RoadmapCard
                title="Pro"
                text="Automatizações, lembretes, lista de espera e estatísticas avançadas."
              />

              <RoadmapCard
                title="QR Ordering"
                text="Menu digital, QR por mesa, pedidos pelo telemóvel e chamada de empregado."
              />
            </div>
          </section>

          <section className="mx-auto mt-10 max-w-5xl rounded-[36px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl sm:p-8">
            <Badge>FAQ</Badge>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Perguntas rápidas.
            </h2>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              <FAQ question="Há comissões por reserva?" answer="Não. O MesaLink não cobra comissão por reserva." />
              <FAQ question="Posso cancelar?" answer="Sim. Pode cancelar quando quiser." />
              <FAQ question="Demora muito a configurar?" answer="Não. A configuração inicial demora cerca de 10 minutos." />
              <FAQ question="Funciona com Google Maps?" answer="Sim. Pode usar o link público no Google Maps, Instagram, website e QR Code." />
            </div>
          </section>

          <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_100px_rgba(96,165,250,0.45)] sm:p-9">
            <h2 className="text-[40px] font-black leading-[0.9] tracking-[-0.06em] sm:text-5xl">
              Comece hoje. Receba reservas amanhã.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/70">
              O MesaLink foi criado para restaurantes que querem receber mais
              reservas, organizar melhor a operação e eliminar papel.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-180px] top-[360px] h-[380px] w-[380px] rounded-full bg-violet-500/20 blur-[110px]" />
      <div className="absolute bottom-[-160px] left-[-140px] h-[360px] w-[360px] rounded-full bg-blue-500/20 blur-[100px]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.07)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(to_bottom,#020617,#050816_40%,#020617)]" />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">
      {children}
    </span>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur">
      <p className="text-2xl font-black text-cyan-300">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function RoadmapCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-violet-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200">
        Em breve
      </span>

      <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className="font-black text-white">{question}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{answer}</p>
    </div>
  );
}