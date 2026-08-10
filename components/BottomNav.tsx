"use client";

import {
  CalendarDays,
  House,
  LayoutGrid,
  Megaphone,
  QrCode,
  Settings,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav({ id }: { id: string }) {
  const pathname = usePathname();
  const root = `/restaurants/${id}`;
  const items = [
    { href: root, icon: House, label: "Dash" },
    { href: `${root}/day`, icon: Zap, label: "Hoje" },
    { href: `${root}/calendar`, icon: CalendarDays, label: "Cal." },
    { href: `${root}/ordering`, icon: QrCode, label: "QR" },
    { href: `${root}/tables`, icon: LayoutGrid, label: "Sala" },
    { href: `${root}/marketing`, icon: Megaphone, label: "Mkt." },
    { href: `${root}/settings`, icon: Settings, label: "Def." },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== root && pathname.startsWith(`${href}/`));

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-2.5 pb-[calc(0.7rem+env(safe-area-inset-bottom))] lg:hidden">
      <div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-7 gap-0.5 rounded-[24px] border border-white/10 bg-[#17130F]/96 p-1.5 shadow-[0_22px_65px_rgba(23,19,15,0.36)] backdrop-blur-2xl">
        {items.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-[17px] py-1.5 transition ${
                active
                  ? "bg-[#C8A56A] text-[#17130F] shadow-[0_8px_24px_rgba(200,165,106,0.25)]"
                  : "text-white/60 active:bg-white/10 active:text-white"
              }`}
            >
              <item.icon className="size-[17px]" strokeWidth={2.2} />
              <span className="max-w-full truncate px-0.5 text-[8px] font-bold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
