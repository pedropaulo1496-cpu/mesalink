"use client";

import { FileUploadField } from "@/components/FileUploadField";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useMemo, useState } from "react";

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
  const [template, setTemplate] = useState(restaurant.websiteTemplate || "PREMIUM");
  const [slug, setSlug] = useState(restaurant.slug);
  const [headline, setHeadline] = useState(restaurant.websiteHeadline || "");
  const [description, setDescription] = useState(restaurant.websiteDescription || "");
  const [cuisine, setCuisine] = useState(restaurant.websiteCuisine || "");
  const [instagram, setInstagram] = useState(restaurant.websiteInstagram || "");
  const [logoImage, setLogoImage] = useState(restaurant.websiteLogoImage || "");
  const [heroImage, setHeroImage] = useState(restaurant.websiteHeroImage || "");
  const [gallery1, setGallery1] = useState(restaurant.websiteGalleryImage1 || "");
  const [gallery2, setGallery2] = useState(restaurant.websiteGalleryImage2 || "");
  const [gallery3, setGallery3] = useState(restaurant.websiteGalleryImage3 || "");
  const [gallery4, setGallery4] = useState(restaurant.websiteGalleryImage4 || "");
  const [galleryTitle1, setGalleryTitle1] = useState(restaurant.websiteGalleryTitle1 || "");
  const [galleryTitle2, setGalleryTitle2] = useState(restaurant.websiteGalleryTitle2 || "");
  const [galleryTitle3, setGalleryTitle3] = useState(restaurant.websiteGalleryTitle3 || "");
  const [galleryTitle4, setGalleryTitle4] = useState(restaurant.websiteGalleryTitle4 || "");
  const [menuTitle, setMenuTitle] = useState(restaurant.websiteMenuTitle || "");
  const [menuDescription, setMenuDescription] = useState(restaurant.websiteMenuDescription || "");
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
  const [aboutTitle, setAboutTitle] = useState(restaurant.websiteAboutTitle || "");
  const [aboutText, setAboutText] = useState(restaurant.websiteAboutText || "");
  const [featureTitle, setFeatureTitle] = useState(restaurant.websiteFeatureTitle || "");
  const [featureText, setFeatureText] = useState(restaurant.websiteFeatureText || "");
  const [sectionTitle, setSectionTitle] = useState(restaurant.websiteSectionTitle || "");
  const [sectionText, setSectionText] = useState(restaurant.websiteSectionText || "");
  const [galleryTitle, setGalleryTitle] = useState(restaurant.websiteGalleryTitle || "");
  const [galleryDescription, setGalleryDescription] = useState(restaurant.websiteGalleryDescription || "");
  const [locationTitle, setLocationTitle] = useState(restaurant.websiteLocationTitle || "");
  const [locationDescription, setLocationDescription] = useState(restaurant.websiteLocationDescription || "");
  const [finalCtaTitle, setFinalCtaTitle] = useState(restaurant.websiteFinalCtaTitle || "");
  const [finalCtaText, setFinalCtaText] = useState(restaurant.websiteFinalCtaText || "");
  const [seoTitle, setSeoTitle] = useState(restaurant.websiteSeoTitle || "");
  const [seoDescription, setSeoDescription] = useState(restaurant.websiteSeoDescription || "");
  const [customDomain, setCustomDomain] = useState(restaurant.customDomain || "");
  const [primaryColor, setPrimaryColor] = useState(restaurant.websitePrimaryColor || "#111827");
  const [email, setEmail] = useState(restaurant.email || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [aiBrief, setAiBrief] = useState("");

  const publicUrl = `/s/${slug || restaurant.slug}`;
  const fullPublicUrl = `${slug || restaurant.slug}.mesalink.pt`;
  const previewTheme = getPreviewTheme(template, primaryColor);
  const gallery = [gallery1, gallery2, gallery3, gallery4];
  const galleryTitles = [galleryTitle1, galleryTitle2, galleryTitle3, galleryTitle4];
  const galleryCount = gallery.filter((item) => item.startsWith("http")).length;
  const menuCount = menuItems.filter((item) => item.pdf.startsWith("http")).length;

  const score = useMemo(() => {
    const items = [enabled, headline, description, cuisine, heroImage, aboutText, menuCount > 0, phone || email];
    return Math.round((items.filter(Boolean).length / items.length) * 100);
  }, [enabled, headline, description, cuisine, heroImage, aboutText, menuCount, phone, email]);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

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
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeMenuItem(index: number) {
    setMenuItems((items) =>
      items
        .filter((_, itemIndex) => itemIndex !== index)
        .map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }))
    );
  }

  function improveText() {
    if (headline) setHeadline(cleanHeadline(headline));
    if (description) setDescription(polishText(description, restaurant.name));
    if (aboutText) setAboutText(polishText(aboutText, restaurant.name));
    if (featureText) setFeatureText(polishText(featureText, restaurant.name));
    if (menuDescription) setMenuDescription(polishText(menuDescription, restaurant.name));
    if (sectionText) setSectionText(polishText(sectionText, restaurant.name));
    if (galleryDescription) setGalleryDescription(polishText(galleryDescription, restaurant.name));
    if (locationDescription) setLocationDescription(polishText(locationDescription, restaurant.name));
    if (finalCtaText) setFinalCtaText(polishText(finalCtaText, restaurant.name));
    if (seoDescription) setSeoDescription(toSeoDescription(seoDescription, restaurant.name));
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 -mx-4 border-b border-white/10 bg-[#050505]/85 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <a href={`/restaurants/${restaurant.id}`} className="text-sm font-bold text-white/45 hover:text-white">← Voltar ao dashboard</a>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.05em]">Website Builder</h1>
                <span className={enabled ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200" : "rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-black text-orange-200"}>{enabled ? "Online" : "Offline"}</span>
                {saved && <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">Guardado</span>}
              </div>
              <p className="mt-2 text-sm text-white/45">Cria um website profissional para o teu restaurante em poucos minutos.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={improveText} className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15">Melhorar textos</button>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15">Ver site</a>
              <button form="website-editor-form" type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-black hover:bg-white/90">Guardar alterações</button>
            </div>
          </div>
        </header>

        <form id="website-editor-form" action={`/api/restaurants/${restaurant.id}/website`} method="POST" className="grid gap-6 py-8 lg:grid-cols-[1fr_440px]">
          <section className="space-y-6">
            <EditorBlock number="01" title="Publicação" description="Controla se o site está online e qual é o endereço público.">
              <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <input type="checkbox" name="websiteEnabled" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="mt-1 h-5 w-5 rounded" />
                <div>
                  <p className="font-black">Ativar website público</p>
                  <p className="mt-1 text-sm leading-6 text-white/45">Quando ativo, o restaurante fica disponível em <span className="font-bold text-white">{fullPublicUrl}</span>.</p>
                </div>
              </label>

              <Field label="Link público">
                <div className="grid gap-3 md:grid-cols-[1fr_150px]">
                  <input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="input-dark h-12" required />
                  <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-bold text-white/35">.mesalink.pt</div>
                </div>
              </Field>

              <Field label="Template">
                <select name="websiteTemplate" value={template} onChange={(event) => setTemplate(event.target.value)} className="input-dark h-12">
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
  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-black">
          IA Website Builder
        </h3>

        <p className="mt-2 text-sm text-white/45">
          Criação automática de conteúdo para websites.
        </p>
      </div>

      <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
        Coming Soon
      </span>
    </div>
  </div>
</EditorBlock>

            <EditorBlock number="03" title="Primeira impressão" description="O que o cliente vê nos primeiros 3 segundos.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Headline"><input name="websiteHeadline" value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder={restaurant.name} className="input-dark h-12" /></Field>
                <Field label="Tipo de cozinha"><input name="websiteCuisine" value={cuisine} onChange={(event) => setCuisine(event.target.value)} placeholder="Portuguesa, Japonesa, Brunch..." className="input-dark h-12" /></Field>
              </div>
              <Field label="Descrição curta"><textarea name="websiteDescription" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Um espaço acolhedor para comer bem, ficar mais um pouco e voltar." className="input-dark min-h-32 py-3" /></Field>
            </EditorBlock>

            <EditorBlock number="04" title="História" description="Aqui começa a alma do restaurante.">
              <Field label="Título da secção sobre"><input name="websiteAboutTitle" value={aboutTitle} onChange={(event) => setAboutTitle(event.target.value)} placeholder="A nossa casa" className="input-dark h-12" /></Field>
              <Field label="Texto sobre o restaurante"><textarea name="websiteAboutText" value={aboutText} onChange={(event) => setAboutText(event.target.value)} rows={5} placeholder="Conta a história, o conceito e o ambiente." className="input-dark min-h-36 py-3" /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Destaque"><input name="websiteFeatureTitle" value={featureTitle} onChange={(event) => setFeatureTitle(event.target.value)} placeholder="Uma experiência à mesa" className="input-dark h-12" /></Field>
                <Field label="Texto do destaque"><input name="websiteFeatureText" value={featureText} onChange={(event) => setFeatureText(event.target.value)} placeholder="Uma experiência pensada para reunir pessoas." className="input-dark h-12" /></Field>
              </div>
            </EditorBlock>

            <EditorBlock number="05" title="Textos do website" description="Personaliza os textos principais do site.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título da secção principal"><input name="websiteSectionTitle" value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder="Sobre nós" className="input-dark h-12" /></Field>
                <Field label="Texto da secção principal"><input name="websiteSectionText" value={sectionText} onChange={(event) => setSectionText(event.target.value)} placeholder="Texto livre sobre o espaço." className="input-dark h-12" /></Field>
                <Field label="Título da galeria"><input name="websiteGalleryTitle" value={galleryTitle} onChange={(event) => setGalleryTitle(event.target.value)} placeholder="Galeria" className="input-dark h-12" /></Field>
                <Field label="Descrição da galeria"><input name="websiteGalleryDescription" value={galleryDescription} onChange={(event) => setGalleryDescription(event.target.value)} placeholder="Descrição curta da galeria." className="input-dark h-12" /></Field>
                <Field label="Título da localização"><input name="websiteLocationTitle" value={locationTitle} onChange={(event) => setLocationTitle(event.target.value)} placeholder="Onde estamos" className="input-dark h-12" /></Field>
                <Field label="Texto da localização"><input name="websiteLocationDescription" value={locationDescription} onChange={(event) => setLocationDescription(event.target.value)} placeholder="Morada, zona ou indicação útil." className="input-dark h-12" /></Field>
                <Field label="Título final"><input name="websiteFinalCtaTitle" value={finalCtaTitle} onChange={(event) => setFinalCtaTitle(event.target.value)} placeholder={`Reserva em ${restaurant.name}`} className="input-dark h-12" /></Field>
                <Field label="Texto final"><input name="websiteFinalCtaText" value={finalCtaText} onChange={(event) => setFinalCtaText(event.target.value)} placeholder="Chamada final para reservar, visitar ou contactar." className="input-dark h-12" /></Field>
              </div>
            </EditorBlock>

            <EditorBlock number="06" title="Imagens" description="As melhores fotografias do teu espaço.">
              <Field label="Logo"><ImageUploadField value={logoImage} onChange={setLogoImage} compact /><input type="hidden" name="websiteLogoImage" value={logoImage} /></Field>
              <Field label="Foto principal"><ImageUploadField value={heroImage} onChange={setHeroImage} /><input type="hidden" name="websiteHeroImage" value={heroImage} /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <GalleryUploadField number="1" value={gallery1} onChange={setGallery1} title={galleryTitle1} onTitleChange={setGalleryTitle1} />
                <GalleryUploadField number="2" value={gallery2} onChange={setGallery2} title={galleryTitle2} onTitleChange={setGalleryTitle2} />
                <GalleryUploadField number="3" value={gallery3} onChange={setGallery3} title={galleryTitle3} onTitleChange={setGalleryTitle3} />
                <GalleryUploadField number="4" value={gallery4} onChange={setGallery4} title={galleryTitle4} onTitleChange={setGalleryTitle4} />
              </div>
            </EditorBlock>

            <EditorBlock number="07" title="Menus" description="Adiciona um ou vários menus em PDF, com o nome que quiseres.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título da secção">
                  <input
                    name="websiteMenuTitle"
                    value={menuTitle}
                    onChange={(event) => setMenuTitle(event.target.value)}
                    placeholder="Menu"
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Descrição da secção">
                  <input
                    name="websiteMenuDescription"
                    value={menuDescription}
                    onChange={(event) => setMenuDescription(event.target.value)}
                    placeholder="Consulta os nossos menus."
                    className="input-dark h-12"
                  />
                </Field>
              </div>

              <div className="space-y-4">
                {menuItems.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-sm text-white/45">
                    Ainda não adicionaste nenhum menu.
                  </div>
                )}

                {menuItems.map((item, index) => (
                  <div
                    key={`${item.id || "new"}-${index}`}
                    className="rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-white">
                        Menu {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeMenuItem(index)}
                        className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-black text-red-200 hover:bg-red-400/15"
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
                          className="input-dark h-12"
                        />
                      </Field>

                      <input
                        type="hidden"
                        name="websiteMenuItemPdf[]"
                        value={item.pdf}
                      />

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
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15"
                >
                  + Adicionar menu
                </button>
              </div>
            </EditorBlock>

            <EditorBlock number="08" title="Estilo" description="Ajusta a identidade visual do site.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram"><input name="websiteInstagram" value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="@restaurante" className="input-dark h-12" /></Field>
                <Field label="Cor principal"><input type="color" name="websitePrimaryColor" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 p-2" /></Field>
              </div>
            </EditorBlock>

            <EditorBlock number="09" title="Contactos" description="Edita os contactos que aparecem no website público.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email">
                  <input
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="info@restaurante.pt"
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Telefone">
                  <input
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+351 912 345 678"
                    className="input-dark h-12"
                  />
                </Field>
              </div>

              <Field label="Morada">
                <input
                  name="address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Rua, número, cidade"
                  className="input-dark h-12"
                />
              </Field>
            </EditorBlock>

            <EditorBlock
  number="10"
  title="SEO e domínio"
  description="Melhora a presença no Google e prepara o website para crescer."
>
  <Field label="Título SEO">
    <input
      name="websiteSeoTitle"
      value={seoTitle}
      onChange={(event) => setSeoTitle(event.target.value)}
      placeholder={`${restaurant.name} | Reservas online`}
      className="input-dark h-12"
    />
  </Field>

  <Field label="Descrição SEO">
    <textarea
      name="websiteSeoDescription"
      value={seoDescription}
      onChange={(event) => setSeoDescription(event.target.value)}
      rows={3}
      placeholder="Descrição para Google e partilhas."
      className="input-dark min-h-24 py-3"
    />
  </Field>

  <Field label="Domínio próprio">
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-white">
            Domínio próprio
          </p>

          <p className="mt-1 text-sm leading-6 text-white/45">
            Em breve poderás utilizar um domínio próprio em vez de um subdomínio MesaLink.
          </p>
        </div>

        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
          Coming Soon
        </span>
      </div>
    </div>

    <input
      type="hidden"
      name="customDomain"
      value={customDomain}
    />
  </Field>
</EditorBlock>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <LivePreview restaurantName={restaurant.name} logoImage={logoImage} headline={headline} description={description} cuisine={cuisine} heroImage={heroImage} gallery={gallery} galleryTitles={galleryTitles} primaryColor={primaryColor} template={template} theme={previewTheme} menuTitle={menuTitle} menuItems={menuItems} />
            <QualityCard score={score} enabled={enabled} galleryCount={galleryCount} hasMenu={menuCount > 0} />
            <button type="submit" className="hidden h-14 w-full rounded-full bg-white text-sm font-black text-black hover:bg-white/90 lg:block">Guardar alterações</button>
          </aside>
        </form>
      </div>
    </main>
  );
}

function LivePreview({ restaurantName, logoImage, headline, description, cuisine, heroImage, gallery, galleryTitles, primaryColor, template, theme, menuTitle, menuItems }: { restaurantName: string; logoImage: string; headline: string; description: string; cuisine: string; heroImage: string; gallery: string[]; galleryTitles: string[]; primaryColor: string; template: string; theme: ReturnType<typeof getPreviewTheme>; menuTitle: string; menuItems: WebsiteMenuItem[]; }) {
  const validGallery = gallery.filter((item) => item.startsWith("http"));
  const validMenus = menuItems.filter((item) => item.pdf.startsWith("http"));

  return (
    <div className={`overflow-hidden rounded-[2rem] border shadow-2xl ${theme.shell}`}>
      <div className={`relative min-h-[340px] ${theme.hero}`}>
        {heroImage.startsWith("http") && <img src={heroImage} alt={headline || restaurantName} className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[1px]" />}
        <div className={theme.overlay} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            {logoImage.startsWith("http") && <img src={logoImage} alt="Logo" className="h-14 max-w-[190px] object-contain" />}
            {!logoImage.startsWith("http") && <p className="text-sm font-black">{restaurantName}</p>}
          </div>
          <span className="rounded-full px-3 py-1.5 text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>Reservar</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className={theme.eyebrow}>{cuisine || "Restaurante"}</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.9] tracking-[-0.06em]">{headline || restaurantName}</h2>
          <p className={theme.text}>{description || "Reserva a tua mesa online em poucos segundos."}</p>
        </div>
      </div>
      <div className={theme.body}>
        <div className="grid grid-cols-3 gap-2">
          <PreviewPill label="Template" value={template} />
          <PreviewPill label="Menus" value={validMenus.length ? String(validMenus.length) : "—"} />
          <PreviewPill label="Fotos" value={String(validGallery.length + (heroImage ? 1 : 0))} />
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[heroImage, ...gallery].slice(0, 4).map((image, index) => <div key={index} className="relative h-20 overflow-hidden rounded-2xl bg-black/20">{image?.startsWith("http") ? (
                <>
                  <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  {index > 0 && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/0 px-2 py-1 text-[10px] font-black text-white">
                      {galleryTitles[index - 1] || `Foto ${index}`}
                    </div>
                  )}
                </>
              ) : <div className="flex h-full items-center justify-center text-xs opacity-40">Foto</div>}</div>)}
        </div>
        <div className="mt-4 rounded-2xl border border-current/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-40">Menu</p>
          <p className="mt-2 text-lg font-black">{menuTitle || "Menus"}</p>
          <p className="mt-1 text-sm opacity-55">{validMenus.length ? `${validMenus.length} menu(s) carregado(s).` : "Adiciona um ou mais menus em PDF."}</p>
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
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <Field label={`Nome da foto ${number}`}>
        <input
          name={`websiteGalleryTitle${number}`}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={number === "1" ? "Ambiente" : `Foto ${number}`}
          className="input-dark h-11"
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
  return <div className="rounded-2xl border border-current/10 p-3"><p className="text-[10px] font-black uppercase tracking-widest opacity-35">{label}</p><p className="mt-1 truncate text-xs font-black">{value}</p></div>;
}

function QualityCard({ score, enabled, galleryCount, hasMenu }: { score: number; enabled: boolean; galleryCount: number; hasMenu: boolean }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-white/30">Qualidade</p><p className="mt-2 text-3xl font-black">{score}%</p></div><div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black">{enabled ? "ON" : "OFF"}</div></div>
      <div className="mt-5 space-y-2 text-sm text-white/50"><p>Galeria: <span className="font-bold text-white">{galleryCount}/4</span></p><p>Menu: <span className="font-bold text-white">{hasMenu ? "Sim" : "Não"}</span></p></div>
    </div>
  );
}

function EditorBlock({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-6"><div className="mb-6 flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black text-white/60">{number}</div><div><h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">{description}</p></div></div><div className="space-y-5">{children}</div></section>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><span className="text-sm font-black text-white/80">{label}</span>{hint && <span className="text-xs text-white/35">{hint}</span>}</div>{children}</label>;
}

function cleanHeadline(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .slice(0, 90);
}

function polishText(value: string, restaurantName: string) {
  const clean = value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1");

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
  const base = clean || `Reserva online no ${restaurantName}. Consulta menu, localização e contactos.`;
  return base.length > 155 ? base.slice(0, 152).trimEnd() + "..." : base;
}

function extractCuisine(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("portugu")) return "Portuguesa tradicional";
  if (lower.includes("japon")) return "Japonesa";
  if (lower.includes("corean")) return "Coreana";
  if (lower.includes("italian")) return "Italiana";
  if (lower.includes("brunch")) return "Brunch";
  return "";
}

function extractLocation(address: string | null, brief: string) {
  const source = `${address || ""} ${brief}`.toLowerCase();
  if (source.includes("lisboa") || source.includes("lisbon")) return "Lisboa";
  if (source.includes("porto")) return "Porto";
  if (source.includes("algarve")) return "Algarve";
  if (source.includes("cais do sodré")) return "Cais do Sodré";
  if (source.includes("baixa")) return "Baixa";
  return "";
}

function getPreviewTheme(template: string, primaryColor: string) {
  if (template === "MINIMAL") return { shell: "border-zinc-200 bg-white text-zinc-950", hero: "bg-zinc-100", overlay: "absolute inset-0 bg-gradient-to-b from-transparent to-white/95", body: "bg-white p-5 text-zinc-950", eyebrow: "text-xs font-black uppercase tracking-[0.3em] text-zinc-400", text: "mt-3 text-sm leading-6 text-zinc-500", accent: primaryColor };
  if (template === "LUXURY") return { shell: "border-[#d4af37]/20 bg-black text-[#f5ead7]", hero: "bg-black", overlay: "absolute inset-0 bg-gradient-to-b from-black/40 to-black", body: "bg-black p-5 text-[#f5ead7]", eyebrow: "text-xs font-black uppercase tracking-[0.3em] text-[#d4af37]/70", text: "mt-3 text-sm leading-6 text-[#f5ead7]/55", accent: "#d4af37" };
  if (template === "SOCIAL") return { shell: "border-pink-300/20 bg-[#0f0715] text-white", hero: "bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),transparent_50%),#0f0715]", overlay: "absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[#0f0715]", body: "bg-[#0f0715] p-5 text-white", eyebrow: "text-xs font-black uppercase tracking-[0.3em] text-pink-300/70", text: "mt-3 text-sm leading-6 text-white/55", accent: "#ec4899" };
  return { shell: "border-white/10 bg-[#120b07] text-white", hero: "bg-[#120b07]", overlay: "absolute inset-0 bg-gradient-to-b from-black/20 to-[#120b07]", body: "bg-[#120b07] p-5 text-white", eyebrow: "text-xs font-black uppercase tracking-[0.3em] text-amber-200/70", text: "mt-3 text-sm leading-6 text-white/60", accent: primaryColor };
}
