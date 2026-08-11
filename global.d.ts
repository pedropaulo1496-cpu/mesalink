import type { Locale } from "@/i18n/locales";
import type messages from "./messages/pt/index";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
