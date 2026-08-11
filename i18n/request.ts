import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./locales";

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get("NEXT_LOCALE")?.value;
  const locale = isLocale(raw) ? raw : defaultLocale;

  const messages = (await import(`../messages/${locale}/index.ts`)).default;

  return { locale, messages };
});
