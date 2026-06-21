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
      page: "bg-[#F5EFE6] text-[#16120E]",
      sectionDark: "bg-[#F5EFE6] text-[#16120E]",
      sectionLight: "bg-[#FFF9F0] text-[#16120E]",
      card: "border-[#E1D0B8] bg-white",
      accent: primaryColor,
      eyebrow: "text-[#9B6F3B]",
      muted: "text-[#6B6258]",
    },

    LUXURY: {
      page: "bg-[#16120E] text-[#F5EFE6]",
      sectionDark: "bg-[#16120E] text-[#F5EFE6]",
      sectionLight: "bg-[#241B13] text-[#F5EFE6]",
      card: "border-[#C8A56A]/25 bg-white/[0.06]",
      accent: "#C8A56A",
      eyebrow: "text-[#C8A56A]",
      muted: "text-[#F5EFE6]/60",
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
      page: "bg-[#F5EFE6] text-[#16120E]",
      sectionDark: "bg-[#F5EFE6] text-[#16120E]",
      sectionLight: "bg-[#FFF9F0] text-[#16120E]",
      card: "border-[#E1D0B8] bg-white",
      accent: "#A14E36",
      eyebrow: "text-[#A14E36]",
      muted: "text-[#6B6258]",
    },
  };

  return themes[template];
}
