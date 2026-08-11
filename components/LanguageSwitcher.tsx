"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { locales, localeNames, type Locale } from "@/i18n/locales";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({
  className,
  contentClassName,
}: {
  className?: string;
  contentClassName?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.languageSwitcher");
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      setLocale(next);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("srLabel")}
          disabled={isPending}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E3D3BC] bg-[#FFF9F0] px-3.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#6B6258] transition hover:bg-[#F5ECDE] disabled:opacity-60",
            className,
          )}
        >
          <Globe className="size-3.5" strokeWidth={2.25} />
          <span>{locale}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(
          "min-w-[168px] rounded-xl border border-[#E3D3BC] bg-[#FFF9F0] p-1 text-[#16120E] shadow-[0_22px_60px_rgba(96,65,28,0.16)]",
          contentClassName,
        )}
      >
        {locales.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => handleSelect(code)}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-[#3A3128] focus:bg-[#F5ECDE] focus:text-[#16120E]"
          >
            <span>{localeNames[code]}</span>
            {code === locale && <Check className="size-3.5 text-[#B9965E]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
