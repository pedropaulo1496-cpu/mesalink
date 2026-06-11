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

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-full border border-cyan-300/25 bg-white/5 px-5 py-2 font-black text-cyan-200 backdrop-blur hover:bg-white/10"
            >
              Entrar
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-7xl">
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

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/25 bg-[#06111f]/90 p-6 shadow-[0_0_100px_rgba(34,211,238,0.18)] backdrop-blur-2xl sm:p-8">
              <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
              <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-500/20 blur-[90px]" />

              <div className="relative">
                <Badge>Disponível agora</Badge>

                <div className="mt-6 flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <h2 className="text-4xl font-black tracking-[-0.04em]">
                      Starter
                    </h2>

                    <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                      Para restaurantes que querem trocar chamadas, mensagens e
                      papel por uma experiência de reservas moderna.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-cyan-300/15 bg-black/25 p-5 xl:text-right">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                      Mensal
                    </p>

                    <div className="mt-2">
                      <span className="text-6xl font-black tracking-[-0.06em] text-cyan-300">
                        17,50€
                      </span>
                      <span className="ml-2 text-sm text-slate-400">
                        + IVA
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-400">
                      Por restaurante · Sem comissões
                    </p>

                    <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4 text-sm text-violet-100">
                      <strong className="text-white">
                        Anual: 192,50€ + IVA
                      </strong>
                      <br />
                      Pague 11 meses e use 12.
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <HeroStat value="0%" label="comissões" />
                  <HeroStat value="24h" label="online" />
                  <HeroStat value="10min" label="setup" />
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Página pública de reservas",
                    "Link para Google Maps, Instagram e website",
                    "QR Code de reservas incluído",
                    "Dashboard do restaurante",
                    "Calendário mensal",
                    "Serviço do dia",
                    "Gestão de clientes",
                    "Gestão de mesas",
                    "Horários de funcionamento",
                    "Aprovação manual de grupos grandes",
                    "Modo por mesas ou por capacidade",
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

                <div className="mt-8 grid gap-3">
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

            <div className="grid gap-6">
              <ComingSoonCard
                title="Pro"
                price="22,50€ + IVA / mês"
                description="Automatizações para restaurantes que querem reduzir trabalho manual."
                features={[
                  "Emails automáticos",
                  "Lembretes de reserva",
                  "Lista de espera",
                  "Estatísticas avançadas",
                  "Exportação de clientes",
                ]}
              />

              <ComingSoonCard
                title="QR Ordering"
                price="+15€ + IVA / mês"
                description="Pedidos diretamente pela mesa, sem esperar pelo empregado."
                features={[
                  "QR por mesa",
                  "Menu digital",
                  "Pedidos pelo telemóvel",
                  "Chamada de empregado",
                  "Gestão de pedidos",
                ]}
              />
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_100px_rgba(96,165,250,0.45)]">
            <h2 className="text-[38px] font-black leading-[0.9] tracking-[-0.06em] sm:text-5xl">
              Um sistema simples para transformar visitas em reservas.
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
      <p className="text-2xl font-black text-cyan-300">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ComingSoonCard({
  title,
  price,
  description,
  features,
}: {
  title: string;
  price: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-violet-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
      <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-violet-500/20 blur-[70px]" />

      <div className="relative">
        <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200">
          Em breve
        </span>

        <h3 className="mt-5 text-3xl font-black tracking-[-0.04em]">
          {title}
        </h3>

        <p className="mt-2 font-black text-cyan-300">{price}</p>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          {description}
        </p>

        <ul className="mt-6 space-y-3 text-sm text-slate-300">
          {features.map((feature) => (
            <li key={feature} className="flex gap-3">
              <span className="text-violet-300">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}