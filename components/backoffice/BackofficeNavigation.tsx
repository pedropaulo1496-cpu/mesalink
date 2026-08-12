"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeEuro, BriefcaseBusiness, Building2, LayoutDashboard, MessageCircle, UsersRound } from "lucide-react";

const links = [
  { href: "/backoffice", label: "Visão geral", icon: LayoutDashboard },
  { href: "/backoffice/clients", label: "Clientes", icon: Building2 },
  { href: "/backoffice/commissions", label: "Comissões", icon: BadgeEuro },
  { href: "/backoffice/requests", label: "Pedidos", icon: BriefcaseBusiness },
  { href: "/backoffice/chat", label: "Chat", icon: MessageCircle },
];

export default function BackofficeNavigation({ role, variant }: { role: "ADMIN" | "SALES"; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  const items = role === "ADMIN"
    ? [...links, { href: "/backoffice/team", label: "Equipa", icon: UsersRound }]
    : links;

  if (variant === "desktop") {
    return (
      <nav className="mt-8 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/backoffice" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active ? "bg-[#D7B267] text-[#17130F]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
      <nav className="fixed inset-x-2 bottom-2 z-50 grid grid-cols-5 rounded-[22px] border border-white/10 bg-[#17130F]/95 p-1.5 shadow-2xl backdrop-blur lg:hidden">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/backoffice" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold ${active ? "bg-[#D7B267] text-[#17130F]" : "text-white/55"}`}>
              <Icon size={17} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
  );
}
