"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import Image from "next/image";
import {
  ArrowDownToLine,
  Bot,
  Check,
  Globe2,
  Hotel,
  MailCheck,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const copy = {
  pt: {
    eyebrow: "A nova geração MesaLink",
    title: "O sistema que encontra receita antes de ela desaparecer.",
    intro: "Não é apenas gestão. A MesaLink encontra oportunidades, melhora a visibilidade do restaurante e executa trabalho que normalmente ficava por fazer.",
    recovered: "recuperados este mês",
    opportunities: "oportunidades detetadas",
    agent: "Agente ativo 24/7",
    features: [
      { title: "Revenue AI", label: "Recuperar vendas", text: "Responde a chamadas não atendidas, leads, cancelamentos e clientes inativos. Mostra receita recuperada, não métricas vazias.", result: "Follow-up por email e WhatsApp" },
      { title: "AI Visibility / GEO", label: "Aparecer nas pesquisas por IA", text: "Mede como ChatGPT e outros motores entendem o restaurante, encontra falhas e transforma o diagnóstico em melhorias concretas.", result: "AI Visibility Score 0–100" },
      { title: "Website Builder AI", label: "Website preenchido pela IA", text: "Cria textos, especialidades, páginas locais, menu estruturado, FAQ e sinais SEO. Com domínio próprio e reservas diretas.", result: "Publicação profissional, sem código" },
      { title: "Marketing Autopilot", label: "Campanhas que trabalham sozinhas", text: "A IA escolhe públicos, aniversários, dias fracos, pedidos de review e cartões promocionais em PNG ou PDF.", result: "1.000 emails incluídos por conta" },
      { title: "Rede de Parceiros", label: "Hotéis que enviam clientes", text: "Grupos anónimos, comissões acordadas, restaurantes por cozinha e cartões de parceria com descontos e benefícios.", result: "MesaLink gere cobrança e comissão" },
    ],
    whatsapp: "WhatsApp simples e previsível",
    whatsappText: "1 crédito disponibiliza 8 mensagens enviadas — cerca de 0,03€ por envio. Mensagens recebidas não gastam saldo.",
    downloadsEyebrow: "Apps Android oficiais",
    downloadsTitle: "Três apps. Cada equipa vê apenas o que precisa.",
    downloadsIntro: "Instala diretamente no Android. As contas, permissões e dados continuam protegidos pela mesma infraestrutura MesaLink.",
    download: "Descarregar APK",
    version: "Android 7 ou superior",
    installNote: "Ao instalar por APK, o Android pode pedir autorização para instalar aplicações deste browser. Os ficheiros abaixo são assinados oficialmente pela MesaLink.",
    apps: [
      { name: "MesaLink Restaurantes", audience: "Para restaurantes", text: "Reservas, serviço do dia, clientes, marketing, Revenue AI, website, visibilidade e operação diária.", version: "v1.1.3", href: "/downloads/MesaLink-Restaurantes-v1.1.3.apk", icon: "/icons/apps/restaurant-192.png" },
      { name: "MesaLink Parceiros", audience: "Para parceiros", text: "Escolher restaurantes disponíveis, confirmar reservas imediatas e acompanhar comissões, faturas e pagamentos.", version: "v1.0.3", href: "/downloads/MesaLink-Parceiros-v1.0.3.apk", icon: "/icons/apps/partners-192.png" },
      { name: "MesaLink Backoffice", audience: "Para administração e comerciais", text: "Clientes atribuídos, risco, custos, comissões, pedidos, promoções e chat interno.", version: "v1.0.3", href: "/downloads/MesaLink-Backoffice-v1.0.3.apk", icon: "/icons/apps/backoffice-192.png" },
    ],
  },
  en: {
    eyebrow: "The new MesaLink generation",
    title: "The system that finds revenue before it disappears.",
    intro: "More than management. MesaLink identifies opportunities, improves restaurant visibility and executes work that would otherwise remain undone.",
    recovered: "recovered this month",
    opportunities: "opportunities detected",
    agent: "Agent active 24/7",
    features: [
      { title: "Revenue AI", label: "Win back sales", text: "Responds to missed calls, leads, cancellations and inactive customers. It shows recovered revenue instead of vanity metrics.", result: "Email and WhatsApp follow-up" },
      { title: "AI Visibility / GEO", label: "Be found in AI search", text: "Measures how ChatGPT and other engines understand the restaurant, finds gaps and turns the diagnosis into practical improvements.", result: "AI Visibility Score 0–100" },
      { title: "AI Website Builder", label: "A website completed by AI", text: "Creates copy, specialties, local pages, structured menu, FAQs and SEO signals, with custom domain and direct bookings.", result: "Professional publishing, no code" },
      { title: "Marketing Autopilot", label: "Campaigns that run themselves", text: "AI chooses audiences, birthdays, quiet days, review requests and promotional cards in PNG or PDF.", result: "1,000 emails included per account" },
      { title: "Partner Network", label: "Hotels sending customers", text: "Anonymous groups, agreed commissions, cuisine matching and partnership cards with discounts and benefits.", result: "MesaLink manages payment and commission" },
    ],
    whatsapp: "Simple, predictable WhatsApp",
    whatsappText: "One credit unlocks 8 outbound messages — around €0.03 per send. Incoming messages do not use balance.",
    downloadsEyebrow: "Official Android apps",
    downloadsTitle: "Three apps. Every team sees only what it needs.",
    downloadsIntro: "Install directly on Android. Accounts, permissions and data remain protected by MesaLink infrastructure.",
    download: "Download APK",
    version: "Android 7 or newer",
    installNote: "Android may ask permission to install apps from this browser. Every file below is officially signed by MesaLink.",
    apps: [
      { name: "MesaLink Restaurants", audience: "For restaurants", text: "Bookings, daily service, customers, marketing, Revenue AI, website, visibility and daily operations.", version: "v1.1.3", href: "/downloads/MesaLink-Restaurantes-v1.1.3.apk", icon: "/icons/apps/restaurant-192.png" },
      { name: "MesaLink Partners", audience: "For partners", text: "Choose available restaurants, confirm instant bookings, and track commissions, invoices, and payouts.", version: "v1.0.3", href: "/downloads/MesaLink-Parceiros-v1.0.3.apk", icon: "/icons/apps/partners-192.png" },
      { name: "MesaLink Backoffice", audience: "For admin and sales", text: "Assigned clients, risk, costs, commissions, requests, promotions and internal chat.", version: "v1.0.3", href: "/downloads/MesaLink-Backoffice-v1.0.3.apk", icon: "/icons/apps/backoffice-192.png" },
    ],
  },
} as const;

export function LaunchHighlights({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = locale === "pt" ? copy.pt : copy.en;
  const icons = [Bot, Sparkles, Globe2, MailCheck, Hotel];

  return (
    <section id="ai-platform" className={compact ? "px-5 py-12" : "px-5 py-16 lg:px-8 lg:py-24"}>
      <div className={`${compact ? "max-w-md" : "max-w-7xl"} mx-auto`}>
        <div className={`relative overflow-hidden bg-[#17130F] text-white shadow-[0_40px_130px_rgba(23,19,15,0.25)] ${compact ? "rounded-[38px] p-6" : "rounded-[52px] p-6 sm:p-10 lg:p-14"}`}>
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#C8A56A]/20 blur-[90px]" />
          <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-[#8DA8A1]/10 blur-[100px]" />
          <div className={`relative grid gap-10 ${compact ? "" : "lg:grid-cols-[0.8fr_1.2fr] lg:items-start"}`}>
            <div className={compact ? "" : "lg:sticky lg:top-28"}>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">✦ {t.eyebrow}</p>
              <h2 className={`mt-5 font-semibold leading-[0.9] tracking-[-0.07em] ${compact ? "text-[42px]" : "text-5xl sm:text-7xl"}`}>{t.title}</h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-white/60 sm:text-base">{t.intro}</p>

              <div className={`mt-8 grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4"><TrendingUp className="text-[#D7B267]" size={19} /><p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">€4.820</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{t.recovered}</p></div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4"><Sparkles className="text-[#D7B267]" size={19} /><p className="mt-5 text-3xl font-semibold tracking-[-0.05em]">12</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">{t.opportunities}</p></div>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-[#D7B267]/25 bg-[#D7B267]/10 p-4"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" /><span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" /></span><p className="text-xs font-bold text-[#E6D0A4]">{t.agent}</p></div>
            </div>

            <div className="grid gap-3">
              {t.features.map((feature, index) => {
                const Icon = icons[index];
                return (
                  <motion.article key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.04 }} className="group rounded-[28px] border border-white/10 bg-white/[0.055] p-5 transition hover:border-[#D7B267]/45 hover:bg-white/[0.08] sm:p-6">
                    <div className="flex items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#D7B267] text-[#17130F]"><Icon size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D7B267]">{feature.label}</p><h3 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">{feature.title}</h3></div></div>
                    <p className="mt-4 text-sm leading-6 text-white/58">{feature.text}</p>
                    <p className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#E7D4AE]"><Check size={14} /> {feature.result}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
          <div className="relative mt-6 flex items-start gap-4 rounded-[28px] border border-[#5D8D78]/30 bg-[#294F3D]/35 p-5"><MessageCircleMore className="mt-0.5 shrink-0 text-emerald-300" size={22} /><div><p className="font-bold text-emerald-100">{t.whatsapp}</p><p className="mt-1 text-xs leading-5 text-emerald-50/60">{t.whatsappText}</p></div></div>
        </div>
      </div>
    </section>
  );
}

export function AppDownloads({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const t = locale === "pt" ? copy.pt : copy.en;
  const tones = ["bg-[#17130F] text-white", "bg-[#E8D7BB] text-[#17130F]", "bg-[#315C4A] text-white"];

  return (
    <section id="downloads" className={compact ? "px-5 py-12" : "px-5 py-16 lg:px-8 lg:py-24"}>
      <div className={`${compact ? "max-w-md" : "max-w-7xl"} mx-auto`}>
        <div className={compact ? "" : "grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">{t.downloadsEyebrow}</p>
            <h2 className={`mt-4 font-semibold leading-[0.9] tracking-[-0.07em] ${compact ? "text-[42px]" : "text-5xl sm:text-7xl"}`}>{t.downloadsTitle}</h2>
          </div>
          <p className={`text-sm leading-7 text-[#5C5348] ${compact ? "mt-5" : "max-w-2xl lg:justify-self-end lg:text-base"}`}>{t.downloadsIntro}</p>
        </div>

        <div className={`mt-8 grid gap-4 ${compact ? "" : "lg:grid-cols-3"}`}>
          {t.apps.map((app, index) => {
            const dark = index !== 1;
            return (
              <article key={app.name} className={`relative overflow-hidden rounded-[34px] border border-[#D8C5A5] p-6 shadow-[0_24px_70px_rgba(80,55,30,0.10)] ${tones[index]}`}>
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#D7B267]/20 blur-[55px]" />
                <div className="relative"><div className="flex items-center justify-between gap-3"><Image src={app.icon} alt="" width={56} height={56} className="h-14 w-14 rounded-[18px] shadow-[0_12px_30px_rgba(0,0,0,0.18)]" /><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${dark ? "bg-white/10 text-white/65" : "bg-white/50 text-[#6B4A24]"}`}>{app.version}</span></div>
                  <p className={`mt-6 text-[9px] font-black uppercase tracking-[0.2em] ${dark ? "text-[#D7B267]" : "text-[#8A6130]"}`}>{app.audience}</p>
                  <h3 className="mt-2 text-3xl font-semibold leading-none tracking-[-0.055em]">{app.name}</h3>
                  <p className={`mt-4 min-h-20 text-sm leading-6 ${dark ? "text-white/60" : "text-[#5C5348]"}`}>{app.text}</p>
                  <a href={app.href} download className={`mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition hover:-translate-y-0.5 ${dark ? "bg-white text-[#17130F]" : "bg-[#17130F] text-white"}`}><ArrowDownToLine size={17} /> {t.download}</a>
                  <p className={`mt-3 text-center text-[10px] ${dark ? "text-white/35" : "text-[#6B6258]"}`}>{t.version}</p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-[#C9B38E] bg-[#FFF9F0] p-4 text-xs leading-5 text-[#6B6258]"><ShieldCheck className="mt-0.5 shrink-0 text-[#8A6130]" size={18} /><p>{t.installNote}</p></div>
      </div>
    </section>
  );
}
