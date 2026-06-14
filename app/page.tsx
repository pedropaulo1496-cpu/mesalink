"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

const websiteTemplates = [
  {
    name: "Premium",
    text: "Para restaurantes modernos que querem uma presença forte.",
  },
  {
    name: "Luxury",
    text: "Para conceitos premium, fine dining e experiências exclusivas.",
  },
  {
    name: "Minimal",
    text: "Para restaurantes que querem uma imagem limpa e direta.",
  },
  {
    name: "Social",
    text: "Para marcas jovens, visuais e muito ligadas às redes sociais.",
  },
];

const platformFeatures = [
  {
    icon: "🌐",
    title: "Website profissional",
    text: "Crie um website moderno com menus, galeria, contactos, SEO e reservas integradas.",
  },
  {
    icon: "📅",
    title: "Reservas online",
    text: "Receba reservas pelo website, Google Maps, Instagram, Facebook e outros canais.",
  },
  {
    icon: "🪑",
    title: "Gestão de mesas",
    text: "Organize a sala, horários, ocupação e reservas sem folhas soltas ou confusão.",
  },
  {
    icon: "👥",
    title: "Clientes",
    text: "Guarde histórico, contactos e detalhes importantes para melhorar o serviço.",
  },
];

const comparisonRows = [
  ["Website", "Ferramenta #1", "Incluído"],
  ["Reservas", "Ferramenta #2", "Incluído"],
  ["Gestão de mesas", "Ferramenta #3", "Incluído"],
  ["Clientes", "Ferramenta #4", "Incluído"],
  ["Marketing", "Ferramenta #5", "Brevemente"],
  ["QR Ordering", "Ferramenta #6", "Brevemente"],
  ["POS", "Ferramenta #7", "Brevemente"],
];

export default function HomePage() {
  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -70]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.25], [-4, 4]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-5 pb-16 pt-5 lg:px-8 lg:pb-24">
        <nav className="mx-auto mb-12 flex max-w-7xl items-center justify-between lg:mb-16">
          <Link href="/" className="text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm lg:flex">
            <Link href="#platform" className="font-bold text-slate-400 hover:text-white">
              Plataforma
            </Link>
            <Link href="#websites" className="font-bold text-slate-400 hover:text-white">
              Websites
            </Link>
            <Link href="#comparison" className="font-bold text-slate-400 hover:text-white">
              Comparação
            </Link>
            <Link href="#pricing" className="font-bold text-slate-400 hover:text-white">
              Preços
            </Link>
            <Link href="/login" className="font-bold text-slate-400 hover:text-white">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 py-3 font-black text-black shadow-[0_0_45px_rgba(96,165,250,0.35)] hover:opacity-90"
            >
              Começar grátis
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/30 bg-white/5 px-5 py-2 text-sm font-black text-cyan-200 backdrop-blur lg:hidden"
          >
            Entrar
          </Link>
        </nav>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:min-h-[720px] lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div style={{ y: heroY }}>
            <Badge>Restaurant Operating System</Badge>

            <h1 className="mt-5 text-[52px] font-black leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-[92px]">
              O Sistema Operativo para{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
                Restaurantes.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-300 lg:text-lg">
              Receba reservas online, crie um website profissional e gira o seu
              restaurante numa única plataforma.
            </p>

            <div className="mt-7 grid gap-3 sm:max-w-xl sm:grid-cols-2">
              <Button
                asChild
                className="h-14 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.6)] hover:opacity-90"
              >
                <Link href="/register">Começar gratuitamente →</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-14 rounded-full border-cyan-300/30 bg-white/5 text-base font-black text-white backdrop-blur hover:bg-white/10"
              >
                <Link href="#websites">Ver websites →</Link>
              </Button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <HeroStat icon="🌐" value="Website" label="profissional" />
              <HeroStat icon="📅" value="Reservas" label="online" />
              <HeroStat icon="🪑" value="Mesas" label="gestão" />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-400">
              <span>✓ Até 100 reservas/mês grátis</span>
              <span>✓ Sem cartão de crédito</span>
              <span>✓ Configuração em minutos</span>
            </div>
          </motion.div>

          <motion.div style={{ rotate: phoneRotate }} className="lg:mt-8">
            <PhoneHero />
          </motion.div>
        </div>
      </section>

      <StickyBar />

      <section id="platform" className="relative z-10 px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge>Uma plataforma. Um login.</Badge>

            <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
              Tudo o que o seu restaurante precisa{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                ligado num só lugar.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 lg:text-lg">
              Website, reservas, clientes, mesas, marketing e POS não deviam
              viver em ferramentas separadas. O MesaLink junta tudo numa
              plataforma feita para restaurantes.
            </p>
          </div>

          <FlowNetwork />
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>Menos ferramentas. Mais restaurante.</Badge>

          <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                Pare de gerir o restaurante{" "}
                <span className="text-cyan-300">em várias plataformas.</span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
                O MesaLink centraliza a presença online, as reservas, a sala e
                os clientes. Hoje resolve o essencial. Amanhã liga marketing,
                QR Ordering e POS na mesma plataforma.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
              <BigCard
                number="01"
                title="Atrair clientes"
                text="Website profissional, SEO, Google Maps e redes sociais preparados para converter visitas em reservas."
              />
              <BigCard
                number="02"
                title="Receber reservas"
                text="Reservas online organizadas no calendário, com clientes e detalhes sempre disponíveis."
              />
              <BigCard
                number="03"
                title="Gerir e crescer"
                text="Gestão de mesas hoje. IA, marketing, QR Ordering e POS integrados no futuro."
              />
            </div>
          </div>
        </div>
      </section>

      <section id="websites" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_100px_rgba(34,211,238,0.22)] lg:p-10">
            <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-500/25 blur-[70px]" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/25 blur-[70px]" />

            <div className="relative">
              <Badge purple>Website Profissional</Badge>

              <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <h2 className="text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                    O website que o seu{" "}
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                      restaurante merece.
                    </span>
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">
                    Escolha um template, adicione imagens, menus em PDF,
                    galeria, contactos, SEO e reservas integradas. Sem
                    programar. Sem agência. Sem complicações.
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <p>✓ Menus PDF</p>
                  <p>✓ Galeria</p>
                  <p>✓ SEO</p>
                  <p>✓ Contactos</p>
                  <p>✓ Google Maps</p>
                  <p>✓ Reservas integradas</p>
                </div>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {websiteTemplates.map((template) => (
                  <TemplateCard key={template.name} {...template} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>Plataforma completa</Badge>

          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
            Uma base para todas as fases do restaurante.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature) => (
              <Feature key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="comparison" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>Porque MesaLink?</Badge>

          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
            Porque usar várias plataformas?
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400">
            A solução tradicional obriga o restaurante a juntar ferramentas
            diferentes. O MesaLink foi pensado para juntar tudo no mesmo
            sistema.
          </p>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#06111f] shadow-[0_0_70px_rgba(34,211,238,0.08)]">
            <div className="grid grid-cols-3 bg-white/[0.04] p-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <div>Necessidade</div>
              <div>Solução tradicional</div>
              <div>MesaLink</div>
            </div>

            {comparisonRows.map(([need, traditional, mesalink]) => (
              <div
                key={need}
                className="grid grid-cols-3 border-t border-white/10 p-5 text-sm sm:text-base"
              >
                <div className="font-black text-white">{need}</div>
                <div className="text-slate-400">{traditional}</div>
                <div className="font-black text-cyan-300">{mesalink}</div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xl font-black text-cyan-200">
            Uma plataforma. Um login. Tudo ligado.
          </p>
        </div>
      </section>

      <section id="pricing" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Badge>Preços simples</Badge>

          <h2 className="mt-5 max-w-4xl text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
            Comece grátis. Cresça quando precisar.
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <PriceCard
              title="Free"
              price="0€"
              text="Para começar a receber reservas online sem risco."
              items={["Até 100 reservas/mês", "Calendário", "Clientes", "Link para redes sociais e Google Maps"]}
              cta="Começar grátis"
              href="/register"
            />

            <PriceCard
              highlighted
              title="Pro"
              price="10€"
              text="Para restaurantes que querem gerir reservas sem limites."
              items={["Reservas ilimitadas", "Gestão de mesas", "Calendário", "Clientes"]}
              cta="Escolher Pro"
              href="/register"
            />

            <PriceCard
              title="Website"
              price="+10€"
              text="Add-on para transformar a presença online do restaurante."
              items={["Website profissional", "Templates", "Menus PDF", "Galeria", "SEO", "Reservas integradas"]}
              cta="Adicionar website"
              href="/register"
            />
          </div>
        </div>
      </section>

      <section id="future" className="relative z-10 px-5 py-14 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_100px_rgba(34,211,238,0.16)] lg:p-10">
            <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-500/25 blur-[70px]" />
            <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/25 blur-[70px]" />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <Badge purple>O futuro da restauração</Badge>

                <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl">
                  Estamos a construir a plataforma completa para{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                    restaurantes.
                  </span>
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">
                  Hoje, o MesaLink resolve website, reservas, mesas e clientes.
                  Em breve, vai ligar marketing, IA, pedidos por QR Code e POS
                  numa única operação.
                </p>
              </div>

              <div className="grid gap-3">
                <AiItem title="Assistente IA" text="Ajuda para reviews, descrições, conteúdo, operação e decisões do dia a dia." />
                <AiItem title="Ferramentas de Marketing" text="Campanhas, mensagens, promoções e reativação de clientes." />
                <AiItem title="QR Ordering" text="O cliente pede na mesa por QR Code e o pedido entra diretamente no sistema." />
                <AiItem title="POS Integrado" text="O próximo passo para ligar reservas, pedidos, pagamentos e operação." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_100px_rgba(96,165,250,0.55)] lg:p-10">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-3xl" />

            <h2 className="relative max-w-4xl text-[42px] font-black leading-[0.88] tracking-[-0.06em] sm:text-6xl">
              Comece gratuitamente hoje.
            </h2>

            <p className="relative mt-5 max-w-2xl text-base leading-relaxed text-black/70">
              Receba reservas online, organize o restaurante e prepare a sua
              operação para uma nova geração de ferramentas de restauração.
            </p>

            <Button
              asChild
              className="relative mt-7 h-14 rounded-full bg-black px-8 text-base font-black text-white hover:bg-black/90"
            >
              <Link href="/register">Criar conta grátis →</Link>
            </Button>

            <div className="relative mt-6 grid gap-4 text-sm text-black/70 sm:grid-cols-2 lg:max-w-md">
              <p>💳 Sem cartão de crédito</p>
              <p>📅 Até 100 reservas/mês grátis</p>
            </div>
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
      <motion.div
        animate={{ scale: [1, 1.18, 1], y: [0, 42, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-140px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[110px] lg:h-[620px] lg:w-[620px]"
      />

      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 50, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-140px] top-[420px] h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[100px] lg:h-[440px] lg:w-[440px]"
      />

      <motion.div
        animate={{ x: [0, 22, 0], opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-120px] left-[-120px] h-[320px] w-[320px] rounded-full bg-blue-500/20 blur-[100px]"
      />

      <motion.div
        animate={{ opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.08)_1px,transparent_1px)] bg-[size:44px_44px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function StickyBar() {
  return (
    <section className="sticky top-0 z-30 border-y border-cyan-300/10 bg-[#020617]/80 px-5 py-4 backdrop-blur-2xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
            MesaLink OS
          </p>
          <p className="text-sm font-bold text-white">Website → Reservas → Gestão</p>
        </div>

        <Link
          href="/register"
          className="rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-4 py-2 text-sm font-black text-black"
        >
          Começar
        </Link>
      </div>
    </section>
  );
}

function Badge({ children, purple }: { children: React.ReactNode; purple?: boolean }) {
  return (
    <span
      className={
        purple
          ? "relative inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200"
          : "relative inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200"
      }
    >
      {children}
    </span>
  );
}

function PhoneHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 45, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.85, delay: 0.15 }}
      className="relative mx-auto max-w-[330px] lg:max-w-[430px]"
    >
      <div className="absolute inset-0 translate-y-10 rounded-[48px] bg-cyan-500/25 blur-[80px]" />
      <div className="absolute inset-0 translate-y-16 rounded-[48px] bg-violet-500/20 blur-[100px]" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[44px] border border-cyan-300/35 bg-gradient-to-b from-[#0b1b2c] via-[#071426] to-[#020617] p-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-cyan-300/50" />

        <div className="rounded-[34px] border border-white/10 bg-black/45 p-4 backdrop-blur-xl lg:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">MesaLink OS</p>
              <h3 className="text-2xl font-black lg:text-3xl">Restaurante</h3>
            </div>

            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-300">
              ONLINE
            </span>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            <Dash value="12" label="Reservas" />
            <Dash value="48" label="Pessoas" />
            <Dash value="91%" label="Ocup." />
          </div>

          <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 shadow-[0_0_35px_rgba(34,211,238,0.18)]">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Website ativo
            </p>
            <p className="text-2xl font-black text-cyan-200">
              Premium <span className="text-white">· Reservas ON</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Menus, galeria, SEO e Google Maps ligados.
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
              Plataforma completa
            </p>
            <p className="text-sm font-bold text-white">
              Website → Reserva → Cliente → Mesa
            </p>
          </div>

          <Reservation time="20:00" name="João Silva" status="Confirmada" />
          <Reservation time="20:30" name="Ana Costa" status="Confirmada" />
          <Reservation time="21:00" name="Pedro Santos" status="Pendente" danger />
        </div>
      </motion.div>
    </motion.div>
  );
}

function FlowNetwork() {
  return (
    <div className="relative mx-auto mt-10 h-[520px] w-full max-w-sm overflow-hidden rounded-[40px] border border-cyan-300/10 bg-white/[0.035] p-4 backdrop-blur-2xl lg:h-[620px] lg:max-w-[560px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,211,238,0.22),transparent_32%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 520" fill="none">
        <path d="M85 85 C145 120 160 190 180 235" stroke="rgba(34,211,238,.22)" strokeWidth="2" />
        <path d="M275 85 C215 120 200 190 180 235" stroke="rgba(167,139,250,.22)" strokeWidth="2" />
        <path d="M85 335 C145 310 160 275 180 245" stroke="rgba(96,165,250,.22)" strokeWidth="2" />
        <path d="M275 335 C215 310 200 275 180 245" stroke="rgba(34,211,238,.22)" strokeWidth="2" />
        <path d="M180 285 C180 340 180 390 180 445" stroke="rgba(34,197,94,.25)" strokeWidth="2" />
      </svg>

      <FlowSource top={48} left={18} icon="🌐" label="Website" />
      <FlowSource top={48} right={18} icon="📅" label="Reservas" />
      <FlowSource top={306} left={18} icon="👥" label="Clientes" />
      <FlowSource top={306} right={18} icon="🪑" label="Mesas" />

      <motion.div
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: [
            "0 0 40px rgba(34,211,238,.25)",
            "0 0 90px rgba(167,139,250,.55)",
            "0 0 40px rgba(34,211,238,.25)",
          ],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[190px] z-10 flex h-36 w-36 -translate-x-1/2 flex-col items-center justify-center rounded-[40px] border border-cyan-300/30 bg-[#06111f]/95 text-center lg:top-[235px] lg:h-44 lg:w-44"
      >
        <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-xl font-black text-transparent lg:text-2xl">
          MesaLink
        </span>
        <motion.span
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"
        >
          Tudo ligado
        </motion.span>
      </motion.div>

      <ConfirmedBooking />

      <FlowParticle delay={0} fromX={85} fromY={85} />
      <FlowParticle delay={0.9} fromX={275} fromY={85} />
      <FlowParticle delay={1.8} fromX={85} fromY={335} />
      <FlowParticle delay={2.7} fromX={275} fromY={335} />
      <FlowParticleToBooking delay={1.2} />
      <FlowParticleToBooking delay={2.8} />
    </div>
  );
}

function FlowSource({
  top,
  left,
  right,
  icon,
  label,
}: {
  top: number;
  left?: number;
  right?: number;
  icon: string;
  label: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ top, left, right }}
      className="absolute z-10 rounded-2xl border border-white/10 bg-[#020617]/90 px-4 py-3 backdrop-blur"
    >
      <p className="text-lg">{icon}</p>
      <p className="text-xs font-black">{label}</p>
    </motion.div>
  );
}

function ConfirmedBooking() {
  return (
    <motion.div
      animate={{ y: [0, -5, 0], opacity: [0.88, 1, 0.88] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 rounded-full border border-green-400/20 bg-green-500/15 px-5 py-3 text-sm font-black text-green-300 shadow-[0_0_35px_rgba(34,197,94,0.18)]"
    >
      🍽 Reserva Confirmada
    </motion.div>
  );
}

function FlowParticle({
  delay,
  fromX,
  fromY,
}: {
  delay: number;
  fromX: number;
  fromY: number;
}) {
  return (
    <motion.div
      initial={{ x: fromX, y: fromY, opacity: 0 }}
      animate={{ x: 180, y: 245, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, delay, ease: "easeInOut" }}
      className="absolute z-20 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,1)]"
    />
  );
}

function FlowParticleToBooking({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ x: 180, y: 285, opacity: 0 }}
      animate={{ x: 180, y: 445, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeInOut" }}
      className="absolute z-20 h-3 w-3 rounded-full bg-green-400 shadow-[0_0_22px_rgba(34,197,94,1)]"
    />
  );
}

function HeroStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <motion.div
      whileInView={{ y: [12, 0], opacity: [0, 1] }}
      viewport={{ once: true }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur"
    >
      <p className="text-lg">{icon}</p>
      <p className="mt-1 text-sm font-black text-cyan-300">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </motion.div>
  );
}

function BigCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, margin: "-80px" }}
      className="relative overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_45px_rgba(34,211,238,0.08)]"
    >
      <div className="absolute right-5 top-4 text-6xl font-black text-cyan-300/10">
        {number}
      </div>
      <p className="mb-3 text-xs font-black text-cyan-300">{number}</p>
      <h3 className="mb-3 text-2xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{text}</p>
    </motion.div>
  );
}

function AiItem({ title, text }: { title: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -22 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-4"
    >
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </motion.div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true }}
      className="rounded-[30px] border border-cyan-300/10 bg-[#06111f] p-6"
    >
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </motion.div>
  );
}

function TemplateCard({ name, text }: { name: string; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-3"
    >
      <div className="h-52 rounded-[22px] bg-gradient-to-br from-slate-950 via-slate-800 to-cyan-900 p-4">
        <div className="mb-4 h-20 rounded-2xl bg-white/10" />
        <div className="mb-2 h-3 w-3/4 rounded-full bg-white/30" />
        <div className="mb-5 h-3 w-1/2 rounded-full bg-white/20" />
        <div className="inline-flex rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-black">
          Reservar
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-xl font-black">{name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
      </div>
    </motion.div>
  );
}

function PriceCard({
  title,
  price,
  text,
  items,
  cta,
  href,
  highlighted,
}: {
  title: string;
  price: string;
  text: string;
  items: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true }}
      className={
        highlighted
          ? "relative overflow-hidden rounded-[32px] border border-cyan-300/30 bg-gradient-to-b from-cyan-300/20 to-white/[0.04] p-7 shadow-[0_0_80px_rgba(34,211,238,0.22)]"
          : "relative overflow-hidden rounded-[32px] border border-cyan-300/10 bg-[#06111f] p-7"
      }
    >
      {highlighted && (
        <span className="mb-5 inline-flex rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-black">
          Mais popular
        </span>
      )}

      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-4 text-5xl font-black text-cyan-300">{price}</p>
      <p className="mt-4 text-sm leading-relaxed text-slate-400">{text}</p>

      <ul className="mt-6 space-y-3 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>

      <Link
        href={href}
        className={
          highlighted
            ? "mt-7 inline-flex w-full justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black hover:opacity-90"
            : "mt-7 inline-flex w-full justify-center rounded-full border border-cyan-300/20 bg-white/5 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
        }
      >
        {cta}
      </Link>
    </motion.div>
  );
}

function Dash({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-cyan-300">{label}</p>
    </div>
  );
}

function Reservation({
  time,
  name,
  status,
  danger,
}: {
  time: string;
  name: string;
  status: string;
  danger?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-3">
      <div>
        <p className="text-sm font-black text-cyan-300">{time}</p>
        <p className="text-sm font-bold">{name}</p>
      </div>

      <span
        className={
          danger
            ? "rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300"
            : "rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300"
        }
      >
        {status}
      </span>
    </div>
  );
}
