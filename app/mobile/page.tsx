"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MobilePage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const phoneRotate = useTransform(scrollYProgress, [0, 0.25], [-6, 4]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 min-h-screen px-5 pb-14 pt-5">
        <nav className="mb-12 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa<span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Link</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/30 bg-white/5 px-5 py-2 text-sm font-black text-cyan-200 backdrop-blur"
          >
            Entrar
          </Link>
        </nav>

        <motion.div style={{ y: heroY }}>
          <Badge>AI Reservation OS</Badge>

          <h1 className="mt-5 text-[52px] font-black leading-[0.88] tracking-[-0.07em]">
            O futuro das reservas tem{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              inteligência.
            </span>
          </h1>

          <p className="mt-6 text-[17px] leading-relaxed text-slate-300">
            Transforme Google Maps, Instagram, TikTok, website e QR Codes numa
            central inteligente de reservas. Hoje: automação. Brevemente: IA.
          </p>

          <div className="mt-7 grid gap-3">
            <Button asChild className="h-14 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_65px_rgba(96,165,250,0.55)] hover:opacity-90">
              <Link href="/register">Ativar MesaLink AI →</Link>
            </Button>

            <Button asChild variant="outline" className="h-14 rounded-full border-cyan-300/30 bg-white/5 text-base font-black text-white backdrop-blur hover:bg-white/10">
              <Link href="/pricing">Ver planos →</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <HeroStat icon="📍" value="Maps" label="ready" />
            <HeroStat icon="⚡" value="24h" label="online" />
            <HeroStat icon="🤖" value="IA" label="brevemente" />
          </div>
        </motion.div>

        <motion.div style={{ rotate: phoneRotate }} className="mt-12">
          <PhoneHero />
        </motion.div>
      </section>

      <StickyBar />

      <section className="relative z-10 px-5 py-16">
        <Badge>AI Flow</Badge>

        <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
          Todos os canais entram no{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
            AI Core.
          </span>
        </h2>

        <p className="mt-5 text-base leading-relaxed text-slate-400">
          Google Maps, redes sociais e website convergem para uma central
          inteligente de reservas.
        </p>

        <FlowNetwork />
      </section>

      <section className="relative z-10 px-5 py-14">
        <Badge>Google Maps first</Badge>

        <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
          Quem encontra o restaurante no Google{" "}
          <span className="text-cyan-300">reserva na hora.</span>
        </h2>

        <p className="mt-5 text-base leading-relaxed text-slate-400">
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
        <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-6 shadow-[0_0_90px_rgba(34,211,238,0.2)]">
          <div className="absolute -right-16 top-10 h-52 w-52 rounded-full bg-cyan-500/25 blur-[70px]" />
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/25 blur-[70px]" />

          <Badge purple>MesaLink Intelligence</Badge>

          <h2 className="relative mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
            Brevemente, uma IA para{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              vender mais mesas.
            </span>
          </h2>

          <p className="relative mt-5 text-base leading-relaxed text-slate-300">
            Estamos a preparar uma camada inteligente para prever movimento,
            reduzir no-shows e otimizar horários automaticamente.
          </p>

          <div className="relative mt-8 grid gap-3">
            <AiItem title="Previsão de ocupação" text="Antecipe dias fortes, dias fracos e picos de procura." />
            <AiItem title="Sugestão de horários" text="Recomendações automáticas para melhorar ocupação." />
            <AiItem title="Previsão de no-shows" text="Identifique reservas com maior risco de falha." />
            <AiItem title="Assistente operacional" text="Ajuda inteligente para gerir o serviço do dia." />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 py-14">
        <Badge>Restaurant AI OS</Badge>

        <h2 className="mt-5 text-[40px] font-black leading-[0.92] tracking-[-0.05em]">
          Uma sala de controlo inteligente para o restaurante.
        </h2>

        <div className="mt-8 grid gap-4">
          <Feature icon="⚡" title="Serviço do dia" text="Almoço, jantar, pendentes, confirmadas, check-ins e no-shows." />
          <Feature icon="👁️" title="Visão em tempo real" text="Saiba quantas pessoas entram em cada horário." />
          <Feature icon="🧠" title="Clientes automáticos" text="Histórico, contactos e observações guardados sem esforço." />
          <Feature icon="🛡️" title="Controlo total" text="Aprovação manual para grupos grandes ou pedidos especiais." />
        </div>
      </section>

      <section className="relative z-10 px-5 pb-16">
        <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-7 text-black shadow-[0_0_90px_rgba(96,165,250,0.5)]">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/40 blur-3xl" />

          <h2 className="relative text-[42px] font-black leading-[0.88] tracking-[-0.06em]">
            Entre agora no futuro inteligente das reservas.
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

function FlowNetwork() {
  return (
    <div className="relative mx-auto mt-10 h-[460px] max-w-sm overflow-hidden rounded-[36px] border border-cyan-300/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.18),transparent_35%)]" />

      <FlowLine />

      <Source top={24} left={14} icon="📍" label="Google Maps" />
      <Source top={112} left={6} icon="📸" label="Instagram" />
      <Source top={208} left={22} icon="🎵" label="TikTok" />
      <Source top={304} left={12} icon="🌐" label="Website" />

      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 35px rgba(34,211,238,0.22)",
            "0 0 75px rgba(167,139,250,0.45)",
            "0 0 35px rgba(34,211,238,0.22)",
          ],
        }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-[165px] z-10 flex h-32 w-32 -translate-x-1/2 flex-col items-center justify-center rounded-[36px] border border-cyan-300/30 bg-[#06111f] text-center"
      >
        <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-xl font-black text-transparent">
          AI CORE
        </span>
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Processing
        </span>
      </motion.div>

      <ConfirmedBooking />

      <FlowParticle delay={0} startY={50} />
      <FlowParticle delay={0.9} startY={138} />
      <FlowParticle delay={1.8} startY={234} />
      <FlowParticle delay={2.7} startY={330} />
      <FlowParticleToBooking delay={1.2} />
      <FlowParticleToBooking delay={2.8} />
    </div>
  );
}

function FlowLine() {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 460" fill="none">
      <path d="M86 58 C150 70 165 150 180 200" stroke="rgba(34,211,238,0.18)" strokeWidth="2" />
      <path d="M78 146 C140 155 160 180 180 210" stroke="rgba(96,165,250,0.18)" strokeWidth="2" />
      <path d="M88 242 C140 240 158 220 180 220" stroke="rgba(167,139,250,0.18)" strokeWidth="2" />
      <path d="M82 338 C150 330 168 270 180 240" stroke="rgba(34,211,238,0.18)" strokeWidth="2" />
      <path d="M180 260 C190 330 190 370 180 410" stroke="rgba(34,197,94,0.22)" strokeWidth="2" />
    </svg>
  );
}

function Source({
  top,
  left,
  icon,
  label,
}: {
  top: number;
  left: number;
  icon: string;
  label: string;
}) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ top, left }}
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

function FlowParticle({ delay, startY }: { delay: number; startY: number }) {
  return (
    <motion.div
      initial={{ x: 80, y: startY, opacity: 0 }}
      animate={{ x: 180, y: 210, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, delay, ease: "easeInOut" }}
      className="absolute z-20 h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(34,211,238,1)]"
    />
  );
}

function FlowParticleToBooking({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ x: 180, y: 260, opacity: 0 }}
      animate={{ x: 180, y: 400, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeInOut" }}
      className="absolute z-20 h-3 w-3 rounded-full bg-green-400 shadow-[0_0_22px_rgba(34,197,94,1)]"
    />
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