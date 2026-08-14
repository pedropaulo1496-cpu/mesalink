"use client";

import { FileUploadField } from "@/components/FileUploadField";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import BottomNav from "@/components/BottomNav";
import { CalendarCheck2, CheckCircle2, ChevronDown, CircleHelp, ExternalLink, Eye, FileText, Image as ImageIcon, LoaderCircle, Palette, Save, Search, Sparkles, WandSparkles } from "lucide-react";
import { CustomDomainManager, type PublicDomainOrder } from "./CustomDomainManager";

type Translator = ReturnType<typeof useTranslations>;

type WebsiteMenuItem = {
  id?: string;
  title: string;
  pdf: string;
  sortOrder?: number;
};

type WebsiteFaqItem = { question: string; answer: string };

type RestaurantWebsiteData = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  websiteEnabled: boolean;
  websiteTemplate: string;
  websiteHeadline: string | null;
  websiteDescription: string | null;
  websiteCuisine: string | null;
  websiteInstagram: string | null;
  websiteHeroImage: string | null;
  websiteLogoImage: string | null;
  websiteGalleryImage1: string | null;
  websiteGalleryImage2: string | null;
  websiteGalleryImage3: string | null;
  websiteGalleryImage4: string | null;
  websiteGalleryTitle1: string | null;
  websiteGalleryTitle2: string | null;
  websiteGalleryTitle3: string | null;
  websiteGalleryTitle4: string | null;
  websiteMenuTitle: string | null;
  websiteMenuDescription: string | null;
  websiteMenuPdf: string | null;
  websiteMenus?: WebsiteMenuItem[];
  websiteAboutTitle: string | null;
  websiteAboutText: string | null;
  websiteFeatureTitle: string | null;
  websiteFeatureText: string | null;
  websiteSectionTitle: string | null;
  websiteSectionText: string | null;
  websiteGalleryTitle: string | null;
  websiteGalleryDescription: string | null;
  websiteLocationTitle: string | null;
  websiteLocationDescription: string | null;
  websiteFinalCtaTitle: string | null;
  websiteFinalCtaText: string | null;
  websiteFaqTitle: string | null;
  websiteFaqItems: unknown;
  websiteSpecialties: string[];
  websiteLastGeneratedAt: string | Date | null;
  websiteAiVersion: string | null;
  websiteSeoTitle: string | null;
  websiteSeoDescription: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  websitePrimaryColor: string | null;
};

export function WebsiteEditorClient({
  restaurant,
  saved,
  domainOrder,
  domainServiceConfigured,
}: {
  restaurant: RestaurantWebsiteData;
  saved: boolean;
  domainOrder: PublicDomainOrder | null;
  domainServiceConfigured: boolean;
}) {
  const t = useTranslations("dashboardSettings.website");
  const [enabled, setEnabled] = useState(restaurant.websiteEnabled);
  const [template, setTemplate] = useState(
    restaurant.websiteTemplate || "PREMIUM",
  );
  const [slug, setSlug] = useState(restaurant.slug);
  const [headline, setHeadline] = useState(restaurant.websiteHeadline || "");
  const [description, setDescription] = useState(
    restaurant.websiteDescription || "",
  );
  const [cuisine, setCuisine] = useState(restaurant.websiteCuisine || "");
  const [instagram, setInstagram] = useState(
    restaurant.websiteInstagram || "",
  );
  const [logoImage, setLogoImage] = useState(
    restaurant.websiteLogoImage || "",
  );
  const [heroImage, setHeroImage] = useState(
    restaurant.websiteHeroImage || "",
  );
  const [gallery1, setGallery1] = useState(
    restaurant.websiteGalleryImage1 || "",
  );
  const [gallery2, setGallery2] = useState(
    restaurant.websiteGalleryImage2 || "",
  );
  const [gallery3, setGallery3] = useState(
    restaurant.websiteGalleryImage3 || "",
  );
  const [gallery4, setGallery4] = useState(
    restaurant.websiteGalleryImage4 || "",
  );
  const [galleryTitle1, setGalleryTitle1] = useState(
    restaurant.websiteGalleryTitle1 || "",
  );
  const [galleryTitle2, setGalleryTitle2] = useState(
    restaurant.websiteGalleryTitle2 || "",
  );
  const [galleryTitle3, setGalleryTitle3] = useState(
    restaurant.websiteGalleryTitle3 || "",
  );
  const [galleryTitle4, setGalleryTitle4] = useState(
    restaurant.websiteGalleryTitle4 || "",
  );
  const [menuTitle, setMenuTitle] = useState(
    restaurant.websiteMenuTitle || "",
  );
  const [menuDescription, setMenuDescription] = useState(
    restaurant.websiteMenuDescription || "",
  );

  const [menuItems, setMenuItems] = useState<WebsiteMenuItem[]>(() => {
    if (restaurant.websiteMenus?.length) {
      return restaurant.websiteMenus
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map((item) => ({
          id: item.id,
          title: item.title || "",
          pdf: item.pdf || "",
          sortOrder: item.sortOrder || 0,
        }));
    }

    if (restaurant.websiteMenuPdf) {
      return [
        {
          title: restaurant.websiteMenuTitle || "Menu",
          pdf: restaurant.websiteMenuPdf,
          sortOrder: 0,
        },
      ];
    }

    return [];
  });

  const [aboutTitle, setAboutTitle] = useState(
    restaurant.websiteAboutTitle || "",
  );
  const [aboutText, setAboutText] = useState(
    restaurant.websiteAboutText || "",
  );
  const [featureTitle, setFeatureTitle] = useState(
    restaurant.websiteFeatureTitle || "",
  );
  const [featureText, setFeatureText] = useState(
    restaurant.websiteFeatureText || "",
  );
  const [sectionTitle, setSectionTitle] = useState(
    restaurant.websiteSectionTitle || "",
  );
  const [sectionText, setSectionText] = useState(
    restaurant.websiteSectionText || "",
  );
  const [galleryTitle, setGalleryTitle] = useState(
    restaurant.websiteGalleryTitle || "",
  );
  const [galleryDescription, setGalleryDescription] = useState(
    restaurant.websiteGalleryDescription || "",
  );
  const [locationTitle, setLocationTitle] = useState(
    restaurant.websiteLocationTitle || "",
  );
  const [locationDescription, setLocationDescription] = useState(
    restaurant.websiteLocationDescription || "",
  );
  const [finalCtaTitle, setFinalCtaTitle] = useState(
    restaurant.websiteFinalCtaTitle || "",
  );
  const [finalCtaText, setFinalCtaText] = useState(
    restaurant.websiteFinalCtaText || "",
  );
  const [faqTitle, setFaqTitle] = useState(restaurant.websiteFaqTitle || "Perguntas frequentes");
  const [faqItems, setFaqItems] = useState<WebsiteFaqItem[]>(() => normalizeFaqItems(restaurant.websiteFaqItems));
  const [specialties, setSpecialties] = useState<string[]>(restaurant.websiteSpecialties || []);
  const [seoTitle, setSeoTitle] = useState(
    restaurant.websiteSeoTitle || "",
  );
  const [seoDescription, setSeoDescription] = useState(
    restaurant.websiteSeoDescription || "",
  );
  const [primaryColor, setPrimaryColor] = useState(
    restaurant.websitePrimaryColor || "#111827",
  );
  const [email, setEmail] = useState(restaurant.email || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [aiBrief, setAiBrief] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<null | {
    fields: number;
    reviews: number;
    images: number;
    prompts: number;
  }>(null);
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");

  const publicUrl = restaurant.customDomainVerified && restaurant.customDomain
    ? `https://${restaurant.customDomain}`
    : `/s/${slug || restaurant.slug}`;
  const fullPublicUrl = restaurant.customDomainVerified && restaurant.customDomain
    ? restaurant.customDomain
    : `${slug || restaurant.slug}.mesalink.pt`;
  const previewTheme = getPreviewTheme(template, primaryColor);
  const gallery = [gallery1, gallery2, gallery3, gallery4];
  const galleryTitles = [
    galleryTitle1,
    galleryTitle2,
    galleryTitle3,
    galleryTitle4,
  ];
  const galleryCount = gallery.filter((item) => item.startsWith("http")).length;

  const score = useMemo(() => {
    const items = [
      enabled,
      headline,
      description,
      cuisine,
      heroImage,
      aboutText,
      seoTitle,
      seoDescription,
      faqItems.filter((item) => item.question && item.answer).length >= 3,
      specialties.length >= 3,
      galleryCount >= 2,
      phone || email,
    ];

    return Math.round((items.filter(Boolean).length / items.length) * 100);
  }, [
    enabled,
    headline,
    description,
    cuisine,
    heroImage,
    aboutText,
    seoTitle,
    seoDescription,
    faqItems,
    specialties,
    galleryCount,
    phone,
    email,
  ]);

  async function generateWebsiteWithAi() {
    if (isGeneratingAi) return;

    setIsGeneratingAi(true);

    try {
      const res = await fetch("/api/ai/website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          name: restaurant.name,
          cuisine,
          address,
          instagram,
          brief: aiBrief || aboutText || description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("aiErrors.generateFailed"));
      }

      setHeadline(data.headline || "");
      setDescription(data.description || "");
      setCuisine(data.cuisine || cuisine);
      setAboutTitle(data.aboutTitle || "");
      setAboutText(data.aboutText || "");
      setFeatureTitle(data.featureTitle || "");
      setFeatureText(data.featureText || "");
      setSectionTitle(data.sectionTitle || "");
      setSectionText(data.sectionText || "");
      setGalleryTitle(data.galleryTitle || "");
      setGalleryDescription(data.galleryDescription || "");
      setLocationTitle(data.locationTitle || "");
      setLocationDescription(data.locationDescription || "");
      setFinalCtaTitle(data.ctaTitle || "");
      setFinalCtaText(data.ctaText || "");
      setMenuTitle(data.menuTitle || "");
      setMenuDescription(data.menuDescription || "");
      setSeoTitle(data.seoTitle || "");
      setSeoDescription(data.seoDescription || "");
      setFaqTitle(data.faqTitle || "Perguntas frequentes");
      setFaqItems(normalizeFaqItems(data.faqItems));
      setSpecialties(Array.isArray(data.specialties) ? data.specialties.slice(0, 6) : []);
      setTemplate(data.template || "PREMIUM");
      setPrimaryColor(/^#[0-9a-f]{6}$/i.test(data.primaryColor || "") ? data.primaryColor : primaryColor);
      const generatedGalleryTitles = Array.isArray(data.galleryTitles) ? data.galleryTitles : [];
      setGalleryTitle1(generatedGalleryTitles[0] || galleryTitle1);
      setGalleryTitle2(generatedGalleryTitles[1] || galleryTitle2);
      setGalleryTitle3(generatedGalleryTitles[2] || galleryTitle3);
      setGalleryTitle4(generatedGalleryTitles[3] || galleryTitle4);
      const suggestions = Array.isArray(data.suggestedImages) ? data.suggestedImages.filter((url: unknown) => typeof url === "string" && url.startsWith("https://")) : [];
      const available = suggestions.filter((url: string) => ![heroImage, gallery1, gallery2, gallery3, gallery4].includes(url));
      if (!heroImage) setHeroImage(suggestions[0] || "");
      if (!gallery1) setGallery1(available.shift() || suggestions[1] || "");
      if (!gallery2) setGallery2(available.shift() || suggestions[2] || "");
      if (!gallery3) setGallery3(available.shift() || suggestions[3] || "");
      if (!gallery4) setGallery4(available.shift() || suggestions[4] || "");
      const sourceStats = data.sourceStats || {};
      setAiResult({
        fields: countBlueprintFields(data),
        reviews: Number(sourceStats.reviews || 0),
        images: Number(sourceStats.images || 0),
        prompts: Number(sourceStats.prompts || 0),
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : t("aiErrors.generateFailedAlert"));
    } finally {
      setIsGeneratingAi(false);
    }
  }

  function addMenuItem() {
    setMenuItems((items) => [
      ...items,
      {
        title: "",
        pdf: "",
        sortOrder: items.length,
      },
    ]);
  }

  function updateMenuItem(index: number, field: "title" | "pdf", value: string) {
    setMenuItems((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeMenuItem(index: number) {
    setMenuItems((items) =>
      items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex })),
    );
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_minmax(0,1fr)]">
       <RestaurantSidebar
  id={restaurant.id}
  restaurantName={restaurant.name}
  active="website"
/>

        <div className="min-w-0 px-4 pb-40 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <header className="sticky top-0 z-40 -mx-4 border-b border-[#E1D0B8] bg-[#F5EFE6]/90 px-4 py-3 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    {t("header.eyebrow")}
                  </p>

                  <h1 className="mt-1 text-3xl font-semibold tracking-[-0.065em] sm:mt-2 sm:text-4xl">
                    {t("header.title")}
                  </h1>
                </div>

                <span
                  className={
                    enabled
                      ? "rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]"
                      : "rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36]"
                  }
                >
                  {enabled ? t("header.statusOnline") : t("header.statusOffline")}
                </span>

                {saved && (
                  <span className="rounded-full border border-[#E1D0B8] bg-white px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
                    {t("header.savedBadge")}
                  </span>
                )}
              </div>

              <p className="mt-2 hidden text-sm text-[#6B6258] sm:block">
                {t("header.subtitle")}
              </p>
            </div>

            <div className="hidden gap-2 xl:flex">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold text-[#16120E] transition hover:-translate-y-0.5 hover:bg-[#FFF9F0]"
              >
                <ExternalLink size={15} />
                {t("header.viewSiteButton")}
              </a>

              <button
                form="website-editor-form"
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(22,18,14,0.16)] transition hover:-translate-y-0.5 hover:bg-[#2A2118]"
              >
                <Save size={15} />
                {t("header.saveButton")}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 rounded-2xl border border-[#DCCBAF] bg-white p-1 xl:hidden">
            <button
              type="button"
              onClick={() => setMobileMode("edit")}
              aria-pressed={mobileMode === "edit"}
              className={`h-10 rounded-xl text-sm font-semibold transition ${
                mobileMode === "edit"
                  ? "bg-[#16120E] text-white shadow-sm"
                  : "text-[#6B6258]"
              }`}
            >
              {t("header.title")}
            </button>
            <button
              type="button"
              onClick={() => setMobileMode("preview")}
              aria-pressed={mobileMode === "preview"}
              className={`h-10 rounded-xl text-sm font-semibold transition ${
                mobileMode === "preview"
                  ? "bg-[#16120E] text-white shadow-sm"
                  : "text-[#6B6258]"
              }`}
            >
              {t("previewCard.eyebrow")}
            </button>
          </div>
        </header>

        <form
          id="website-editor-form"
          action={`/api/restaurants/${restaurant.id}/website`}
          method="POST"
          className="grid gap-6 py-5 sm:py-8 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <section className={`space-y-4 sm:space-y-6 ${mobileMode === "preview" ? "hidden xl:block" : ""}`}>
            <EditorBlock
              number="01"
              title={t("publish.title")}
              description={t("publish.description")}
            >
              <label className="flex cursor-pointer items-start gap-4 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
                <input
                  type="checkbox"
                  name="websiteEnabled"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#16120E]"
                />

                <div>
                  <p className="font-semibold">{t("publish.enableLabel")}</p>

                  <p className="mt-1 text-sm leading-6 text-[#6B6258]">
                    {t("publish.enableDescriptionBefore")}{" "}
                    <span className="font-semibold text-[#16120E]">
                      {fullPublicUrl}
                    </span>
                    .
                  </p>
                </div>
              </label>

              <Field label={t("publish.linkLabel")}>
                <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                  <input
                    name="slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    className="input-premium h-12"
                    required
                  />

                  <div className="flex h-12 items-center rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#9B6F3B]">
                    .mesalink.pt
                  </div>
                </div>
              </Field>

              <Field label={t("publish.templateLabel")}>
                <input type="hidden" name="websiteTemplate" value={template} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { value: "PREMIUM", label: t("publish.templateOptions.premium"), swatch: "bg-[#F2E5D3]", ink: "bg-[#17120D]" },
                    { value: "LUXURY", label: t("publish.templateOptions.luxury"), swatch: "bg-[#17120D]", ink: "bg-[#D7B267]" },
                    { value: "MINIMAL", label: t("publish.templateOptions.minimal"), swatch: "bg-white", ink: "bg-zinc-900" },
                    { value: "SOCIAL", label: t("publish.templateOptions.social"), swatch: "bg-[#F5E6DC]", ink: "bg-[#A14E36]" },
                  ].map((option) => {
                    const selected = template === option.value;
                    return <button key={option.value} type="button" onClick={() => setTemplate(option.value)} aria-pressed={selected} className={`relative rounded-[18px] border p-2.5 text-left transition ${selected ? "border-[#9B6F3B] bg-[#FFF9F0] shadow-[0_8px_22px_rgba(80,55,30,0.08)]" : "border-[#E8DCCB] bg-white hover:border-[#CDB792]"}`}>
                      <span className={`block h-12 rounded-xl border border-black/5 ${option.swatch}`}><span className={`mx-2 mt-3 block h-2 w-9 rounded-full ${option.ink}`} /><span className={`mx-2 mt-1.5 block h-1.5 w-14 rounded-full opacity-35 ${option.ink}`} /></span>
                      <span className="mt-2 block truncate text-xs font-semibold text-[#16120E]">{option.label}</span>
                      {selected && <CheckCircle2 size={15} className="absolute right-2 top-2 text-[#9B6F3B]" />}
                    </button>;
                  })}
                </div>
              </Field>
            </EditorBlock>

            <EditorBlock
              number="02"
              title={t("aiBuilder.title")}
              description={t("aiBuilder.description")}
            >
              <div className="overflow-hidden rounded-[30px] border border-[#2C2117] bg-[#17120D] text-white shadow-[0_24px_65px_rgba(44,31,18,0.18)]">
                <div className="border-b border-white/10 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#D7B267]"><WandSparkles size={15} /> {t("aiBuilder.agentLabel")}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t("aiBuilder.cardTitle")}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#D5C6B4]">{t("aiBuilder.cardText")}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[#D7B267]/30 bg-[#D7B267]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#E7C98D]">{t("aiBuilder.activeBadge")}</span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <AiSource icon={<FileText size={15} />} label={t("aiBuilder.sources.copy")} />
                    <AiSource icon={<Palette size={15} />} label={t("aiBuilder.sources.design")} />
                    <AiSource icon={<ImageIcon size={15} />} label={t("aiBuilder.sources.images")} />
                    <AiSource icon={<Search size={15} />} label={t("aiBuilder.sources.visibility")} />
                    <AiSource icon={<CircleHelp size={15} />} label={t("aiBuilder.sources.faq")} />
                    <AiSource icon={<CalendarCheck2 size={15} />} label={t("aiBuilder.sources.conversion")} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#AFA08F]">{t("aiBuilder.menuNote")}</p>
                </div>

                <div className="p-5 sm:p-6">
                  <label className="block text-xs font-bold text-[#EADBC5]">{t("aiBuilder.briefLabel")}</label>
                  <textarea
                    value={aiBrief}
                    onChange={(event) => setAiBrief(event.target.value)}
                    rows={3}
                    aria-label={t("aiBuilder.cardTitle")}
                    placeholder={t("aiBuilder.briefPlaceholder")}
                    className="mt-2 min-h-24 w-full rounded-[20px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#D7B267]/60"
                  />

                  {isGeneratingAi && <div className="mt-4 rounded-[20px] border border-[#D7B267]/25 bg-[#D7B267]/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-[#E7C98D]"><LoaderCircle size={17} className="animate-spin" /> {t("aiBuilder.progressTitle")}</p>
                    <p className="mt-1 text-xs leading-5 text-[#D5C6B4]">{t("aiBuilder.progressText")}</p>
                  </div>}

                  {aiResult && !isGeneratingAi && <div className="mt-4 rounded-[20px] border border-[#84B48A]/30 bg-[#84B48A]/10 p-4">
                    <p className="flex items-center gap-2 text-sm font-black text-[#DDF2DF]"><CheckCircle2 size={17} /> {t("aiBuilder.successTitle")}</p>
                    <p className="mt-1 text-xs leading-5 text-[#CDE4D0]">{t("aiBuilder.successText", aiResult)}</p>
                  </div>}

                  <button
                    type="button"
                    onClick={generateWebsiteWithAi}
                    disabled={isGeneratingAi}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D7B267] px-5 text-sm font-black text-[#17120D] transition hover:bg-[#E7C98D] disabled:cursor-wait disabled:opacity-55"
                  >
                    {isGeneratingAi ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />}
                    {isGeneratingAi ? t("aiBuilder.generatingButton") : t("aiBuilder.generateButton")}
                  </button>
                  <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{t("aiBuilder.costNote")}</p>
                </div>
              </div>
            </EditorBlock>

            <EditorBlock
              number="03"
              title={t("firstImpression.title")}
              description={t("firstImpression.description")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("firstImpression.headlineLabel")}>
                  <input
                    name="websiteHeadline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder={restaurant.name}
                    className="input-premium h-12"
                  />
                </Field>

                <Field label={t("firstImpression.cuisineLabel")}>
                  <input
                    name="websiteCuisine"
                    value={cuisine}
                    onChange={(event) => setCuisine(event.target.value)}
                    placeholder={t("firstImpression.cuisinePlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>
              </div>

              <Field label={t("firstImpression.descriptionLabel")}>
                <textarea
                  name="websiteDescription"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder={t("firstImpression.descriptionPlaceholder")}
                  className="input-premium min-h-32 py-3"
                />
              </Field>
            </EditorBlock>

            <EditorBlock number="04" title={t("story.title")} description={t("story.description")}>
              <Field label={t("story.aboutTitleLabel")}>
                <input
                  name="websiteAboutTitle"
                  value={aboutTitle}
                  onChange={(event) => setAboutTitle(event.target.value)}
                  placeholder={t("story.aboutTitlePlaceholder")}
                  className="input-premium h-12"
                />
              </Field>

              <Field label={t("story.aboutTextLabel")}>
                <textarea
                  name="websiteAboutText"
                  value={aboutText}
                  onChange={(event) => setAboutText(event.target.value)}
                  rows={5}
                  placeholder={t("story.aboutTextPlaceholder")}
                  className="input-premium min-h-36 py-3"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("story.featureTitleLabel")}>
                  <input
                    name="websiteFeatureTitle"
                    value={featureTitle}
                    onChange={(event) => setFeatureTitle(event.target.value)}
                    placeholder={t("story.featureTitlePlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>

                <Field label={t("story.featureTextLabel")}>
                  <input
                    name="websiteFeatureText"
                    value={featureText}
                    onChange={(event) => setFeatureText(event.target.value)}
                    placeholder={t("story.featureTextPlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock
              number="05"
              title={t("texts.title")}
              description={t("texts.description")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label={t("texts.sectionTitleLabel")} name="websiteSectionTitle" value={sectionTitle} onChange={setSectionTitle} placeholder={t("texts.sectionTitlePlaceholder")} />
                <TextInput label={t("texts.sectionTextLabel")} name="websiteSectionText" value={sectionText} onChange={setSectionText} placeholder={t("texts.sectionTextPlaceholder")} />
                <TextInput label={t("texts.galleryTitleLabel")} name="websiteGalleryTitle" value={galleryTitle} onChange={setGalleryTitle} placeholder={t("texts.galleryTitlePlaceholder")} />
                <TextInput label={t("texts.galleryDescriptionLabel")} name="websiteGalleryDescription" value={galleryDescription} onChange={setGalleryDescription} placeholder={t("texts.galleryDescriptionPlaceholder")} />
                <TextInput label={t("texts.locationTitleLabel")} name="websiteLocationTitle" value={locationTitle} onChange={setLocationTitle} placeholder={t("texts.locationTitlePlaceholder")} />
                <TextInput label={t("texts.locationDescriptionLabel")} name="websiteLocationDescription" value={locationDescription} onChange={setLocationDescription} placeholder={t("texts.locationDescriptionPlaceholder")} />
                <TextInput label={t("texts.finalCtaTitleLabel")} name="websiteFinalCtaTitle" value={finalCtaTitle} onChange={setFinalCtaTitle} placeholder={t("texts.finalCtaTitlePlaceholder", { name: restaurant.name })} />
                <TextInput label={t("texts.finalCtaTextLabel")} name="websiteFinalCtaText" value={finalCtaText} onChange={setFinalCtaText} placeholder={t("texts.finalCtaTextPlaceholder")} />
              </div>
            </EditorBlock>

            <EditorBlock number="06" title={t("faq.title")} description={t("faq.description")}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("faq.sectionTitleLabel")}>
                  <input value={faqTitle} onChange={(event) => setFaqTitle(event.target.value)} className="input-premium h-12" placeholder={t("faq.sectionTitlePlaceholder")} />
                </Field>
                <Field label={t("faq.specialtiesLabel")} hint={t("faq.specialtiesHint")}>
                  <input
                    value={specialties.join(", ")}
                    onChange={(event) => setSpecialties(event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6))}
                    className="input-premium h-12"
                    placeholder={t("faq.specialtiesPlaceholder")}
                  />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {faqItems.map((item, index) => <div key={index} className="rounded-[26px] border border-[#E8DCCB] bg-[#FFF9F0] p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">{t("faq.itemLabel", { index: index + 1 })}</p>
                  <input
                    value={item.question}
                    onChange={(event) => setFaqItems((items) => items.map((faq, itemIndex) => itemIndex === index ? { ...faq, question: event.target.value } : faq))}
                    className="input-premium h-11"
                    placeholder={t("faq.questionPlaceholder")}
                  />
                  <textarea
                    value={item.answer}
                    onChange={(event) => setFaqItems((items) => items.map((faq, itemIndex) => itemIndex === index ? { ...faq, answer: event.target.value } : faq))}
                    rows={3}
                    className="input-premium mt-3 min-h-24 py-3"
                    placeholder={t("faq.answerPlaceholder")}
                  />
                </div>)}
              </div>
              <input type="hidden" name="websiteFaqTitle" value={faqTitle} />
              <input type="hidden" name="websiteFaqItems" value={JSON.stringify(faqItems)} />
              <input type="hidden" name="websiteSpecialties" value={JSON.stringify(specialties)} />
              <input type="hidden" name="websiteAiGenerated" value={aiResult ? "1" : ""} />
            </EditorBlock>

            <EditorBlock number="07" title={t("images.title")} description={t("images.description")}>
              <Field label={t("images.logoLabel")}>
                <ImageUploadField value={logoImage} onChange={setLogoImage} compact />
                <input type="hidden" name="websiteLogoImage" value={logoImage} />
              </Field>

              <Field label={t("images.heroLabel")}>
                <ImageUploadField value={heroImage} onChange={setHeroImage} />
                <input type="hidden" name="websiteHeroImage" value={heroImage} />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <GalleryUploadField number="1" value={gallery1} onChange={setGallery1} title={galleryTitle1} onTitleChange={setGalleryTitle1} t={t} />
                <GalleryUploadField number="2" value={gallery2} onChange={setGallery2} title={galleryTitle2} onTitleChange={setGalleryTitle2} t={t} />
                <GalleryUploadField number="3" value={gallery3} onChange={setGallery3} title={galleryTitle3} onTitleChange={setGalleryTitle3} t={t} />
                <GalleryUploadField number="4" value={gallery4} onChange={setGallery4} title={galleryTitle4} onTitleChange={setGalleryTitle4} t={t} />
              </div>
            </EditorBlock>

            <EditorBlock
              number="08"
              title={t("menus.title")}
              description={t("menus.description")}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("menus.sectionTitleLabel")}>
                  <input
                    name="websiteMenuTitle"
                    value={menuTitle}
                    onChange={(event) => setMenuTitle(event.target.value)}
                    placeholder={t("menus.sectionTitlePlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>

                <Field label={t("menus.sectionDescriptionLabel")}>
                  <input
                    name="websiteMenuDescription"
                    value={menuDescription}
                    onChange={(event) => setMenuDescription(event.target.value)}
                    placeholder={t("menus.sectionDescriptionPlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                {menuItems.length === 0 && (
                  <div className="rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-6 text-sm text-[#6B6258]">
                    {t("menus.emptyState")}
                  </div>
                )}

                {menuItems.map((item, index) => (
                  <div
                    key={`${item.id || "new"}-${index}`}
                    className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#16120E]">
                        {t("menus.itemLabel", { index: index + 1 })}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeMenuItem(index)}
                        className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36] hover:bg-[#FFE7DE]"
                      >
                        {t("menus.removeButton")}
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label={t("menus.nameLabel")}>
                        <input
                          name="websiteMenuItemTitle[]"
                          value={item.title}
                          onChange={(event) =>
                            updateMenuItem(index, "title", event.target.value)
                          }
                          placeholder={t("menus.namePlaceholder")}
                          className="input-premium h-12"
                        />
                      </Field>

                      <input type="hidden" name="websiteMenuItemPdf[]" value={item.pdf} />

                      <Field label={t("menus.pdfLabel")}>
                        <FileUploadField
                          value={item.pdf}
                          onChange={(url) => updateMenuItem(index, "pdf", url)}
                        />
                      </Field>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMenuItem}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
                >
                  {t("menus.addButton")}
                </button>
              </div>
            </EditorBlock>

            <EditorBlock number="09" title={t("style.title")} description={t("style.description")}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("style.instagramLabel")}>
                  <input
                    name="websiteInstagram"
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    placeholder={t("style.instagramPlaceholder")}
                    className="input-premium h-12"
                  />
                </Field>

                <Field label={t("style.primaryColorLabel")}>
                  <input
                    type="color"
                    name="websitePrimaryColor"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-2"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock number="10" title={t("contacts.title")} description={t("contacts.description")}>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label={t("contacts.emailLabel")} name="email" value={email} onChange={setEmail} placeholder={t("contacts.emailPlaceholder")} />
                <TextInput label={t("contacts.phoneLabel")} name="phone" value={phone} onChange={setPhone} placeholder={t("contacts.phonePlaceholder")} />
              </div>

              <TextInput label={t("contacts.addressLabel")} name="address" value={address} onChange={setAddress} placeholder={t("contacts.addressPlaceholder")} />
            </EditorBlock>

            <EditorBlock
              number="11"
              title={t("seo.title")}
              description={t("seo.description")}
            >
              <TextInput
                label={t("seo.titleLabel")}
                name="websiteSeoTitle"
                value={seoTitle}
                onChange={setSeoTitle}
                placeholder={t("seo.titlePlaceholder", { name: restaurant.name })}
              />

              <Field label={t("seo.descriptionLabel")}>
                <textarea
                  name="websiteSeoDescription"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  rows={3}
                  placeholder={t("seo.descriptionPlaceholder")}
                  className="input-premium min-h-24 py-3"
                />
              </Field>

              <Field label={t("seo.domainLabel")}>
                <CustomDomainManager
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  email={restaurant.email}
                  phone={restaurant.phone}
                  address={restaurant.address}
                  activeDomain={restaurant.customDomain}
                  activeDomainVerified={restaurant.customDomainVerified}
                  initialOrder={domainOrder}
                  serviceConfigured={domainServiceConfigured}
                />
              </Field>
            </EditorBlock>
          </section>

          <aside className={`flex flex-col gap-4 xl:sticky xl:top-28 xl:self-start ${mobileMode === "edit" ? "hidden xl:flex" : "flex"}`}>
            <div className="order-2 xl:order-none">
              <QualityCard
                score={score}
                enabled={enabled}
                galleryCount={galleryCount}
                seoReady={Boolean(seoTitle && seoDescription)}
                faqCount={faqItems.filter((item) => item.question && item.answer).length}
                t={t}
              />
            </div>

            <div className="order-3 rounded-[2rem] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.06)] xl:order-none">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                {t("publicCard.eyebrow")}
              </p>

              <p className="mt-3 break-all text-lg font-semibold tracking-[-0.03em]">
                {fullPublicUrl}
              </p>

              <div className="mt-4 grid gap-2">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118]"
                >
                  {t("publicCard.viewButton")}
                </a>

                <button
                  type="submit"
                  className="h-11 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#16120E] transition hover:bg-white"
                >
                  {t("publicCard.saveButton")}
                </button>
              </div>
            </div>

            <div className="order-4 rounded-[2rem] border border-[#E1D0B8] bg-[#FFF9F0] p-5 shadow-[0_14px_44px_rgba(80,55,30,0.035)] xl:order-none">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                {t("checklist.eyebrow")}
              </p>

              <div className="mt-4 space-y-3 text-sm text-[#6B6258]">
                <ChecklistItem done={enabled}>{t("checklist.websiteActive")}</ChecklistItem>
                <ChecklistItem done={Boolean(headline)}>{t("checklist.headlineFilled")}</ChecklistItem>
                <ChecklistItem done={Boolean(heroImage)}>{t("checklist.mainPhoto")}</ChecklistItem>
                <ChecklistItem done={Boolean(seoTitle && seoDescription)}>{t("checklist.seoReady")}</ChecklistItem>
                <ChecklistItem done={faqItems.filter((item) => item.question && item.answer).length >= 3}>{t("checklist.faqsReady")}</ChecklistItem>
                <ChecklistItem done={Boolean(phone || email)}>
                  {t("checklist.contactVisible")}
                </ChecklistItem>
              </div>
            </div>

            <div className="order-1 overflow-hidden rounded-[2rem] border border-[#E1D0B8] bg-white shadow-[0_18px_55px_rgba(80,55,30,0.06)] xl:order-none">
              <div className="border-b border-[#E8DCCB] bg-[#FFF9F0] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                  {t("previewCard.eyebrow")}
                </p>
              </div>

              <LivePreview
                restaurantName={restaurant.name}
                logoImage={logoImage}
                headline={headline}
                description={description}
                cuisine={cuisine}
                heroImage={heroImage}
                gallery={gallery}
                galleryTitles={galleryTitles}
                primaryColor={primaryColor}
                template={template}
                theme={previewTheme}
                menuTitle={menuTitle}
                menuItems={menuItems}
                compact
                t={t}
              />
            </div>
          </aside>
        </form>
        </div>
      </div>

      <div className="fixed bottom-[84px] left-3 right-3 z-40 grid grid-cols-2 gap-2 rounded-[22px] border border-white/15 bg-[#17130F]/96 p-2 shadow-[0_20px_65px_rgba(23,19,15,0.32)] backdrop-blur-2xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMode(mobileMode === "edit" ? "preview" : "edit")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] border border-white/15 px-4 text-sm font-semibold text-white"
        >
          {mobileMode === "edit" ? <Eye size={16} /> : <FileText size={16} />}
          {mobileMode === "edit" ? t("header.previewButton") : t("header.editButton")}
        </button>
        <button
          form="website-editor-form"
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#C8A56A] px-5 text-sm font-black text-[#17130F]"
        >
          <Save size={16} />
          {t("header.saveButton")}
        </button>
      </div>

      <BottomNav id={restaurant.id} />
    </main>
  );
}

function TextInput({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Field label={label}>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-premium h-12"
      />
    </Field>
  );
}

function AiSource({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-bold text-[#EADBC5]">
    <span className="text-[#D7B267]">{icon}</span><span>{label}</span>
  </div>;
}

function LivePreview({
  restaurantName,
  logoImage,
  headline,
  description,
  cuisine,
  heroImage,
  gallery,
  galleryTitles,
  primaryColor,
  template,
  theme,
  menuTitle,
  menuItems,
  compact = false,
  t,
}: {
  restaurantName: string;
  logoImage: string;
  headline: string;
  description: string;
  cuisine: string;
  heroImage: string;
  gallery: string[];
  galleryTitles: string[];
  primaryColor: string;
  template: string;
  theme: ReturnType<typeof getPreviewTheme>;
  menuTitle: string;
  menuItems: WebsiteMenuItem[];
  compact?: boolean;
  t: Translator;
}) {
  const validGallery = gallery.filter((item) => item.startsWith("http"));
  const validMenus = menuItems.filter((item) => item.pdf.startsWith("http"));

  return (
    <div
      className={`overflow-hidden ${compact ? "border-0 shadow-none" : "rounded-[2rem] border shadow-[0_28px_90px_rgba(80,55,30,0.12)]"} ${theme.shell}`}
    >
      <div className={`relative ${compact ? "min-h-[220px]" : "min-h-[340px]"} ${theme.hero}`}>
        {heroImage.startsWith("http") && (
          <img
            src={heroImage}
            alt={headline || restaurantName}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[1px]"
          />
        )}

        <div className={theme.overlay} />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            {logoImage.startsWith("http") && (
              <img
                src={logoImage}
                alt="Logo"
                className="h-14 max-w-[190px] object-contain"
              />
            )}

            {!logoImage.startsWith("http") && (
              <p className="text-sm font-semibold">{restaurantName}</p>
            )}
          </div>

          <span
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {t("preview.reserveBadge")}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className={theme.eyebrow}>{cuisine || t("preview.cuisineFallback")}</p>

          <h2 className={compact ? "mt-3 text-3xl font-semibold leading-[0.92] tracking-[-0.06em]" : "mt-3 text-4xl font-semibold leading-[0.9] tracking-[-0.06em]"}>
            {headline || restaurantName}
          </h2>

          <p className={theme.text}>
            {description || t("preview.descriptionFallback")}
          </p>
        </div>
      </div>

      <div className={theme.body}>
        <div className="grid grid-cols-3 gap-2">
          <PreviewPill label={t("preview.templateLabel")} value={template} />
          <PreviewPill label={t("preview.menusLabel")} value={validMenus.length ? String(validMenus.length) : "—"} />
          <PreviewPill label={t("preview.photosLabel")} value={String(validGallery.length + (heroImage ? 1 : 0))} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[heroImage, ...gallery].slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="relative h-20 overflow-hidden rounded-2xl bg-black/20"
            >
              {image?.startsWith("http") ? (
                <>
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {index > 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/35 px-2 py-1 text-[10px] font-semibold text-white">
                      {galleryTitles[index - 1] || t("preview.photoNumberFallback", { index })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs opacity-40">
                  {t("preview.photoLabel")}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-current/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-40">
            {t("preview.menuSectionLabel")}
          </p>

          <p className="mt-2 text-lg font-semibold">{menuTitle || t("preview.menuTitleFallback")}</p>

          <p className="mt-1 text-sm opacity-55">
            {validMenus.length
              ? t("preview.menuLoadedCount", { count: validMenus.length })
              : t("preview.menuNotLoaded")}
          </p>
        </div>
      </div>
    </div>
  );
}

function GalleryUploadField({
  number,
  value,
  onChange,
  title,
  onTitleChange,
  t,
}: {
  number: string;
  value: string;
  onChange: (url: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  t: Translator;
}) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <Field label={t("images.photoNameLabel", { number })}>
        <input
          name={`websiteGalleryTitle${number}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={number === "1" ? t("images.photoPlaceholderFirst") : t("images.photoPlaceholderOther", { number })}
          className="input-premium h-11"
        />
      </Field>

      <div className="mt-4">
        <ImageUploadField value={value} onChange={onChange} compact />
        <input type="hidden" name={`websiteGalleryImage${number}`} value={value} />
      </div>
    </div>
  );
}

function PreviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-current/10 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-35">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold">{value}</p>
    </div>
  );
}

function QualityCard({
  score,
  enabled,
  galleryCount,
  seoReady,
  faqCount,
  t,
}: {
  score: number;
  enabled: boolean;
  galleryCount: number;
  seoReady: boolean;
  faqCount: number;
  t: Translator;
}) {
  return (
    <div className="rounded-[2rem] border border-[#E1D0B8] bg-white p-5 shadow-[0_28px_90px_rgba(80,55,30,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
            {t("quality.eyebrow")}
          </p>

          <p className="mt-2 text-4xl font-semibold tracking-[-0.06em]">
            {score}%
          </p>
        </div>

        <div
          className={
            enabled
              ? "flex h-16 w-16 items-center justify-center rounded-full border border-[#9CCB9B] bg-[#ECF7EC] text-sm font-semibold text-[#3F6A4D]"
              : "flex h-16 w-16 items-center justify-center rounded-full border border-[#E7B7A8] bg-[#FFF0EA] text-sm font-semibold text-[#A14E36]"
          }
        >
          {enabled ? t("quality.on") : t("quality.off")}
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-[#6B6258]">
        <p>
          {t("quality.galleryLabel")}{" "}
          <span className="font-semibold text-[#16120E]">{galleryCount}/4</span>
        </p>

        <p>{t("quality.seoLabel")} <span className="font-semibold text-[#16120E]">{seoReady ? t("quality.ready") : t("quality.missing")}</span></p>
        <p>{t("quality.faqLabel")} <span className="font-semibold text-[#16120E]">{faqCount}/4</span></p>
      </div>
    </div>
  );
}

function EditorBlock({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const surfaces: Record<string, string> = {
    "01": "bg-[#FFF9F0]",
    "02": "bg-[#FFFBF4]",
    "03": "bg-[#FFF7EE]",
    "04": "bg-[#FFFDF8]",
    "05": "bg-[#FFFAF2]",
    "06": "bg-[#FFF7EE]",
    "07": "bg-[#FFFDF8]",
    "08": "bg-[#FFFAF2]",
    "09": "bg-[#FFFDF8]",
    "10": "bg-[#FFFBF4]",
    "11": "bg-[#FFF7EE]",
  };

  const surface = surfaces[number] ?? "bg-white";

  return (
    <details open={number === "01" || number === "02"} className="group overflow-hidden rounded-[24px] border border-[#E1D0B8] bg-white shadow-[0_14px_40px_rgba(80,55,30,0.04)]">
      <summary className={`cursor-pointer list-none px-4 py-3.5 sm:px-5 sm:py-4 ${surface}`}>
        <div className="flex items-start gap-4">
          <div className="rounded-full border border-[#D6C3A5] bg-white px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#9B6F3B]">
            {number}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.035em] sm:text-xl">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6B6258]">
              {description}
            </p>
          </div>
          <span className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#DFCDB2] bg-white text-[#9B6F3B] transition group-open:rotate-180"><ChevronDown size={15} /></span>
        </div>
      </summary>

      <div className="space-y-4 border-t border-[#E8DCCB] p-4 sm:p-5">{children}</div>
    </details>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block rounded-[20px] border border-[#E8DCCB] bg-[#FFFDF8] p-4 shadow-[0_10px_28px_rgba(80,55,30,0.025)]">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <span className="text-sm font-semibold text-[#16120E]">{label}</span>
        {hint && <span className="text-xs text-[#9B6F3B]">{hint}</span>}
      </div>

      {children}
    </label>
  );
}

function ChecklistItem({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={
          done
            ? "h-2.5 w-2.5 rounded-full bg-[#86A969]"
            : "h-2.5 w-2.5 rounded-full bg-[#D6C3A5]"
        }
      />
      <span className={done ? "font-semibold text-[#16120E]" : ""}>
        {children}
      </span>
    </div>
  );
}

function normalizeFaqItems(value: unknown): WebsiteFaqItem[] {
  const source = Array.isArray(value) ? value : [];
  const items = source
    .map((item) => {
      const candidate = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return { question: String(candidate.question || "").slice(0, 160), answer: String(candidate.answer || "").slice(0, 360) };
    })
    .slice(0, 4);
  while (items.length < 4) items.push({ question: "", answer: "" });
  return items;
}

function countBlueprintFields(data: Record<string, unknown>) {
  const scalarKeys = [
    "headline", "description", "cuisine", "aboutTitle", "aboutText", "featureTitle", "featureText", "sectionTitle",
    "sectionText", "galleryTitle", "galleryDescription", "locationTitle", "locationDescription", "ctaTitle", "ctaText",
    "menuTitle", "menuDescription", "seoTitle", "seoDescription", "faqTitle", "template", "primaryColor",
  ];
  const scalars = scalarKeys.filter((key) => typeof data[key] === "string" && Boolean(String(data[key]).trim())).length;
  const listItems = [data.galleryTitles, data.specialties, data.faqItems]
    .filter(Array.isArray)
    .reduce((total, list) => total + (list as unknown[]).length, 0);
  return scalars + listItems;
}

function getPreviewTheme(template: string, primaryColor: string) {
  if (template === "MINIMAL") {
    return {
      shell: "border-zinc-200 bg-white text-zinc-950",
      hero: "bg-zinc-100",
      overlay: "absolute inset-0 bg-gradient-to-b from-transparent to-white/95",
      body: "bg-white p-5 text-zinc-950",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400",
      text: "mt-3 text-sm leading-6 text-zinc-500",
      accent: primaryColor,
    };
  }

  if (template === "LUXURY") {
    return {
      shell: "border-[#d4af37]/20 bg-black text-[#f5ead7]",
      hero: "bg-black",
      overlay: "absolute inset-0 bg-gradient-to-b from-black/40 to-black",
      body: "bg-black p-5 text-[#f5ead7]",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]/70",
      text: "mt-3 text-sm leading-6 text-[#f5ead7]/55",
      accent: "#d4af37",
    };
  }

  if (template === "SOCIAL") {
    return {
      shell: "border-pink-300/20 bg-[#0f0715] text-white",
      hero: "bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),transparent_50%),#0f0715]",
      overlay: "absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[#0f0715]",
      body: "bg-[#0f0715] p-5 text-white",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.3em] text-pink-300/70",
      text: "mt-3 text-sm leading-6 text-white/55",
      accent: "#ec4899",
    };
  }

  return {
    shell: "border-[#E1D0B8] bg-[#120b07] text-white",
    hero: "bg-[#120b07]",
    overlay: "absolute inset-0 bg-gradient-to-b from-black/20 to-[#120b07]",
    body: "bg-[#120b07] p-5 text-white",
    eyebrow: "text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70",
    text: "mt-3 text-sm leading-6 text-white/60",
    accent: primaryColor,
  };
}
