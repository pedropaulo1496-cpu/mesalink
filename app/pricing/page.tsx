import Footer from "@/components/Footer";
import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(240,195,106,0.22),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

        <div className="relative mx-auto max-w-7xl px-8 py-8">
          <nav className="mb-24 flex items-center justify-between">
            <Link href="/" className="text-3xl font-black">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </Link>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-[#d6c7ad] hover:text-white">
                Início
              </Link>

              <Link href="/login" className="text-[#d6c7ad] hover:text-white">
                Entrar
              </Link>

              <Link
                href="/register?plan=starter"
                className="rounded-full bg-[#f0c36a] px-6 py-3 font-bold text-black hover:bg-[#ffd982]"
              >
                Começar agora
              </Link>
            </div>
          </nav>

          <div className="mx-auto mb-16 max-w-4xl text-center">
            <div className="mb-6 inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#f0c36a]">
              Preço de lançamento
            </div>

            <h1 className="mb-6 text-6xl font-black leading-tight tracking-tight">
              Um plano simples para receber reservas online.
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#d6c7ad]">
              Tudo o que um restaurante precisa para aceitar reservas pelo
              Google Maps, Instagram, website e QR Code — sem comissões por reserva.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="relative rounded-[2.5rem] border border-[#f0c36a] bg-[#15100b] p-8 shadow-2xl shadow-[#f0c36a]/10">
              <div className="absolute -top-4 left-8 rounded-full bg-[#f0c36a] px-4 py-1 text-sm font-bold text-black">
                Disponível agora
              </div>

              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
                <div>
                  <h2 className="text-4xl font-black">Starter</h2>

                  <p className="mt-3 max-w-xl text-[#a99a82]">
                    Para restaurantes que querem trocar chamadas, mensagens e
                    papel por um sistema simples de reservas online.
                  </p>
                </div>

                <div className="md:text-right">
                  <div>
                    <span className="text-6xl font-black text-[#f0c36a]">
                      17,50€
                    </span>
                    <span className="ml-2 text-[#d6c7ad]">
                      + IVA / mês
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
  <p className="text-sm text-[#a99a82]">
    Por restaurante · Sem comissões
  </p>

  <div className="inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-sm font-bold text-[#f0c36a]">
    Pagamento anual: 1 mensalidade grátis
  </div>

  <p className="text-sm text-[#d6c7ad]">
    Anual: <strong className="text-[#f0c36a]">192,50€ + IVA / ano</strong> · pague 11 meses e use 12.
  </p>
</div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    className="flex gap-3 rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-4 text-[#d6c7ad]"
                  >
                    <span className="text-[#f0c36a]">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
  <CheckoutButton />

  <Link
    href="/contact"
    className="mt-3 flex h-14 items-center justify-center rounded-full border border-[#f0c36a]/20 bg-white/5 px-8 text-base font-bold text-white hover:border-[#f0c36a]"
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

          <div className="mt-16 rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8 text-center">
            <h2 className="text-3xl font-black">
              Sem comissões. Sem complicação. Sem papel.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-[#a99a82]">
              O MesaLink foi criado para restaurantes que querem transformar
              visitas no Google em reservas confirmadas, mantendo controlo total
              da operação.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
    <div className="rounded-[2rem] border border-[#f0c36a]/15 bg-[#0e0a07] p-7">
      <div className="mb-4 inline-flex rounded-full border border-[#f0c36a]/20 bg-[#f0c36a]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f0c36a]">
        Em breve
      </div>

      <h3 className="text-3xl font-black">{title}</h3>

      <p className="mt-2 font-bold text-[#f0c36a]">{price}</p>

      <p className="mt-4 text-[#a99a82]">{description}</p>

      <ul className="mt-6 space-y-3 text-sm text-[#d6c7ad]">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="text-[#f0c36a]">•</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrustItem({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-[#f0c36a]/10 bg-black/20 p-6">
      <p className="text-4xl font-black text-[#f0c36a]">{value}</p>
      <p className="mt-2 text-sm text-[#a99a82]">{label}</p>
    </div>
  );
}