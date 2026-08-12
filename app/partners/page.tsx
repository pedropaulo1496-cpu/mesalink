import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MesaLink Partners — Envie grupos para restaurantes",
  description: "Rede profissional para hotéis, concierges, guias e empresas enviarem grupos a restaurantes e receberem comissões semanais verificadas.",
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function PartnersLandingPage() {
  const restaurantCount = await prisma.restaurant.count();

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#17120D]">
      <header className="border-b border-[#E1D0B8] bg-[#F5EFE6]/90 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-3xl font-black tracking-[-0.08em]"><span className="text-[#C8A56A]">Mesa</span>Link <span className="text-sm font-semibold tracking-normal text-[#8A6130]">Partners</span></Link>
          <div className="flex items-center gap-2">
            <Link href="/login?callbackUrl=/partners/app" className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex">Entrar</Link>
            <Link href="/partners/register" className="inline-flex h-11 items-center rounded-full bg-[#17120D] px-5 text-sm font-bold text-white">Criar conta</Link>
          </div>
        </div>
      </header>

      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">Hotel → restaurante → comissão</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.075em] sm:text-7xl">Transforma recomendações em receita.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#62594F]">Publica um grupo, escolhe restaurantes por cozinha e localização e acompanha a reserva, a fatura e a comissão numa única app. O contacto só é revelado ao restaurante que aceitar.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/partners/register" className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#17120D] px-7 text-sm font-black text-white">Começar como parceiro <ArrowRight size={17} /></Link>
              <Link href="/login?callbackUrl=/partners/app" className="inline-flex h-13 items-center justify-center rounded-full border border-[#D6C3A5] bg-white px-7 text-sm font-bold">Já tenho conta</Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[40px] border border-[#2C2117] bg-[#17120D] p-7 text-white shadow-[0_35px_100px_rgba(44,31,18,0.25)] sm:p-9">
            <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">Novo grupo</p><span className="rounded-full bg-[#D7B267]/15 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#E8C985]">Anónimo</span></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric label="Pessoas" value="12" />
              <Metric label="Cozinha" value="Portuguesa" />
              <Metric label="Comissão" value="€6 / pessoa" />
              <Metric label="Parceiro recebe" value="€61,20" />
            </div>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.05] p-4 text-sm text-white/65"><span className="font-semibold text-white">ML-8F3A12BC</span><br />Sábado · 20:30 · centro de Lisboa</div>
            <div className="mt-5 flex items-center gap-2 text-xs text-[#AEE0AD]"><CheckCircle2 size={16} /> 3 restaurantes selecionados</div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E1D0B8] bg-white px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <Feature icon={<UtensilsCrossed size={21} />} title={`${restaurantCount} restaurantes disponíveis`} text="Pesquisa por tipo de cozinha, localização, preço e capacidade do grupo." />
          <Feature icon={<ShieldCheck size={21} />} title="Contacto protegido" text="Antes da aceitação, a oferta mostra apenas código, data, pessoas e preferências. O contacto é revelado apenas ao restaurante que garante a reserva." />
          <Feature icon={<Building2 size={21} />} title="Acordos recorrentes" text="Hotel e restaurante podem deixar uma comissão total ou por pessoa pré-definida." />
        </div>
      </section>

      <section className="px-5 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-[40px] bg-[#D7B267] p-8 text-[#17120D] sm:p-12">
          <p className="text-xs font-black uppercase tracking-[0.28em]">Regra simples</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">85% para o parceiro. 15% para o MesaLink.</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#4A3822]">O cartão do restaurante garante a comissão. Depois do serviço, o parceiro anexa a fatura ao grupo; o MesaLink verifica-a e só então inclui os 85% no pagamento semanal.</p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-white/10 bg-white/[0.05] p-4"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-6"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F1E3CC] text-[#8A6130]">{icon}</div><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p></div>;
}
