import Footer from "@/components/Footer";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050711] text-white">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              Mesa<span className="text-cyan-300">Link</span>
            </Link>

            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="hidden text-white/55 hover:text-white sm:block">
                Início
              </Link>

              <Link href="/login" className="text-white/55 hover:text-white">
                Entrar
              </Link>

              <Link
                href="/register?plan=starter"
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 font-semibold text-black"
              >
                Começar
              </Link>
            </div>
          </nav>

          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-cyan-300">
              Preço de lançamento
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Reservas online, sem comissões.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Tudo o que um restaurante precisa para receber reservas pelo
              Google Maps, Instagram, website e QR Code.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-cyan-400/25 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:p-8">
              <div className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-cyan-300">
                Disponível agora
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Starter
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                    Para restaurantes que querem trocar chamadas, mensagens e
                    papel por uma página simples de reservas online.
                  </p>
                </div>

                <div className="lg:text-right">
                  <div>
                    <span className="text-5xl font-semibold tracking-tight text-cyan-300">
                      17,50€
                    </span>
                    <span className="ml-2 text-sm text-white/45">
                      + IVA / mês
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-white/45">
                    Por restaurante · Sem comissões
                  </p>

                  <div className="mt-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm text-violet-200">
                    Anual:{" "}
                    <strong className="text-white">
                      192,50€ + IVA / ano
                    </strong>
                    <br />
                    Pague 11 meses e use 12.
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65"
                  >
                    <span className="text-cyan-300">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-3">
                <CheckoutButton />

                <Link
                  href="/contact"
                  className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Falar connosco
                </Link>
              </div>
            </div>

            <div className="space-y-6">
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

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Simples. Sem papel. Sem comissões.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/50">
              O MesaLink transforma visitas no Google, Instagram e website em
              reservas organizadas no dashboard do restaurante.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TrustItem value="0%" label="Comissões por reserva" />
              <TrustItem value="24h" label="Reservas online" />
              <TrustItem value="10 min" label="Configuração inicial" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
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
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl sm:p-7">
      <div className="mb-4 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-violet-300">
        Em breve
      </div>

      <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>

      <p className="mt-2 text-sm font-medium text-cyan-300">{price}</p>

      <p className="mt-4 text-sm leading-6 text-white/50">{description}</p>

      <ul className="mt-6 space-y-3 text-sm text-white/60">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="text-violet-300">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrustItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <p className="text-3xl font-semibold tracking-tight text-cyan-300">
        {value}
      </p>
      <p className="mt-2 text-sm text-white/45">{label}</p>
    </div>
  );
}