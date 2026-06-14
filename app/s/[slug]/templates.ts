export type WebsiteTemplate = "PREMIUM" | "LUXURY" | "MINIMAL" | "SOCIAL";

export function getWebsiteTemplate(value?: string | null): WebsiteTemplate {
  if (value === "LUXURY") return "LUXURY";
  if (value === "MINIMAL") return "MINIMAL";
  if (value === "SOCIAL") return "SOCIAL";
  return "PREMIUM";
}

export function getTemplateTheme(template: WebsiteTemplate, primaryColor: string) {
  const themes = {
    PREMIUM: {
      page: "bg-[#120b07] text-white",
      sectionDark: "bg-[#120b07] text-white",
      sectionLight: "bg-[#f4eadf] text-[#1d120b]",
      card: "border-white/10 bg-white/[0.06]",
      accent: primaryColor,
      eyebrow: "text-amber-200/60",
      muted: "text-white/60",
    },

    LUXURY: {
      page: "bg-black text-[#f5ead7]",
      sectionDark: "bg-black text-[#f5ead7]",
      sectionLight: "bg-[#15100a] text-[#f5ead7]",
      card: "border-[#d4af37]/20 bg-[#d4af37]/[0.06]",
      accent: "#d4af37",
      eyebrow: "text-[#d4af37]/70",
      muted: "text-[#f5ead7]/60",
    },

    MINIMAL: {
      page: "bg-white text-zinc-950",
      sectionDark: "bg-white text-zinc-950",
      sectionLight: "bg-zinc-50 text-zinc-950",
      card: "border-zinc-200 bg-white",
      accent: primaryColor,
      eyebrow: "text-zinc-400",
      muted: "text-zinc-500",
    },

    SOCIAL: {
      page: "bg-[#0f0715] text-white",
      sectionDark: "bg-[#0f0715] text-white",
      sectionLight: "bg-[#1a0b24] text-white",
      card: "border-pink-300/15 bg-pink-400/[0.06]",
      accent: "#ec4899",
      eyebrow: "text-pink-300/70",
      muted: "text-white/60",
    },
  };

  return themes[template];
}