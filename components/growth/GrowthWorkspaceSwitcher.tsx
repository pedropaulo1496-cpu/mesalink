import Link from "next/link";
import { Globe2, Handshake, Megaphone, MessageCircleMore, Sparkles } from "lucide-react";

type GrowthArea = "marketing" | "revenue" | "partners" | "website" | "visibility";

const copy = {
  pt: {
    label: "Crescimento",
    marketing: "Marketing",
    revenue: "Revenue AI",
    partners: "Parceiros",
    website: "Website",
    visibility: "Visibilidade IA",
  },
  en: {
    label: "Growth",
    marketing: "Marketing",
    revenue: "Revenue AI",
    partners: "Partners",
    website: "Website",
    visibility: "AI Visibility",
  },
} as const;

export default function GrowthWorkspaceSwitcher({ restaurantId, active, locale }: { restaurantId: string; active: GrowthArea; locale: string }) {
  const t = locale === "pt" ? copy.pt : copy.en;
  const items = [
    { key: "marketing" as const, href: `/restaurants/${restaurantId}/marketing`, label: t.marketing, icon: <Megaphone size={15} /> },
    { key: "revenue" as const, href: `/restaurants/${restaurantId}/revenue-ai`, label: t.revenue, icon: <MessageCircleMore size={15} /> },
    { key: "partners" as const, href: `/restaurants/${restaurantId}/partner-network`, label: t.partners, icon: <Handshake size={15} /> },
    { key: "website" as const, href: `/restaurants/${restaurantId}/website`, label: t.website, icon: <Globe2 size={15} /> },
    { key: "visibility" as const, href: `/restaurants/${restaurantId}/ai-visibility`, label: t.visibility, icon: <Sparkles size={15} /> },
  ];

  return (
    <nav aria-label={t.label} className="mt-5 overflow-x-auto rounded-2xl border border-[#DCC9AA] bg-white p-1.5 shadow-[0_10px_30px_rgba(80,55,30,0.04)]">
      <div className="flex min-w-max gap-1">
        <span className="hidden items-center px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B] xl:flex">{t.label}</span>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${active === item.key ? "bg-[#17120D] text-white shadow-sm" : "text-[#6B6258] hover:bg-[#FFF6E9] hover:text-[#17120D]"}`}
          >
            {item.icon}{item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
