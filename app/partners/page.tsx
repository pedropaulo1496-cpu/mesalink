import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  Clock3,
  CreditCard,
  FileCheck2,
  Handshake,
  MapPin,
  Navigation,
  ReceiptText,
  Search,
  ShieldCheck,
  Star,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MesaLink Partners — Reservas com comissão para parceiros",
  description: "Escolha restaurantes disponíveis, confirme reservas de grupos e acompanhe comissões, faturas e pagamentos numa única conta MesaLink Partners.",
  alternates: { canonical: "https://www.mesalink.pt/partners" },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function PartnersLandingPage() {
  const availableRestaurants = await prisma.restaurant.count({
    where: {
      referralNetworkEnabled: true,
      referralAutoAcceptEnabled: true,
      referralPaymentBlockedAt: null,
    },
  });

  return (
    <main className="min-h-screen bg-[#F3EDE4] text-[#17120D]">
      <header className="sticky top-0 z-30 border-b border-[#DFD1BD] bg-[#F3EDE4]/92 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-2 font-serif text-2xl font-bold tracking-[-0.05em]"><span><span className="text-[#B48645]">Mesa</span>Link</span><span className="text-[10px] font-black uppercase tracking-[0.17em] text-[#765B39]">Partners</span></Link>
          <div className="flex items-center gap-2">
            <Link href="/partners/login" className="hidden h-10 items-center rounded-full px-4 text-xs font-bold sm:inline-flex">Entrar</Link>
            <Link href="/partners/register" className="inline-flex h-10 items-center rounded-full bg-[#17120D] px-5 text-xs font-black text-white">Criar conta</Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-9 lg:grid-cols-[minmax(0,1fr)_470px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D8C5A5] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#8B6230]"><Navigation size={13} /> Reserva direta · comissão registada</span>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl font-semibold leading-[.92] tracking-[-0.065em] sm:text-6xl lg:text-[4.7rem]">Leva clientes ao restaurante certo. Recebe por isso.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#62594F]">Pesquisa restaurantes disponíveis, compara localização, cozinha, avaliação, preço e comissão e confirma a reserva na hora. Sem telefonemas, folhas de cálculo ou acordos perdidos.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/partners/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-7 text-sm font-black text-white">Começar gratuitamente <ArrowRight size={16} /></Link>
              <Link href="#como-funciona" className="inline-flex h-12 items-center justify-center rounded-full border border-[#D4C0A2] bg-white px-7 text-sm font-bold">Ver como funciona</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-[#74685C]"><span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#4E7A52]" /> Hotel, concierge, guia, influencer ou particular</span><span className="inline-flex items-center gap-1.5"><Check size={13} className="text-[#4E7A52]" /> Conta própria e gratuita</span></div>
          </div>

          <RestaurantPickerPreview restaurantCount={availableRestaurants} />
        </div>
      </section>

      <section id="como-funciona" className="border-y border-[#DFD1BD] bg-white px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">Como funciona agora</p><h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Da pesquisa à comissão, sem esperas.</h2></div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-[28px] border border-[#E0D1BC] bg-[#E0D1BC] md:grid-cols-4">
            <Step number="01" icon={<Search size={18} />} title="Escolhe o restaurante" text="Filtra por zona, distância, cozinha e disponibilidade. Vê logo a comissão oferecida pelo restaurante." />
            <Step number="02" icon={<CalendarCheck2 size={18} />} title="Confirma a reserva" text="Indica data, hora e pessoas. Se houver capacidade e garantia ativa, a reserva entra imediatamente." />
            <Step number="03" icon={<Clock3 size={18} />} title="Confirma o serviço" text="O restaurante pode ajustar o número final de pessoas. Após 24 horas, fica disponível o valor exato a faturar." />
            <Step number="04" icon={<WalletCards size={18} />} title="Recebe o pagamento" text="Anexa a fatura correta, acompanha a verificação e vê o pagamento e o histórico na tua conta." />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-[30px] bg-[#17120D] p-6 text-white sm:p-8">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D7B267]">Um perfil útil, não outro diretório</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-[.98] tracking-[-0.05em]">Tudo o que interessa antes de escolher.</h2>
              <div className="mt-7 space-y-3">
                <DarkFeature icon={<MapPin size={16} />} title="Localização e distância" text="Pesquisa por zona e vê quantos quilómetros estás do restaurante." />
                <DarkFeature icon={<Star size={16} />} title="Reviews e faixa de preço" text="O mini perfil apresenta os dados públicos disponíveis e informação confirmada pelo MesaLink." />
                <DarkFeature icon={<UtensilsCrossed size={16} />} title="Cozinha, menu e fotografias" text="Categorias iguais para todos, menu e imagens do perfil do restaurante." />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Feature icon={<CreditCard size={18} />} title="Garantia do restaurante" text="A rede fica disponível apenas com um cartão válido. Se uma cobrança falhar, novas reservas ficam bloqueadas sem afetar as já confirmadas." />
              <Feature icon={<Handshake size={18} />} title="Comissão negociável" text="O restaurante define a regra base. Qualquer lado pode propor uma comissão especial e o novo acordo só entra em vigor depois de aceite." />
              <Feature icon={<ReceiptText size={18} />} title="Fatura calculada" text="A app calcula o valor líquido a faturar depois da taxa MesaLink, custos de serviço e impostos aplicáveis. Só tens de emitir e anexar o documento." />
              <Feature icon={<BarChart3 size={18} />} title="Histórico e estatísticas" text="Reservas futuras, concluídas, valores por faturar, em verificação, por receber e já recebidos, sempre separados." />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[34px] border border-[#CBA967] bg-[#D7B267] lg:grid-cols-[1fr_330px]">
          <div className="p-7 sm:p-10"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#62441F]">Pagamentos transparentes</p><h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-5xl">Sabes o que vais receber antes de reservar.</h2><p className="mt-4 max-w-2xl text-sm leading-6 text-[#513A20]">A comissão aparece sempre no total e por pessoa. No detalhe financeiro são descontados 7% MesaLink, custos do serviço e impostos aplicáveis. A fatura do parceiro é verificada antes de o pagamento seguir.</p></div>
          <div className="border-t border-[#B98E42] bg-[#17120D] p-7 text-white lg:border-l lg:border-t-0"><FileCheck2 className="text-[#D7B267]" size={24} /><p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">Na tua conta</p><ul className="mt-3 space-y-3 text-xs font-semibold text-white/75"><li>Valor exato a faturar</li><li>Prazo e estado da verificação</li><li>Fatura PDF ligada à reserva</li><li>Saldo acumulado e recebido</li></ul></div>
        </div>
      </section>

      <section className="border-t border-[#DFD1BD] bg-[#FAF7F2] px-4 py-14 text-center sm:px-6"><div className="mx-auto max-w-2xl"><ShieldCheck className="mx-auto text-[#9B6F3B]" /><h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.055em]">Uma recomendação já não se perde.</h2><p className="mt-3 text-sm leading-6 text-[#6B6258]">Cria a tua conta de parceiro, escolhe o que és e começa a reservar nos restaurantes disponíveis.</p><Link href="/partners/register" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#17120D] px-7 text-sm font-black text-white">Criar conta Partners <ArrowRight size={16} /></Link></div></section>
    </main>
  );
}

function RestaurantPickerPreview({ restaurantCount }: { restaurantCount: number }) {
  return <div className="rounded-[31px] border border-[#2E241B] bg-[#17120D] p-4 text-white shadow-[0_32px_90px_rgba(44,31,18,.23)] sm:p-5">
    <div className="flex items-center justify-between gap-3 px-1"><div><p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#D7B267]">Escolher restaurante</p><p className="mt-1 text-xs font-semibold text-white/50">{restaurantCount || "Novos"} disponíveis agora</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-[#D7B267]"><Search size={15} /></span></div>
    <div className="mt-4 rounded-[17px] border border-white/10 bg-white/6 px-4 py-3 text-[10px] text-white/42"><Search size={13} className="mr-2 inline" />Nome, cozinha ou localização</div>
    <div className="mt-3 overflow-hidden rounded-[23px] bg-[#F8F2E9] text-[#17120D]">
      <div className="h-32 bg-[linear-gradient(120deg,rgba(20,15,10,.08),rgba(20,15,10,.55)),url('/demo-restaurants/brasa-atlantica.webp')] bg-cover bg-center" />
      <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-serif text-xl font-semibold">Taberna Tuga</h3><p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-[#6F6357]"><MapPin size={11} /> Lisboa · 1,8 km</p></div><div className="rounded-[12px] bg-[#17120D] px-3 py-2 text-right text-white"><p className="text-xs font-black text-[#D7B267]">1,50 €</p><p className="text-[7px] uppercase tracking-[0.08em] text-white/45">por pessoa</p></div></div><div className="mt-3 flex items-center gap-2 text-[9px]"><span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 font-bold"><Star size={10} className="fill-[#C7953F] text-[#C7953F]" /> 4,6</span><span className="rounded-full bg-white px-2.5 py-1 font-bold">€€</span><span className="rounded-full bg-white px-2.5 py-1 font-bold">Portuguesa</span></div><button className="mt-4 h-10 w-full rounded-full bg-[#D7B267] text-xs font-black">Selecionar restaurante</button></div>
    </div>
    <p className="mt-3 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-white/40"><ShieldCheck size={11} /> Contacto do cliente protegido até à reserva</p>
  </div>;
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="bg-[#FFFDFC] p-5 sm:p-6"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-[13px] bg-[#F0E3D1] text-[#8A6130]">{icon}</span><span className="text-[9px] font-black tracking-[0.15em] text-[#B09A80]">{number}</span></div><h3 className="mt-5 text-base font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6B6258]">{text}</p></div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-[24px] border border-[#E0D1BC] bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#F1E5D3] text-[#8A6130]">{icon}</span><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6B6258]">{text}</p></div>;
}

function DarkFeature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-[18px] border border-white/9 bg-white/5 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#D7B267]/14 text-[#D7B267]">{icon}</span><div><h3 className="text-xs font-bold">{title}</h3><p className="mt-1 text-[10px] leading-4 text-white/47">{text}</p></div></div>;
}
