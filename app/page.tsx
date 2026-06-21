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

const features = [
  "Reservas online",
  "Gestão de mesas",
  "CRM de clientes",
  "Website profissional",
  "POS integrado",
  "QR Ordering",
  "Marketing",
  "Google Reviews",
  "Fidelização VIP",
  "Campanhas",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F1E9DD] text-[#17130F]">
      <Header />

      <section className="relative px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <SoftBackground />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <Label>Plataforma de crescimento para restaurantes</Label>

            <h1 className="mt-6 text-[52px] font-semibold leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-[104px]">
              O sistema operativo para restaurantes modernos.
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#5C5348] lg:text-xl">
              Reservas, CRM, website, marketing, POS e QR Ordering numa única
              plataforma para aumentar receita, poupar tempo e fazer clientes
              voltar.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-14 rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_20px_55px_rgba(185,150,94,0.22)] hover:bg-[#2A2118]"
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
          </div>

          <div className="mt-16">
            <HeroProduct />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Label>Uma plataforma. Um login.</Label>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
              Tudo ligado ao{" "}
              <span style={{ color: brand.mesa }}>Mesa</span>
              <span style={{ color: brand.link }}>Link</span>.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C5348]">
              O cliente reserva, senta-se, pede por QR, paga, entra no CRM e
              recebe marketing automático para voltar.
            </p>
          </div>

          <Ecosystem />
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <TableEditor />

          <div>
            <Label>Editor de mesas</Label>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
              Veja a sala em tempo real.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C5348]">
              Mesas, reservas, pedidos QR, contas e ocupação num painel visual
              feito para equipas de restaurante.
            </p>
          </div>
        </div>
      </section>

      <RoiSection />

      <section id="pricing" className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <Label>Preço de lançamento</Label>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
              79€/mês para uma plataforma que pode pagar-se sozinha.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5C5348]">
              Uma mesa extra, um cliente recuperado ou menos pressão na equipa
              já pode compensar o custo mensal.
            </p>
          </div>

          <PricingCard />
        </div>
      </section>

      <section className="px-5 pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[44px] bg-[#221A13] p-8 text-white shadow-[0_35px_120px_rgba(34,26,19,0.24)] lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <h2 className="max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
                O próximo cliente já está à procura do seu restaurante.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                Dê-lhe uma experiência melhor. Faça-o voltar.
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

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#DECDB4] bg-[#F1E9DD]/88 px-5 py-5 backdrop-blur-xl lg:px-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-2xl font-semibold tracking-[-0.045em]">
          <span style={{ color: brand.mesa }}>Mesa</span>
          <span style={{ color: brand.link }}>Link</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-[#5C5348] lg:flex">
          <Link href="#platform">Produto</Link>
          <Link href="#pricing">Preços</Link>
          <Link href="/login">Entrar</Link>
        </div>

        <Link
          href="/register"
          className="rounded-full bg-[#17130F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2A2118]"
        >
          Começar
        </Link>
      </nav>
    </header>
  );
}

function HeroProduct() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: "easeOut" }}
      className="relative mx-auto max-w-6xl"
    >
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative overflow-hidden rounded-[46px] border border-[#D6BE94] bg-[#FFF8ED] p-3 shadow-[0_45px_150px_rgba(71,47,24,0.22)]"
      >
        <div className="rounded-[38px] border border-[#E8D7BB] bg-[#FBF4EA] p-3">
          <div className="overflow-hidden rounded-[32px] border border-[#E3CFAD] bg-white">
            <div className="grid min-h-[610px] lg:grid-cols-[240px_1fr]">
              <aside className="hidden border-r border-[#E7D7BF] bg-[#EFE4D4] p-7 lg:block">
                <Logo />

                <div className="mt-9 space-y-2 text-sm">
                  {[
                    "Dashboard",
                    "Reservas",
                    "Mapa de mesas",
                    "Clientes",
                    "Campanhas",
                    "POS",
                    "Relatórios",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className={
                        index === 0
                          ? "rounded-2xl bg-[#17130F] px-4 py-3 font-semibold text-white shadow-sm"
                          : "rounded-2xl px-4 py-3 text-[#6B6258]"
                      }
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-3xl border border-[#D6BE94] bg-[#FFF8ED] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9B6F3B]">
                    Serviço
                  </p>
                  <p className="mt-2 text-3xl font-semibold">74%</p>
                  <p className="text-sm text-[#6B6258]">ocupação atual</p>
                </div>
              </aside>

              <div className="p-5 lg:p-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#7A7166]">Hoje · 19:42</p>
                    <h3 className="text-5xl font-semibold tracking-[-0.07em]">
                      Dashboard
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#EFE4D4] px-5 py-3 text-sm font-semibold">
                    Serviço ativo
                  </span>
                </div>

                <div className="mt-9 grid gap-4 sm:grid-cols-4">
                  <Metric value="€3.840" label="Receita POS" />
                  <Metric value="48" label="Reservas" />
                  <Metric value="126" label="Clientes" />
                  <Metric value="+31%" label="Retorno" />
                </div>

                <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <MiniPanel title="Mapa de mesas">
                    <MiniTableMap />
                  </MiniPanel>

                  <MiniPanel title="Crescimento ativo">
                    {[
                      ["Review Google", "+1"],
                      ["Campanha VIP", "24 clientes"],
                      ["Cliente recuperado", "€68"],
                      ["Pedido QR", "Mesa 7"],
                    ].map(([label, value]) => (
                      <Row key={label} label={label} value={value} />
                    ))}
                  </MiniPanel>
                </div>

                <div className="mt-6 rounded-[28px] border border-[#E7D7BF] bg-[#FFF8ED] p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Impacto estimado este mês</p>
                    <p className="text-sm font-semibold text-[#9B6F3B]">
                      +€1.240
                    </p>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#E8D7BB]">
                    <motion.div
                      initial={{ width: "20%" }}
                      animate={{ width: "76%" }}
                      transition={{ duration: 1.2, delay: 0.4 }}
                      className="h-full rounded-full bg-[#B9965E]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Ecosystem() {
  const nodes = [
    ["Reservas", "Todos os canais", "top-[9%] left-[6%]"],
    ["Website", "Online 24/7", "top-[3%] left-[39%]"],
    ["QR Ordering", "Pedidos na mesa", "top-[9%] right-[6%]"],
    ["Marketing", "Atrair e fidelizar", "bottom-[15%] left-[7%]"],
    ["POS", "Vendas e operação", "bottom-[15%] right-[7%]"],
  ];

  return (
    <div className="relative mx-auto h-[640px] w-full max-w-[740px] overflow-hidden rounded-[52px] border border-[#D6BE94] bg-[#FFF8ED] p-7 shadow-[0_35px_130px_rgba(80,55,30,0.14)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(185,150,94,0.24),transparent_45%)]" />
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
        className="absolute left-1/2 top-1/2 z-10 flex h-[205px] w-[250px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[46px] border border-[#B9965E] bg-[#2A2118] text-white shadow-[0_35px_100px_rgba(80,55,30,0.26)]"
      >
        <p className="text-4xl font-semibold tracking-[-0.06em]">
          <span className="text-[#C8A56A]">Mesa</span>
          <span className="text-white">Link</span>
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#D8C5A5]">
          Growth Engine
        </p>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#D8C5A5] bg-[#F1E9DD] px-7 py-3 text-sm font-semibold text-[#17130F] shadow-[0_15px_40px_rgba(80,55,30,0.10)]">
        Dados, relatórios e automações
      </div>
    </div>
  );
}

function MiniTableMap() {
  const tables = [
    ["2", "Livre"],
    ["4", "Reserva"],
    ["6", "Ocupada"],
    ["2", "QR"],
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tables.map(([pax, status], index) => (
        <div
          key={`${pax}-${status}-${index}`}
          className={
            status === "QR"
              ? "rounded-2xl border border-[#B9965E] bg-[#FFF0CF] p-3"
              : "rounded-2xl border border-[#E5D6C1] bg-white p-3"
          }
        >
          <div className="flex h-16 items-center justify-center rounded-full border border-current/10 bg-[#F8F0E6]">
            <p className="text-lg font-semibold">{pax}</p>
          </div>

          <p className="mt-2 text-center text-xs text-[#6B6258]">
            {status}
          </p>
        </div>
      ))}
    </div>
  );
}

function TableEditor() {
  const tables = [
    ["2", "Livre"],
    ["4", "Reserva"],
    ["6", "Ocupada"],
    ["2", "QR"],
    ["8", "Conta"],
    ["4", "Ocupada"],
    ["2", "Livre"],
    ["6", "Reserva"],
  ];

  return (
    <div className="rounded-[44px] border border-[#D8C5A5] bg-[#FFF9F0] p-5 shadow-[0_30px_110px_rgba(80,55,30,0.14)]">
      <div className="rounded-[36px] border border-[#E5D6C1] bg-white p-6">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#7A7166]">Sala Principal</p>
            <h3 className="text-4xl font-semibold tracking-[-0.06em]">
              Editor de mesas
            </h3>
          </div>
          <span className="rounded-full bg-[#F1E9DD] px-4 py-2 text-sm font-semibold text-[#9B6F3B]">
            Serviço ativo
          </span>
        </div>

        <div className="grid grid-cols-4 gap-5">
          {tables.map(([pax, status], index) => (
            <motion.div
              key={`${pax}-${status}-${index}`}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.04 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={
                  status === "Conta"
                    ? "flex h-24 w-24 items-center justify-center rounded-full bg-[#2A2118] text-white shadow-lg"
                    : status === "QR"
                      ? "flex h-24 w-24 items-center justify-center rounded-full border border-[#B9965E] bg-[#FFF0CF]"
                      : "flex h-24 w-24 items-center justify-center rounded-full border border-[#E5D6C1] bg-[#F8F0E6]"
                }
              >
                <p className="text-2xl font-semibold">{pax}</p>
              </div>
              <p className="text-xs font-semibold text-[#6B6258]">{status}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <Metric value="18" label="Mesas" />
          <Metric value="74%" label="Ocupação" />
          <Metric value="9" label="Pedidos QR" />
          <Metric value="4" label="Contas" />
        </div>
      </div>
    </div>
  );
}

function RoiSection() {
  return (
    <section className="px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[44px] bg-[#2A2118] p-8 text-white shadow-[0_35px_120px_rgba(34,26,19,0.22)] lg:p-12">
        <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#D8C5A5]">
              Retorno claro
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">
              Os 79€ têm de pagar-se sozinhos.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/65">
              Mais clientes recorrentes, menos trabalho manual, mais reviews e
              serviço mais eficiente.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["+ clientes recorrentes", "Campanhas e recuperação trazem clientes de volta."],
              ["+ reviews Google", "Pedidos automáticos melhoram reputação."],
              ["- pressão na equipa", "QR Ordering reduz pedidos manuais."],
              ["+ eficiência", "Mesas, pedidos, POS e CRM ficam ligados."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-[30px] border border-white/10 bg-white/[0.06] p-6"
              >
                <h3 className="text-xl font-semibold text-[#D8C5A5]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard() {
  return (
    <div className="rounded-[42px] bg-[#2A2118] p-8 text-white shadow-[0_35px_120px_rgba(24,21,18,0.24)]">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D8C5A5]">
        <span className="text-[#C8A56A]">Mesa</span>
        <span className="text-white">Link</span> Growth
      </p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-7xl font-semibold tracking-[-0.08em]">79€</span>
        <span className="mb-3 text-white/65">/mês</span>
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.07] p-5">
        <p className="text-sm text-white/70">
          Basta recuperar <span className="font-semibold text-[#D8C5A5]">1 cliente</span>,
          gerar <span className="font-semibold text-[#D8C5A5]"> 1 mesa extra</span> ou
          poupar tempo de equipa para compensar o valor.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <p key={feature} className="text-sm text-white/82">
            ✓ {feature}
          </p>
        ))}
      </div>

      <Button
        asChild
        className="mt-8 h-14 w-full rounded-full bg-[#D8C5A5] text-base font-semibold text-[#17130F] hover:bg-[#E8D6B8]"
      >
        <Link href="/register">Começar teste gratuito</Link>
      </Button>

      <p className="mt-5 text-center text-sm text-white/55">
        Preço de lançamento. Mantém para sempre.
      </p>
    </div>
  );
}

function Logo() {
  return (
    <p className="text-xl font-semibold tracking-[-0.04em]">
      <span className="text-[#C8A56A]">Mesa</span>
      <span className="text-[#17130F]">Link</span>
    </p>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
      {children}
    </p>
  );
}

function SoftBackground() {
  return (
    <>
      <div className="absolute left-[-160px] top-[-120px] h-[420px] w-[420px] rounded-full bg-[#E4D0AE]/45 blur-[90px]" />
      <div className="absolute right-[-180px] top-[120px] h-[520px] w-[520px] rounded-full bg-[#D8C5A5]/38 blur-[115px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.66),transparent_40%)]" />
    </>
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

function MiniPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[30px] border border-[#E5D6C1] bg-[#FFF9F0] p-5">
      <h4 className="font-semibold">{title}</h4>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-white px-4 py-3">
      <span>{label}</span>
      <span className="text-[#9B6F3B]">{value}</span>
    </div>
  );
}