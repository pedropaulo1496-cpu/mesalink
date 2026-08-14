import type { Metadata } from "next";
import { ArrowDown, BadgeEuro, BarChart3, Globe2, MessagesSquare, Rocket, ShieldCheck, UtensilsCrossed } from "lucide-react";
import Footer from "@/components/Footer";
import SiteHeader from "@/components/SiteHeader";
import CommercialPartnerApplicationForm from "@/components/commercial-partners/CommercialPartnerApplicationForm";

export const metadata: Metadata = {
  title: "Independent Commercial Partners — Worldwide",
  description: "Join MesaLink as an independent commercial partner. Help restaurants grow with reservations, Revenue AI, partner referrals, marketing and premium websites.",
  alternates: { canonical: "https://www.mesalink.pt/global-sales-partners" },
  openGraph: {
    title: "Build MesaLink in your market",
    description: "A worldwide, commission-based commercial partnership for people who understand restaurants and know how to sell value.",
    url: "https://www.mesalink.pt/global-sales-partners",
    type: "website",
  },
};

const jobPosting = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Independent Commercial Partner — Restaurant Technology",
  description: "Develop MesaLink in your market as an independent, commission-based commercial partner. Introduce restaurants to reservations, Revenue AI, QR Ordering, partner referrals, marketing, customer loyalty and premium websites. This is an independent commercial opportunity with no fixed salary.",
  datePosted: "2026-08-14",
  employmentType: "CONTRACTOR",
  jobLocationType: "TELECOMMUTE",
  directApply: true,
  hiringOrganization: {
    "@type": "Organization",
    name: "MesaLink",
    sameAs: "https://www.mesalink.pt",
    logo: "https://www.mesalink.pt/icon-512.png",
  },
};

export default function GlobalSalesPartnersPage() {
  return (
    <main className="min-h-screen bg-[#F3EDE4] text-[#17130F]">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting) }} />

      <section className="relative overflow-hidden border-b border-[#DCC9AA] bg-[#17130F] text-white">
        <div className="pointer-events-none absolute -right-24 -top-36 h-[32rem] w-[32rem] rounded-full border border-[#D7B267]/20" />
        <div className="pointer-events-none absolute -right-4 -top-14 h-[22rem] w-[22rem] rounded-full border border-[#D7B267]/15" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Pill>Worldwide</Pill><Pill>Independent</Pill><Pill>Commission-based</Pill><Pill>Remote</Pill>
            </div>
            <p className="mt-9 text-[11px] font-black uppercase tracking-[0.28em] text-[#D7B267]">MesaLink global partner programme</p>
            <h1 className="mt-4 max-w-4xl text-[3.45rem] font-semibold leading-[.91] tracking-[-.065em] sm:text-[5rem]">Build the restaurant growth network in your market.</h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">Bring a product restaurant owners can understand in minutes: more bookings, recovered revenue, direct customers and one place to run growth.</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="#apply" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#D7B267] px-6 text-sm font-black text-[#17130F]">Apply now <ArrowDown size={15} /></a><a href="#earn" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-bold text-white">See how it works</a></div>
          </div>

          <div id="earn" className="rounded-[30px] border border-white/12 bg-white/[.055] p-5 shadow-[0_30px_90px_rgba(0,0,0,.25)] backdrop-blur sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#D7B267]">Your commercial model</p>
            <div className="mt-5 divide-y divide-white/10">
              <Earning value="40%" label="of eligible MesaLink plan revenue" />
              <Earning value="20%" label="of eligible credits and extras" />
              <Earning value="+" label="commission on eligible Partner Network net fees" />
            </div>
            <div className="mt-5 rounded-2xl bg-[#D7B267] p-4 text-[#17130F]"><p className="text-sm font-black">MesaLink gives you the operating system.</p><p className="mt-1 text-xs leading-5 opacity-70">You develop relationships and close restaurants in the markets you know best.</p></div>
            <p className="mt-4 text-[10px] leading-4 text-white/40">Commissions are governed by the partner agreement and apply to eligible net revenue. Local invoicing and tax obligations apply. This opportunity has no fixed salary.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#9B6F3B]">A product that opens conversations</p><h2 className="mt-3 text-4xl font-semibold leading-[.98] tracking-[-.055em] sm:text-5xl">Sell measurable growth, not another complicated tool.</h2></div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<BadgeEuro />} title="Recover missed revenue" text="Revenue AI follows cancelled bookings and missed calls, then turns intent back into reservations." />
          <Feature icon={<Globe2 />} title="Win direct demand" text="Premium websites, SEO and AI visibility help restaurants become easier to discover and book." />
          <Feature icon={<UtensilsCrossed />} title="Create new customers" text="The Partner Network connects restaurants with hotels, concierges, creators and local partners." />
          <Feature icon={<MessagesSquare />} title="Explain it simply" text="Reservations, WhatsApp automation, QR ordering, marketing and loyalty live in one platform." />
          <Feature icon={<BarChart3 />} title="Track every account" text="Your own HQ area shows clients, requests, commissions, performance and conversations." />
          <Feature icon={<Rocket />} title="Start with support" text="Demo environment, sales material, onboarding and a personal invitation flow are provided." />
        </div>
      </section>

      <section className="border-y border-[#DCC9AA] bg-[#FFF9F0]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#9B6F3B]">Who succeeds</p><h2 className="mt-3 text-4xl font-semibold tracking-[-.055em]">Commercial judgement with local credibility.</h2><p className="mt-4 text-sm leading-6 text-[#6B6258]">We value people who can identify restaurant pain, build trust and follow a disciplined sales process. Restaurant, hospitality or SaaS experience helps — but clear evidence of execution matters more than titles.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><Fit number="01" title="You know a market" text="You understand how restaurants buy, decide and operate where you live or work." /><Fit number="02" title="You sell outcomes" text="You connect product features to bookings, retention, revenue and operational simplicity." /><Fit number="03" title="You follow through" text="You prospect, demonstrate, document the opportunity and keep momentum after first contact." /><Fit number="04" title="You work independently" text="You organise your pipeline and communicate transparently with MesaLink HQ." /></div>
        </div>
      </section>

      <section id="apply" className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.62fr_1.38fr] lg:items-start">
        <div className="lg:sticky lg:top-28"><p className="text-[10px] font-black uppercase tracking-[.25em] text-[#9B6F3B]">Start here</p><h2 className="mt-3 text-4xl font-semibold leading-[.98] tracking-[-.055em]">Represent MesaLink in the markets you understand.</h2><p className="mt-5 text-sm leading-6 text-[#6B6258]">Every application is reviewed by a person. Structured answers help us find strong market fit faster; they never create an automatic rejection.</p><div className="mt-6 space-y-3"><Trust text="No application fee" /><Trust text="No sensitive-trait scoring" /><Trust text="Human final decision" /><Trust text="Worldwide applications" /></div></div>
        <CommercialPartnerApplicationForm />
      </section>
      <Footer />
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-white/70">{children}</span>; }
function Earning({ value, label }: { value: string; label: string }) { return <div className="flex items-baseline gap-4 py-4 first:pt-0"><strong className="min-w-20 text-4xl font-semibold tracking-[-.06em] text-[#D7B267]">{value}</strong><span className="text-sm font-semibold text-white/75">{label}</span></div>; }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="rounded-[24px] border border-[#DCC9AA] bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F3E7D5] text-[#8C622F]">{icon}</span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6B6258]">{text}</p></article>; }
function Fit({ number, title, text }: { number: string; title: string; text: string }) { return <article className="rounded-[22px] border border-[#E3D4BF] bg-white p-4"><span className="text-[10px] font-black tracking-[.18em] text-[#B08349]">{number}</span><h3 className="mt-2 text-base font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#74695E]">{text}</p></article>; }
function Trust({ text }: { text: string }) { return <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-[#4F7954]" />{text}</p>; }
