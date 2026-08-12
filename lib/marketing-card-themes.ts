export const MARKETING_CARD_THEMES = {
  GOLD: {
    name: "Dourado",
    background: "linear-gradient(135deg, #17120D 0%, #2D2116 58%, #7A5427 100%)",
    foreground: "#FFF9EF",
    muted: "#E6D2AF",
    accent: "#D7B267",
  },
  TERRACOTTA: {
    name: "Terracota",
    background: "linear-gradient(135deg, #6E2F22 0%, #A95036 55%, #E09A6A 100%)",
    foreground: "#FFF8F2",
    muted: "#F5D9CA",
    accent: "#FFD6A7",
  },
  FOREST: {
    name: "Floresta",
    background: "linear-gradient(135deg, #10291E 0%, #23563C 56%, #57845D 100%)",
    foreground: "#F7FFF8",
    muted: "#CFE4D2",
    accent: "#D9C98A",
  },
  MIDNIGHT: {
    name: "Meia-noite",
    background: "linear-gradient(135deg, #111827 0%, #243A5A 58%, #566F93 100%)",
    foreground: "#F8FAFF",
    muted: "#D6DFEC",
    accent: "#E7C982",
  },
} as const;

export type MarketingCardTheme = keyof typeof MARKETING_CARD_THEMES;

export function getMarketingCardTheme(value: string) {
  return MARKETING_CARD_THEMES[value as MarketingCardTheme] || MARKETING_CARD_THEMES.GOLD;
}

export function marketingBenefitValue(type: string, value: number | null) {
  if (type === "PERCENT") return `${new Intl.NumberFormat("pt-PT").format(value || 0)}%`;
  if (type === "FIXED") return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);
  return "OFERTA";
}
