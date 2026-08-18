"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { setLocale } from "@/i18n/actions";
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

  const tabs = [
    { href: `/restaurants/${id}`, icon: HomeIcon, label: t("dash") },
    { href: `/restaurants/${id}/day`, icon: FlashIcon, label: t("today") },
    {
      href: `/restaurants/${id}/calendar`,
      icon: CalendarIcon,
      label: t("calendar"),
    },
    { href: `/restaurants/${id}/ordering`, icon: QrIcon, label: t("orders") },
  ];

  const moreLinks = [
    {
      href: `/restaurants/${id}/support`,
      icon: SupportIcon,
      label: "Ajuda",
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
      <div className="pointer-events-auto mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-[24px] border border-white/10 bg-[#17130F]/96 p-1.5 shadow-[0_22px_65px_rgba(23,19,15,0.36)] backdrop-blur-2xl">
        {tabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] py-2 transition ${
              isActive(item.href)
                ? "bg-[#C8A56A] text-[#17130F] shadow-[0_8px_24px_rgba(200,165,106,0.25)]"
                : "text-white/60 active:bg-white/10 active:text-white"
            }`}
          >
            <item.icon />
            <span className="max-w-full truncate text-[10px] font-black leading-none">
              {item.label}
            </span>
          </Link>
        ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-[18px] py-2 transition aria-expanded:bg-[#C8A56A] aria-expanded:text-[#17130F] ${
                isMoreActive
                  ? "bg-[#C8A56A] text-[#17130F] shadow-[0_8px_24px_rgba(200,165,106,0.25)]"
                  : "text-white/60 active:bg-white/10 active:text-white"
              }`}
            >
              <MoreIcon />
              <span className="max-w-full truncate text-[10px] font-black leading-none">
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
