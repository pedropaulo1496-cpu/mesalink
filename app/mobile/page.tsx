"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";

const brand = {
  mesa: "#C8A56A",
  link: "#17130F",
};

const growthFeatures = [
  ["QR Ordering", "Pedidos"],
  ["Marketing", "Campanhas"],
  ["CRM", "Clientes"],
  ["Recuperação", "Inativos"],
  ["Aniversários", "Automático"],
  ["Clientes em risco", "Retenção"],
];

const visibilityFeatures = [
  ["Website", "SEO"],
  ["Reservas", "Diretas"],
  ["Google Reviews", "Reputação"],
  ["Instagram", "Bio"],
  ["Domínio", "Premium"],
  ["Galeria", "Menus"],
];

const controlFeatures = [
  ["POS / Moloni", "Operação"],
  ["Mesas", "Sala"],
  ["Relatórios", "Dados"],
  ["Pagamentos", "Caixa"],
  ["Faturação", "Fiscal"],
  ["Tempo real", "Controlo"],
];

export default function MobilePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4ECDF] text-[#17130F]">
      <Header />
      <Hero />
      <FeatureCards />
      <QRSection />
      <PricingMini />
      <FinalCTA />
      <StickyCTA />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#DECDB4] bg-[#F4ECDF]/90 px-5 py-4 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-md items-center justify-between">
        <Link href="/" className="text-3xl font-semibold tracking-[-0.06em]">
          <span style={{ color: brand.mesa }}>Mesa</span>
          <span style={{ color: brand.link }}>Link</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold"
          >
            Entrar
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-[#17130F] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_32px_rgba(80,55,30,0.18)]"
          >
            Testar
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative px-5 pb-10 pt-10">
      <Glow />

      <div className="relative mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center"
        >
          <Pill>Restaurant Growth System</Pill>

          <h1 className="mt-6 text-[50px] font-semibold leading-[0.86] tracking-[-0.085em] min-[390px]:text-[58px]">
            O restaurante já mudou.
            <span className="block text-[#C8A56A]">O software também.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-sm text-base leading-7 text-[#5C5348]">
            MesaLink liga reservas, QR Ordering, website, CRM, marketing, POS e
            dados num sistema vivo para crescer todos os dias.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              href="/register"
              className="flex h-14 items-center justify-center rounded-full bg-[#17130F] px-6 text-base font-semibold text-white shadow-[0_22px_65px_rgba(80,55,30,0.26)]"
            >
              Começar teste gratuito →
            </Link>

            <Link
              href="/contact"
              className="flex h-14 items-center justify-center rounded-full border border-[#B9965E] bg-[#FFF9F0] px-6 text-base font-semibold"
            >
              Pedir demonstração
            </Link>
          </div>
        </motion.div>

        <LivePhone />
        <TrustStrip />
      </div>
    </section>
  );
}

function LivePhone() {
  const events = [
    ["Reserva recebida", "Mesa 8 · 19:30", "✓"],
    ["Pedido QR", "Mesa 7 · 42€", "↗"],
    ["Cliente recuperado", "Ana voltou", "+68€"],
    ["Review Google", "★★★★★", "5.0"],
  ];

  const { scrollYProgress } = useScroll();
  const phoneY = useTransform(scrollYProgress, [0, 0.25], [0, -44]);
  const chartY = useTransform(scrollYProgress, [0, 0.18], [14, -18]);

  return (
    <motion.div style={{ y: phoneY }} className="relative mx-auto mt-10 max-w-[365px]">
      <div className="absolute -left-4 top-20 z-20 rounded-2xl border border-[#E5D6C1] bg-white/90 px-4 py-3 shadow-[0_18px_55px_rgba(80,55,30,0.16)] backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
          Reserva
        </p>
        <p className="mt-1 text-xs font-semibold">Confirmada</p>
      </div>

      <div className="absolute -right-4 bottom-28 z-20 rounded-2xl border border-[#E5D6C1] bg-white/90 px-4 py-3 shadow-[0_18px_55px_rgba(80,55,30,0.16)] backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
          Growth
        </p>
        <p className="mt-1 text-xs font-semibold">+18%</p>
      </div>

      <div className="relative overflow-hidden rounded-[44px] border-[10px] border-[#17130F] bg-[#FBF4EA] shadow-[0_42px_120px_rgba(33,25,18,0.26)]">
        <div className="mx-auto mt-3 h-5 w-28 rounded-b-2xl bg-[#17130F]" />

        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold tracking-[-0.04em]">
              MesaLink
            </p>
            <span className="rounded-full bg-[#FFF9F0] px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
              Live
            </span>
          </div>

          <motion.div
            style={{ y: chartY }}
            className="relative mt-5 overflow-hidden rounded-[26px] bg-[#17130F] p-5 text-white"
          >
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#C8A56A]/25 blur-3xl" />

            <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-[#D8C5A5]">
              Receita atribuída
            </p>

            <p className="relative mt-2 text-4xl font-semibold tracking-[-0.075em]">
              3.840€
            </p>

            <p className="relative mt-1 text-xs text-emerald-300">
              QR + Marketing + Reservas
            </p>

            <svg viewBox="0 0 300 95" className="relative mt-4 h-24 w-full">
              <motion.path
                d="M0 76 C32 70 46 55 76 60 C112 66 116 36 154 42 C192 48 206 67 238 49 C270 30 284 18 300 12"
                fill="none"
                stroke="#C8A56A"
                strokeWidth="5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <circle cx="300" cy="12" r="6" fill="#F4D08D" />
            </svg>
          </motion.div>

          <div className="mt-4 grid gap-2">
            {events.map(([title, text, value], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.18 }}
                className="flex items-center justify-between rounded-2xl border border-[#E5D6C1] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-[#6B6258]">{text}</p>
                </div>

                <span className="rounded-full bg-[#FFF0CF] px-3 py-1 text-xs font-bold text-[#9B6F3B]">
                  {value}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FeatureCards() {
  return (
    <section className="px-5 py-12">
      <div className="mx-auto max-w-md">
        <Pill>Growth. Visibility. Control.</Pill>

        <h2 className="mt-5 text-[42px] font-semibold leading-[0.9] tracking-[-0.075em]">
          A operação toda
          <span className="block text-[#C8A56A]">a trabalhar junta.</span>
        </h2>

        <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <MegaCard
            dark
            title="Growth"
            subtitle="Mais receita"
            text="Ferramentas que atraem, vendem mais e fazem clientes voltar."
            items={growthFeatures}
          />

          <MegaCard
            title="Visibility"
            subtitle="Mais descoberta"
            text="Esteja onde os clientes procuram e transforme visitas em reservas."
            items={visibilityFeatures}
          />

          <MegaCard
            title="Control"
            subtitle="Melhor gestão"
            text="Tudo integrado num único sistema para decidir e operar melhor."
            items={controlFeatures}
          />
        </div>

        <div className="mx-auto mt-1 flex w-fit gap-2">
          <span className="h-2 w-7 rounded-full bg-[#C8A56A]" />
          <span className="h-2 w-2 rounded-full bg-[#D8C5A5]" />
          <span className="h-2 w-2 rounded-full bg-[#D8C5A5]" />
        </div>
      </div>
    </section>
  );
}

function QRSection() {
  return (
    <section className="px-5 py-12">
      <div className="mx-auto max-w-md overflow-hidden rounded-[36px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 shadow-[0_24px_80px_rgba(80,55,30,0.10)]">
        <Pill>QR Ordering</Pill>

        <h2 className="mt-5 text-[42px] font-semibold leading-[0.9] tracking-[-0.075em]">
          Clientes pedem.
          <span className="block text-[#C8A56A]">O restaurante controla.</span>
        </h2>

        <p className="mt-5 text-base leading-7 text-[#5C5348]">
          Menu digital por QR, pedidos por mesa, chamar empregado e pedir conta.
          Tudo integrado no MesaLink.
        </p>

        <div className="mt-6 grid gap-3">
          <Event text="Mesa 12 · Pedido recebido" value="+24€" />
          <Event text="Mesa 7 · Chamou empregado" value="Agora" />
          <Event text="Mesa 4 · Pediu conta" value="Fechar" />
        </div>
      </div>
    </section>
  );
}

function PricingMini() {
  return (
    <section id="pricing" className="px-5 py-12">
      <div className="mx-auto max-w-md">
        <Pill>Preços simples</Pill>

        <h2 className="mt-5 text-[42px] font-semibold leading-[0.9] tracking-[-0.075em]">
          Teste primeiro.
          <span className="block text-[#C8A56A]">Escolha depois.</span>
        </h2>

        <div className="mt-7 overflow-hidden rounded-[32px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_24px_80px_rgba(80,55,30,0.10)]">
          <MiniPlanRow
            name="Essentials"
            price="79€"
            text="Reservas, Website, QR Ordering, CRM e Reviews."
          />

          <MiniPlanRow
            featured
            name="Growth"
            price="99€"
            text="Tudo + Marketing, recuperação e clientes em risco."
          />
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#6B6258]">
          7 dias grátis. Anual com 1 mês grátis. Valores sem IVA.
        </p>
      </div>
    </section>
  );
}

function MiniPlanRow({
  name,
  price,
  text,
  featured = false,
}: {
  name: string;
  price: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-[#E5D6C1] p-5 last:border-b-0 ${
        featured ? "bg-[#17130F] text-white" : "bg-[#FFF9F0]"
      }`}
    >
      <div>
        <p
          className={`text-xs font-semibold uppercase tracking-[0.22em] ${
            featured ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
          }`}
        >
          {name}
        </p>

        <p className={`mt-2 text-sm leading-5 ${featured ? "text-white/65" : "text-[#6B6258]"}`}>
          {text}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {featured && (
          <p className="mb-1 rounded-full bg-[#D8C5A5] px-2 py-1 text-[10px] font-semibold text-[#17130F]">
            Melhor
          </p>
        )}

        <p className="text-3xl font-semibold tracking-[-0.075em]">
          {price}
        </p>

        <p className={`text-xs ${featured ? "text-white/55" : "text-[#6B6258]"}`}>
          /mês
        </p>
      </div>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 pb-28 pt-10">
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[40px] bg-[#211912] p-8 text-white shadow-[0_35px_100px_rgba(34,26,19,0.22)]">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C8A56A]/20 blur-[70px]" />

        <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-[#D8C5A5]">
          Próximo passo
        </p>

        <h2 className="relative mt-5 text-[46px] font-semibold leading-[0.88] tracking-[-0.08em]">
          O restaurante já evoluiu.
          <span className="block text-[#D8C5A5]">Agora evolua o software.</span>
        </h2>

        <p className="relative mt-5 text-base leading-7 text-white/65">
          Experimente a MesaLink durante 7 dias e veja tudo a trabalhar junto.
        </p>

        <Link
          href="/register"
          className="relative mt-7 flex h-14 items-center justify-center rounded-full bg-[#D8C5A5] px-6 text-base font-semibold text-[#17130F]"
        >
          Começar teste gratuito →
        </Link>
      </div>
    </section>
  );
}

function MegaCard({
  title,
  subtitle,
  text,
  items,
  dark = false,
}: {
  title: string;
  subtitle: string;
  text: string;
  items: string[][];
  dark?: boolean;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      className={`min-w-[300px] snap-center rounded-[34px] border p-6 shadow-[0_24px_80px_rgba(80,55,30,0.10)] ${
        dark
          ? "border-[#17130F] bg-[#17130F] text-white"
          : "border-[#D8C5A5] bg-[#FFF9F0]"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C8A56A] text-xl">
        {title === "Growth" ? "↗" : title === "Visibility" ? "◎" : "≡"}
      </div>

      <h3
        className={`mt-5 text-4xl font-semibold tracking-[-0.075em] ${
          dark ? "text-white" : "text-[#17130F]"
        }`}
      >
        {title}
      </h3>

      <p className={dark ? "mt-1 text-[#D8C5A5]" : "mt-1 text-[#9B6F3B]"}>
        {subtitle}
      </p>

      <p className={`mt-4 text-sm leading-6 ${dark ? "text-white/64" : "text-[#6B6258]"}`}>
        {text}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {items.map(([name, label]) => (
          <div
            key={name}
            className={`rounded-2xl p-3 text-center ${
              dark ? "bg-white/[0.07]" : "border border-[#E5D6C1] bg-white"
            }`}
          >
            <p className="text-xs font-semibold">{name}</p>
            <p className={dark ? "mt-1 text-[10px] text-white/50" : "mt-1 text-[10px] text-[#6B6258]"}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className={dark ? "mt-6 h-1 rounded-full bg-white/10" : "mt-6 h-1 rounded-full bg-[#E5D6C1]"}>
        <div className="h-1 w-1/2 rounded-full bg-[#C8A56A]" />
      </div>
    </motion.div>
  );
}

function MiniPlan({
  name,
  price,
  text,
  featured = false,
}: {
  name: string;
  price: string;
  text: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-[28px] border p-5 ${
        featured
          ? "border-[#17130F] bg-[#17130F] text-white"
          : "border-[#D8C5A5] bg-[#FFF9F0]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.22em] ${
              featured ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
            }`}
          >
            {name}
          </p>

          <p className="mt-2 text-4xl font-semibold tracking-[-0.075em]">
            {price}
            <span className="text-sm font-normal opacity-60">/mês</span>
          </p>
        </div>

        {featured && (
          <span className="rounded-full bg-[#D8C5A5] px-3 py-1 text-xs font-semibold text-[#17130F]">
            Melhor
          </span>
        )}
      </div>

      <p className={`mt-3 text-sm leading-6 ${featured ? "text-white/65" : "text-[#6B6258]"}`}>
        {text}
      </p>

      <Link
        href="/register"
        className={`mt-5 flex h-12 items-center justify-center rounded-full text-sm font-semibold ${
          featured ? "bg-[#D8C5A5] text-[#17130F]" : "bg-[#17130F] text-white"
        }`}
      >
        Testar grátis
      </Link>
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="mx-auto mt-8 grid max-w-md grid-cols-3 overflow-hidden rounded-[26px] border border-[#D8C5A5] bg-[#FFF9F0] text-center shadow-[0_18px_55px_rgba(80,55,30,0.08)]">
      <TrustItem value="0€" label="comissões" />
      <TrustItem value="7 dias" label="grátis" />
      <TrustItem value="Tudo" label="incluído" />
    </div>
  );
}

function TrustItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-r border-[#E5D6C1] px-3 py-4 last:border-r-0">
      <p className="font-semibold">{value}</p>
      <p className="mt-1 text-xs text-[#6B6258]">{label}</p>
    </div>
  );
}

function Event({ text, value }: { text: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#E5D6C1] bg-white px-4 py-3">
      <p className="text-sm font-semibold">{text}</p>
      <p className="text-sm font-bold text-[#9B6F3B]">{value}</p>
    </div>
  );
}

function FloatingCard({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className: string;
}) {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute z-20 hidden rounded-2xl border border-[#E5D6C1] bg-white/90 px-4 py-3 shadow-[0_18px_55px_rgba(80,55,30,0.16)] backdrop-blur min-[390px]:block ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B6F3B]">
        {title}
      </p>
      <p className="mt-1 text-xs font-semibold">{value}</p>
    </motion.div>
  );
}

function DashStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[20px] border border-[#E5D6C1] bg-white p-3">
      <p className="text-2xl font-semibold tracking-[-0.06em]">{value}</p>
      <p className="mt-1 text-[11px] text-[#6B6258]">{label}</p>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-[#D8C5A5] bg-[#FFF9F0] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9B6F3B] shadow-[0_12px_35px_rgba(80,55,30,0.06)]">
      ✦ {children}
    </span>
  );
}

function Glow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute left-1/2 top-[-160px] h-[330px] w-[330px] -translate-x-1/2 rounded-full bg-[#D8C5A5]/45 blur-[90px]" />
      <div className="absolute right-[-120px] top-[260px] h-[260px] w-[260px] rounded-full bg-[#C8A56A]/20 blur-[80px]" />
      <div className="absolute left-[-120px] top-[420px] h-[260px] w-[260px] rounded-full bg-white/70 blur-[80px]" />
    </div>
  );
}

function StickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#D8C5A5] bg-[#F4ECDF]/94 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] items-center gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9B6F3B]">
            Trial completo
          </p>
          <p className="text-sm font-semibold">7 dias grátis</p>
        </div>

        <Link
          href="/register"
          className="rounded-full bg-[#17130F] px-5 py-3 text-sm font-semibold text-white"
        >
          Começar
        </Link>
      </div>
    </div>
  );
}