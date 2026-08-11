export const locales = ["pt", "en", "fr", "de", "zh", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export const localeNames: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  es: "Español",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
