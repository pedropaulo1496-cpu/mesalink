"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeEuro, BarChart3, BriefcaseBusiness, Building2, ChevronRight, LayoutDashboard, MessageCircle, Settings, UserRoundSearch, UsersRound, WalletCards } from "lucide-react";

const links = [
  { href: "/backoffice", label: "Visão geral", icon: LayoutDashboard },
  { href: "/backoffice/clients", label: "Clientes", icon: Building2 },
  { href: "/backoffice/commissions", label: "Comissões", icon: BadgeEuro },
  { href: "/backoffice/requests", label: "Aprovações", icon: BriefcaseBusiness },
  { href: "/backoffice/chat", label: "Chat", icon: MessageCircle },
  { href: "/backoffice/settings", label: "Definições", icon: Settings },
];

export default function BackofficeNavigation({ role, variant }: { role: "ADMIN" | "SALES"; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const items = role === "ADMIN"
    ? [...links, { href: "/backoffice/traffic", label: "Tráfego", icon: BarChart3 }, { href: "/backoffice/candidates", label: "Candidaturas", icon: UserRoundSearch }, { href: "/backoffice/partner-payouts", label: "Pagamentos", icon: WalletCards }, { href: "/backoffice/team", label: "Comerciais", icon: UsersRound }]
    : links.map((item) => item.href === "/backoffice/requests" ? { ...item, label: "Os meus pedidos" } : item);

  if (variant === "desktop") {
    return (
      <nav className="mt-7 space-y-1.5">
        <p className="mb-3 px-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/25">Área de trabalho</p>
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/backoffice" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`group flex h-11 items-center gap-3 rounded-[14px] px-2.5 text-[12px] font-bold transition ${active ? "bg-[#D7B267] text-[#17130F] shadow-[0_10px_25px_rgba(0,0,0,0.18)]" : "text-white/56 hover:bg-white/[0.07] hover:text-white"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[11px] ${active ? "bg-[#17130F]/10" : "bg-white/[0.06]"}`}><Icon size={15} /></span>
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <ChevronRight size={13} className={`${active ? "opacity-65" : "opacity-0 group-hover:opacity-40"}`} />
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
      <nav className="fixed inset-x-2 bottom-2 z-50 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#17130F]/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/backoffice" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[8px] font-bold ${active ? "bg-[#D7B267] text-[#17130F]" : "text-white/55"}`}>
              <Icon size={16} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
  );
}
