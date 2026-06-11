"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MobilePage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.25], [-6, 4]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020201] text-[#fff7ea]">
      <Background />

      <section className="relative z-10 min-h-screen px-5 pb-14 pt-5">
        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa<span className="text-[#f0c36a]">Link</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-[#f0c36a]/40 bg-black/30 px-5 py-2 text-sm font-black text-[#f0c36a] backdrop-blur"
          >
            Entrar
          </Link>
        </nav>

        <motion.div style={{ y: heroY }}>
          <Badge>✦ O futuro das reservas</Badge>

          <h1 className="mt-5 text-[52px] font-black leading-[0.88] tracking-[-0.07em]">
            Transforme o{" "}
            <span className="bg-gradient-to-r from-[#f0c36a] via-[#fff3bd] to-[#f0c36a] bg-clip-text text-transparent">
              Google Maps
            </span>{" "}
            numa máquina de reservas.
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-[#d6c7ad]">
            O MesaLink liga Google Maps, Instagram, TikTok, website e QR Codes
            a uma central de reservas futurista. Sem chamadas. Sem comissões.
            Sem perder clientes.
          </p>

          <div className="mt-7 grid gap-3">
            <Button asChild className="h-14 rounded-full bg-[#f0c36a] text-base font-black text-black shadow-[0_0_65px_rgba(240,195,106,0.5)] hover:bg-[#ffd982]">
              <Link href="/register">Ativar MesaLink →</Link>
            </Button>

            <Button asChild variant="outline" className="h-14 rounded-full border-[#f0c36a]/40 bg-black/30 text-base font-black text-white backdrop-blur hover:bg-white/10">
              <Link href="/pricing">Ver planos →</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <HeroStat icon="⚡" value="10 min" label="setup" />
            <HeroStat icon="📍" value="Maps" label="ready" />
            <HeroStat icon="🤖" value="IA" label="brevemente" />
          </div>
        </motion.div>

        <motion.div style={{ rotate: phoneRotate }} className="mt-12">
          <PhoneHero />
        </motion.div>
      </section>

      <StickyBar />

      <section className="relative z-10 px-5 py-14">
        <Badge>Google Maps first</Badge>

        <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
          Quem encontra o restaurante no Google{" "}
          <span className="text-[#f0c36a]">reserva na hora.</span>
        </h2>

        <p className="mt-5 text-base leading-relaxed text-[#a99a82]">
          O perfil Google deixa de ser só uma montra. Passa a ser uma entrada
          direta para reservas confirmadas.
        </p>

        <div className="mt-8 grid gap-4">
          <BigCard number="01" title="Google Maps" text="Transforme pesquisas locais em reservas reais." />
          <BigCard number="02" title="Redes sociais" text="Bio, stories, reels, TikTok e Facebook com reserva direta." />
          <BigCard number="03" title="Website & QR" text="Reserve direto do site, menus, montra e cartões." />
        </div>
      </section>

      <section className="relative z-10 px-5 py-14">
        <div className="relative overflow-hidden rounded-[36px] border border-blue-400/20 bg-[#080b1a] p-6 shadow-[0_0_90px_rgba(59,130,246,0.2)]">
          <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-blue-500/25 blur-[70px]" />
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-purple-500/20 blur-[70px]" />

          <Badge purple>Brevemente com IA</Badge>

          <h2 className="relative mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
            O próximo salto das reservas vem com{" "}
            <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Inteligência Artificial.
            </span>
          </h2>

          <p className="relative mt-5 text-base leading-relaxed text-[#b8bed6]">
            Em breve, o MesaLink vai ajudar a prever movimento, sugerir horários,
            otimizar capacidade e automatizar mensagens.
          </p>

          <div className="relative mt-8 grid gap-3">
            <AiItem title="Previsão de movimento" text="Antecipe dias fortes, dias fracos e picos de procura." />
            <AiItem title="Sugestões inteligentes" text="Melhore horários, capacidade e ocupação." />
            <AiItem title="Mensagens automáticas" text="Confirmações, lembretes e follow-ups." />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14">
        <Badge>MesaLink OS</Badge>

        <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
          Uma sala de controlo para o restaurante.
        </h2>

        <div className="mt-8 grid gap-4">
          <Feature icon="⚡" title="Serviço do dia" text="Almoço, jantar, pendentes, confirmadas, check-ins e no-shows." />
          <Feature icon="👁️" title="Visão em tempo real" text="Saiba quantas pessoas entram em cada horário." />
          <Feature icon="🧠" title="Clientes automáticos" text="Histórico, contactos e observações guardados sem esforço." />
          <Feature icon="🛡️" title="Controlo total" text="Aprovação manual para grupos grandes ou pedidos especiais." />
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16">
        <div className="relative overflow-hidden rounded-[36px] border border-[#f0c36a]/20 bg-[#f0c36a] p-7 text-black shadow-[0_0_90px_rgba(240,195,106,0.4)]">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-3xl" />

          <h2 className="relative text-[42px] font-black leading-[0.88] tracking-[-0.06em]">
            Entre agora no futuro das reservas.
          </h2>

          <p className="relative mt-5 text-base leading-relaxed text-black/70">
            Ative o MesaLink e transforme cada canal online numa fonte de
            reservas.
          </p>

          <Button asChild className="relative mt-7 h-14 w-full rounded-full bg-black text-base font-black text-white hover:bg-black/90">
            <Link href="/register">Criar conta grátis →</Link>
          </Button>

          <div className="relative mt-6 grid grid-cols-2 gap-4 text-sm text-black/70">
            <p>💳 Sem cartão de crédito</p>
            <p>⏱️ Cancele quando quiser</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <motion.div
        animate={{ scale: [1, 1.15, 1], y: [0, 40, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[-140px] h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#f0c36a]/25 blur-[100px]"
      />

      <motion.div
        animate={{ x: [0, -35, 0], y: [0, 50, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-140px] top-[420px] h-[300px] w-[300px] rounded-full bg-orange-500/15 blur-[90px]"
      />

      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-[linear-gradient(rgba(240,195,106,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(240,195,106,0.08)_1px,transparent_1px)] bg-[size:44px_44px]"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(240,195,106,0.16),transparent_35%),linear-gradient(to_bottom,#020201,#070504_35%,#020201)]" />
    </div>
  );
}

function StickyBar() {
  return (
    <section className="sticky top-0 z-30 border-y border-[#f0c36a]/10 bg-[#020201]/80 px-5 py-4 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f0c36a]">
            Live system
          </p>
          <p className="text-sm font-bold text-white">Google Maps → Reserva</p>
        </div>

        <Link href="/register" className="rounded-full bg-[#f0c36a] px-4 py-2 text-sm font-black text-black">
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
          ? "relative inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-purple-200"
          : "relative inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#f0c36a]"
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
      className="relative mx-auto max-w-[330px]"
    >
      <div className="absolute inset-0 translate-y-10 rounded-[48px] bg-[#f0c36a]/30 blur-[70px]" />

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-[44px] border border-[#f0c36a]/40 bg-gradient-to-b from-[#1b1308] to-[#050302] p-3 shadow-2xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-[#f0c36a]/50" />

        <div className="rounded-[34px] border border-white/10 bg-black/50 p-4 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#a99a82]">MesaLink OS</p>
              <h3 className="text-2xl font-black">Live Service</h3>
            </div>

            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">
              ON
            </span>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            <Dash value="18" label="Reservas" />
            <Dash value="64" label="Pessoas" />
            <Dash value="3" label="Pend." />
          </div>

          <div className="mb-5 rounded-2xl border border-[#f0c36a]/20 bg-[#f0c36a]/10 p-4 shadow-[0_0_35px_rgba(240,195,106,0.18)]">
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#f0c36a]">
              Próxima entrada
            </p>
            <p className="text-2xl font-black text-[#f0c36a]">
              20:00 <span className="text-white">· 4 pessoas</span>
            </p>
            <p className="mt-1 text-sm text-[#d6c7ad]">João Silva</p>
          </div>

          <Reservation time="20:00" name="João Silva" status="Confirmada" />
          <Reservation time="20:30" name="Ana Costa" status="Confirmada" />
          <Reservation time="21:00" name="Pedro Santos" status="Pendente" danger />
        </div>
      </motion.div>
    </motion.div>
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
      <p className="mt-1 text-sm font-black text-[#f0c36a]">{value}</p>
      <p className="text-[10px] text-[#a99a82]">{label}</p>
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
      className="relative overflow-hidden rounded-[30px] border border-[#f0c36a]/20 bg-[#120d08] p-6 shadow-[0_0_40px_rgba(240,195,106,0.08)]"
    >
      <div className="absolute right-5 top-4 text-6xl font-black text-[#f0c36a]/10">
        {number}
      </div>
      <p className="mb-3 text-xs font-black text-[#f0c36a]">{number}</p>
      <h3 className="mb-3 text-2xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
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
      className="rounded-2xl border border-blue-300/10 bg-white/[0.04] p-4"
    >
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="mt-1 text-sm text-[#9fa8c8]">{text}</p>
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
      className="rounded-[30px] border border-[#f0c36a]/10 bg-[#120d08] p-6"
    >
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </motion.div>
  );
}

function Dash({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-[#f0c36a]">{label}</p>
    </div>
  );
}

function Reservation({ time, name, status, danger }: { time: string; name: string; status: string; danger?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-3">
      <div>
        <p className="text-sm font-black text-[#f0c36a]">{time}</p>
        <p className="text-sm font-bold">{name}</p>
      </div>

      <span className={danger ? "rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300" : "rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300"}>
        {status}
      </span>
    </div>
  );
}