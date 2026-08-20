"use client";

import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  ChevronRight,
  Globe2,
  Hotel,
  LayoutDashboard,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

const mobileCopy = {
  pt: {
    eyebrow: "Crescimento para restaurantes",
    heroLead: "Mais mesas ocupadas.",
    heroAccent: "Menos clientes perdidos.",
    heroText:
      "Reservas diretas, novos clientes enviados por parceiros e recuperação automática — tudo num sistema simples de usar.",
    primary: "Começar 7 dias grátis",
    secondary: "Pedir demonstração",
    trust: ["Sem comissão direta", "Configuração acompanhada", "Sem compromisso"],
    flowTitle: "Uma reserva. Tudo ligado.",
    flowRows: [
      ["Reserva direta", "Google · Instagram · Website"],
      ["Cliente novo", "Hotel · concierge · parceiro"],
      ["Oportunidade recuperada", "Revenue AI · email · WhatsApp"],
    ],
    enginesEyebrow: "Três motores de crescimento",
    enginesTitle: "Não é só gestão. É negócio novo.",
    engines: [
      ["Reservas diretas", "Converte quem já procura o restaurante, sem comissão por pessoa."],
      ["Rede de Parceiros", "Os parceiros enviam clientes que provavelmente não chegariam até ti."],
      ["Revenue AI", "Cancelamentos, no-shows e chamadas não atendidas voltam a ser oportunidades."],
    ],
    networkEyebrow: "Funcionalidade em destaque",
    networkTitle: "Clientes novos, enviados por quem já os tem.",
    networkText:
      "Define a comissão e a disponibilidade. O parceiro escolhe o restaurante e a reserva entra diretamente na agenda MesaLink.",
    networkPoints: ["Comissão definida pelo restaurante", "Contacto protegido até à reserva", "Capacidade e dias sob o teu controlo"],
    networkCta: "Conhecer a Rede de Parceiros",
    demoEyebrow: "Experimenta como cliente",
    demoTitle: "Uma reserva real, sem instalar nenhuma app.",
    demoText: "Vê a experiência pública da Taberna Tuga diretamente no browser do telemóvel.",
    demoCta: "Reservar na Taberna Tuga",
    platformEyebrow: "Tudo num só lugar",
    platformTitle: "Antes, durante e depois da visita.",
    features: ["Reservas & mesas", "Menus & depósitos", "QR Ordering", "CRM & cartões", "Website & SEO", "Rede de Parceiros", "Marketing Autopilot", "AI Visibility"],
    appsEyebrow: "Apps oficiais",
    appsTitle: "Cada equipa vê apenas o que precisa.",
    appsText: "A app dos restaurantes e a app dos parceiros usam contas e permissões separadas.",
    download: "Descarregar",
    appAudience: ["Restaurantes", "Parceiros"],
    finalEyebrow: "Começa hoje",
    finalTitle: "A próxima reserva pode começar no MesaLink.",
    finalText: "7 dias para experimentar todas as funcionalidades, com configuração acompanhada.",
    finalPrimary: "Começar teste gratuito",
    finalSecondary: "Falar com a MesaLink",
  },
  en: {
    eyebrow: "Growth for restaurants",
    heroLead: "More tables filled.",
    heroAccent: "Fewer customers lost.",
    heroText:
      "Direct bookings, new customers sent by partners and automatic recovery — all in one simple system.",
    primary: "Start 7 days free",
    secondary: "Book a demo",
    trust: ["No direct booking fee", "Guided setup", "No commitment"],
    flowTitle: "One booking. Everything connected.",
    flowRows: [
      ["Direct booking", "Google · Instagram · Website"],
      ["New customer", "Hotel · concierge · partner"],
      ["Recovered opportunity", "Revenue AI · email · WhatsApp"],
    ],
    enginesEyebrow: "Three growth engines",
    enginesTitle: "More than management. New business.",
    engines: [
      ["Direct bookings", "Convert people already searching, with no per-cover commission."],
      ["Partner Network", "Hotels and partners send customers who probably would not find you otherwise."],
      ["Revenue AI", "Cancellations, no-shows and missed calls become opportunities again."],
    ],
    networkEyebrow: "Featured capability",
    networkTitle: "New customers, sent by people who already have them.",
    networkText:
      "Set commission and availability. The partner chooses the restaurant and the booking enters MesaLink directly.",
    networkPoints: ["Commission set by the restaurant", "Contact protected until booking", "Capacity and days under your control"],
    networkCta: "Explore the Partner Network",
    demoEyebrow: "Try the customer experience",
    demoTitle: "A real booking, with no app to install.",
    demoText: "See Taberna Tuga’s public experience directly in the phone browser.",
    demoCta: "Book at Taberna Tuga",
    platformEyebrow: "Everything in one place",
    platformTitle: "Before, during and after the visit.",
    features: ["Bookings & tables", "Menus & deposits", "QR Ordering", "CRM & cards", "Website & SEO", "Partner Network", "Marketing Autopilot", "AI Visibility"],
    appsEyebrow: "Official apps",
    appsTitle: "Every team sees only what it needs.",
    appsText: "The restaurant and partner apps use separate accounts and permissions.",
    download: "Download",
    appAudience: ["Restaurants", "Partners"],
    finalEyebrow: "Start today",
    finalTitle: "Your next booking can start in MesaLink.",
    finalText: "Try every feature for 7 days, with guided setup.",
    finalPrimary: "Start free trial",
    finalSecondary: "Talk to MesaLink",
  },
} as const;

type MobileCopy = typeof mobileCopy.pt | typeof mobileCopy.en;
type IconComponent = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

export default function MobilePage() {
  const locale = useLocale();
  const copy = locale === "pt" ? mobileCopy.pt : mobileCopy.en;

  return (
    <main className="min-h-screen overflow-hidden bg-[#F3ECE2] text-[#17130F]">
      <SiteHeader variant="compact" />
      <MobileHero copy={copy} />
      <GrowthEngines copy={copy} />
      <PartnerFeature copy={copy} />
      <PublicDemo copy={copy} />
      <MobilePlatform copy={copy} />
      <PricingMini />
      <MobileApps copy={copy} />
      <MobileFinalCTA copy={copy} />
      <Footer />
    </main>
  );
}

function MobileHero({ copy }: { copy: MobileCopy }) {
  const flowIcons = [Globe2, Hotel, Bot];

  return (
    <section className="relative px-4 pb-12 pt-9">
      <div className="pointer-events-none absolute left-1/2 top-[-130px] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#D8C5A5]/45 blur-[85px]" />
      <div className="relative mx-auto max-w-md">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <MobileEyebrow icon={Sparkles}>{copy.eyebrow}</MobileEyebrow>
          <h1 className="mt-5 text-[46px] font-semibold leading-[0.9] tracking-[-0.075em] min-[390px]:text-[52px]">
            {copy.heroLead}<span className="mt-1 block text-[#A9793E]">{copy.heroAccent}</span>
          </h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-[#5F554B]">{copy.heroText}</p>

          <div className="mt-7 grid gap-2.5">
            <Link href="/register" className="flex h-13 items-center justify-center rounded-full bg-[#17130F] px-6 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(23,19,15,0.2)]">{copy.primary}<ArrowRight className="ml-2" size={17} /></Link>
            <Link href="/contact" className="flex h-13 items-center justify-center rounded-full border border-[#BFA477] bg-[#FFF9F0] px-6 text-sm font-semibold">{copy.secondary}</Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {copy.trust.map((item) => <span key={item} className="flex items-center gap-1.5 rounded-full border border-[#DDCBB0] bg-[#FFF9F0]/80 px-3 py-2 text-[10px] font-semibold text-[#62574B]"><Check size={11} className="text-[#315A3F]" strokeWidth={3} />{item}</span>)}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.08 }} className="relative mt-8 overflow-hidden rounded-[32px] border border-[#2C241E] bg-[#17130F] p-4 text-white shadow-[0_30px_80px_rgba(23,19,15,0.24)]">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#D7B267]/18 blur-[65px]" />
          <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7B267]">MesaLink Growth</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">{copy.flowTitle}</h2></div><span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1.5 text-[9px] font-bold uppercase text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Ativo</span></div>
          <div className="relative mt-4 grid gap-2.5">
            {copy.flowRows.map(([title, text], index) => {
              const Icon = flowIcons[index];
              return <div key={title} className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[19px] border border-white/10 bg-white/[0.055] p-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 1 ? "bg-[#315A3F] text-[#E4C98F]" : index === 2 ? "bg-[#5A467D] text-white" : "bg-[#D7B267] text-[#17130F]"}`}><Icon size={17} /></span><div className="min-w-0"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 truncate text-[10px] text-white/45">{text}</p></div><ChevronRight size={14} className="text-[#D7B267]" /></div>;
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function GrowthEngines({ copy }: { copy: MobileCopy }) {
  const icons = [Globe2, Hotel, Bot];
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <MobileEyebrow>{copy.enginesEyebrow}</MobileEyebrow>
        <h2 className="mt-4 text-[38px] font-semibold leading-[0.94] tracking-[-0.065em]">{copy.enginesTitle}</h2>
        <div className="mt-7 grid gap-3">
          {copy.engines.map(([title, text], index) => {
            const Icon = icons[index];
            const highlighted = index === 1;
            return <article key={title} className={`grid grid-cols-[48px_1fr] gap-4 rounded-[25px] border p-4 ${highlighted ? "border-[#315A3F] bg-[#274735] text-white" : "border-[#DDCBB0] bg-[#FFF9F0]"}`}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${highlighted ? "bg-white/10 text-[#E4C98F]" : "bg-[#F0DFC1] text-[#80592B]"}`}><Icon size={19} /></span><div><p className={`text-[9px] font-bold uppercase tracking-[0.16em] ${highlighted ? "text-[#E4C98F]" : "text-[#9B6F3B]"}`}>{index === 0 ? "Direto" : index === 1 ? "Cliente novo" : "Recuperação"}</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.035em]">{title}</h3><p className={`mt-2 text-sm leading-6 ${highlighted ? "text-white/62" : "text-[#655B50]"}`}>{text}</p></div></article>;
          })}
        </div>
      </div>
    </section>
  );
}

function PartnerFeature({ copy }: { copy: MobileCopy }) {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-md overflow-hidden rounded-[32px] bg-[#17130F] text-white shadow-[0_28px_75px_rgba(23,19,15,0.22)]">
        <div className="relative p-6">
          <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#315A3F]/60 blur-[65px]" />
          <div className="relative"><MobileEyebrow dark icon={Hotel}>{copy.networkEyebrow}</MobileEyebrow><h2 className="mt-4 text-[38px] font-semibold leading-[0.94] tracking-[-0.065em]">{copy.networkTitle}</h2><p className="mt-4 text-sm leading-6 text-white/58">{copy.networkText}</p></div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.04] p-4">
          <div className="rounded-[24px] border border-white/10 bg-[#211A15] p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D7B267]">Reserva Partner</p><h3 className="mt-1 text-lg font-semibold">Hotel · Lisboa</h3></div><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[9px] font-bold uppercase text-emerald-200">Confirmada</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2"><SmallData icon={Users} value="8" label="pessoas" /><SmallData icon={CalendarCheck2} value="20:00" label="hora" /><SmallData icon={MapPin} value="2,4 km" label="distância" /></div>
          </div>
          <div className="mt-4 grid gap-2">{copy.networkPoints.map((point) => <p key={point} className="flex items-start gap-2 rounded-2xl bg-white/[0.045] px-3.5 py-3 text-xs leading-5 text-white/64"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#D7B267]" />{point}</p>)}</div>
          <Link href="/partners" className="mt-4 flex h-12 items-center justify-center rounded-full bg-[#D7B267] px-5 text-sm font-semibold text-[#17130F]">{copy.networkCta}<ArrowRight className="ml-2" size={16} /></Link>
        </div>
      </div>
    </section>
  );
}

function PublicDemo({ copy }: { copy: MobileCopy }) {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-md rounded-[30px] border border-[#D7C3A1] bg-[#FFF9F0] p-5 shadow-[0_20px_55px_rgba(65,43,23,0.08)]">
        <MobileEyebrow icon={Search}>{copy.demoEyebrow}</MobileEyebrow>
        <h2 className="mt-4 text-[34px] font-semibold leading-[0.96] tracking-[-0.06em]">{copy.demoTitle}</h2>
        <p className="mt-4 text-sm leading-6 text-[#655B50]">{copy.demoText}</p>
        <div className="mt-5 rounded-[22px] bg-[#17130F] p-4 text-white"><div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D7B267]">Reserva online</p><h3 className="mt-1 text-xl font-semibold">Taberna Tuga</h3><p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/45"><MapPin size={11} />Cais do Sodré · Lisboa</p></div><span className="grid h-11 w-11 place-items-center rounded-full bg-[#D7B267] text-[#17130F]"><UtensilsCrossed size={18} /></span></div><div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-3.5 py-3"><span className="text-xs">Amanhã · 20:00 · 4 pessoas</span><CalendarCheck2 size={16} className="text-[#D7B267]" /></div></div>
        <a href="https://www.mesalink.pt/reserve/taberna-tuga" target="_blank" rel="noreferrer" className="mt-4 flex h-12 items-center justify-center rounded-full border border-[#BFA477] bg-white px-5 text-sm font-semibold">{copy.demoCta}<ArrowRight className="ml-2" size={16} /></a>
      </div>
    </section>
  );
}

function MobilePlatform({ copy }: { copy: MobileCopy }) {
  const icons = [CalendarCheck2, UtensilsCrossed, QrCode, Users, Globe2, Hotel, Sparkles, Search];
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <MobileEyebrow icon={LayoutDashboard}>{copy.platformEyebrow}</MobileEyebrow>
        <h2 className="mt-4 text-[38px] font-semibold leading-[0.94] tracking-[-0.065em]">{copy.platformTitle}</h2>
        <div className="mt-7 grid grid-cols-2 gap-2.5">{copy.features.map((feature, index) => { const Icon = icons[index]; const growth = index >= 6; return <div key={feature} className={`rounded-[22px] border p-4 ${growth ? "border-[#C9B9D9] bg-[#F6F1F9]" : "border-[#DDCBB0] bg-[#FFF9F0]"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${growth ? "bg-[#E9DEF1] text-[#5D477B]" : "bg-[#F0DFC1] text-[#80592B]"}`}><Icon size={16} /></span><p className="mt-3 text-sm font-semibold leading-5">{feature}</p><p className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${growth ? "text-[#71568B]" : "text-[#9B6F3B]"}`}>{growth ? "Growth" : "Essentials"}</p></div>; })}</div>
      </div>
    </section>
  );
}

function PricingMini() {
  const t = useTranslations("marketing.mobileHome");
  return (
    <section id="pricing" className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <MobileEyebrow>{t("pricingMini.label")}</MobileEyebrow>
        <h2 className="mt-4 text-[38px] font-semibold leading-[0.94] tracking-[-0.065em]">{t("pricingMini.titleLine1")} <span className="text-[#A9793E]">{t("pricingMini.titleLine2")}</span></h2>
        <div className="mt-7 overflow-hidden rounded-[28px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_20px_55px_rgba(65,43,23,0.08)]">
          <PlanRow name={t("pricingMini.essentialsName")} price="55€" text={t("pricingMini.essentialsText")} perMonth={t("pricingMini.perMonth")} />
          <PlanRow featured name={t("pricingMini.growthName")} price="75€" text={t("pricingMini.growthText")} perMonth={t("pricingMini.perMonth")} badge={t("pricingMini.bestBadge")} />
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-[#6B6258]">{t("pricingMini.footerNote")}</p>
      </div>
    </section>
  );
}

function PlanRow({ name, price, text, perMonth, badge, featured = false }: { name: string; price: string; text: string; perMonth: string; badge?: string; featured?: boolean }) {
  return <div className={`border-b border-[#E5D6C1] p-5 last:border-b-0 ${featured ? "bg-[#17130F] text-white" : "bg-[#FFF9F0]"}`}><div className="flex items-start justify-between gap-4"><div><p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${featured ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{name}</p><p className={`mt-2 max-w-[230px] text-xs leading-5 ${featured ? "text-white/55" : "text-[#655B50]"}`}>{text}</p></div><div className="shrink-0 text-right">{badge && <span className="rounded-full bg-[#D7B267] px-2 py-1 text-[8px] font-bold uppercase text-[#17130F]">{badge}</span>}<p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{price}</p><p className={`text-[10px] ${featured ? "text-white/45" : "text-[#6B6258]"}`}>{perMonth}</p></div></div></div>;
}

function MobileApps({ copy }: { copy: MobileCopy }) {
  const apps = [
    { name: "MesaLink", icon: "/icons/apps/restaurant-192.png", href: "/downloads/MesaLink-Restaurantes-v1.1.3.apk" },
    { name: "MesaLink Partners", icon: "/icons/apps/partners-192.png", href: "/downloads/MesaLink-Parceiros-v1.0.3.apk" },
  ];
  return (
    <section id="downloads" className="px-4 py-12">
      <div className="mx-auto max-w-md">
        <MobileEyebrow icon={ArrowDownToLine}>{copy.appsEyebrow}</MobileEyebrow><h2 className="mt-4 text-[38px] font-semibold leading-[0.94] tracking-[-0.065em]">{copy.appsTitle}</h2><p className="mt-4 text-sm leading-6 text-[#655B50]">{copy.appsText}</p>
        <div className="mt-6 grid gap-2.5">{apps.map((app, index) => <a key={app.name} href={app.href} download className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-[22px] border border-[#D8C5A5] bg-[#FFF9F0] p-3.5"><Image src={app.icon} alt="" width={48} height={48} className="h-12 w-12 rounded-2xl" /><div><p className="text-sm font-semibold">{app.name}</p><p className="mt-0.5 text-[10px] text-[#6B6258]">{copy.appAudience[index]}</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-[#17130F] text-white"><ArrowDownToLine size={15} /></span></a>)}</div>
      </div>
    </section>
  );
}

function MobileFinalCTA({ copy }: { copy: MobileCopy }) {
  return (
    <section className="px-4 pb-20 pt-10">
      <div className="relative mx-auto max-w-md overflow-hidden rounded-[32px] bg-[#274735] p-6 text-white shadow-[0_28px_75px_rgba(28,65,45,0.2)]"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D7B267]/18 blur-[70px]" /><div className="relative"><MobileEyebrow dark>{copy.finalEyebrow}</MobileEyebrow><h2 className="mt-4 text-[40px] font-semibold leading-[0.92] tracking-[-0.07em]">{copy.finalTitle}</h2><p className="mt-4 text-sm leading-6 text-white/60">{copy.finalText}</p><div className="mt-6 grid gap-2.5"><Link href="/register" className="flex h-12 items-center justify-center rounded-full bg-[#D7B267] px-5 text-sm font-semibold text-[#17130F]">{copy.finalPrimary}<ArrowRight className="ml-2" size={16} /></Link><Link href="/contact" className="flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold">{copy.finalSecondary}</Link></div></div></div>
    </section>
  );
}

function SmallData({ icon: Icon, value, label }: { icon: IconComponent; value: string; label: string }) {
  return <div className="rounded-2xl bg-white/[0.055] p-3"><Icon size={14} className="text-[#D7B267]" /><p className="mt-2 text-sm font-semibold">{value}</p><p className="mt-0.5 text-[8px] uppercase tracking-wider text-white/35">{label}</p></div>;
}

function MobileEyebrow({ children, icon: Icon, dark = false }: { children: ReactNode; icon?: IconComponent; dark?: boolean }) {
  return <p className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] ${dark ? "text-[#D7B267]" : "text-[#8E6231]"}`}>{Icon && <Icon size={13} />}{children}</p>;
}
