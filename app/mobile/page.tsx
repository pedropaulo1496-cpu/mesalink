import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MobilePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070504] text-[#fff7ea]">
      <section className="relative px-5 pb-12 pt-5">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#f0c36a]/20 blur-3xl" />
        <div className="absolute -left-24 top-80 h-72 w-72 rounded-full bg-[#f0c36a]/10 blur-3xl" />

        <nav className="relative z-10 mb-10 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Mesa<span className="text-[#f0c36a]">Link</span>
          </Link>

          <Link
            href="/login"
            className="rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-sm font-bold text-[#f0c36a]"
          >
            Entrar
          </Link>
        </nav>

        <div className="relative z-10">
          <div className="mb-5 inline-flex rounded-full border border-[#f0c36a]/30 bg-[#f0c36a]/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#f0c36a]">
            Reservas online para restaurantes
          </div>

          <h1 className="mb-5 text-[44px] font-black leading-[0.95] tracking-tight">
            Receba reservas pelas{" "}
            <span className="text-[#f0c36a]">
              redes sociais, Google Maps e website.
            </span>
          </h1>

          <p className="mb-7 text-base leading-relaxed text-[#d6c7ad]">
            Um único link para transformar Instagram, Facebook, TikTok, Google
            Maps, website e QR Codes em reservas confirmadas.
          </p>

          <div className="grid gap-3">
            <Button
              asChild
              className="h-14 rounded-full bg-[#f0c36a] text-base font-black text-black shadow-[0_0_40px_rgba(240,195,106,0.35)] hover:bg-[#ffd982]"
            >
              <Link href="/register">Começar teste gratuito</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-14 rounded-full border-[#f0c36a]/40 bg-white/5 text-base text-white hover:bg-white/10"
            >
              <Link href="/pricing">Ver preços</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-[#a99a82]">
            Desde <strong className="text-[#f0c36a]">17,50€ + IVA/mês</strong>.
            Sem cartão de crédito.
          </p>
        </div>
      </section>

      <section className="px-5 pb-12">
        <PhoneMockup />
      </section>

      <section className="sticky top-0 z-20 border-y border-[#f0c36a]/10 bg-[#070504]/90 px-5 py-4 backdrop-blur-xl">
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat value="24h" label="online" />
          <MiniStat value="0%" label="comissão" />
          <MiniStat value="10min" label="setup" />
        </div>
      </section>

      <section className="px-5 py-14">
        <Title eyebrow="Canais" title="Receba reservas de todo o lado." />

        <div className="grid gap-4">
          <FloatingCard
            icon="📸"
            title="Instagram"
            text="Link na bio, stories, destaques e campanhas."
          />
          <FloatingCard
            icon="📍"
            title="Google Maps"
            text="Transforme pesquisas locais em reservas confirmadas."
          />
          <FloatingCard
            icon="🎵"
            title="TikTok e Facebook"
            text="Partilhe o link em publicações, anúncios e mensagens."
          />
          <FloatingCard
            icon="🔗"
            title="Website e QR Code"
            text="Reservas diretas no site, menus, montra e cartões."
          />
        </div>
      </section>

      <section className="relative bg-[#0d0a07] px-5 py-14">
        <div className="absolute right-5 top-8 h-20 w-20 animate-pulse rounded-full bg-[#f0c36a]/20 blur-2xl" />

        <Title eyebrow="Como funciona" title="Do clique à reserva em segundos." />

        <div className="relative grid gap-4">
          <Step number="1" title="Partilhe o link" text="Coloque o link onde os clientes já estão." />
          <Step number="2" title="Cliente escolhe hora" text="Data, hora, pessoas e dados da reserva." />
          <Step number="3" title="Recebe no painel" text="Confirme, organize e acompanhe tudo no MesaLink." />
        </div>
      </section>

      <section className="px-5 py-14">
        <Title eyebrow="App" title="Uma central de reservas no bolso." />

        <div className="grid gap-4">
          <FloatingCard
            icon="🍽️"
            title="Serviço do dia"
            text="Veja almoço, jantar, pendentes, check-ins e no-shows."
          />
          <FloatingCard
            icon="👥"
            title="Clientes automáticos"
            text="Histórico, contactos, visitas e observações."
          />
          <FloatingCard
            icon="🪑"
            title="Mesas e capacidade"
            text="Controle lotação, mesas disponíveis e horários."
          />
          <FloatingCard
            icon="✅"
            title="Aprovação manual"
            text="Aprove grupos grandes ou pedidos especiais antes de confirmar."
          />
        </div>
      </section>

      <section className="px-5 pb-14">
        <div className="relative overflow-hidden rounded-[32px] bg-[#f0c36a] p-6 text-black">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />

          <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-black/60">
            Comece agora
          </p>

          <h2 className="mb-3 text-4xl font-black leading-none">
            O seu restaurante a receber reservas 24h/dia.
          </h2>

          <p className="mb-6 text-black/70">
            Sem comissões. Sem complicações. Sem perder clientes por mensagem.
          </p>

          <Button asChild className="h-14 w-full rounded-full bg-black text-base font-black text-white hover:bg-black/90">
            <Link href="/register">Criar conta grátis</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto max-w-sm">
      <div className="absolute inset-0 translate-y-8 rounded-[3rem] bg-[#f0c36a]/20 blur-3xl" />

      <div className="relative rounded-[2.5rem] border border-[#f0c36a]/25 bg-[#120d08] p-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-[#f0c36a]/40" />

        <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#070504] p-4">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#a99a82]">Hoje</p>
              <h3 className="text-xl font-black">Serviço do dia</h3>
            </div>
            <span className="rounded-full bg-[#f0c36a]/15 px-3 py-1 text-xs font-black text-[#f0c36a]">
              Jantar
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            <DashStat value="18" label="Reservas" />
            <DashStat value="64" label="Pessoas" />
            <DashStat value="3" label="Pend." />
          </div>

          <ReservationRow time="20:00" name="João Silva" people="4 pessoas" />
          <ReservationRow time="20:30" name="Ana Costa" people="2 pessoas" />
          <ReservationRow time="21:00" name="Pedro Santos" people="6 pessoas" pending />
        </div>
      </div>
    </div>
  );
}

function DashStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-white/5 p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[11px] text-[#a99a82]">{label}</p>
    </div>
  );
}

function ReservationRow({
  time,
  name,
  people,
  pending,
}: {
  time: string;
  name: string;
  people: string;
  pending?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/5 p-3">
      <div className="flex gap-3">
        <p className="text-sm font-bold text-[#f0c36a]">{time}</p>
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-xs text-[#a99a82]">{people}</p>
        </div>
      </div>

      <span
        className={
          pending
            ? "rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300"
            : "rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black text-green-300"
        }
      >
        {pending ? "Pendente" : "OK"}
      </span>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-black text-[#f0c36a]">{value}</p>
      <p className="text-[11px] uppercase tracking-widest text-[#a99a82]">
        {label}
      </p>
    </div>
  );
}

function Title({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black leading-tight">{title}</h2>
    </div>
  );
}

function FloatingCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[26px] border border-[#f0c36a]/10 bg-[#15100b] p-5 shadow-xl transition active:scale-[0.98]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0c36a]/15 text-2xl">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
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
    <div className="rounded-[26px] border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0c36a] text-lg font-black text-black">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </div>
  );
}