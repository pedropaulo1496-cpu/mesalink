import Link from "next/link";
import { ArrowRight, Megaphone, MessageCircleMore } from "lucide-react";

const copy = {
  pt: {
    eyebrow: "Dois motores, uma só estratégia",
    marketingTitle: "Marketing & Fidelização",
    marketingRule: "Um público → uma campanha",
    marketingText: "Campanhas, aniversários, reviews, clientes VIP e cartões promocionais.",
    revenueTitle: "Revenue AI",
    revenueRule: "Uma oportunidade → uma conversa",
    revenueText: "Leads, chamadas perdidas, cancelamentos, no-shows e clientes inativos.",
    active: "Estás aqui",
    open: "Abrir",
  },
  en: {
    eyebrow: "Two engines, one growth strategy",
    marketingTitle: "Marketing & Loyalty",
    marketingRule: "One audience → one campaign",
    marketingText: "Campaigns, birthdays, reviews, VIP customers and promotional cards.",
    revenueTitle: "Revenue AI",
    revenueRule: "One opportunity → one conversation",
    revenueText: "Leads, missed calls, cancellations, no-shows and inactive customers.",
    active: "You are here",
    open: "Open",
  },
} as const;

export default function GrowthWorkspaceSwitcher({ restaurantId, active, locale }: { restaurantId: string; active: "marketing" | "revenue"; locale: string }) {
  const t = locale === "pt" ? copy.pt : copy.en;
  return (
    <section className="mt-6 rounded-[30px] border border-[#DCC9AA] bg-[#EDE0CD] p-3">
      <p className="px-2 pb-3 pt-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#8A6130]">{t.eyebrow}</p>
      <div className="grid gap-3 lg:grid-cols-2">
        <WorkspaceCard href={`/restaurants/${restaurantId}/marketing`} icon={<Megaphone size={19} />} title={t.marketingTitle} rule={t.marketingRule} text={t.marketingText} active={active === "marketing"} activeLabel={t.active} openLabel={t.open} />
        <WorkspaceCard href={`/restaurants/${restaurantId}/revenue-ai`} icon={<MessageCircleMore size={19} />} title={t.revenueTitle} rule={t.revenueRule} text={t.revenueText} active={active === "revenue"} activeLabel={t.active} openLabel={t.open} />
      </div>
    </section>
  );
}

function WorkspaceCard({ href, icon, title, rule, text, active, activeLabel, openLabel }: { href: string; icon: React.ReactNode; title: string; rule: string; text: string; active: boolean; activeLabel: string; openLabel: string }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`group rounded-[24px] border p-5 transition ${active ? "border-[#17120D] bg-[#17120D] text-white shadow-[0_16px_40px_rgba(48,32,18,0.16)]" : "border-[#DCC9AA] bg-[#FFF9F0] text-[#17120D] hover:border-[#B88B4A] hover:bg-white"}`}>
      <div className="flex items-start justify-between gap-4"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${active ? "bg-[#D7B267] text-[#17120D]" : "bg-[#EFE1CA] text-[#8A6130]"}`}>{icon}</span><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${active ? "bg-white/10 text-[#F1DCA8]" : "bg-[#EFE1CA] text-[#7A552A]"}`}>{active ? activeLabel : <span className="inline-flex items-center gap-1">{openLabel}<ArrowRight size={11} /></span>}</span></div>
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.035em]">{title}</h2>
      <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.15em] ${active ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{rule}</p>
      <p className={`mt-3 text-xs leading-5 ${active ? "text-white/60" : "text-[#6B6258]"}`}>{text}</p>
    </Link>
  );
}
