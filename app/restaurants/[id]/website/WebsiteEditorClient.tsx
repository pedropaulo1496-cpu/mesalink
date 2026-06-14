"use client";

import { ImageUploadField } from "@/components/ImageUploadField";
import { useMemo, useState } from "react";

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
  websiteGalleryImage1: string | null;
  websiteGalleryImage2: string | null;
  websiteGalleryImage3: string | null;
  websiteGalleryImage4: string | null;
    websiteGalleryImage5: string | null;
  websiteGalleryImage6: string | null;

  websiteLogoImage: string | null;

  websiteMenuTitle: string | null;
  websiteMenuDescription: string | null;

  websiteDish1Name: string | null;
  websiteDish1Description: string | null;
  websiteDish1Price: string | null;
  websiteDish1Image: string | null;

  websiteDish2Name: string | null;
  websiteDish2Description: string | null;
  websiteDish2Price: string | null;
  websiteDish2Image: string | null;

  websiteDish3Name: string | null;
  websiteDish3Description: string | null;
  websiteDish3Price: string | null;
  websiteDish3Image: string | null;

  websiteDish4Name: string | null;
  websiteDish4Description: string | null;
  websiteDish4Price: string | null;
  websiteDish4Image: string | null;

  websiteDish5Name: string | null;
  websiteDish5Description: string | null;
  websiteDish5Price: string | null;
  websiteDish5Image: string | null;

  websiteDish6Name: string | null;
  websiteDish6Description: string | null;
  websiteDish6Price: string | null;
  websiteDish6Image: string | null;

  websiteSeoTitle: string | null;
  websiteSeoDescription: string | null;
  customDomain: string | null;
  websiteAboutTitle: string | null;
  websiteAboutText: string | null;
  websiteFeatureTitle: string | null;
  websiteFeatureText: string | null;
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
  const [description, setDescription] = useState(
    restaurant.websiteDescription || ""
  );
  const [cuisine, setCuisine] = useState(restaurant.websiteCuisine || "");
  const [instagram, setInstagram] = useState(restaurant.websiteInstagram || "");
  const [heroImage, setHeroImage] = useState(restaurant.websiteHeroImage || "");
  const [gallery1, setGallery1] = useState(restaurant.websiteGalleryImage1 || "");
  const [gallery2, setGallery2] = useState(restaurant.websiteGalleryImage2 || "");
  const [gallery3, setGallery3] = useState(restaurant.websiteGalleryImage3 || "");
  const [gallery4, setGallery4] = useState(restaurant.websiteGalleryImage4 || "");
    const [gallery5, setGallery5] = useState(restaurant.websiteGalleryImage5 || "");
  const [gallery6, setGallery6] = useState(restaurant.websiteGalleryImage6 || "");
  const [logoImage, setLogoImage] = useState(restaurant.websiteLogoImage || "");

  const [menuTitle, setMenuTitle] = useState(restaurant.websiteMenuTitle || "");
  const [menuDescription, setMenuDescription] = useState(
    restaurant.websiteMenuDescription || ""
  );

  const [dish1Name, setDish1Name] = useState(restaurant.websiteDish1Name || "");
  const [dish1Description, setDish1Description] = useState(
    restaurant.websiteDish1Description || ""
  );
  const [dish1Price, setDish1Price] = useState(restaurant.websiteDish1Price || "");
  const [dish1Image, setDish1Image] = useState(restaurant.websiteDish1Image || "");

  const [dish2Name, setDish2Name] = useState(restaurant.websiteDish2Name || "");
  const [dish2Description, setDish2Description] = useState(
    restaurant.websiteDish2Description || ""
  );
  const [dish2Price, setDish2Price] = useState(restaurant.websiteDish2Price || "");
  const [dish2Image, setDish2Image] = useState(restaurant.websiteDish2Image || "");

  const [dish3Name, setDish3Name] = useState(restaurant.websiteDish3Name || "");
  const [dish3Description, setDish3Description] = useState(
    restaurant.websiteDish3Description || ""
  );
  const [dish3Price, setDish3Price] = useState(restaurant.websiteDish3Price || "");
  const [dish3Image, setDish3Image] = useState(restaurant.websiteDish3Image || "");

  const [dish4Name, setDish4Name] = useState(restaurant.websiteDish4Name || "");
  const [dish4Description, setDish4Description] = useState(
    restaurant.websiteDish4Description || ""
  );
  const [dish4Price, setDish4Price] = useState(restaurant.websiteDish4Price || "");
  const [dish4Image, setDish4Image] = useState(restaurant.websiteDish4Image || "");

  const [dish5Name, setDish5Name] = useState(restaurant.websiteDish5Name || "");
  const [dish5Description, setDish5Description] = useState(
    restaurant.websiteDish5Description || ""
  );
  const [dish5Price, setDish5Price] = useState(restaurant.websiteDish5Price || "");
  const [dish5Image, setDish5Image] = useState(restaurant.websiteDish5Image || "");

  const [dish6Name, setDish6Name] = useState(restaurant.websiteDish6Name || "");
  const [dish6Description, setDish6Description] = useState(
    restaurant.websiteDish6Description || ""
  );
  const [dish6Price, setDish6Price] = useState(restaurant.websiteDish6Price || "");
  const [dish6Image, setDish6Image] = useState(restaurant.websiteDish6Image || "");

  const [seoTitle, setSeoTitle] = useState(restaurant.websiteSeoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    restaurant.websiteSeoDescription || ""
  );
  const [customDomain, setCustomDomain] = useState(
    restaurant.customDomain || ""
  );
  const [aboutTitle, setAboutTitle] = useState(
    restaurant.websiteAboutTitle || ""
  );
  const [aboutText, setAboutText] = useState(restaurant.websiteAboutText || "");
  const [featureTitle, setFeatureTitle] = useState(
    restaurant.websiteFeatureTitle || ""
  );
  const [featureText, setFeatureText] = useState(
    restaurant.websiteFeatureText || ""
  );
  const [primaryColor, setPrimaryColor] = useState(
    restaurant.websitePrimaryColor || "#111827"
  );

  const publicUrl = `/s/${slug || restaurant.slug}`;
  const fullPublicUrl = `${slug || restaurant.slug}.mesalink.pt`;

  const score = useMemo(() => {
    const items = [
      enabled,
      headline,
      description,
      cuisine,
      heroImage,
      aboutText,
      restaurant.phone || restaurant.email,
    ];

    return Math.round((items.filter(Boolean).length / items.length) * 100);
  }, [
    enabled,
    headline,
    description,
    cuisine,
    heroImage,
    aboutText,
    restaurant.phone,
    restaurant.email,
  ]);

  const previewTheme = getPreviewTheme(template, primaryColor);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-40 -mx-4 border-b border-white/10 bg-[#050505]/85 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <a
                href={`/restaurants/${restaurant.id}`}
                className="text-sm font-bold text-white/45 hover:text-white"
              >
                ← Voltar ao dashboard
              </a>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.05em]">
                  Website Builder
                </h1>

                <span
                  className={
                    enabled
                      ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200"
                      : "rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-black text-orange-200"
                  }
                >
                  {enabled ? "Online" : "Offline"}
                </span>

                {saved && (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                    Guardado
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-white/45">
                Cria um site premium com preview ao vivo.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 text-sm font-black text-white hover:bg-white/15"
              >
                Ver site
              </a>

              <button
                form="website-editor-form"
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-black hover:bg-white/90"
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
          className="grid gap-6 py-8 lg:grid-cols-[1fr_440px]"
        >
          <section className="space-y-6">
            <EditorBlock
              number="01"
              title="Publicação"
              description="Controla se o site está online e qual é o link público."
            >
              <label className="flex cursor-pointer items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <input
                  type="checkbox"
                  name="websiteEnabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded"
                />

                <div>
                  <p className="font-black">Ativar website público</p>
                  <p className="mt-1 text-sm leading-6 text-white/45">
                    Quando ativo, o restaurante fica disponível em{" "}
                    <span className="font-bold text-white">{fullPublicUrl}</span>.
                  </p>
                </div>
              </label>

              <Field label="Link público">
  <div className="grid gap-3 md:grid-cols-[1fr_150px]">
    <input
      name="slug"
      value={slug}
      onChange={(e) => setSlug(e.target.value)}
      className="input-dark h-12"
      required
    />
    <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-bold text-white/35">
      .mesalink.pt
    </div>
  </div>
</Field>

              <Field label="Template">
                <select
                  name="websiteTemplate"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="input-dark h-12"
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
              title="Primeira impressão"
              description="O que o cliente vê nos primeiros 3 segundos."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Headline">
                  <input
                    name="websiteHeadline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder={restaurant.name}
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Tipo de cozinha">
                  <input
                    name="websiteCuisine"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="Portuguesa, Japonesa, Brunch..."
                    className="input-dark h-12"
                  />
                </Field>
              </div>

              <Field label="Descrição curta">
                <textarea
                  name="websiteDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Um espaço acolhedor para comer bem, ficar mais um pouco e voltar."
                  className="input-dark min-h-32 py-3"
                />
              </Field>
            </EditorBlock>

            <EditorBlock
              number="03"
              title="História"
              description="Aqui começa a alma do restaurante."
            >
              <Field label="Título da secção sobre">
                <input
                  name="websiteAboutTitle"
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  placeholder="A nossa casa"
                  className="input-dark h-12"
                />
              </Field>

              <Field label="Texto sobre o restaurante">
                <textarea
                  name="websiteAboutText"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  rows={5}
                  placeholder="Conta a história, o conceito e o ambiente."
                  className="input-dark min-h-36 py-3"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Destaque">
                  <input
                    name="websiteFeatureTitle"
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    placeholder="Pratos para partilhar"
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Texto do destaque">
                  <input
                    name="websiteFeatureText"
                    value={featureText}
                    onChange={(e) => setFeatureText(e.target.value)}
                    placeholder="Uma experiência pensada para reunir pessoas."
                    className="input-dark h-12"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock
              number="04"
              title="Imagens"
              description="Por agora usa URLs. A seguir fazemos upload real."
            >

                <Field label="Logo">
  <input
    name="websiteLogoImage"
    value={logoImage}
    onChange={(e) => setLogoImage(e.target.value)}
    placeholder="https://..."
    className="input-dark h-12"
  />
</Field>

              <Field label="Foto principal">
  <ImageUploadField value={heroImage} onChange={setHeroImage} />

  <input type="hidden" name="websiteHeroImage" value={heroImage} />
</Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Galeria 1">
                  <input
                    name="websiteGalleryImage1"
                    value={gallery1}
                    onChange={(e) => setGallery1(e.target.value)}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 2">
                  <input
                    name="websiteGalleryImage2"
                    value={gallery2}
                    onChange={(e) => setGallery2(e.target.value)}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 3">
                  <input
                    name="websiteGalleryImage3"
                    value={gallery3}
                    onChange={(e) => setGallery3(e.target.value)}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 4">
                  <input
                    name="websiteGalleryImage4"
                    value={gallery4}
                    onChange={(e) => setGallery4(e.target.value)}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 5">
  <input
    name="websiteGalleryImage5"
    value={gallery5}
    onChange={(e) => setGallery5(e.target.value)}
    placeholder="https://..."
    className="input-dark h-12"
  />
</Field>

<Field label="Galeria 6">
  <input
    name="websiteGalleryImage6"
    value={gallery6}
    onChange={(e) => setGallery6(e.target.value)}
    placeholder="https://..."
    className="input-dark h-12"
  />
</Field>

              </div>
            </EditorBlock>

            <EditorBlock
  number="05"
  title="Menu"
  description="Mostra pratos em destaque. Isto é essencial para um site de restaurante."
>
  <div className="grid gap-4 md:grid-cols-2">
    <Field label="Título do menu">
      <input
        name="websiteMenuTitle"
        value={menuTitle}
        onChange={(e) => setMenuTitle(e.target.value)}
        placeholder="Pratos em destaque"
        className="input-dark h-12"
      />
    </Field>

    <Field label="Descrição do menu">
      <input
        name="websiteMenuDescription"
        value={menuDescription}
        onChange={(e) => setMenuDescription(e.target.value)}
        placeholder="Uma seleção pensada para abrir o apetite."
        className="input-dark h-12"
      />
    </Field>
  </div>

  <DishFields
    number="1"
    name={dish1Name}
    setName={setDish1Name}
    description={dish1Description}
    setDescription={setDish1Description}
    price={dish1Price}
    setPrice={setDish1Price}
    image={dish1Image}
    setImage={setDish1Image}
  />

  <DishFields
    number="2"
    name={dish2Name}
    setName={setDish2Name}
    description={dish2Description}
    setDescription={setDish2Description}
    price={dish2Price}
    setPrice={setDish2Price}
    image={dish2Image}
    setImage={setDish2Image}
  />

  <DishFields
    number="3"
    name={dish3Name}
    setName={setDish3Name}
    description={dish3Description}
    setDescription={setDish3Description}
    price={dish3Price}
    setPrice={setDish3Price}
    image={dish3Image}
    setImage={setDish3Image}
  />

  <DishFields
    number="4"
    name={dish4Name}
    setName={setDish4Name}
    description={dish4Description}
    setDescription={setDish4Description}
    price={dish4Price}
    setPrice={setDish4Price}
    image={dish4Image}
    setImage={setDish4Image}
  />

  <DishFields
    number="5"
    name={dish5Name}
    setName={setDish5Name}
    description={dish5Description}
    setDescription={setDish5Description}
    price={dish5Price}
    setPrice={setDish5Price}
    image={dish5Image}
    setImage={setDish5Image}
  />

  <DishFields
    number="6"
    name={dish6Name}
    setName={setDish6Name}
    description={dish6Description}
    setDescription={setDish6Description}
    price={dish6Price}
    setPrice={setDish6Price}
    image={dish6Image}
    setImage={setDish6Image}
  />
</EditorBlock>

<EditorBlock
  number="07"
  title="SEO e domínio"
  description="Preparado para crescer: Google, domínio próprio e presença profissional."
>
  <Field label="Título SEO">
    <input
      name="websiteSeoTitle"
      value={seoTitle}
      onChange={(e) => setSeoTitle(e.target.value)}
      placeholder={`${restaurant.name} | Reservas online`}
      className="input-dark h-12"
    />
  </Field>

  <Field label="Descrição SEO">
    <textarea
      name="websiteSeoDescription"
      value={seoDescription}
      onChange={(e) => setSeoDescription(e.target.value)}
      rows={3}
      placeholder="Descrição para Google e partilhas."
      className="input-dark min-h-24 py-3"
    />
  </Field>

  <Field label="Domínio próprio">
    <input
      name="customDomain"
      value={customDomain}
      onChange={(e) => setCustomDomain(e.target.value)}
      placeholder="tabernatuga.pt"
      className="input-dark h-12"
    />
  </Field>
</EditorBlock>

            <EditorBlock
              number="06"
              title="Estilo"
              description="A cor já muda o preview todo e prepara o tema."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram">
                  <input
                    name="websiteInstagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@restaurante"
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Cor principal">
                  <input
                    type="color"
                    name="websitePrimaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 p-2"
                  />
                </Field>
              </div>
            </EditorBlock>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <LivePreview
  restaurantName={restaurant.name}
  headline={headline}
  description={description}
  cuisine={cuisine}
  heroImage={heroImage}
  gallery={[gallery1, gallery2, gallery3, gallery4, gallery5, gallery6]}
  primaryColor={primaryColor}
  template={template}
  theme={previewTheme}
  menuTitle={menuTitle}
  dishes={[
    dish1Name,
    dish2Name,
    dish3Name,
    dish4Name,
    dish5Name,
    dish6Name,
  ]}
/>

            <QualityCard score={score} enabled={enabled} />

            <button
              type="submit"
              className="hidden h-14 w-full rounded-full bg-white text-sm font-black text-black hover:bg-white/90 lg:block"
            >
              Guardar alterações
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}

function LivePreview({
  restaurantName,
  headline,
  description,
  cuisine,
  heroImage,
  gallery,
  primaryColor,
  template,
  theme,
  menuTitle,
  dishes,
}: {
  restaurantName: string;
  headline: string;
  description: string;
  cuisine: string;
  heroImage: string;
  gallery: string[];
  primaryColor: string;
  template: string;
  theme: ReturnType<typeof getPreviewTheme>;
  menuTitle: string;
  dishes: string[];
}) {
  const validGallery = gallery.filter((item) => item.startsWith("http"));

  return (
    <div className={`overflow-hidden rounded-[2rem] border shadow-2xl ${theme.shell}`}>
      <div className={`relative min-h-[340px] ${theme.hero}`}>
        {heroImage.startsWith("http") && (
          <img
            src={heroImage}
            alt={headline || restaurantName}
            className="absolute inset-0 h-full w-full object-cover opacity-65"
          />
        )}

        <div className={theme.overlay} />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          <p className="text-sm font-black">{restaurantName}</p>
          <span
            className="rounded-full px-3 py-1.5 text-xs font-black text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reservar
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className={theme.eyebrow}>{cuisine || "Restaurante"}</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.9] tracking-[-0.06em]">
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
          <PreviewPill label="Reserva" value="Online" />
          <PreviewPill label="Fotos" value={String(validGallery.length + (heroImage ? 1 : 0))} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[heroImage, ...gallery].slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="relative h-20 overflow-hidden rounded-2xl bg-black/20"
            >
              {image?.startsWith("http") ? (
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs opacity-40">
                  Foto
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-current/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.25em] opacity-40">
            Secção
          </p>
          <p className="mt-2 text-lg font-black">A nossa casa</p>
          <p className="mt-1 text-sm opacity-55">
            Design, história, galeria, horário e reserva num só site.
          </p>
        </div>
        <div className="mt-4 rounded-2xl border border-current/10 p-4">
  <p className="text-xs font-black uppercase tracking-[0.25em] opacity-40">
    Menu
  </p>

  <p className="mt-2 text-lg font-black">
    {menuTitle || "Pratos em destaque"}
  </p>

  <div className="mt-3 grid gap-2">
    {dishes
      .filter(Boolean)
      .slice(0, 3)
      .map((dish, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-current/10 px-3 py-2 text-sm"
        >
          <span className="font-bold">{dish}</span>
          <span className="opacity-40">Prato</span>
        </div>
      ))}
  </div>
</div>
      </div>
    </div>
  );
}

function PreviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-current/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest opacity-35">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-black">{value}</p>
    </div>
  );
}

function QualityCard({
  score,
  enabled,
}: {
  score: number;
  enabled: boolean;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-white/30">
            Qualidade
          </p>
          <p className="mt-2 text-3xl font-black">{score}%</p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black">
          {enabled ? "ON" : "OFF"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/45">
        Quanto mais completo estiver, maior a probabilidade de transformar
        visitas em reservas.
      </p>
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
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="mb-6 flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black text-white/60">
          {number}
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-[-0.04em]">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5">{children}</div>
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
    <label className="block">
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <span className="text-sm font-black text-white/80">{label}</span>
        {hint && <span className="text-xs text-white/35">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

function DishFields({
  number,
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  image,
  setImage,
}: {
  number: string;
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  price: string;
  setPrice: (value: string) => void;
  image: string;
  setImage: (value: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
      <p className="mb-4 text-sm font-black text-white/60">
        Prato {number}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome">
          <input
            name={`websiteDish${number}Name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bacalhau à Brás"
            className="input-dark h-12"
          />
        </Field>

        <Field label="Preço">
          <input
            name={`websiteDish${number}Price`}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="14€"
            className="input-dark h-12"
          />
        </Field>

        <Field label="Descrição">
          <input
            name={`websiteDish${number}Description`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição curta do prato."
            className="input-dark h-12"
          />
        </Field>

        <Field label="Imagem">
          <input
            name={`websiteDish${number}Image`}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="input-dark h-12"
          />
        </Field>
      </div>
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
      eyebrow:
        "text-xs font-black uppercase tracking-[0.3em] text-zinc-400",
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
      eyebrow:
        "text-xs font-black uppercase tracking-[0.3em] text-[#d4af37]/70",
      text: "mt-3 text-sm leading-6 text-[#f5ead7]/55",
      accent: "#d4af37",
    };
  }

  if (template === "SOCIAL") {
    return {
      shell: "border-pink-300/20 bg-[#0f0715] text-white",
      hero: "bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.35),transparent_50%),#0f0715]",
      overlay:
        "absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-[#0f0715]",
      body: "bg-[#0f0715] p-5 text-white",
      eyebrow:
        "text-xs font-black uppercase tracking-[0.3em] text-pink-300/70",
      text: "mt-3 text-sm leading-6 text-white/55",
      accent: "#ec4899",
    };
  }

  return {
    shell: "border-white/10 bg-[#120b07] text-white",
    hero: "bg-[#120b07]",
    overlay: "absolute inset-0 bg-gradient-to-b from-black/20 to-[#120b07]",
    body: "bg-[#120b07] p-5 text-white",
    eyebrow:
      "text-xs font-black uppercase tracking-[0.3em] text-amber-200/70",
    text: "mt-3 text-sm leading-6 text-white/60",
    accent: primaryColor,
  };
}