"use client";

import Link from "next/link";
import { FileUploadField } from "@/components/FileUploadField";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useMemo, useState } from "react";
import RestaurantSidebar from "@/components/RestaurantSidebar";

type WebsiteMenuItem = {
  id?: string;
  title: string;
  pdf: string;
  sortOrder?: number;
};

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
  websiteSeoTitle: string | null;
  websiteSeoDescription: string | null;
  customDomain: string | null;
  websitePrimaryColor: string | null;
};

export function WebsiteEditorClient({
  restaurant,
  saved,
}: {
  restaurant: RestaurantWebsiteData;
  saved: boolean;
}) {
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
  const [seoTitle, setSeoTitle] = useState(
    restaurant.websiteSeoTitle || "",
  );
  const [seoDescription, setSeoDescription] = useState(
    restaurant.websiteSeoDescription || "",
  );
  const [customDomain] = useState(restaurant.customDomain || "");
  const [primaryColor, setPrimaryColor] = useState(
    restaurant.websitePrimaryColor || "#111827",
  );
  const [email, setEmail] = useState(restaurant.email || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [aiBrief] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const publicUrl = `/s/${slug || restaurant.slug}`;
  const fullPublicUrl = `${slug || restaurant.slug}.mesalink.pt`;
  const previewTheme = getPreviewTheme(template, primaryColor);
  const gallery = [gallery1, gallery2, gallery3, gallery4];
  const galleryTitles = [
    galleryTitle1,
    galleryTitle2,
    galleryTitle3,
    galleryTitle4,
  ];
  const galleryCount = gallery.filter((item) => item.startsWith("http")).length;
  const menuCount = menuItems.filter((item) => item.pdf.startsWith("http")).length;

  const score = useMemo(() => {
    const items = [
      enabled,
      headline,
      description,
      cuisine,
      heroImage,
      aboutText,
      menuCount > 0,
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
    menuCount,
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
          name: restaurant.name,
          cuisine,
          address,
          instagram,
          brief: aiBrief || aboutText || description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao gerar conteúdo com IA");
      }

      setHeadline(data.headline || "");
      setDescription(data.description || "");
      setAboutTitle(data.aboutTitle || "");
      setAboutText(data.aboutText || "");
      setFeatureTitle(data.featureTitle || "");
      setFeatureText(data.featureText || "");
      setGalleryTitle(data.galleryTitle || "");
      setGalleryDescription(data.galleryDescription || "");
      setLocationTitle(data.locationTitle || "");
      setLocationDescription(data.locationDescription || "");
      setFinalCtaTitle(data.ctaTitle || "");
      setFinalCtaText(data.ctaText || "");
      setSeoTitle(data.seoTitle || "");
      setSeoDescription(data.seoDescription || "");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar conteúdo com IA. Confirma a OPENAI_API_KEY e tenta novamente.");
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

  function improveText() {
    if (headline) setHeadline(cleanHeadline(headline));
    if (description) setDescription(polishText(description, restaurant.name));
    if (aboutText) setAboutText(polishText(aboutText, restaurant.name));
    if (featureText) setFeatureText(polishText(featureText, restaurant.name));
    if (menuDescription) {
      setMenuDescription(polishText(menuDescription, restaurant.name));
    }
    if (sectionText) setSectionText(polishText(sectionText, restaurant.name));
    if (galleryDescription) {
      setGalleryDescription(polishText(galleryDescription, restaurant.name));
    }
    if (locationDescription) {
      setLocationDescription(polishText(locationDescription, restaurant.name));
    }
    if (finalCtaText) setFinalCtaText(polishText(finalCtaText, restaurant.name));
    if (seoDescription) {
      setSeoDescription(toSeoDescription(seoDescription, restaurant.name));
    }
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_minmax(0,1fr)]">
       <RestaurantSidebar
  id={restaurant.id}
  restaurantName={restaurant.name}
  active="Website"
/>

        <div className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-40 -mx-4 border-b border-[#E1D0B8] bg-[#F5EFE6]/90 px-4 py-3 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
                    Website
                  </p>

                  <h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em]">
                    Website Studio
                  </h1>
                </div>

                <span
                  className={
                    enabled
                      ? "rounded-full border border-[#9CCB9B] bg-[#ECF7EC] px-3 py-1 text-xs font-semibold text-[#3F6A4D]"
                      : "rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36]"
                  }
                >
                  {enabled ? "Online" : "Offline"}
                </span>

                {saved && (
                  <span className="rounded-full border border-[#E1D0B8] bg-white px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
                    Guardado
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-[#6B6258]">
                Cria um website profissional para o teu restaurante em poucos minutos.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={improveText}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
              >
                Melhorar textos
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#E1D0B8] bg-white px-5 text-sm font-semibold text-[#16120E] transition hover:bg-[#FFF9F0]"
              >
                Ver site
              </a>

              <button
                form="website-editor-form"
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
              >
                Guardar alterações
              </button>
            </div>
          </div>
        </header>

        <form
          id="website-editor-form"
          action={`/api/restaurants/${restaurant.id}/website`}
          method="POST"
          className="grid gap-6 py-8 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <section className="space-y-6">
            <EditorBlock
              number="01"
              title="Publicação"
              description="Controla se o site está online e qual é o endereço público."
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
                  <p className="font-semibold">Ativar website público</p>

                  <p className="mt-1 text-sm leading-6 text-[#6B6258]">
                    Quando ativo, o restaurante fica disponível em{" "}
                    <span className="font-semibold text-[#16120E]">
                      {fullPublicUrl}
                    </span>
                    .
                  </p>
                </div>
              </label>

              <Field label="Link público">
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

              <Field label="Template">
                <select
                  name="websiteTemplate"
                  value={template}
                  onChange={(event) => setTemplate(event.target.value)}
                  className="input-premium h-12"
                >
                  <option value="PREMIUM">Premium Restaurant</option>
                  <option value="LUXURY">Luxury Dining</option>
                  <option value="MINIMAL">Minimal Clean</option>
                  <option value="SOCIAL">Instagram First</option>
                </select>
              </Field>
            </EditorBlock>

            <EditorBlock
              number="02"
              title="IA Website Builder"
              description="Funcionalidade em desenvolvimento."
            >
              <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">IA Website Builder</h3>

                    <p className="mt-2 text-sm text-[#6B6258]">
                      Criação automática de conteúdo para websites.
                    </p>
                  </div>

                  <span className="rounded-full border border-[#E1D0B8] bg-[#EFE5D6] px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
                    Coming Soon
                  </span>
                </div>
              </div>
            </EditorBlock>

            <EditorBlock
              number="03"
              title="Primeira impressão"
              description="O que o cliente vê nos primeiros 3 segundos."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Headline">
                  <input
                    name="websiteHeadline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder={restaurant.name}
                    className="input-premium h-12"
                  />
                </Field>

                <Field label="Tipo de cozinha">
                  <input
                    name="websiteCuisine"
                    value={cuisine}
                    onChange={(event) => setCuisine(event.target.value)}
                    placeholder="Portuguesa, Japonesa, Brunch..."
                    className="input-premium h-12"
                  />
                </Field>
              </div>

              <Field label="Descrição curta">
                <textarea
                  name="websiteDescription"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Um espaço acolhedor para comer bem, ficar mais um pouco e voltar."
                  className="input-premium min-h-32 py-3"
                />
              </Field>
            </EditorBlock>

            <EditorBlock number="04" title="História" description="Aqui começa a alma do restaurante.">
              <Field label="Título da secção sobre">
                <input
                  name="websiteAboutTitle"
                  value={aboutTitle}
                  onChange={(event) => setAboutTitle(event.target.value)}
                  placeholder="A nossa casa"
                  className="input-premium h-12"
                />
              </Field>

              <Field label="Texto sobre o restaurante">
                <textarea
                  name="websiteAboutText"
                  value={aboutText}
                  onChange={(event) => setAboutText(event.target.value)}
                  rows={5}
                  placeholder="Conta a história, o conceito e o ambiente."
                  className="input-premium min-h-36 py-3"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Destaque">
                  <input
                    name="websiteFeatureTitle"
                    value={featureTitle}
                    onChange={(event) => setFeatureTitle(event.target.value)}
                    placeholder="Uma experiência à mesa"
                    className="input-premium h-12"
                  />
                </Field>

                <Field label="Texto do destaque">
                  <input
                    name="websiteFeatureText"
                    value={featureText}
                    onChange={(event) => setFeatureText(event.target.value)}
                    placeholder="Uma experiência pensada para reunir pessoas."
                    className="input-premium h-12"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock
              number="05"
              title="Textos do website"
              description="Personaliza os textos principais do site."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Título da secção principal" name="websiteSectionTitle" value={sectionTitle} onChange={setSectionTitle} placeholder="Sobre nós" />
                <TextInput label="Texto da secção principal" name="websiteSectionText" value={sectionText} onChange={setSectionText} placeholder="Texto livre sobre o espaço." />
                <TextInput label="Título da galeria" name="websiteGalleryTitle" value={galleryTitle} onChange={setGalleryTitle} placeholder="Galeria" />
                <TextInput label="Descrição da galeria" name="websiteGalleryDescription" value={galleryDescription} onChange={setGalleryDescription} placeholder="Descrição curta da galeria." />
                <TextInput label="Título da localização" name="websiteLocationTitle" value={locationTitle} onChange={setLocationTitle} placeholder="Onde estamos" />
                <TextInput label="Texto da localização" name="websiteLocationDescription" value={locationDescription} onChange={setLocationDescription} placeholder="Morada, zona ou indicação útil." />
                <TextInput label="Título final" name="websiteFinalCtaTitle" value={finalCtaTitle} onChange={setFinalCtaTitle} placeholder={`Reserva em ${restaurant.name}`} />
                <TextInput label="Texto final" name="websiteFinalCtaText" value={finalCtaText} onChange={setFinalCtaText} placeholder="Chamada final para reservar, visitar ou contactar." />
              </div>
            </EditorBlock>

            <EditorBlock number="06" title="Imagens" description="As melhores fotografias do teu espaço.">
              <Field label="Logo">
                <ImageUploadField value={logoImage} onChange={setLogoImage} compact />
                <input type="hidden" name="websiteLogoImage" value={logoImage} />
              </Field>

              <Field label="Foto principal">
                <ImageUploadField value={heroImage} onChange={setHeroImage} />
                <input type="hidden" name="websiteHeroImage" value={heroImage} />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <GalleryUploadField number="1" value={gallery1} onChange={setGallery1} title={galleryTitle1} onTitleChange={setGalleryTitle1} />
                <GalleryUploadField number="2" value={gallery2} onChange={setGallery2} title={galleryTitle2} onTitleChange={setGalleryTitle2} />
                <GalleryUploadField number="3" value={gallery3} onChange={setGallery3} title={galleryTitle3} onTitleChange={setGalleryTitle3} />
                <GalleryUploadField number="4" value={gallery4} onChange={setGallery4} title={galleryTitle4} onTitleChange={setGalleryTitle4} />
              </div>
            </EditorBlock>

            <EditorBlock
              number="07"
              title="Menus"
              description="Adiciona um ou vários menus em PDF, com o nome que quiseres."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título da secção">
                  <input
                    name="websiteMenuTitle"
                    value={menuTitle}
                    onChange={(event) => setMenuTitle(event.target.value)}
                    placeholder="Menu"
                    className="input-premium h-12"
                  />
                </Field>

                <Field label="Descrição da secção">
                  <input
                    name="websiteMenuDescription"
                    value={menuDescription}
                    onChange={(event) => setMenuDescription(event.target.value)}
                    placeholder="Consulta os nossos menus."
                    className="input-premium h-12"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                {menuItems.length === 0 && (
                  <div className="rounded-[28px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-6 text-sm text-[#6B6258]">
                    Ainda não adicionaste nenhum menu.
                  </div>
                )}

                {menuItems.map((item, index) => (
                  <div
                    key={`${item.id || "new"}-${index}`}
                    className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#16120E]">
                        Menu {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeMenuItem(index)}
                        className="rounded-full border border-[#E7B7A8] bg-[#FFF0EA] px-3 py-1 text-xs font-semibold text-[#A14E36] hover:bg-[#FFE7DE]"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Nome do menu">
                        <input
                          name="websiteMenuItemTitle[]"
                          value={item.title}
                          onChange={(event) =>
                            updateMenuItem(index, "title", event.target.value)
                          }
                          placeholder="Ex: Carta, Cocktails, Vinhos, Brunch..."
                          className="input-premium h-12"
                        />
                      </Field>

                      <input type="hidden" name="websiteMenuItemPdf[]" value={item.pdf} />

                      <Field label="PDF do menu">
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
                  + Adicionar menu
                </button>
              </div>
            </EditorBlock>

            <EditorBlock number="08" title="Estilo" description="Ajusta a identidade visual do site.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram">
                  <input
                    name="websiteInstagram"
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    placeholder="@restaurante"
                    className="input-premium h-12"
                  />
                </Field>

                <Field label="Cor principal">
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

            <EditorBlock number="09" title="Contactos" description="Edita os contactos que aparecem no website público.">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Email" name="email" value={email} onChange={setEmail} placeholder="info@restaurante.pt" />
                <TextInput label="Telefone" name="phone" value={phone} onChange={setPhone} placeholder="+351 912 345 678" />
              </div>

              <TextInput label="Morada" name="address" value={address} onChange={setAddress} placeholder="Rua, número, cidade" />
            </EditorBlock>

            <EditorBlock
              number="10"
              title="SEO e domínio"
              description="Melhora a presença no Google e prepara o website para crescer."
            >
              <TextInput
                label="Título SEO"
                name="websiteSeoTitle"
                value={seoTitle}
                onChange={setSeoTitle}
                placeholder={`${restaurant.name} | Reservas online`}
              />

              <Field label="Descrição SEO">
                <textarea
                  name="websiteSeoDescription"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  rows={3}
                  placeholder="Descrição para Google e partilhas."
                  className="input-premium min-h-24 py-3"
                />
              </Field>

              <Field label="Domínio próprio">
                <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#16120E]">
                        Domínio próprio
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#6B6258]">
                        Em breve poderás utilizar um domínio próprio em vez de um subdomínio MesaLink.
                      </p>
                    </div>

                    <span className="rounded-full border border-[#E1D0B8] bg-[#EFE5D6] px-3 py-1 text-xs font-semibold text-[#9B6F3B]">
                      Coming Soon
                    </span>
                  </div>
                </div>

                <input type="hidden" name="customDomain" value={customDomain} />
              </Field>
            </EditorBlock>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <QualityCard
              score={score}
              enabled={enabled}
              galleryCount={galleryCount}
              hasMenu={menuCount > 0}
            />

            <div className="rounded-[2rem] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                Website público
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
                  Ver website
                </a>

                <button
                  type="submit"
                  className="h-11 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-sm font-semibold text-[#16120E] transition hover:bg-white"
                >
                  Guardar alterações
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#E1D0B8] bg-[#FFF9F0] p-5 shadow-[0_14px_44px_rgba(80,55,30,0.035)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                Checklist
              </p>

              <div className="mt-4 space-y-3 text-sm text-[#6B6258]">
                <ChecklistItem done={enabled}>Website ativo</ChecklistItem>
                <ChecklistItem done={Boolean(headline)}>Headline preenchida</ChecklistItem>
                <ChecklistItem done={Boolean(heroImage)}>Foto principal</ChecklistItem>
                <ChecklistItem done={menuCount > 0}>Menu carregado</ChecklistItem>
                <ChecklistItem done={Boolean(phone || email)}>
                  Contacto visível
                </ChecklistItem>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#E1D0B8] bg-white shadow-[0_18px_55px_rgba(80,55,30,0.06)]">
              <div className="border-b border-[#E8DCCB] bg-[#FFF9F0] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
                  Preview rápido
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
              />
            </div>
          </aside>
        </form>
        </div>
      </div>
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
            Reservar
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className={theme.eyebrow}>{cuisine || "Restaurante"}</p>

          <h2 className={compact ? "mt-3 text-3xl font-semibold leading-[0.92] tracking-[-0.06em]" : "mt-3 text-4xl font-semibold leading-[0.9] tracking-[-0.06em]"}>
            {headline || restaurantName}
          </h2>

          <p className={theme.text}>
            {description || "Reserva a tua mesa online em poucos segundos."}
          </p>
        </div>
      </div>

      <div className={theme.body}>
        <div className="grid grid-cols-3 gap-2">
          <PreviewPill label="Template" value={template} />
          <PreviewPill label="Menus" value={validMenus.length ? String(validMenus.length) : "—"} />
          <PreviewPill label="Fotos" value={String(validGallery.length + (heroImage ? 1 : 0))} />
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
                      {galleryTitles[index - 1] || `Foto ${index}`}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs opacity-40">
                  Foto
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-current/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-40">
            Menu
          </p>

          <p className="mt-2 text-lg font-semibold">{menuTitle || "Menus"}</p>

          <p className="mt-1 text-sm opacity-55">
            {validMenus.length
              ? `${validMenus.length} menu(s) carregado(s).`
              : "Adiciona um ou mais menus em PDF."}
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
}: {
  number: string;
  value: string;
  onChange: (url: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <Field label={`Nome da foto ${number}`}>
        <input
          name={`websiteGalleryTitle${number}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={number === "1" ? "Ambiente" : `Foto ${number}`}
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
  hasMenu,
}: {
  score: number;
  enabled: boolean;
  galleryCount: number;
  hasMenu: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-[#E1D0B8] bg-white p-5 shadow-[0_28px_90px_rgba(80,55,30,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
            Qualidade
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
          {enabled ? "ON" : "OFF"}
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm text-[#6B6258]">
        <p>
          Galeria:{" "}
          <span className="font-semibold text-[#16120E]">{galleryCount}/4</span>
        </p>

        <p>
          Menu:{" "}
          <span className="font-semibold text-[#16120E]">
            {hasMenu ? "Sim" : "Não"}
          </span>
        </p>
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
  };

  const surface = surfaces[number] ?? "bg-white";

  return (
    <section className="overflow-hidden rounded-[34px] border border-[#E1D0B8] bg-white shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      <div className={`border-b border-[#E8DCCB] px-6 py-5 ${surface}`}>
        <div className="flex items-start gap-4">
          <div className="rounded-full border border-[#D6C3A5] bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-[#9B6F3B] shadow-[0_10px_24px_rgba(80,55,30,0.04)]">
            {number}
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-[-0.045em]">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6B6258]">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">{children}</div>
    </section>
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
    <label className="block rounded-[26px] border border-[#E8DCCB] bg-[#FFFDF8] p-5 shadow-[0_12px_34px_rgba(80,55,30,0.035)]">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <span className="text-sm font-semibold text-[#16120E]">{label}</span>
        {hint && <span className="text-xs text-[#9B6F3B]">{hint}</span>}
      </div>

      {children}
    </label>
  );
}

function cleanHeadline(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/\.+$/g, "").slice(0, 90);
}

function polishText(value: string, restaurantName: string) {
  const clean = value.trim().replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1");

  if (!clean) return clean;

  const improved = clean
    .replace(/lolitos/gi, "")
    .replace(/\btop\b/gi, "excelente")
    .replace(/\bfixe\b/gi, "acolhedor")
    .replace(/\bmuito bom\b/gi, "de qualidade")
    .replace(/\s+/g, " ")
    .trim();

  const sentence = improved.endsWith(".") ? improved : `${improved}.`;

  if (sentence.length > 260) {
    return sentence.slice(0, 257).trimEnd() + "...";
  }

  return sentence;
}

function toSeoDescription(value: string, restaurantName: string) {
  const clean = value.trim().replace(/\s+/g, " ");
  const base =
    clean ||
    `Reserva online no ${restaurantName}. Consulta menu, localização e contactos.`;

  return base.length > 155 ? base.slice(0, 152).trimEnd() + "..." : base;
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