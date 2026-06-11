import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 px-5 pb-20 pt-5 sm:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Link
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm lg:flex">
            <Link href="#features" className="text-slate-400 hover:text-white">
              Funcionalidades
            </Link>
            <Link href="/pricing" className="text-slate-400 hover:text-white">
              Preços
            </Link>
            <Link href="/contact" className="text-slate-400 hover:text-white">
              Contacto
            </Link>
            <Link href="/login" className="text-slate-400 hover:text-white">
              Entrar
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-6 py-3 font-black text-black shadow-[0_0_45px_rgba(96,165,250,0.35)]"
            >
              Começar
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/25 bg-white/5 px-5 py-2 text-sm font-black text-cyan-200 backdrop-blur lg:hidden"
          >
            Entrar
          </Link>
        </nav>

        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 py-16 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <Badge>AI Reservation OS</Badge>

            <h1 className="mt-6 max-w-4xl text-[54px] font-black leading-[0.88] tracking-[-0.075em] sm:text-7xl lg:text-8xl">
              A próxima geração das{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-400 bg-clip-text text-transparent">
                reservas para restaurantes.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300">
              Transforme Google Maps, Instagram e website num sistema
              inteligente de reservas — sem chamadas perdidas, sem papel e sem
              comissões.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-14 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.45)] hover:opacity-90"
              >
                <Link href="/register">Ativar MesaLink AI →</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-14 rounded-full border-cyan-300/30 bg-white/5 px-8 text-base font-black text-white backdrop-blur hover:bg-white/10"
              >
                <Link href="/pricing">Ver planos →</Link>
              </Button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <HeroStat value="0%" label="comissões" />
              <HeroStat value="24h" label="online" />
              <HeroStat value="10min" label="setup" />
            </div>
          </div>

          <ProductMockup />
        </div>
      </section>

      <section className="relative z-10 border-y border-cyan-300/10 bg-[#020617]/70 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <Badge>Como funciona</Badge>

          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Do Google Maps à reserva confirmada.
          </h2>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Step
              number="01"
              title="Adicione o link"
              text="Coloque o MesaLink no Google Maps, Instagram, website e QR Code."
            />
            <Step
              number="02"
              title="O cliente reserva"
              text="Escolhe data, hora e pessoas numa página simples e premium."
            />
            <Step
              number="03"
              title="Gere no painel"
              text="Veja reservas, clientes, horários e serviço do dia num só lugar."
            />
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge>Restaurant AI OS</Badge>

              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
                Uma sala de controlo para as reservas.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-slate-400 lg:pt-12">
              O MesaLink organiza os canais que já trazem clientes ao
              restaurante e transforma essa procura em reservas fáceis de gerir.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="📍"
              title="Google Maps first"
              text="Transforme pesquisas locais em reservas reais."
            />
            <Feature
              icon="📸"
              title="Redes sociais"
              text="Bio, stories, reels, TikTok e Facebook com reserva direta."
            />
            <Feature
              icon="🌐"
              title="Website & QR"
              text="Link direto para reservas em qualquer canal."
            />
            <Feature
              icon="⚡"
              title="Serviço do dia"
              text="Almoço, jantar, pendentes, confirmadas, check-ins e no-shows."
            />
            <Feature
              icon="🧠"
              title="Clientes automáticos"
              text="Histórico, contactos e observações guardados sem esforço."
            />
            <Feature
              icon="🛡️"
              title="Controlo total"
              text="Aprovação manual para grupos grandes ou pedidos especiais."
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#06111f] p-8 shadow-[0_0_100px_rgba(34,211,238,0.14)]">
            <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
            <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-500/20 blur-[90px]" />

            <div className="relative">
              <Badge purple>MesaLink Intelligence</Badge>

              <h2 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl">
                Brevemente, uma IA para{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
                  vender mais mesas.
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
                Estamos a preparar uma camada inteligente para prever movimento,
                reduzir no-shows e otimizar horários automaticamente.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <AiItem title="Previsão de ocupação" />
                <AiItem title="Sugestão de horários" />
                <AiItem title="Previsão de no-shows" />
                <AiItem title="Assistente operacional" />
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-2xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Preço de lançamento
            </p>

            <h3 className="mt-5 text-4xl font-black tracking-[-0.05em]">
              Starter
            </h3>

            <div className="mt-5">
              <span className="text-6xl font-black tracking-[-0.07em] text-cyan-300">
                17,50€
              </span>
              <span className="ml-2 text-sm text-slate-400">
                + IVA / mês
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Por restaurante. Sem comissões por reserva.
            </p>

            <Link
              href="/pricing"
              className="mt-8 flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_55px_rgba(96,165,250,0.35)]"
            >
              Ver planos →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-cyan-300/20 bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 p-8 text-black shadow-[0_0_100px_rgba(96,165,250,0.45)] sm:p-10">
          <h2 className="max-w-3xl text-[44px] font-black leading-[0.88] tracking-[-0.07em] sm:text-6xl">
            Entre agora no futuro inteligente das reservas.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/70">
            Ative o MesaLink e transforme cada canal online numa fonte de
            reservas.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-black px-8 text-base font-black text-white hover:bg-black/90"
          >
            Criar conta grátis →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[130px]" />
      <div className="absolute right-[-180px] top-[420px] h-[420px] w-[420px] rounded-full bg-violet-500/18 blur-[120px]" />
      <div className="absolute bottom-[-180px] left-[-160px] h-[380px] w-[380px] rounded-full bg-blue-500/16 blur-[110px]" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(125,211,252,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_35%),linear-gradient(to_bottom,#020617,#050816_35%,#020617)]" />
    </div>
  );
}

function Badge({
  children,
  purple,
}: {
  children: React.ReactNode;
  purple?: boolean;
}) {
  return (
    <span
      className={
        purple
          ? "inline-flex rounded-full border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-violet-200"
          : "inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200"
      }
    >
      {children}
    </span>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
      <p className="text-2xl font-black text-cyan-300">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute inset-0 translate-y-8 rounded-[48px] bg-cyan-500/20 blur-[90px]" />
      <div className="absolute inset-0 translate-y-14 rounded-[48px] bg-violet-500/15 blur-[110px]" />

      <div className="relative rounded-[36px] border border-cyan-300/25 bg-[#06111f]/95 p-4 shadow-2xl">
        <div className="mb-4 flex items-center gap-2 px-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="ml-auto text-xs text-slate-400">
            MesaLink AI OS
          </span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/35">
          <div className="border-b border-white/10 p-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Live Control
            </p>
            <h3 className="mt-2 text-3xl font-black">Serviço de hoje</h3>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <Dash value="18" label="Reservas" />
            <Dash value="64" label="Pessoas" />
            <Dash value="91%" label="Ocupação" />
          </div>

          <div className="mx-6 mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              AI Prediction
            </p>
            <p className="mt-2 text-2xl font-black text-cyan-200">
              20:00 <span className="text-white">· Pico forte</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Sugestão: proteger mesas de 2 pessoas.
            </p>
          </div>

          <div className="px-6 pb-6">
            <Reservation time="20:00" name="João Silva" status="Confirmada" />
            <Reservation time="20:30" name="Ana Costa" status="Confirmada" />
            <Reservation time="21:00" name="Pedro Santos" status="Pendente" danger />
          </div>
        </div>
      </div>
    </div>
  );
}

function Dash({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs text-cyan-300">{label}</p>
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
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-4">
      <div>
        <p className="text-sm font-black text-cyan-300">{time}</p>
        <p className="font-bold">{name}</p>
      </div>

      <span
        className={
          danger
            ? "rounded-full bg-red-500/15 px-3 py-1 text-xs font-black text-red-300"
            : "rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300"
        }
      >
        {status}
      </span>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-cyan-300/10 bg-white/[0.04] p-7 text-left backdrop-blur">
      <p className="text-sm font-black text-cyan-300">{number}</p>
      <h3 className="mt-5 text-2xl font-black">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-cyan-300/10 bg-[#06111f] p-6">
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-4 text-2xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function AiItem({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-cyan-300/10 bg-white/[0.04] p-4">
      <p className="font-black text-white">{title}</p>
    </div>
  );
}