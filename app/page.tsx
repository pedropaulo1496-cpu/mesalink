"use client";

import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

const brand = {
  mesa: "#C8A56A",
  link: "#17130F",
};

const productStack = [
  "Reservas online",
  "Mapa de mesas",
  "POS / Moloni",
  "QR Ordering",
  "Website premium",
  "CRM de clientes",
  "Marketing",
  "Google Reviews",
  "VIP & Fidelização",
  "Relatórios",
  "IA",
  "Restaurant Network",
];

const essentials = [
  {
    title: "QR Ordering",
    value: "Menos pressão",
    text: "Clientes pedem diretamente da mesa. Menos deslocações da equipa, menos erros e serviço mais rápido.",
  },
  {
    title: "Marketing",
    value: "Clientes a voltar",
    text: "Recupere clientes inativos, promova dias fracos e aumente visitas recorrentes com campanhas simples.",
  },
  {
    title: "Reservas diretas",
    value: "0€ comissões",
    text: "Receba reservas pelo Google, Instagram, website e bio sem pagar por cada cliente que entra.",
  },
  {
    title: "Website + SEO",
    value: "Mais procura",
    text: "Página premium, rápida, mobile-first e preparada para transformar pesquisas em reservas.",
  },
  {
    title: "POS / Moloni",
    value: "Tudo ligado",
    text: "Pedidos, pagamentos, mesas, clientes e marketing deixam de estar espalhados em sistemas separados.",
  },
  {
    title: "Restaurant Network",
    value: "Próxima fase",
    text: "Um ecossistema em evolução para responder a novas necessidades de operação e crescimento.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4ECDF] text-[#17130F]">
      <Header />

      <Hero />

      <GrowthLoop />

      <ProductShowcase />

      <RestaurantEssentials />


      <UpcomingEssentialsNote />

      <PricingSection />

      <FinalCTA />

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#DECDB4] bg-[#F4ECDF]/86 px-5 py-5 backdrop-blur-xl lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-[-0.045em]">
          <span style={{ color: brand.mesa }}>Mesa</span>
          <span style={{ color: brand.link }}>Link</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-[#5C5348] lg:flex">
          <Link href="#growth">Crescimento</Link>
          <Link href="#platform">Plataforma</Link>
          <Link href="#pricing">Preços</Link>
          <Link href="/login">Entrar</Link>
        </div>

        <Link
          href="/register"
          className="rounded-full bg-[#17130F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
        >
          Começar
        </Link>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative px-5 pb-20 pt-14 lg:px-8 lg:pb-28 lg:pt-20">
      <MoneyBackground />

      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72 }}
        >
          <Label>Restaurant Essentials by MesaLink</Label>

          <h1 className="mt-6 max-w-4xl text-[52px] font-semibold leading-[0.87] tracking-[-0.08em] sm:text-7xl lg:text-[96px]">
            Everything your restaurant needs.
            <span className="block text-[#C8A56A]">One platform.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5C5348] lg:text-xl">
            Reservas, QR Ordering, Website, CRM e Marketing — ligados para
            aumentar receita, recuperar clientes e reduzir trabalho manual.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-14 rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_24px_70px_rgba(80,55,30,0.24)] hover:bg-[#2A2118]"
            >
              <Link href="/register">Começar teste gratuito</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-[#B9965E] bg-[#FFF9F0] px-8 text-base font-semibold text-[#17130F] hover:bg-white"
            >
              <Link href="/contact">Pedir demonstração</Link>
            </Button>
          </div>

          <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
            <HeroMiniStat value="+€1.240" label="impacto estimado/mês" />
            <HeroMiniStat value="31%" label="clientes a voltar" />
            <HeroMiniStat value="0€" label="comissões reservas" />
          </div>
        </motion.div>

        <HeroCommandCenter />
      </div>
    </section>
  );
}

function HeroCommandCenter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 34, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.82, delay: 0.1, ease: "easeOut" }}
      className="relative"
    >
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[46px] border border-[#D6BE94] bg-[#FFF8ED] p-3 shadow-[0_45px_150px_rgba(71,47,24,0.24)]"
      >
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#C8A56A]/20 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-[#2A2118]/10 blur-3xl" />

        <div className="relative overflow-hidden rounded-[38px] border border-[#E8D7BB] bg-[#FBF4EA]">
          <div className="flex items-center justify-between border-b border-[#E8D7BB] bg-white/60 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                Dashboard MesaLink
              </p>
              <h3 className="mt-1 text-3xl font-semibold tracking-[-0.06em]">
                Performance em tempo real
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#17130F] px-4 py-2 text-xs font-semibold text-white">
                c/ IVA
              </span>
              <span className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-xs font-semibold text-[#6B6258]">
                Live
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[30px] border border-[#E5D6C1] bg-white p-5 shadow-[0_18px_60px_rgba(80,55,30,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                    Faturação
                  </p>
                  <h4 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
                    €19.564 este mês
                  </h4>
                  <p className="mt-2 text-sm text-[#6B6258]">
                    QR Ordering, marketing e reservas diretas ligados no mesmo painel.
                  </p>
                </div>

                <span className="rounded-full bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]">
                  +18%
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <DashboardHeroStat value="€3.840" label="Hoje" />
                <DashboardHeroStat value="48" label="Reservas" />
                <DashboardHeroStat value="€920" label="Recuperado" />
              </div>

              <div className="mt-5 rounded-[28px] bg-[#FFF9F0] p-4">
                <svg viewBox="0 0 520 170" className="h-48 w-full overflow-visible">
                  <defs>
                    <linearGradient id="heroDashFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#C8A56A" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#C8A56A" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {[28, 62, 96, 130].map((y) => (
                    <line key={y} x1="0" x2="520" y1={y} y2={y} stroke="#E8D7BB" strokeWidth="1" />
                  ))}

                  <path
                    d="M0 138 C36 126 48 94 78 92 C112 88 112 66 150 62 C190 56 198 82 238 74 C280 66 292 42 330 48 C372 54 382 78 420 52 C462 22 492 30 520 16"
                    fill="none"
                    stroke="#C8A56A"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 170 L0 138 C36 126 48 94 78 92 C112 88 112 66 150 62 C190 56 198 82 238 74 C280 66 292 42 330 48 C372 54 382 78 420 52 C462 22 492 30 520 16 L520 170 Z"
                    fill="url(#heroDashFill)"
                  />
                  <circle cx="520" cy="16" r="7" fill="#17130F" />
                </svg>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-[#E5D6C1] bg-white p-5 shadow-[0_18px_60px_rgba(80,55,30,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
                      Sala
                    </p>
                    <h4 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                      Ocupação agora
                    </h4>
                  </div>
                  <strong className="text-sm text-[#9B6F3B]">74%</strong>
                </div>

                <div className="mt-4 rounded-[24px] bg-[#FFF9F0] p-4">
                  <div className="grid grid-cols-4 gap-3">
                    {["1", "2", "3", "4", "5", "6", "7", "8"].map((table, index) => (
                      <div
                        key={table}
                        className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold ${
                          index === 0 || index === 5
                            ? "border-[#17130F] bg-[#17130F] text-white"
                            : index === 3
                              ? "border-[#C8A56A] bg-[#FFF0CF]"
                              : "border-[#E5D6C1] bg-white"
                        }`}
                      >
                        {table}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[26px] border border-[#E5D6C1] bg-[#17130F] p-5 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D8C5A5]">
                    QR Ordering
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                    26
                  </p>
                  <p className="mt-1 text-sm text-white/62">pedidos hoje</p>
                </div>

                <div className="rounded-[26px] border border-[#E5D6C1] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
                    Marketing
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
                    4.6x
                  </p>
                  <p className="mt-1 text-sm text-[#6B6258]">ROI growth</p>
                </div>
              </div>

              <div className="rounded-[30px] border border-[#E5D6C1] bg-[#FFF9F0] p-5">
                {[
                  ["Cliente recuperado", "+€68"],
                  ["Pedido QR", "Mesa 7"],
                  ["Reserva direta", "0€ comissão"],
                ].map(([label, value]) => (
                  <Row key={label} label={label} value={value} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DashboardHeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E5D6C1] bg-[#FFF9F0] p-4">
      <p className="text-2xl font-semibold tracking-[-0.055em]">{value}</p>
      <p className="mt-1 text-xs text-[#6B6258]">{label}</p>
    </div>
  );
}

function GrowthLoop() {
  const steps = [
    ["Descoberta", "Google, redes sociais, website"],
    ["Reserva", "Direta e sem comissão"],
    ["Experiência", "Mesa, QR e serviço"],
    ["Dados", "Cliente entra no CRM"],
    ["Retorno", "Marketing faz voltar"],
  ];

  return (
    <section id="growth" className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Label>Growth Engine</Label>
          <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
            Do primeiro clique à próxima visita.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C5348]">
            MesaLink liga cada etapa da experiência: descoberta, reserva,
            pedido, pagamento, CRM e campanhas para trazer o cliente de volta.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[46px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 shadow-[0_30px_110px_rgba(80,55,30,0.12)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,165,106,0.18),transparent_42%)]" />

          <div className="relative grid gap-4">
            {steps.map(([title, text], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -26 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 rounded-[30px] border border-[#E5D6C1] bg-white/90 p-4 backdrop-blur"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#17130F] text-sm font-semibold text-white">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold tracking-[-0.035em]">
                    {title}
                  </p>
                  <p className="text-sm text-[#6B6258]">{text}</p>
                </div>

                {index < steps.length - 1 && (
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2,
                    }}
                    className="hidden text-2xl text-[#C8A56A] sm:block"
                  >
                    →
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  const returns = [
    {
      value: "Growth",
      label: "Mais receita",
      text: "QR Ordering reduz espera. Marketing faz clientes voltar. Mais vendas sem aumentar a equipa.",
    },
    {
      value: "Visibility",
      label: "Mais descoberta",
      text: "Website otimizado, presença online e reviews positivas ajudam novos clientes a encontrar o restaurante.",
    },
    {
      value: "Control",
      label: "Melhor gestão",
      text: "Reservas, CRM, QR Ordering, marketing e dados integrados num único sistema para controlar melhor a operação.",
    },
    {
      value: "Future",
      label: "Sempre a evoluir",
      text: "Novas ferramentas essenciais para restaurantes serão lançadas em breve dentro do ecossistema MesaLink.",
    },
  ];

  return (
    <section className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <Label>Growth. Visibility. Control.</Label>

            <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
              Cresça com mais clientes.
              <span className="block text-[#C8A56A]">Gira com mais controlo.</span>
            </h2>
          </div>

          <p className="max-w-2xl text-lg leading-8 text-[#5C5348] lg:justify-self-end">
            Atraia mais clientes, aumente a receita e ganhe controlo total
            sobre a operação com uma plataforma criada especificamente para
            restaurantes.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[44px] border border-[#D8C5A5] bg-[#FFF9F0] p-4 shadow-[0_30px_110px_rgba(80,55,30,0.11)]">
          <div className="grid gap-4 lg:grid-cols-4">
            {returns.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`relative overflow-hidden rounded-[34px] border p-6 ${
                  index === 0
                    ? "border-[#17130F] bg-[#17130F] text-white"
                    : "border-[#E5D6C1] bg-white text-[#17130F]"
                }`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#C8A56A]/20 blur-3xl" />

                <div className="relative">
                  <p
                    className={`text-4xl font-semibold tracking-[-0.075em] ${
                      index === 0 ? "text-[#D8C5A5]" : "text-[#C8A56A]"
                    }`}
                  >
                    {item.value}
                  </p>

                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                    {item.label}
                  </h3>

                  <p
                    className={`mt-3 text-sm leading-6 ${
                      index === 0 ? "text-white/66" : "text-[#6B6258]"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <ReturnDriver
              title="QR Ordering + Marketing"
              text="Pedidos mais rápidos, menos atrito no serviço e campanhas para trazer clientes de volta."
            />
            <ReturnDriver
              title="Website + Reviews"
              text="Mais visibilidade online, mais confiança e mais reservas diretas sem depender de comissões."
            />
            <ReturnDriver
              title="Tudo integrado"
              text="Reservas, CRM, QR Ordering, website, marketing e dados ligados para gerir melhor todos os dias."
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function ReturnDriver({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[30px] border border-[#E5D6C1] bg-[#FBF4EA] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
        {title}
      </p>
      <p className="mt-3 text-base leading-7 text-[#5C5348]">{text}</p>
    </div>
  );
}

function RestaurantEssentials() {
  return (
    <section id="platform" className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <Label>Uma plataforma. Um login.</Label>

          <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
            Tudo ligado ao
            <span className="block text-[#C8A56A]">MesaLink.</span>
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C5348]">
            O cliente reserva, senta-se, pede por QR, paga, entra no CRM e
            recebe marketing automático para voltar.
          </p>
        </div>

        <ConnectedMesaLink />
      </div>
    </section>
  );
}

function ConnectedMesaLink() {
  const nodes = [
    {
      title: "Reservas",
      text: "Todos os canais",
      className: "left-[60px] top-[80px]",
      line: "M270 145 L350 270",
    },
    {
      title: "Website",
      text: "Online 24/7",
      className: "left-1/2 top-[42px] -translate-x-1/2",
      line: "M380 150 L380 250",
    },
    {
      title: "QR Ordering",
      text: "Pedidos na mesa",
      className: "right-[60px] top-[80px]",
      line: "M490 145 L410 270",
    },
    {
      title: "Marketing",
      text: "Atrair e fidelizar",
      className: "left-[72px] bottom-[80px]",
      line: "M270 498 L350 350",
    },
    {
      title: "Moloni",
      text: "Faturação externa",
      className: "right-[72px] bottom-[80px]",
      line: "M490 498 L410 350",
    },
  ];

  return (
    <div className="relative mx-auto h-[620px] w-full max-w-[760px] overflow-hidden rounded-[48px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_32px_120px_rgba(80,55,30,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(200,165,106,0.20),transparent_38%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.94),transparent_32%),radial-gradient(circle_at_82%_82%,rgba(216,197,165,0.34),transparent_34%)]" />

      <div className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C8A56A]/22" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C8A56A]/30" />

      <motion.div
        className="absolute left-[10%] top-[13%] h-40 w-40 rounded-full bg-[#C8A56A]/13 blur-[58px]"
        animate={{ scale: [1, 1.16, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[10%] top-[18%] h-40 w-40 rounded-full bg-[#C8A56A]/12 blur-[58px]"
        animate={{ scale: [1.08, 0.94, 1.08], opacity: [0.38, 0.7, 0.38] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[8%] left-[18%] h-44 w-44 rounded-full bg-[#B9965E]/11 blur-[64px]"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.68, 0.35] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[8%] right-[18%] h-44 w-44 rounded-full bg-[#B9965E]/11 blur-[64px]"
        animate={{ scale: [1.12, 0.96, 1.12], opacity: [0.34, 0.64, 0.34] }}
        transition={{ duration: 7.1, repeat: Infinity, ease: "easeInOut" }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 760 620"
        fill="none"
      >
        {nodes.map((node) => (
          <path
            key={node.title}
            d={node.line}
            stroke="#B9965E"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.58"
          />
        ))}
      </svg>

      {[...Array(14)].map((_, index) => (
        <motion.span
          key={index}
          className="absolute z-10 h-1.5 w-1.5 rounded-full bg-[#C8A56A]"
          style={{
            left: `${15 + ((index * 37) % 70)}%`,
            top: `${12 + ((index * 43) % 74)}%`,
          }}
          animate={{
            opacity: [0.16, 0.72, 0.16],
            scale: [1, 1.75, 1],
          }}
          transition={{
            duration: 2.9 + (index % 5) * 0.45,
            repeat: Infinity,
            delay: index * 0.13,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="absolute left-1/2 top-1/2 z-20 flex h-[220px] w-[310px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[48px] border border-[#C8A56A] bg-[#211912] text-white shadow-[0_0_95px_rgba(200,165,106,0.20),0_34px_100px_rgba(80,55,30,0.28)]">
        <p className="text-5xl font-semibold tracking-[-0.07em]">
          <span className="text-[#C8A56A]">Mesa</span>
          <span className="text-white">Link</span>
        </p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.34em] text-[#D8C5A5]">
          Growth Engine
        </p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.title}
          className={`absolute ${node.className} z-30 w-[190px] rounded-[28px] border border-[#D8C5A5] bg-white/92 p-5 shadow-[0_24px_75px_rgba(80,55,30,0.11)] backdrop-blur-xl`}
        >
          <p className="text-xl font-semibold tracking-[-0.045em]">
            {node.title}
          </p>
          <p className="mt-2 text-sm text-[#6B6258]">{node.text}</p>
        </div>
      ))}

      <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[#D8C5A5] bg-[#FFF9F0]/94 px-7 py-3 text-sm font-semibold text-[#17130F] shadow-[0_20px_60px_rgba(80,55,30,0.10)] backdrop-blur">
        Dados, relatórios e automações
      </div>
    </div>
  );
}

function ResultsSection() {
  const results = [
    ["Mais descoberta", "Website otimizado, SEO e reviews positivas ajudam novos clientes a encontrar o restaurante."],
    ["Mais clientes recorrentes", "Marketing e CRM ajudam a recuperar clientes que podiam não voltar."],
    ["Reservas sem comissões", "Receba reservas diretamente no restaurante sem pagar por cada cliente."],
    ["Tudo integrado", "POS, CRM, reservas, QR Ordering, website e marketing ligados num único sistema."],
  ];

  return (
    <section className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl rounded-[46px] bg-[#211912] p-8 text-white shadow-[0_35px_120px_rgba(34,26,19,0.22)] lg:p-12">
        <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#D8C5A5]">
              Growth. Visibility. Control.
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
              Crescimento integrado para restaurantes.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/65">
              Aumente receita, melhore a visibilidade online e simplifique a gestão diária com uma plataforma criada para restaurantes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map(([title, text]) => (
              <div
                key={title}
                className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6"
              >
                <h3 className="text-2xl font-semibold tracking-[-0.05em] text-[#D8C5A5]">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function UpcomingEssentialsNote() {
  return (
    <section className="px-5 pb-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 text-center shadow-[0_20px_70px_rgba(80,55,30,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9B6F3B]">
          Novos essenciais em breve
        </p>
        <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-[#6B6258]">
          Além das ferramentas atuais, a MesaLink vai continuar a lançar novos essenciais para restaurantes — sempre pensados para melhorar operação, crescimento e gestão.
        </p>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <Label>Planos MesaLink</Label>

          <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
            7 dias grátis.
            <span className="block text-[#C8A56A]">Depois escolha como crescer.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5C5348]">
            Teste todas as funcionalidades durante 7 dias. No pagamento anual,
            recebe 1 mês grátis. Valores sem IVA.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <PricingCard
            name="Essentials"
            price="79€"
            yearlyPrice="869€"
            description="Para restaurantes que querem centralizar reservas, website, QR Ordering, CRM, reviews e operação."
            features={[
              "7 dias grátis com todas as funcionalidades",
              "Reservas online sem comissões",
              "Website premium integrado",
              "QR Ordering incluído",
              "Mapa de mesas",
              "CRM de clientes",
              "Google Reviews",
              "Relatórios essenciais",
              "1 mês grátis no pagamento anual",
            ]}
            cta="Começar teste gratuito"
          />

          <PricingCard
            featured
            name="Growth"
            price="99€"
            yearlyPrice="1089€"
            description="Para restaurantes que querem recuperar clientes, promover dias fracos e aumentar visitas recorrentes."
            features={[
              "7 dias grátis com todas as funcionalidades",
              "Tudo do Essentials",
              "Tab Marketing",
              "Recuperação de clientes inativos",
              "Campanhas para dias fracos",
              "Clientes em risco",
              "Aniversários e ocasiões especiais",
              "Fidelização VIP",
              "1 mês grátis no pagamento anual",
            ]}
            cta="Começar teste gratuito"
          />
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-6 text-[#6B6258]">
          A faturação/POS fiscal é tratada externamente pelo Moloni. A MesaLink integra a operação e mantém reservas, clientes, QR Ordering e marketing ligados.
        </p>
      </div>
    </section>
  );
}


function PricingCard({
  name,
  price,
  yearlyPrice,
  description,
  features,
  cta,
  featured = false,
}: {
  name: string;
  price: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[44px] p-8 shadow-[0_35px_120px_rgba(24,21,18,0.16)] ${
        featured
          ? "bg-[#211912] text-white"
          : "border border-[#D8C5A5] bg-[#FFF9F0] text-[#17130F]"
      }`}
    >
      {featured && (
        <div className="absolute right-6 top-6 rounded-full bg-[#D8C5A5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#17130F]">
          Mais vendido
        </div>
      )}

      <p
        className={`text-sm font-semibold uppercase tracking-[0.22em] ${
          featured ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
        }`}
      >
        MesaLink {name}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-7xl font-semibold tracking-[-0.08em]">
          {price}
        </span>
        <span className={featured ? "mb-3 text-white/65" : "mb-3 text-[#6B6258]"}>
          /mês
        </span>
      </div>

      <div
        className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
          featured
            ? "border border-white/10 bg-white/[0.07] text-white/76"
            : "border border-[#D8C5A5] bg-white text-[#6B6258]"
        }`}
      >
        <strong className={featured ? "text-[#D8C5A5]" : "text-[#9B6F3B]"}>
          Anual: {yearlyPrice}/ano
        </strong>{" "}
        · 1 mês grátis
      </div>

      <p
        className={`mt-5 max-w-xl text-sm leading-6 ${
          featured ? "text-white/68" : "text-[#6B6258]"
        }`}
      >
        {description}
      </p>

      <div
        className={`mt-7 rounded-3xl p-5 ${
          featured
            ? "border border-white/10 bg-white/[0.07]"
            : "border border-[#D8C5A5] bg-white"
        }`}
      >
        <p className={featured ? "text-sm text-white/72" : "text-sm text-[#5C5348]"}>
          {featured
            ? "Ideal para transformar clientes antigos em visitas recorrentes."
            : "Ideal para organizar a operação e reduzir sistemas separados."}
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <p
            key={feature}
            className={`text-sm ${featured ? "text-white/84" : "text-[#4F463B]"}`}
          >
            ✓ {feature}
          </p>
        ))}
      </div>

      <Button
        asChild
        className={`mt-8 h-14 w-full rounded-full text-base font-semibold ${
          featured
            ? "bg-[#D8C5A5] text-[#17130F] hover:bg-[#E8D6B8]"
            : "bg-[#17130F] text-white hover:bg-[#2A2118]"
        }`}
      >
        <Link href="/register">{cta}</Link>
      </Button>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 pb-20 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[46px] bg-[#201812] p-8 text-white shadow-[0_35px_120px_rgba(34,26,19,0.24)] lg:p-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#D8C5A5]">
              MesaLink Restaurant Essentials
            </p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">
              Stop managing tools.
              <span className="block text-[#D8C5A5]">
                Start growing your restaurant.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              Dê ao cliente uma experiência melhor. Faça-o reservar, pedir,
              voltar e recomendar.
            </p>
          </div>

          <Button
            asChild
            className="h-14 rounded-full bg-[#D8C5A5] px-8 text-base font-semibold text-[#17130F] hover:bg-[#E8D6B8] lg:justify-self-end"
          >
            <Link href="/register">Começar agora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function AnimatedChart() {
  const points =
    "M0 135 C32 90 58 105 88 70 C126 25 152 56 184 48 C226 38 244 115 286 86 C326 58 346 44 380 22";

  return (
    <div className="mt-5 h-44 rounded-[24px] bg-[#FFF9F0] p-4">
      <svg viewBox="0 0 380 155" className="h-full w-full overflow-visible">
        {[30, 65, 100, 135].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="380"
            y2={y}
            stroke="#E8D7BB"
            strokeWidth="1"
          />
        ))}

        <motion.path
          d={points}
          fill="none"
          stroke="#C8A56A"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, delay: 0.3 }}
        />

        <motion.circle
          cx="380"
          cy="22"
          r="7"
          fill="#17130F"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.6 }}
        />
      </svg>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="rounded-[34px] border border-[#E5D6C1] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Dashboard
          </p>
          <h4 className="mt-2 text-3xl font-semibold tracking-[-0.06em]">
            Faturação e crescimento
          </h4>
        </div>

        <span className="rounded-full bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]">
          Online
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric value="€19.564" label="Faturação mensal" />
        <Metric value="+€920" label="Recuperado" />
        <Metric value="42" label="Clientes em risco" />
      </div>

      <AnimatedChart />

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Row label="Mais vendido" value="Bitoque" />
        <Row label="Ticket por pessoa" value="€24,70" />
        <Row label="Marketing ativo" value="87 clientes" />
        <Row label="Reservas futuras" value="32" />
      </div>
    </div>
  );
}

function FloorMock() {
  return (
    <div className="rounded-[30px] bg-[#F4ECDF] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Esplanada</p>
        <p className="text-xs font-semibold text-[#9B6F3B]">74% ocupação</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {["1", "2", "3", "4", "5", "7", "8", "9", "10", "11"].map(
          (number, index) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, scale: 0.86 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.035 }}
              viewport={{ once: true }}
              className={`flex h-14 items-center justify-center rounded-2xl border text-sm font-semibold ${
                index === 0 || index === 6
                  ? "border-[#17130F] bg-[#17130F] text-white"
                  : index === 3
                    ? "border-[#C8A56A] bg-[#FFF0CF]"
                    : "border-[#E5D6C1] bg-white"
              }`}
            >
              {number}
            </motion.div>
          ),
        )}
      </div>
    </div>
  );
}

function MarketingMock() {
  return (
    <div className="space-y-3">
      {[
        ["Clientes em risco", "42"],
        ["Campanha recomendada", "Recuperar"],
        ["Receita potencial", "+€1.260"],
      ].map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-2xl border border-[#E5D6C1] bg-white px-4 py-3"
        >
          <span className="text-sm text-[#6B6258]">{label}</span>
          <span className="font-semibold text-[#9B6F3B]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function MiniFloorPlan() {
  const tables = [
    ["1", "busy"],
    ["2", "free"],
    ["3", "free"],
    ["4", "qr"],
    ["5", "free"],
    ["7", "free"],
    ["8", "busy"],
    ["9", "free"],
  ];

  return (
    <div className="rounded-[24px] bg-[#F4ECDF] p-4">
      <div className="grid grid-cols-5 gap-3">
        {tables.map(([number, status], index) => (
          <motion.div
            key={`${number}-${index}`}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 * index }}
            className={`flex h-14 items-center justify-center rounded-2xl border text-sm font-semibold ${
              status === "busy"
                ? "border-[#17130F] bg-[#17130F] text-white"
                : status === "qr"
                  ? "border-[#C8A56A] bg-[#FFF0CF] text-[#17130F]"
                  : "border-[#E5D6C1] bg-white text-[#17130F]"
            }`}
          >
            {number}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Ecosystem() {
  const nodes = [
    ["Atrair", "Website, SEO, campanhas", "top-[8%] left-[5%]"],
    ["Reservar", "Sem comissões", "top-[2%] left-[39%]"],
    ["Pedir", "QR Ordering", "top-[8%] right-[5%]"],
    ["Operar", "POS, mesas e caixa", "bottom-[18%] left-[6%]"],
    ["Fidelizar", "CRM, VIP e reviews", "bottom-[18%] right-[6%]"],
  ];

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-[740px] overflow-hidden rounded-[52px] border border-[#D6BE94] bg-[#FFF8ED] p-7 shadow-[0_35px_130px_rgba(80,55,30,0.14)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(185,150,94,0.25),transparent_45%)]" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D6BE94]/50" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 740 640" fill="none">
        {[
          "M370 150 C370 225 370 270 370 325",
          "M170 190 C210 300 285 332 335 340",
          "M570 190 C530 300 455 332 405 340",
          "M170 450 C210 370 285 350 335 345",
          "M570 450 C530 370 455 350 405 345",
          "M370 390 C370 455 370 500 370 535",
        ].map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke="#B9965E"
            strokeWidth="2.4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, delay: i * 0.08 }}
            viewport={{ once: true }}
          />
        ))}
      </svg>

      {nodes.map(([title, text, pos], i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ y: [-4, 4, -4] }}
          transition={{
            opacity: { delay: i * 0.08 },
            scale: { delay: i * 0.08 },
            y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut" },
          }}
          viewport={{ once: true }}
          className={`absolute ${pos} w-[185px] rounded-[32px] border border-[#E2D2BA] bg-white/92 p-5 shadow-[0_24px_70px_rgba(80,55,30,0.10)] backdrop-blur`}
        >
          <h3 className="text-lg font-semibold tracking-[-0.035em]">{title}</h3>
          <p className="mt-2 text-sm text-[#6B6258]">{text}</p>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        animate={{ y: [-7, 7, -7] }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
        }}
        viewport={{ once: true }}
        className="absolute left-1/2 top-1/2 z-10 flex h-[210px] w-[260px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[48px] border border-[#B9965E] bg-[#2A2118] text-white shadow-[0_35px_100px_rgba(80,55,30,0.26)]"
      >
        <p className="text-4xl font-semibold tracking-[-0.06em]">
          <span className="text-[#C8A56A]">Mesa</span>
          <span className="text-white">Link</span>
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#D8C5A5]">
          Restaurant Essentials
        </p>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#D8C5A5] bg-[#F1E9DD] px-7 py-3 text-sm font-semibold text-[#17130F] shadow-[0_15px_40px_rgba(80,55,30,0.10)]">
        Hoje software. Amanhã um ecossistema.
      </div>
    </div>
  );
}

function EssentialCard({
  item,
  index,
}: {
  item: (typeof essentials)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      viewport={{ once: true }}
      className="rounded-[26px] border border-[#DAC8AB] bg-[#FFF9F0] p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
        {item.title}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
        {item.value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[#6B6258]">{item.text}</p>
    </motion.div>
  );
}

function MoneyBackground() {
  const points =
    "M0 240 C110 190 160 220 250 150 C340 82 430 180 520 118 C650 28 725 84 820 54 C930 20 1010 64 1120 18";

  return (
    <>
      <div className="absolute left-[-160px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#E4D0AE]/45 blur-[90px]" />
      <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-[#D8C5A5]/38 blur-[115px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.72),transparent_42%)]" />
      <svg
        className="pointer-events-none absolute left-1/2 top-10 hidden h-[360px] w-[1120px] -translate-x-1/2 opacity-35 lg:block"
        viewBox="0 0 1120 280"
        fill="none"
      >
        {[70, 120, 170, 220].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="1120"
            y2={y}
            stroke="#D8C5A5"
            strokeWidth="1"
          />
        ))}

        <motion.path
          d={points}
          stroke="#C8A56A"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.2 }}
        />
      </svg>
    </>
  );
}

function HeroMiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-[#D8C5A5] bg-[#FFF9F0] p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A7166]">
        {label}
      </p>
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-[#E5D6C1] bg-white p-4">
      <p className="text-xl font-semibold tracking-[-0.045em]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#7A7166]">{label}</p>
    </div>
  );
}

function SmallSignal({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9B6F3B]">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ImpactCard({
  value,
  label,
  text,
}: {
  value: string;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-[#DAC8AB] bg-[#FFF9F0] p-6">
      <p className="text-5xl font-semibold tracking-[-0.07em] text-[#17130F]">
        {value}
      </p>
      <p className="mt-2 font-semibold text-[#9B6F3B]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[24px] border border-[#E5D6C1] bg-white p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em]">{value}</p>
      <p className="mt-1 text-sm text-[#7A7166]">{label}</p>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2 flex justify-between gap-4 rounded-2xl bg-white px-4 py-3 last:mb-0">
      <span>{label}</span>
      <span className="font-semibold text-[#9B6F3B]">{value}</span>
    </div>
  );
}
