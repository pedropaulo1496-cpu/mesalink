import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MobilePage() {
  return (
    <main className="min-h-screen bg-[#070504] px-5 py-5 text-[#fff7ea]">
      <nav className="mb-10 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black">
          Mesa<span className="text-[#f0c36a]">Link</span>
        </Link>

        <Link href="/login" className="rounded-full bg-[#f0c36a] px-4 py-2 text-sm font-bold text-black">
          Entrar
        </Link>
      </nav>

      <section className="rounded-[28px] border border-[#f0c36a]/20 bg-[#120d08] p-6">
        <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
          Reservas online
        </p>

        <h1 className="mb-5 text-4xl font-black leading-tight">
          Receba reservas pelo <span className="text-[#f0c36a]">Google Maps.</span>
        </h1>

        <p className="mb-7 text-base leading-relaxed text-[#d6c7ad]">
          Um link simples para os clientes reservarem mesa online. Sem chamadas,
          sem mensagens perdidas e sem comissões.
        </p>

        <div className="grid gap-3">
          <Button asChild className="h-14 rounded-full bg-[#f0c36a] text-base font-bold text-black">
            <Link href="/register">Começar teste gratuito</Link>
          </Button>

          <Button asChild variant="outline" className="h-14 rounded-full border-[#f0c36a]/40 bg-white/5 text-base text-white">
            <Link href="/pricing">Ver preços</Link>
          </Button>
        </div>

        <p className="mt-5 text-sm text-[#a99a82]">
          Desde <strong className="text-[#f0c36a]">17,50€ + IVA/mês</strong>
        </p>
      </section>

      <section className="mt-8 grid gap-3">
        <Stat value="24h" label="Reservas online" />
        <Stat value="0%" label="Comissões" />
        <Stat value="10 min" label="Para configurar" />
      </section>

      <section className="mt-12">
        <Title eyebrow="Como funciona" title="Comece em minutos." />

        <div className="grid gap-4">
          <Card title="1. Adicione o link" text="Coloque no Google Maps, Instagram ou website." />
          <Card title="2. Cliente reserva" text="Escolhe data, hora e número de pessoas." />
          <Card title="3. Gere no painel" text="Veja reservas, clientes e serviço do dia." />
        </div>
      </section>

      <section className="mt-12">
        <Title eyebrow="Funcionalidades" title="Tudo para gerir reservas." />

        <div className="grid gap-4">
          <Card title="Link para Google Maps" text="Receba reservas diretamente do perfil Google." />
          <Card title="QR Code" text="Partilhe em menus, montra e Instagram." />
          <Card title="Serviço do dia" text="Almoço, jantar, pendentes, check-ins e no-shows." />
          <Card title="Clientes" text="Histórico, contactos e visitas guardados automaticamente." />
        </div>
      </section>

      <section className="mt-12 rounded-[28px] bg-[#f0c36a] p-6 text-black">
        <h2 className="mb-3 text-3xl font-black">Pronto para começar?</h2>
        <p className="mb-6 text-black/70">Sem comissões. Sem complicações.</p>

        <Button asChild className="h-14 w-full rounded-full bg-black text-white">
          <Link href="/register">Começar agora</Link>
        </Button>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <p className="text-3xl font-black text-[#f0c36a]">{value}</p>
      <p className="mt-1 text-sm text-[#a99a82]">{label}</p>
    </div>
  );
}

function Title({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="mb-3 text-xs font-black uppercase tracking-[0.25em] text-[#f0c36a]">
        {eyebrow}
      </p>
      <h2 className="mb-6 text-3xl font-black">{title}</h2>
    </>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-[#15100b] p-5">
      <h3 className="mb-2 text-lg font-black">{title}</h3>
      <p className="text-sm leading-relaxed text-[#a99a82]">{text}</p>
    </div>
  );
}