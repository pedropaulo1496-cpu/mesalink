"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MobilePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030201] text-[#fff7ea]">
      <ScrollLine />

      <section className="relative min-h-screen px-5 pb-10 pt-5">
        <div className="absolute left-1/2 top-[-120px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#f0c36a]/25 blur-[90px]" />
        <div className="absolute right-[-120px] top-[220px] h-[260px] w-[260px] rounded-full bg-orange-500/15 blur-[80px]" />

        <nav className="relative z-10 mb-12 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight">
            Mesa<span className="text-[#f0c36a]">Link</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-[#f0c36a]/30 bg-white/5 px-4 py-2 text-sm font-bold text-[#f0c36a] backdrop-blur"
          >
            Entrar
          </Link>
        </nav>

        <div className="relative z-10">
          <p className="mb-5 inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-[#f0c36a]">
            Sistema inteligente de reservas
          </p>

          <h1 className="mb-5 text-[48px] font-black leading-[0.9] tracking-[-0.06em]">
            O futuro das{" "}
            <span className="bg-gradient-to-r from-[#f0c36a] via-[#fff0b8] to-[#f0c36a] bg-clip-text text-transparent">
              reservas online
            </span>{" "}
            do seu restaurante.
          </h1>

          <p className="mb-7 text-[17px] leading-relaxed text-[#d6c7ad]">
            Transforme Instagram, TikTok, Google Maps, website e QR Codes numa
            máquina automática de reservas — sem chamadas, sem comissões e sem
            caos no WhatsApp.
          </p>

          <div className="grid gap-3">
            <Button asChild className="h-14 rounded-full bg-[#f0c36a] text-base font-black text-black shadow-[0_0_55px_rgba(240,195,106,0.42)] hover:bg-[#ffd982]">
              <Link href="/register">Ativar MesaLink</Link>
            </Button>

            <Button asChild variant="outline" className="h-14 rounded-full border-[#f0c36a]/40 bg-white/[0.04] text-base font-bold text-white backdrop-blur hover:bg-white/10">
              <Link href="/pricing">Ver planos</Link>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <PulseStat value="24h" label="online" />
            <PulseStat value="0%" label="comissões" />
            <PulseStat value="10min" label="setup" />
          </div>
        </div>

        <div className="relative z-10 mt-12">
          <FuturePhone />
        </div>
      </section>

      <section className="sticky top-0 z-30 border-y border-[#f0c36a]/10 bg-[#030201]/80 px-5 py-4 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f0c36a]">
              Live system
            </p>
            <p className="text-sm font-bold text-white">
              Reservas sempre ligadas
            </p>
          </div>

          <Link href="/register" className="rounded-full bg-[#f0c36a] px-4 py-2 text-sm font-black text-black">
            Começar
          </Link>
        </div>
      </section>

      <Section eyebrow="Canais" title="Um link. Todos os canais. Zero fricção.">
        <ChannelCard number="01" title="Instagram & TikTok" text="Transforme bio, stories, reels e campanhas em reservas confirmadas." />
        <ChannelCard number="02" title="Google Maps" text="Clientes que procuram restaurante passam a reservar em segundos." />
        <ChannelCard number="03" title="Website" text="Reservas diretas sem depender de plataformas com comissão." />
        <ChannelCard number="04" title="QR Codes" text="Menus, montra, cartões e mesas passam a gerar reservas." />
      </Section>

      <section className="relative bg-[#080604] px-5 py-16">
        <div className="absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-[#f0c36a]/10 blur-[90px]" />

        <GlowTitle eyebrow="Automação" title="O cliente reserva. O sistema organiza." />

        <div className="relative grid gap-4">
          <ProcessCard step="1" title="Cliente toca no link" text="Vem do Instagram, Google, site, QR Code ou anúncio." />
          <ProcessCard step="2" title="Escolhe data e hora" text="Sem mensagens, sem telefonemas, sem idas e voltas." />
          <ProcessCard step="3" title="MesaLink centraliza tudo" text="Reservas, clientes, horários, serviço do dia e histórico." />
        </div>
      </section>

      <Section eyebrow="Painel" title="Uma sala de controlo para o restaurante.">
        <FeatureCard icon="⚡" title="Serviço do dia" text="Almoço, jantar, pendentes, confirmadas, check-ins e no-shows." />
        <FeatureCard icon="👁️" title="Visão em tempo real" text="Saiba quantas pessoas entram em cada horário." />
        <FeatureCard icon="🧠" title="Clientes automáticos" text="Histórico, contactos e observações guardados sem esforço." />
        <FeatureCard icon="🛡️" title="Controlo total" text="Aprovação manual para grupos grandes ou pedidos especiais." />
      </Section>

      <section className="px-5 pb-16">
        <div className="relative overflow-hidden rounded-[36px] border border-[#f0c36a]/20 bg-[#f0c36a] p-7 text-black shadow-[0_0_80px_rgba(240,195,106,0.35)]">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-3xl" />

          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-black/55">
            Pronto para ligar?
          </p>

          <h2 className="mb-4 text-[40px] font-black leading-[0.92] tracking-[-0.04em]">
            O seu restaurante a receber reservas enquanto dorme.
          </h2>

          <p className="mb-7 text-base leading-relaxed text-black/70">
            Sem comissões. Sem perder clientes. Sem depender de mensagens.
          </p>

          <Button asChild className="h-14 w-full rounded-full bg-black text-base font-black text-white hover:bg-black/90">
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ScrollLine() {
  const { scrollYProgress } = useScroll();

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-20 opacity-90">
      <svg className="h-full w-full" viewBox="0 0 390 1200" fill="none" preserveAspectRatio="none">
        <path
          d="M335 110 C250 210 330 320 205 430 C95 530 120 655 260 770 C365 860 310 1000 110 1130"
          stroke="rgba(240,195,106,0.10)"
          strokeWidth="2"
        />

        <motion.path
          d="M335 110 C250 210 330 320 205 430 C95 530 120 655 260 770 C365 860 310 1000 110 1130"
          stroke="url(#goldGlow)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ pathLength }}
        />

        <defs>
          <linearGradient id="goldGlow" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f0c36a" />
            <stop offset="0.5" stopColor="#fff0b8" />
            <stop offset="1" stopColor="#f0c36a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function FuturePhone() {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, scale: 0.96 }}
      whileInView={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="relative mx-auto max-w-[360px]"
    >
      <div className="absolute inset-0 translate-y-8 scale-95 rounded-[3rem] bg-[#f0c36a]/25 blur-[70px]" />

      <div className="relative rounded-[42px] border border-[#f0c36a]/25 bg-gradient-to-b from-[#1c1308] to-[#070504] p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-[#f0c36a]/50" />

        <div className="rounded-[32px] border border-white/10 bg-black/35 p-4 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#a99a82]">MesaLink OS</p>
              <h3 className="text-2xl font-black">Live Service</h3>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-green-500/15 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-xs font-black text-green-300">ON</span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <Dash value="18" label="res." />
            <Dash value="64" label="pax" />
            <Dash value="3" label="pend." />
          </div>

          <div className="mb-4 rounded-2xl border border-[#f0c36a]/10 bg-[#f0c36a]/10 p-4">
            <p className="mb-1 text-xs font-bold text-[#f0c36a]">Próxima entrada</p>
            <p className="text-2xl font-black">20:00 · 4 pessoas</p>
          </div>

          <ReservationLine time="20:00" name="João Silva" />
          <ReservationLine time="20:30" name="Ana Costa" />
          <ReservationLine time="21:00" name="Pedro Santos" pending />
        </div>
      </div>
    </motion.div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative px-5 py-16">
      <GlowTitle eyebrow={eyebrow} title={title} />
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function PulseStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-white/[0.04] p-4 text-center backdrop-blur">
      <p className="text-2xl font-black text-[#f0c36a]">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-[#a99a82]">{label}</p>
    </div>
  );
}

function GlowTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#f0c36a]">
        {eyebrow}
      </p>
      <h2 className="text-[36px] font-black leading-[0.96] tracking-[-0.04em]">
        {title}
      </h2>
    </div>
  );
}

function ChannelCard({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, margin: "-80px" }}
      className="relative overflow-hidden rounded-[28px] border border-[#f0c36a]/10 bg-[#120d08] p-5"
    >
      <div className="absolute right-4 top-4 text-5xl font-black text-[#f0c36a]/10">{number}</div>
      <p className="mb-3 text-xs font-black text-[#f0c36a]">{number}</p>
      <h3 className="mb-2 text-2xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </motion.div>
  );
}

function ProcessCard({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <motion.div
      initial={{ x: -24, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0c36a] text-xl font-black text-black">
        {step}
      </div>
      <h3 className="mb-2 text-2xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.45 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-[28px] border border-[#f0c36a]/10 bg-[#120d08] p-5"
    >
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="mb-2 text-2xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </motion.div>
  );
}

function Dash({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] uppercase text-[#a99a82]">{label}</p>
    </div>
  );
}

function ReservationLine({ time, name, pending }: { time: string; name: string; pending?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
      <div>
        <p className="text-sm font-black text-[#f0c36a]">{time}</p>
        <p className="text-sm font-bold">{name}</p>
      </div>

      <span className={pending ? "rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300" : "rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300"}>
        {pending ? "Pendente" : "OK"}
      </span>
    </div>
  );
}