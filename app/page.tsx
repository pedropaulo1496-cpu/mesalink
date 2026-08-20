"use client";

import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Globe2,
  Hotel,
  LayoutDashboard,
  MailCheck,
  MapPin,
  MessageCircleMore,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

const salesCopy = {
  pt: {
    heroEyebrow: "A plataforma de crescimento para restaurantes",
    heroLead: "Mais mesas ocupadas.",
    heroAccent: "Menos clientes perdidos.",
    heroText:
      "Recebe reservas diretas, ganha novos clientes através de parceiros e recupera oportunidades automaticamente — com toda a operação ligada num só lugar.",
    heroPrimary: "Começar 7 dias grátis",
    heroSecondary: "Ver demonstração",
    trust: ["Sem comissão nas reservas diretas", "Configuração acompanhada", "Cancela quando quiseres"],
    heroProof: "Uma reserva. Todo o sistema trabalha.",
    heroProofText: "Da descoberta à próxima visita, sem copiar dados entre ferramentas.",
    pipeline: {
      discovered: "Cliente encontrado",
      channel: "Google · Instagram · Website",
      partner: "Reserva de parceiro",
      partnerDetail: "Parceiro · Hotel · 8 pessoas",
      booked: "Reserva confirmada",
      bookedDetail: "Hoje · 20:00 · 4 pessoas",
      return: "Próxima visita preparada",
      returnDetail: "CRM · review · fidelização",
    },
    enginesEyebrow: "Três formas concretas de crescer",
    enginesTitle: "O MesaLink não se limita a organizar. Traz negócio.",
    enginesText:
      "Cada motor resolve uma origem diferente de receita: procura existente, clientes que nunca chegariam até ti e oportunidades que normalmente se perdiam.",
    directTitle: "Reservas diretas",
    directKicker: "Converte quem já te procura",
    directText:
      "Google, Instagram e website passam a levar o cliente diretamente para uma reserva rápida, confirmada e sem comissão por pessoa.",
    directResult: "Mais controlo e menos dependência de marketplaces",
    networkTitle: "Rede de Parceiros",
    networkKicker: "Ganha clientes realmente novos",
    networkText:
      "Hotéis, concierges, guias e outros parceiros escolhem o restaurante e fazem reservas. Tu defines disponibilidade e comissão por pessoa.",
    networkResult: "Reservas que provavelmente não receberias de outra forma",
    recoveryTitle: "Revenue AI",
    recoveryKicker: "Recupera procura que escapou",
    recoveryText:
      "Chamadas não atendidas, cancelamentos e no-shows deixam de terminar em silêncio. O MesaLink volta a abrir a conversa e facilita nova reserva.",
    recoveryResult: "Automação com resultado visível no painel",
    networkEyebrow: "MesaLink Partner Network",
    networkHeadline: "Uma nova fonte de clientes, ligada diretamente à tua agenda.",
    networkBody:
      "O parceiro encontra um restaurante disponível, vê a comissão definida e confirma a reserva. O contacto fica protegido, a reserva entra no MesaLink e todo o processo financeiro fica registado.",
    networkSteps: [
      ["Define a regra", "Escolhe comissão por pessoa, capacidade e dias disponíveis."],
      ["Aparece aos parceiros", "O restaurante fica pesquisável por cozinha, localização e disponibilidade."],
      ["Recebe a reserva", "A reserva confirmada entra diretamente na agenda e na gestão de mesas."],
    ],
    networkCta: "Conhecer a Rede de Parceiros",
    platformEyebrow: "Uma operação, não dez ferramentas",
    platformTitle: "Tudo o que acontece antes, durante e depois da visita.",
    platformText:
      "Começa pelo essencial e ativa crescimento inteligente quando quiseres. Os dados ficam ligados desde a primeira reserva.",
    essentialsLabel: "Essentials · 55€/mês",
    growthLabel: "Growth · 75€/mês",
    liveEyebrow: "Vê a experiência do cliente",
    liveTitle: "Experimenta uma reserva MesaLink real.",
    liveText:
      "Abre a página pública da Taberna Tuga e vê como o cliente escolhe data, hora, pessoas e menu sem instalar qualquer aplicação.",
    liveCta: "Abrir reserva da Taberna Tuga",
    liveNote: "Abre no browser · funciona em qualquer telemóvel",
    setupEyebrow: "Começar é simples",
    setupTitle: "Do primeiro contacto à primeira reserva.",
    setupSteps: [
      ["01", "Configuramos contigo", "Horários, mesas, contactos, website e canais de reserva ficam preparados."],
      ["02", "Publicas os links", "Google, Instagram e website começam a encaminhar clientes para a reserva direta."],
      ["03", "O MesaLink trabalha", "Confirmações, alterações, clientes, parceiros e automações ficam no mesmo fluxo."],
    ],
    appsEyebrow: "Leva o MesaLink contigo",
    appsTitle: "No browser, no computador e em Android.",
    appsText: "A app do restaurante acompanha a operação e a app Partners permite enviar clientes e gerir comissões, cada uma com a sua conta.",
    appsCta: "Ver as aplicações MesaLink",
    faqEyebrow: "Perguntas antes de começar",
    faqTitle: "Sem letras pequenas.",
    faqs: [
      ["Pago comissão por cada reserva?", "Não nas reservas diretas do Google, Instagram, website ou link MesaLink. Na Rede de Parceiros, o restaurante define a comissão que aceita pagar por cliente enviado."],
      ["Tenho de trocar o meu website?", "Não. Podes usar apenas o link de reservas ou publicar o website MesaLink quando estiver pronto. O sistema adapta-se ao ponto de partida do restaurante."],
      ["Os clientes precisam de instalar uma app?", "Não. Reservas, alterações, cancelamentos, menus e cartões abrem diretamente no browser do cliente."],
      ["É difícil configurar?", "A configuração é acompanhada. Preparamos a base contigo para que o teste comece com horários, mesas e canais realmente utilizáveis."],
      ["Qual é a diferença do Growth?", "O Essentials centraliza a operação e as reservas. O Growth acrescenta Revenue AI, Marketing Autopilot e AI Visibility para recuperar e gerar mais procura."],
    ],
    finalEyebrow: "A próxima reserva pode começar hoje",
    finalTitle: "Deixa o MesaLink trabalhar pelo restaurante.",
    finalText: "Experimenta todas as funcionalidades durante 7 dias. Sem compromisso e com configuração acompanhada.",
    finalPrimary: "Começar teste gratuito",
    finalSecondary: "Falar com a MesaLink",
  },
  en: {
    heroEyebrow: "The growth platform for restaurants",
    heroLead: "More tables filled.",
    heroAccent: "Fewer customers lost.",
    heroText:
      "Take direct bookings, win new customers through partners and automatically recover missed opportunities — with the whole operation connected in one place.",
    heroPrimary: "Start 7 days free",
    heroSecondary: "Book a demo",
    trust: ["No fee on direct bookings", "Guided setup", "Cancel any time"],
    heroProof: "One booking. The entire system works.",
    heroProofText: "From discovery to the next visit, without copying data between tools.",
    pipeline: {
      discovered: "Customer found",
      channel: "Google · Instagram · Website",
      partner: "Partner booking",
      partnerDetail: "Hotel partner · 8 guests",
      booked: "Booking confirmed",
      bookedDetail: "Today · 20:00 · 4 guests",
      return: "Next visit prepared",
      returnDetail: "CRM · review · loyalty",
    },
    enginesEyebrow: "Three practical ways to grow",
    enginesTitle: "MesaLink does more than organise. It brings business.",
    enginesText:
      "Each engine solves a different revenue source: existing demand, guests who would never reach you and opportunities that normally disappear.",
    directTitle: "Direct bookings",
    directKicker: "Convert people already searching",
    directText:
      "Google, Instagram and your website take customers straight to a fast, confirmed booking with no per-cover commission.",
    directResult: "More control and less marketplace dependence",
    networkTitle: "Partner Network",
    networkKicker: "Win genuinely new customers",
    networkText:
      "Hotels, concierges, guides and other partners choose the restaurant and make bookings. You set availability and commission per guest.",
    networkResult: "Bookings you probably would not receive otherwise",
    recoveryTitle: "Revenue AI",
    recoveryKicker: "Recover demand that slipped away",
    recoveryText:
      "Missed calls, cancellations and no-shows no longer end in silence. MesaLink reopens the conversation and makes rebooking easy.",
    recoveryResult: "Automation with visible results in the dashboard",
    networkEyebrow: "MesaLink Partner Network",
    networkHeadline: "A new source of customers, connected straight to your diary.",
    networkBody:
      "A partner finds an available restaurant, sees the commission and confirms the booking. Contact details stay protected, the booking enters MesaLink and the financial flow is recorded.",
    networkSteps: [
      ["Set the rules", "Choose commission per guest, capacity and available days."],
      ["Appear to partners", "Your restaurant is searchable by cuisine, location and availability."],
      ["Receive the booking", "The confirmed booking enters the diary and table management."],
    ],
    networkCta: "Explore the Partner Network",
    platformEyebrow: "One operation, not ten tools",
    platformTitle: "Everything before, during and after the visit.",
    platformText:
      "Start with the essentials and activate intelligent growth when you need it. Data stays connected from the first booking.",
    essentialsLabel: "Essentials · €55/month",
    growthLabel: "Growth · €75/month",
    liveEyebrow: "See the customer experience",
    liveTitle: "Try a real MesaLink booking.",
    liveText:
      "Open Taberna Tuga’s public page and see how customers choose a date, time, party size and menu without installing an app.",
    liveCta: "Open Taberna Tuga booking",
    liveNote: "Opens in the browser · works on any phone",
    setupEyebrow: "Getting started is simple",
    setupTitle: "From first contact to first booking.",
    setupSteps: [
      ["01", "We configure it with you", "Opening hours, tables, contacts, website and booking channels are prepared."],
      ["02", "Publish the links", "Google, Instagram and your website start sending customers to direct booking."],
      ["03", "MesaLink works", "Confirmations, changes, customers, partners and automations share one flow."],
    ],
    appsEyebrow: "Take MesaLink with you",
    appsTitle: "In the browser, on desktop and Android.",
    appsText: "The restaurant app follows daily operations while the Partners app sends customers and manages commissions, each with its own account.",
    appsCta: "See MesaLink apps",
    faqEyebrow: "Questions before you start",
    faqTitle: "No small print.",
    faqs: [
      ["Do I pay for every booking?", "Not for direct bookings from Google, Instagram, your website or MesaLink link. In the Partner Network, the restaurant sets the commission it accepts per referred guest."],
      ["Do I need to replace my website?", "No. Use only the booking link or publish the MesaLink website when it is ready. The system adapts to your starting point."],
      ["Do customers need an app?", "No. Bookings, changes, cancellations, menus and digital cards open directly in the customer’s browser."],
      ["Is setup difficult?", "Setup is guided. We prepare the foundations with you so the trial starts with usable opening hours, tables and channels."],
      ["What is different about Growth?", "Essentials centralises operations and bookings. Growth adds Revenue AI, Marketing Autopilot and AI Visibility to recover and generate demand."],
    ],
    finalEyebrow: "Your next booking can start today",
    finalTitle: "Let MesaLink work for the restaurant.",
    finalText: "Try every feature for 7 days. No commitment, with guided setup.",
    finalPrimary: "Start free trial",
    finalSecondary: "Talk to MesaLink",
  },
} as const;

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.mesalink.pt/#software",
  name: "MesaLink",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Restaurant management software",
  operatingSystem: "Web, Android",
  url: "https://www.mesalink.pt/",
  description:
    "Plataforma para restaurantes com reservas diretas, rede de parceiros, gestão de mesas, QR Ordering, CRM, website, marketing e Revenue AI.",
  featureList: [
    "Reservas online diretas",
    "Rede de Parceiros para restaurantes",
    "Gestão de mesas e agenda",
    "QR Ordering e menu digital",
    "CRM e fidelização",
    "Website para restaurantes e SEO",
    "Marketing Autopilot",
    "Revenue AI",
    "AI Visibility",
  ],
  offers: [
    { "@type": "Offer", name: "MesaLink Essentials", price: "55", priceCurrency: "EUR", url: "https://www.mesalink.pt/pricing" },
    { "@type": "Offer", name: "MesaLink Growth", price: "75", priceCurrency: "EUR", url: "https://www.mesalink.pt/pricing" },
  ],
  publisher: { "@id": "https://www.mesalink.pt/#organization" },
};

type IconComponent = ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;

export default function HomePage() {
  const locale = useLocale();
  const copy = locale === "pt" ? salesCopy.pt : salesCopy.en;

  return (
    <main className="min-h-screen overflow-hidden bg-[#F3ECE2] text-[#17130F]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <Hero copy={copy} />
      <GrowthEngines copy={copy} />
      <PartnerNetwork copy={copy} />
      <Platform copy={copy} />
      <LiveDemo copy={copy} />
      <Setup copy={copy} />
      <PricingSection />
      <AppsStrip copy={copy} />
      <FAQ copy={copy} />
      <FinalCTA copy={copy} />
      <Footer />
    </main>
  );
}

function Hero({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="relative isolate px-5 pb-20 pt-12 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_84%_30%,rgba(200,165,106,0.22),transparent_31%)]" />
      <div className="pointer-events-none absolute left-1/2 top-8 -z-10 h-px w-[min(94vw,1440px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#CDB893] to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <Eyebrow icon={Sparkles}>{copy.heroEyebrow}</Eyebrow>
          <h1 className="mt-6 max-w-4xl text-[clamp(3.2rem,7vw,6.7rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
            {copy.heroLead}
            <span className="mt-1 block text-[#A9793E]">{copy.heroAccent}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#5F554B] sm:text-xl">
            {copy.heroText}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-14 rounded-full bg-[#17130F] px-7 text-base font-semibold text-white shadow-[0_18px_45px_rgba(23,19,15,0.2)] hover:bg-[#2B221A]">
              <Link href="/register">{copy.heroPrimary}<ArrowRight className="ml-2" size={18} /></Link>
            </Button>
            <Button asChild variant="outline" className="h-14 rounded-full border-[#CAB38E] bg-[#FFF9F0]/80 px-7 text-base font-semibold hover:bg-white">
              <Link href="/contact">{copy.heroSecondary}</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#5F554B]">
            {copy.trust.map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#DBEBDD] text-[#315A3F]"><Check size={12} strokeWidth={3} /></span>
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <GrowthConsole copy={copy} />
      </div>
    </section>
  );
}

function GrowthConsole({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  const rows = [
    { icon: Search, title: copy.pipeline.discovered, detail: copy.pipeline.channel, tone: "bg-[#FFF6E6] text-[#926024]" },
    { icon: Hotel, title: copy.pipeline.partner, detail: copy.pipeline.partnerDetail, tone: "bg-[#E9F2EC] text-[#315A3F]" },
    { icon: CalendarCheck2, title: copy.pipeline.booked, detail: copy.pipeline.bookedDetail, tone: "bg-[#EEE8F8] text-[#5A467D]" },
    { icon: MailCheck, title: copy.pipeline.return, detail: copy.pipeline.returnDetail, tone: "bg-[#F7E9E2] text-[#864933]" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.75, delay: 0.08 }} className="relative">
      <div className="absolute -inset-5 -z-10 rounded-[52px] bg-[#C8A56A]/14 blur-2xl" />
      <div className="overflow-hidden rounded-[36px] border border-[#D8C5A5] bg-[#17130F] p-3 shadow-[0_36px_100px_rgba(34,25,17,0.25)] sm:rounded-[44px]">
        <div className="rounded-[29px] border border-white/10 bg-[#211A15] p-4 sm:rounded-[36px] sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D7B267]">MesaLink Growth Engine</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">{copy.heroProof}</h2>
            </div>
            <span className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> Live
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/55">{copy.heroProofText}</p>

          <div className="relative mt-5 space-y-3">
            <div className="absolute bottom-6 left-[23px] top-6 w-px bg-gradient-to-b from-[#D7B267]/20 via-[#D7B267] to-[#D7B267]/20" />
            {rows.map((row, index) => {
              const Icon = row.icon;
              return (
                <motion.div key={row.title} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + index * 0.08 }} className="relative grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.055] p-3.5">
                  <span className={`relative z-10 grid h-12 w-12 place-items-center rounded-2xl ${row.tone}`}><Icon size={19} /></span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{row.title}</p>
                    <p className="mt-1 truncate text-xs text-white/48 sm:text-sm">{row.detail}</p>
                  </div>
                  <span className="hidden h-7 w-7 place-items-center rounded-full border border-white/10 text-[#D7B267] sm:grid"><ChevronRight size={15} /></span>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[ ["Google", "Direto"], ["Partners", "Novo"], ["AI", "Recupera"] ].map(([title, label]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-center">
                <p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-[#D7B267]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GrowthEngines({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  const engines = [
    { icon: Globe2, title: copy.directTitle, kicker: copy.directKicker, text: copy.directText, result: copy.directResult, className: "border-[#DAC8AB] bg-[#FFF9F0]", iconClass: "bg-[#F0DFC1] text-[#7E5729]" },
    { icon: Hotel, title: copy.networkTitle, kicker: copy.networkKicker, text: copy.networkText, result: copy.networkResult, className: "border-[#315A3F] bg-[#274735] text-white", iconClass: "bg-white/12 text-[#E4C98F]" },
    { icon: Bot, title: copy.recoveryTitle, kicker: copy.recoveryKicker, text: copy.recoveryText, result: copy.recoveryResult, className: "border-[#DAC8AB] bg-[#FFF9F0]", iconClass: "bg-[#EEE3F5] text-[#5D477B]" },
  ];

  return (
    <section id="growth" className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div><Eyebrow>{copy.enginesEyebrow}</Eyebrow><h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.enginesTitle}</h2></div>
          <p className="max-w-2xl text-lg leading-8 text-[#5F554B] lg:justify-self-end">{copy.enginesText}</p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {engines.map((engine, index) => {
            const Icon = engine.icon;
            const dark = index === 1;
            return (
              <motion.article key={engine.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.06 }} className={`relative overflow-hidden rounded-[32px] border p-6 shadow-[0_22px_65px_rgba(65,43,23,0.08)] sm:p-7 ${engine.className}`}>
                {dark && <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D7B267]/16 blur-3xl" />}
                <div className="relative flex min-h-[330px] flex-col">
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${engine.iconClass}`}><Icon size={21} /></span>
                  <p className={`mt-6 text-[10px] font-bold uppercase tracking-[0.22em] ${dark ? "text-[#E4C98F]" : "text-[#9B6F3B]"}`}>{engine.kicker}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{engine.title}</h3>
                  <p className={`mt-4 text-sm leading-6 ${dark ? "text-white/66" : "text-[#655B50]"}`}>{engine.text}</p>
                  <div className={`mt-auto flex items-start gap-2 border-t pt-5 text-sm font-semibold ${dark ? "border-white/12 text-[#F0D9A9]" : "border-[#E7D8C0] text-[#68471F]"}`}><BadgeCheck className="mt-0.5 shrink-0" size={17} />{engine.result}</div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PartnerNetwork({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="px-5 py-10 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] bg-[#17130F] text-white shadow-[0_35px_100px_rgba(23,19,15,0.2)] sm:rounded-[48px]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden p-7 sm:p-10 lg:p-14">
            <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-[#315A3F]/50 blur-[90px]" />
            <div className="relative">
              <Eyebrow dark icon={Hotel}>{copy.networkEyebrow}</Eyebrow>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.networkHeadline}</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">{copy.networkBody}</p>
              <Button asChild className="mt-8 h-13 rounded-full bg-[#D7B267] px-6 font-semibold text-[#17130F] hover:bg-[#E6C981]">
                <Link href="/partners">{copy.networkCta}<ArrowRight className="ml-2" size={17} /></Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.045] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-[28px] border border-white/10 bg-[#211A15] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D7B267]">Nova reserva Partner</p><p className="mt-1 text-lg font-semibold">Hotel · Lisboa</p></div>
                <span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-200">Confirmada</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniValue icon={Users} value="8" label="pessoas" />
                <MiniValue icon={Clock3} value="20:00" label="hora" />
                <MiniValue icon={CircleDollarSign} value="1,50€" label="por pessoa" />
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5"><MapPin size={17} className="text-[#D7B267]" /><div><p className="text-sm font-semibold">Reserva adicionada à agenda</p><p className="mt-0.5 text-xs text-white/42">Contacto revelado apenas após confirmação</p></div></div>
            </div>

            <div className="mt-4 grid gap-3">
              {copy.networkSteps.map(([title, text], index) => (
                <div key={title} className="grid grid-cols-[36px_1fr] gap-3 rounded-[22px] border border-white/10 bg-white/[0.035] p-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#D7B267] text-xs font-bold text-[#17130F]">0{index + 1}</span>
                  <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-white/48">{text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Platform({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  const features: Array<{ icon: IconComponent; title: string; text: string; pack: "Essentials" | "Growth" }> = copy === salesCopy.pt
    ? [
        { icon: CalendarCheck2, title: "Reservas & mesas", text: "Confirmações, alterações, cancelamentos, agenda e sala ligados.", pack: "Essentials" },
        { icon: UtensilsCrossed, title: "Menus & depósitos", text: "Menus predefinidos na reserva e proteção no-show quando precisares.", pack: "Essentials" },
        { icon: QrCode, title: "QR Ordering & Menu", text: "Pedidos à mesa, chamar empregado e pedir a conta pelo telemóvel.", pack: "Essentials" },
        { icon: Users, title: "CRM & cartões", text: "Histórico de clientes, recompensas digitais e fidelização individual.", pack: "Essentials" },
        { icon: Globe2, title: "Website & SEO", text: "Website premium, reservas diretas e estrutura preparada para pesquisa.", pack: "Essentials" },
        { icon: Hotel, title: copy.networkTitle, text: "Novas reservas enviadas por hotéis, concierges, guias e parceiros.", pack: "Essentials" },
        { icon: MessageCircleMore, title: "Revenue AI", text: "Recuperação de cancelamentos, no-shows e chamadas não atendidas.", pack: "Growth" },
        { icon: Sparkles, title: "Marketing Autopilot", text: "Campanhas, aniversários, reviews e clientes inativos trabalhados automaticamente.", pack: "Growth" },
        { icon: Search, title: "AI Visibility", text: "Diagnóstico e melhorias para Google e a nova geração de pesquisas por IA.", pack: "Growth" },
      ]
    : [
        { icon: CalendarCheck2, title: "Bookings & tables", text: "Confirmations, changes, cancellations, diary and floor plan connected.", pack: "Essentials" },
        { icon: UtensilsCrossed, title: "Menus & deposits", text: "Set menus inside booking and no-show protection whenever you need it.", pack: "Essentials" },
        { icon: QrCode, title: "QR Ordering & Menu", text: "Table ordering, call a waiter and request the bill from any phone.", pack: "Essentials" },
        { icon: Users, title: "CRM & digital cards", text: "Customer history, individual digital rewards and loyalty tools.", pack: "Essentials" },
        { icon: Globe2, title: "Website & SEO", text: "Premium website, direct bookings and a search-ready structure.", pack: "Essentials" },
        { icon: Hotel, title: copy.networkTitle, text: "New bookings sent by hotels, concierges, guides and partners.", pack: "Essentials" },
        { icon: MessageCircleMore, title: "Revenue AI", text: "Recover cancellations, no-shows and missed calls.", pack: "Growth" },
        { icon: Sparkles, title: "Marketing Autopilot", text: "Campaigns, birthdays, reviews and inactive customers handled automatically.", pack: "Growth" },
        { icon: Search, title: "AI Visibility", text: "Diagnostics and improvements for Google and the new generation of AI search.", pack: "Growth" },
      ];

  return (
    <section id="platform" className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div><Eyebrow icon={LayoutDashboard}>{copy.platformEyebrow}</Eyebrow><h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.platformTitle}</h2></div>
          <div className="lg:justify-self-end"><p className="max-w-2xl text-lg leading-8 text-[#5F554B]">{copy.platformText}</p><div className="mt-5 flex flex-wrap gap-2"><PackPill dark>{copy.essentialsLabel}</PackPill><PackPill>{copy.growthLabel}</PackPill></div></div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.025 }} className={`group rounded-[26px] border p-5 transition hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(65,43,23,0.09)] ${feature.pack === "Growth" ? "border-[#C5B6D7] bg-[#F7F3FA]" : "border-[#DDCBB0] bg-[#FFF9F0]"}`}>
                <div className="flex items-start justify-between gap-4"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${feature.pack === "Growth" ? "bg-[#E9DEF1] text-[#5D477B]" : "bg-[#F0DFC1] text-[#7E5729]"}`}><Icon size={19} /></span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${feature.pack === "Growth" ? "bg-[#E9DEF1] text-[#5D477B]" : "bg-[#F1E6D4] text-[#7E5729]"}`}>{feature.pack}</span></div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#655B50]">{feature.text}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveDemo({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="px-5 py-10 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[38px] border border-[#D7C3A1] bg-[#FFF9F0] shadow-[0_28px_80px_rgba(65,43,23,0.1)] lg:grid-cols-[0.85fr_1.15fr] sm:rounded-[46px]">
        <div className="p-7 sm:p-10 lg:p-12">
          <Eyebrow icon={Store}>{copy.liveEyebrow}</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">{copy.liveTitle}</h2>
          <p className="mt-5 text-base leading-7 text-[#5F554B]">{copy.liveText}</p>
          <Button asChild className="mt-7 h-13 rounded-full bg-[#17130F] px-6 font-semibold text-white hover:bg-[#2B221A]">
            <a href="https://www.mesalink.pt/reserve/taberna-tuga" target="_blank" rel="noreferrer">{copy.liveCta}<ArrowRight className="ml-2" size={17} /></a>
          </Button>
          <p className="mt-3 flex items-center gap-2 text-xs text-[#7B7065]"><Globe2 size={14} />{copy.liveNote}</p>
        </div>

        <div className="border-t border-[#E3D2B7] bg-[#EEE2D0] p-4 sm:p-6 lg:border-l lg:border-t-0">
          <div className="h-full min-h-[420px] overflow-hidden rounded-[30px] border border-[#CDB58E] bg-white shadow-[0_20px_50px_rgba(66,45,25,0.12)]">
            <div className="relative h-32 overflow-hidden bg-[#17130F] p-5 text-white sm:h-40 sm:p-7">
              <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border border-[#D7B267]/30" />
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#D7B267]">Experiência de reserva</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Taberna Tuga</h3>
              <p className="mt-2 flex items-center gap-2 text-xs text-white/55"><MapPin size={13} />Cais do Sodré · Lisboa</p>
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B6F3B]">A tua reserva</p><p className="mt-1 font-semibold">Escolhe quando queres vir</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#F2E5D0]"><CalendarCheck2 size={18} /></span></div>
              <div className="mt-5 grid grid-cols-4 gap-2">{["Hoje", "Amanhã", "Sáb", "Dom"].map((day, index) => <div key={day} className={`rounded-2xl border px-2 py-3 text-center text-xs font-semibold ${index === 1 ? "border-[#17130F] bg-[#17130F] text-white" : "border-[#E2D0B3] bg-[#FFF9F0]"}`}>{day}</div>)}</div>
              <div className="mt-5 grid grid-cols-3 gap-2">{["19:30", "20:00", "20:30"].map((time, index) => <div key={time} className={`rounded-2xl border px-3 py-3 text-center text-sm font-semibold ${index === 1 ? "border-[#D7B267] bg-[#F5E5C4]" : "border-[#E2D0B3]"}`}>{time}</div>)}</div>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#E2D0B3] bg-[#FFF9F0] p-4"><span className="flex items-center gap-2 text-sm font-semibold"><Users size={16} />Pessoas</span><span className="font-semibold">− &nbsp; 4 &nbsp; +</span></div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#17130F] px-5 py-4 text-white"><div><p className="text-[9px] uppercase tracking-[0.16em] text-[#D7B267]">Amanhã · 20:00</p><p className="mt-1 text-sm font-semibold">4 pessoas</p></div><span className="rounded-full bg-[#D7B267] px-4 py-2 text-xs font-semibold text-[#17130F]">Continuar</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Setup({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center"><Eyebrow className="justify-center">{copy.setupEyebrow}</Eyebrow><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.setupTitle}</h2></div>
        <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-8 hidden h-px bg-[#CDB893] lg:block" />
          {copy.setupSteps.map(([number, title, text]) => (
            <div key={number} className="relative rounded-[28px] border border-[#DDCBB0] bg-[#FFF9F0] p-6 text-center">
              <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-[#F3ECE2] bg-[#17130F] text-sm font-bold text-[#D7B267]">{number}</span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#655B50]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const t = useTranslations("marketing.home");
  const plans = [
    { name: t("pricing.essentialsName"), price: "55€", yearly: "605€", description: t("pricing.essentialsDescription"), featured: false, features: [t("pricing.essentialsFeature2"), t("pricing.essentialsFeature3"), t("pricing.essentialsFeature4"), t("pricing.essentialsFeature5"), t("pricing.essentialsFeature6"), t("pricing.essentialsFeature8"), t("pricing.essentialsFeature9")] },
    { name: t("pricing.growthName"), price: "75€", yearly: "825€", description: t("pricing.growthDescription"), featured: true, features: [t("pricing.growthFeature2"), t("pricing.growthFeature3"), t("pricing.growthFeature5"), t("pricing.growthFeature6"), t("pricing.growthFeature7"), t("pricing.growthFeature9")] },
  ];

  return (
    <section id="pricing" className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center"><Eyebrow className="justify-center">{t("pricing.label")}</Eyebrow><h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{t("pricing.titleLine1")} <span className="text-[#A9793E]">{t("pricing.titleLine2")}</span></h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#5F554B]">{t("pricing.subtitle")}</p></div>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => <PricingCard key={plan.name} {...plan} cta={t("pricing.ctaTrial")} perMonth={t("pricingCard.perMonth")} annualLabel={t("pricingCard.yearlyLabel")} perYear={t("pricingCard.perYear")} freeMonth={t("pricingCard.oneMonthFree")} popular={t("pricingCard.mostPopular")} />)}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ name, price, yearly, description, features, featured, cta, perMonth, annualLabel, perYear, freeMonth, popular }: { name: string; price: string; yearly: string; description: string; features: string[]; featured: boolean; cta: string; perMonth: string; annualLabel: string; perYear: string; freeMonth: string; popular: string }) {
  return (
    <article className={`relative flex h-full flex-col rounded-[34px] border p-6 shadow-[0_24px_70px_rgba(65,43,23,0.1)] sm:p-8 ${featured ? "border-[#17130F] bg-[#17130F] text-white" : "border-[#D8C5A5] bg-[#FFF9F0]"}`}>
      <div className="flex items-center justify-between gap-3"><p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${featured ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>MesaLink {name}</p>{featured && <span className="rounded-full bg-[#D7B267] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#17130F]">{popular}</span>}</div>
      <div className="mt-6 flex items-end gap-2"><span className="text-6xl font-semibold leading-none tracking-[-0.07em]">{price}</span><span className={`mb-2 text-sm ${featured ? "text-white/55" : "text-[#655B50]"}`}>{perMonth}</span></div>
      <p className={`mt-5 min-h-[52px] text-sm leading-6 ${featured ? "text-white/60" : "text-[#655B50]"}`}>{description}</p>
      <div className={`mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border px-4 py-3 text-sm ${featured ? "border-white/10 bg-white/[0.06] text-white/65" : "border-[#E0CEB2] bg-white text-[#655B50]"}`}><span>{annualLabel}</span><strong className={featured ? "text-white" : "text-[#17130F]"}>{yearly}{perYear}</strong><span>· {freeMonth}</span></div>
      <div className="mt-6 grid flex-1 gap-3 sm:grid-cols-2">{features.map((feature) => <div key={feature} className={`flex items-start gap-2 text-sm leading-5 ${featured ? "text-white/78" : "text-[#4F463B]"}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${featured ? "bg-[#D7B267] text-[#17130F]" : "bg-[#EAD9BC] text-[#765126]"}`}><Check size={11} strokeWidth={3} /></span>{feature}</div>)}</div>
      <Button asChild className={`mt-7 h-13 rounded-full font-semibold ${featured ? "bg-[#D7B267] text-[#17130F] hover:bg-[#E6C981]" : "bg-[#17130F] text-white hover:bg-[#2B221A]"}`}><Link href="/register">{cta}<ArrowRight className="ml-2" size={17} /></Link></Button>
    </article>
  );
}

function AppsStrip({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section id="downloads" className="px-5 py-10 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-6 rounded-[34px] border border-[#D5C09E] bg-[#E8D8BE] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#17130F] text-[#D7B267]"><LayoutDashboard size={21} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#855C2C]">{copy.appsEyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">{copy.appsTitle}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#5F554B]">{copy.appsText}</p></div></div>
        <Button asChild variant="outline" className="h-12 rounded-full border-[#9E7D4E] bg-[#FFF9F0] px-5 font-semibold"><Link href="/mobile">{copy.appsCta}<ArrowRight className="ml-2" size={16} /></Link></Button>
      </div>
    </section>
  );
}

function FAQ({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="px-5 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div><Eyebrow icon={ShieldCheck}>{copy.faqEyebrow}</Eyebrow><h2 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.faqTitle}</h2></div>
        <div className="divide-y divide-[#DCC8A8] border-y border-[#DCC8A8]">
          {copy.faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold"><span>{question}</span><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#CCB48E] text-[#8C6030] transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl pr-10 text-sm leading-6 text-[#655B50]">{answer}</p></details>)}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ copy }: { copy: typeof salesCopy.pt | typeof salesCopy.en }) {
  return (
    <section className="px-5 pb-20 pt-8 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[38px] bg-[#274735] p-8 text-white shadow-[0_35px_100px_rgba(28,65,45,0.22)] sm:rounded-[48px] sm:p-12 lg:p-14">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#D7B267]/18 blur-[90px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><Eyebrow dark>{copy.finalEyebrow}</Eyebrow><h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{copy.finalTitle}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/62">{copy.finalText}</p></div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button asChild className="h-13 rounded-full bg-[#D7B267] px-6 font-semibold text-[#17130F] hover:bg-[#E6C981]"><Link href="/register">{copy.finalPrimary}<ArrowRight className="ml-2" size={17} /></Link></Button><Button asChild variant="outline" className="h-13 rounded-full border-white/25 bg-white/5 px-6 font-semibold text-white hover:bg-white/10 hover:text-white"><Link href="/contact">{copy.finalSecondary}</Link></Button></div>
        </div>
      </div>
    </section>
  );
}

function MiniValue({ icon: Icon, value, label }: { icon: IconComponent; value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><Icon size={15} className="text-[#D7B267]" /><p className="mt-3 text-lg font-semibold">{value}</p><p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/38">{label}</p></div>;
}

function PackPill({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <span className={`rounded-full px-3.5 py-2 text-xs font-semibold ${dark ? "bg-[#17130F] text-white" : "border border-[#CDB893] bg-[#FFF9F0] text-[#6D4C26]"}`}>{children}</span>;
}

function Eyebrow({ children, icon: Icon, dark = false, className = "" }: { children: ReactNode; icon?: IconComponent; dark?: boolean; className?: string }) {
  return <p className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] ${dark ? "text-[#D7B267]" : "text-[#8E6231]"} ${className}`}>{Icon && <Icon size={14} />}{children}</p>;
}
