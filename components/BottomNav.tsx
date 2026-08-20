"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, CirclePlus } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import RestaurantPushNotifications from "@/components/RestaurantPushNotifications";
import { locales, localeNames, type Locale } from "@/i18n/locales";
import {
  HomeIcon,
  CalendarIcon,
  FlashIcon,
  QrIcon,
  GridIcon,
  MegaphoneIcon,
  RevenueAiIcon,
  PartnerNetworkIcon,
  GiftIcon,
  AiVisibilityIcon,
  GlobeIcon,
  SettingsIcon,
  MoreIcon,
  UsersIcon,
  BillingIcon,
  SupportIcon,
} from "@/components/icons/nav-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BottomNav({ id }: { id: string }) {
  const t = useTranslations("dashboardNav.bottomNav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [unreadSupport, setUnreadSupport] = useState(0);

  useEffect(() => {
    if (pathname.startsWith(`/restaurants/${id}/support`)) {
      queueMicrotask(() => setUnreadSupport(0));
      return;
    }
    async function loadUnreadSupport() {
      try {
        const response = await fetch(`/api/restaurants/${id}/support/unread`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setUnreadSupport(Number(data.count || 0));
      } catch {
        // A navegação continua disponível mesmo sem ligação temporária.
      }
    }
    queueMicrotask(() => { void loadUnreadSupport(); });
    const interval = window.setInterval(loadUnreadSupport, 8000);
    return () => window.clearInterval(interval);
  }, [id, pathname]);

  const tabs = [
    { href: `/restaurants/${id}`, icon: HomeIcon, label: t("dash") },
    {
      href: `/restaurants/${id}/reservations/new`,
      icon: CirclePlus,
      label: "Nova",
    },
    { href: `/restaurants/${id}/day`, icon: FlashIcon, label: t("today") },
    {
      href: `/restaurants/${id}/calendar`,
      icon: CalendarIcon,
      label: t("calendar"),
    },
    { href: `/restaurants/${id}/support`, icon: SupportIcon, label: "Ajuda" },
  ];

  const moreLinks = [
    {
      href: `/restaurants/${id}/ordering`,
      icon: QrIcon,
      label: t("orders"),
    },
    {
      href: `/restaurants/${id}/experiences`,
      icon: GiftIcon,
      label: t("moreSheet.experiences"),
    },
    {
      href: `/restaurants/${id}/tables`,
      icon: GridIcon,
      label: t("moreSheet.tables"),
    },
    {
      href: `/restaurants/${id}/customers`,
      icon: UsersIcon,
      label: t("moreSheet.customers"),
    },
    {
      href: `/restaurants/${id}/revenue-ai`,
      icon: RevenueAiIcon,
      label: t("moreSheet.revenueAi"),
    },
    {
      href: `/restaurants/${id}/partner-network`,
      icon: PartnerNetworkIcon,
      label: t("moreSheet.partnerNetwork"),
    },
    {
      href: `/restaurants/${id}/marketing/loyalty`,
      icon: GiftIcon,
      label: t("moreSheet.cardsOffers"),
    },
    {
      href: `/restaurants/${id}/marketing`,
      icon: MegaphoneIcon,
      label: t("moreSheet.marketing"),
    },
    {
      href: `/restaurants/${id}/website`,
      icon: GlobeIcon,
      label: t("moreSheet.website"),
    },
    {
      href: `/restaurants/${id}/ai-visibility`,
      icon: AiVisibilityIcon,
      label: t("moreSheet.aiVisibility"),
    },
    {
      href: `/restaurants/${id}/settings`,
      icon: SettingsIcon,
      label: t("moreSheet.settings"),
    },
    {
      href: `/billing?restaurantId=${id}`,
      icon: BillingIcon,
      label: t("moreSheet.billing"),
    },
  ];

  function handleSelectLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next);
    });
  }

  const isActive = (href: string) =>
    pathname === href || (href !== `/restaurants/${id}` && pathname.startsWith(`${href}/`));

  const isMoreActive = moreLinks.some(({ href }) => isActive(href));

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
      <RestaurantPushNotifications variant="first-run" />
      <div className="pointer-events-auto mx-auto grid max-w-xl grid-cols-6 gap-0.5 rounded-[24px] border border-white/10 bg-[#17130F]/96 p-1.5 shadow-[0_22px_65px_rgba(23,19,15,0.36)] backdrop-blur-2xl">
        {tabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 py-2 transition ${
              isActive(item.href)
                ? "bg-[#C8A56A] text-[#17130F] shadow-[0_8px_24px_rgba(200,165,106,0.25)]"
                : "text-white/60 active:bg-white/10 active:text-white"
            }`}
          >
            <span className="relative">
              <item.icon />
              {item.href === `/restaurants/${id}/support` && unreadSupport > 0 && (
                <span className="absolute -right-2 -top-2 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-[#17130F] bg-red-500" />
                </span>
              )}
            </span>
            <span className="max-w-full truncate text-[9px] font-black leading-none min-[390px]:text-[10px]">
              {item.label}
            </span>
          </Link>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex min-h-12 min-w-0 w-full flex-col items-center justify-center gap-1 rounded-[18px] px-0.5 py-2 transition aria-expanded:bg-[#C8A56A] aria-expanded:text-[#17130F] ${
                isMoreActive
                  ? "bg-[#C8A56A] text-[#17130F] shadow-[0_8px_24px_rgba(200,165,106,0.25)]"
                  : "text-white/60 active:bg-white/10 active:text-white"
              }`}
            >
              <MoreIcon />
              <span className="max-w-full truncate text-[9px] font-black leading-none min-[390px]:text-[10px]">
                {t("more")}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            className="min-w-[200px] rounded-xl border border-[#E3D3BC] bg-[#FFF9F0] p-1 text-[#16120E] shadow-[0_22px_60px_rgba(96,65,28,0.16)]"
          >
            {moreLinks.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#3A3128] focus:bg-[#F5ECDE] focus:text-[#16120E]"
                >
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                disabled={isPending}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-[#3A3128] focus:bg-[#F5ECDE] focus:text-[#16120E] data-open:bg-[#F5ECDE] data-open:text-[#16120E]"
              >
                {t("moreSheet.language")}
              </DropdownMenuSubTrigger>

              <DropdownMenuSubContent className="min-w-[168px] rounded-xl border border-[#E3D3BC] bg-[#FFF9F0] p-1 text-[#16120E] shadow-[0_22px_60px_rgba(96,65,28,0.16)]">
                {locales.map((code) => (
                  <DropdownMenuItem
                    key={code}
                    onSelect={() => handleSelectLocale(code)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-[#3A3128] focus:bg-[#F5ECDE] focus:text-[#16120E]"
                  >
                    <span>{localeNames[code]}</span>
                    {code === locale && (
                      <Check className="size-3.5 text-[#B9965E]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
