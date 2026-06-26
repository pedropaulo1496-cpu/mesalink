"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

type RestaurantSidebarProps = {
  id: string;
  restaurantName: string;
  active?: string;
};

export default function RestaurantSidebar({
  id,
  restaurantName,
  active = "Dashboard",
}: RestaurantSidebarProps) {
const [qrNotificationCount, setQrNotificationCount] = useState(0);

useEffect(() => {
  async function loadNotifications() {
    try {
      const response = await fetch(
        `/api/restaurants/${id}/qr-notifications`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json().catch(() => null);

      setQrNotificationCount(Number(data?.count ?? 0));
    } catch (error) {
      console.warn("QR notifications error:", error);
    }
  }

  loadNotifications();

  const interval = window.setInterval(loadNotifications, 8000);

  return () => window.clearInterval(interval);
}, [id]);

  const sections = [
    {
      title: "Operação",
      items: [
        { name: "Dashboard", href: `/restaurants/${id}`, icon: HomeIcon },
        {
          name: "POS",
          href: `/restaurants/${id}/pos`,
          icon: PosIcon,
          soon: true,
        },
        { name: "Menu & Produtos", href: `/restaurants/${id}/menu`, icon: MenuIcon },
        {
          name: "QR Ordering",
          href: `/restaurants/${id}/ordering`,
          icon: QrIcon,
          badge: qrNotificationCount > 0 ? String(qrNotificationCount) : undefined,
          alert: qrNotificationCount > 0,
        },
        { name: "Serviço do Dia", href: `/restaurants/${id}/day`, icon: CalendarIcon },
        { name: "Reservas", href: `/restaurants/${id}/reservations`, icon: BookIcon },
        { name: "Sala & Mesas", href: `/restaurants/${id}/tables`, icon: GridIcon },
      ],
    },

    {
      title: "Crescimento",
      items: [
        { name: "Clientes", href: `/restaurants/${id}/customers`, icon: UsersIcon },
        {
          name: "Marketing",
          href: `/restaurants/${id}/marketing`,
          icon: MegaphoneIcon,
        },
        { name: "Website", href: `/restaurants/${id}/website`, icon: GlobeIcon },
      ],
    },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[286px] overflow-y-auto scrollbar-hide border-r border-[#E3D3BC] bg-[#F5ECDE] px-5 py-6 lg:flex lg:flex-col">
        <div className="relative z-10">
          <Link href={`/restaurants/${id}`} className="block">
            <p className="text-[34px] font-black tracking-[-0.09em]">
              <span className="text-[#C8A56A]">Mesa</span>
              <span className="text-[#070604]">Link</span>
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-[#A88A57]">
              Growth Platform for Restaurants
            </p>
          </Link>
        </div>

        <div className="relative z-10 mt-8 flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#A88A57]">
                {section.title}
              </p>

              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={active === item.name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-4 border-t border-[#DDC9AA] pt-4">
          <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#A88A57]">
            Conta
          </p>

          <div className="flex flex-col gap-1.5">
            <NavItem
              item={{
                name: "Billing",
                href: `/billing?restaurantId=${id}`,
                icon: BillingIcon,
              }}
              active={active === "Billing"}
            />

            <NavItem
              item={{
                name: "Definições",
                href: `/restaurants/${id}/settings`,
                icon: SettingsIcon,
              }}
              active={active === "Definições"}
            />
          </div>
        </div>

        <div className="relative z-10 mt-5 rounded-[24px] border border-[#E3D3BC] bg-[#FFF9F0]/92 p-4 shadow-[0_22px_60px_rgba(96,65,28,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#D7B267] to-[#B88C43] text-xl font-semibold text-white shadow-[0_14px_30px_rgba(184,140,67,0.28)]">
              {restaurantName.slice(0, 1).toUpperCase()}
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#FFF9F0] bg-[#4D8B50]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#16120E]">
                {restaurantName}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#7A6F62]">
                Growth Suite
              </p>
            </div>

            <span className="text-lg text-[#6B6258]">⌄</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto px-1 pt-6 text-[11px] leading-5 text-[#8A7C6D]">
          <p>Growth Platform for Restaurants</p>
          <p>mesalink.pt</p>
        </div>
      </aside>

      <div className="hidden w-[286px] shrink-0 lg:block" />
    </>
  );
}

function NavItem({
  item,
  active,
}: {
  item: {
  name: string;
  href: string;
  icon: () => ReactNode;
  soon?: boolean;
  badge?: string;
  alert?: boolean;
};
  active: boolean;
}) {
  const Icon = item.icon;

  return (
  <Link
    href={item.href}
    className={
      item.alert
        ? "group relative flex h-[58px] animate-pulse items-center justify-between rounded-[22px] border border-[#D8AE62] bg-[#FFF3D8] px-4 text-sm font-bold text-[#9B6F3B] shadow-[0_18px_50px_rgba(200,165,106,0.35)]"
        : active
          ? "group relative flex h-[58px] items-center justify-between rounded-[22px] border border-[#E4C58E] bg-[#FFF8EC] px-4 text-sm font-bold text-[#9B6F3B] shadow-[0_18px_50px_rgba(110,75,35,0.16)]"
          : "group relative flex h-[52px] items-center justify-between rounded-[20px] px-4 text-sm font-bold text-[#201813] transition hover:bg-[#FFF8EC] hover:text-[#9B6F3B]"
    }
  >
      {active && (
        <span className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-[#C8A56A]" />
      )}

      <span className="flex items-center gap-3.5">
        <span
          className={
            active
              ? "flex h-9 w-9 items-center justify-center rounded-[15px] bg-[#C8A56A] text-white shadow-[0_10px_25px_rgba(200,165,106,0.38)]"
              : "flex h-9 w-9 items-center justify-center rounded-[15px] text-[#15110D] transition group-hover:bg-[#EFE1CA] group-hover:text-[#9B6F3B]"
          }
        >
          <Icon />
        </span>

        <span>{item.name}</span>
      </span>

      {item.badge && (
        <span className="rounded-full bg-[#16120E] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
          {item.badge}
        </span>
      )}

      {item.soon && (
        <span className="rounded-full border border-[#E1C48C] bg-[#FFF4DF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          Coming Soon
        </span>
      )}
    </Link>
  );
}

function IconSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.15"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconSvg>
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10.7V20h13v-9.3" />
      <path d="M9.5 20v-6h5v6" />
    </IconSvg>
  );
}

function CalendarIcon() {
  return (
    <IconSvg>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="16" rx="3" />
      <path d="M8 13h4" />
      <path d="M8 17h7" />
    </IconSvg>
  );
}

function BookIcon() {
  return (
    <IconSvg>
      <path d="M6 4h12a2 2 0 0 1 2 2v14H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
    </IconSvg>
  );
}

function GridIcon() {
  return (
    <IconSvg>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </IconSvg>
  );
}

function UsersIcon() {
  return (
    <IconSvg>
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
      <circle cx="12" cy="9" r="3" />
      <path d="M20 18c0-1.7-1-3.1-2.5-3.7" />
      <path d="M16.5 6.5a2.6 2.6 0 0 1 0 5" />
    </IconSvg>
  );
}

function GlobeIcon() {
  return (
    <IconSvg>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2.2 2.2 3.2 5 3.2 8s-1 5.8-3.2 8" />
      <path d="M12 4C9.8 6.2 8.8 9 8.8 12s1 5.8 3.2 8" />
    </IconSvg>
  );
}

function QrIcon() {
  return (
    <IconSvg>
      <path d="M4 4h6v6H4z" />
      <path d="M14 4h6v6h-6z" />
      <path d="M4 14h6v6H4z" />
      <path d="M14 14h2" />
      <path d="M18 14h2v2" />
      <path d="M14 18h2v2" />
      <path d="M18 20h2" />
    </IconSvg>
  );
}

function MegaphoneIcon() {
  return (
    <IconSvg>
      <path d="M4 13h3l9 4V7l-9 4H4z" />
      <path d="M7 13v5" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </IconSvg>
  );
}

function PosIcon() {
  return (
    <IconSvg>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M8 7h8" />
      <path d="M8 12h2" />
      <path d="M12 12h2" />
      <path d="M16 12h.01" />
      <path d="M8 16h2" />
      <path d="M12 16h2" />
      <path d="M16 16h.01" />
    </IconSvg>
  );
}

function MenuIcon() {
  return (
    <IconSvg>
      <path d="M5 5h14" />
      <path d="M5 12h14" />
      <path d="M5 19h14" />
      <path d="M8 8h8" />
      <path d="M8 15h8" />
    </IconSvg>
  );
}

function BillingIcon() {
  return (
    <IconSvg>
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M4 9h16" />
      <path d="M8 14h4" />
      <path d="M15.5 14h.01" />
    </IconSvg>
  );
}

function SettingsIcon() {
  return (
    <IconSvg>
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1a2.1 2.1 0 0 1-3 3l-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21a2.1 2.1 0 0 1-4.2 0v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1a2.1 2.1 0 0 1-3-3l.1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H2a2.1 2.1 0 0 1 0-4.2h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1a2.1 2.1 0 0 1 3-3l.1.1a1.8 1.8 0 0 0 2 .3h.1a1.8 1.8 0 0 0 1-1.6V3a2.1 2.1 0 0 1 4.2 0v.2a1.8 1.8 0 0 0 1 1.6h.1a1.8 1.8 0 0 0 2-.3l.1-.1a2.1 2.1 0 0 1 3 3l-.1.1a1.8 1.8 0 0 0-.3 2v.1a1.8 1.8 0 0 0 1.6 1h.2a2.1 2.1 0 0 1 0 4.2h-.2a1.8 1.8 0 0 0-1.6 1Z" />
    </IconSvg>
  );
}
