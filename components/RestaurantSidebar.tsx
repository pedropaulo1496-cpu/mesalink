"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  HomeIcon,
  CalendarIcon,
  BookIcon,
  GridIcon,
  UsersIcon,
  GlobeIcon,
  QrIcon,
  MegaphoneIcon,
  RevenueAiIcon,
  PartnerNetworkIcon,
  GiftIcon,
  AiVisibilityIcon,
  BillingIcon,
  SettingsIcon,
} from "@/components/icons/nav-icons";

type RestaurantSidebarProps = {
  id: string;
  restaurantName: string;
  active?: string;
};

export default function RestaurantSidebar({
  id,
  restaurantName,
  active = "dashboard",
}: RestaurantSidebarProps) {
  const t = useTranslations("dashboardNav");
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
      title: t("sections.operation"),
      items: [
        {
          key: "dashboard",
          name: "Dashboard",
          href: `/restaurants/${id}`,
          icon: HomeIcon,
        },
        {
          key: "experiences",
          name: t("items.experiences"),
          href: `/restaurants/${id}/experiences`,
          icon: GiftIcon,
        },
        {
          key: "qrOrdering",
          name: t("items.qrOrdering"),
          href: `/restaurants/${id}/ordering`,
          icon: QrIcon,
          badge: qrNotificationCount > 0 ? String(qrNotificationCount) : undefined,
          alert: qrNotificationCount > 0,
        },
        {
          key: "day",
          name: t("items.serviceDay"),
          href: `/restaurants/${id}/day`,
          icon: CalendarIcon,
        },
        {
          key: "reservations",
          name: t("items.reservations"),
          href: `/restaurants/${id}/reservations`,
          icon: BookIcon,
        },
        {
          key: "calendar",
          name: t("items.calendar"),
          href: `/restaurants/${id}/calendar`,
          icon: CalendarIcon,
        },
        {
          key: "tables",
          name: t("items.tables"),
          href: `/restaurants/${id}/tables`,
          icon: GridIcon,
        },
      ],
    },

    {
      title: t("sections.growth"),
      items: [
        {
          key: "revenueAi",
          name: t("items.revenueAi"),
          href: `/restaurants/${id}/revenue-ai`,
          icon: RevenueAiIcon,
        },
        {
          key: "partnerNetwork",
          name: t("items.partnerNetwork"),
          href: `/restaurants/${id}/partner-network`,
          icon: PartnerNetworkIcon,
        },
        {
          key: "cardsOffers",
          name: t("items.cardsOffers"),
          href: `/restaurants/${id}/marketing/loyalty`,
          icon: GiftIcon,
        },
        {
          key: "customers",
          name: t("items.customers"),
          href: `/restaurants/${id}/customers`,
          icon: UsersIcon,
        },
        {
          key: "marketing",
          name: t("items.marketing"),
          href: `/restaurants/${id}/marketing`,
          icon: MegaphoneIcon,
        },
        {
          key: "website",
          name: t("items.website"),
          href: `/restaurants/${id}/website`,
          icon: GlobeIcon,
        },
        {
          key: "aiVisibility",
          name: t("items.aiVisibility"),
          href: `/restaurants/${id}/ai-visibility`,
          icon: AiVisibilityIcon,
        },
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

            <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.32em] text-[#A88A57]">
              {t("tagline")}
            </p>
          </Link>
        </div>

        <div className="relative z-10 mt-8 flex flex-col gap-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 truncate px-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#A88A57]">
                {section.title}
              </p>

              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    active={active === item.key}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-4 border-t border-[#DDC9AA] pt-4">
          <p className="mb-2 truncate px-4 text-[10px] font-black uppercase tracking-[0.28em] text-[#A88A57]">
            {t("account")}
          </p>

          <div className="flex flex-col gap-1.5">
            <NavItem
              item={{
                key: "billing",
                name: t("items.billing"),
                href: `/billing?restaurantId=${id}`,
                icon: BillingIcon,
              }}
              active={active === "billing"}
            />

            <NavItem
              item={{
                key: "settings",
                name: t("items.settings"),
                href: `/restaurants/${id}/settings`,
                icon: SettingsIcon,
              }}
              active={active === "settings"}
            />
          </div>

          <div className="mt-2 px-1">
            <LanguageSwitcher className="w-full justify-center" />
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
              <p className="mt-0.5 truncate text-xs font-medium text-[#7A6F62]">
                {t("growthSuite")}
              </p>
            </div>

            <span className="text-lg text-[#6B6258]">⌄</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto px-1 pt-6 text-[11px] leading-5 text-[#8A7C6D]">
          <p className="truncate">{t("tagline")}</p>
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
    key: string;
    name: string;
    href: string;
    icon: () => ReactNode;
    soon?: boolean;
    badge?: string;
    alert?: boolean;
  };
  active: boolean;
}) {
  const t = useTranslations("dashboardNav");
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

      <span className="flex min-w-0 items-center gap-3.5">
        <span
          className={
            active
              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] bg-[#C8A56A] text-white shadow-[0_10px_25px_rgba(200,165,106,0.38)]"
              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] text-[#15110D] transition group-hover:bg-[#EFE1CA] group-hover:text-[#9B6F3B]"
          }
        >
          <Icon />
        </span>

        <span className="truncate">{item.name}</span>
      </span>

      {item.badge && (
        <span className="shrink-0 rounded-full bg-[#16120E] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
          {item.badge}
        </span>
      )}

      {item.soon && (
        <span className="shrink-0 rounded-full border border-[#E1C48C] bg-[#FFF4DF] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
          {t("comingSoon")}
        </span>
      )}
    </Link>
  );
}
