"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeEuro, BriefcaseBusiness, Building2, LayoutDashboard, MessageCircle, UsersRound, WalletCards } from "lucide-react";

const links = [
  { href: "/backoffice", label: "Visão geral", icon: LayoutDashboard },
  { href: "/backoffice/clients", label: "Clientes", icon: Building2 },
  { href: "/backoffice/commissions", label: "Comissões", icon: BadgeEuro },
  { href: "/backoffice/requests", label: "Aprovações", icon: BriefcaseBusiness },
  { href: "/backoffice/chat", label: "Chat", icon: MessageCircle },
];

export default function BackofficeNavigation({ role, variant }: { role: "ADMIN" | "SALES"; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const items = role === "ADMIN"
    ? [...links, { href: "/backoffice/partner-payouts", label: "Pagamentos", icon: WalletCards }, { href: "/backoffice/team", label: "Equipa", icon: UsersRound }]
    : links;

  if (variant === "desktop") {
    return (
      <nav className="mt-7 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/backoffice" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition ${active ? "bg-[#D7B267] text-[#17130F]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={16} />
              {label}
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
