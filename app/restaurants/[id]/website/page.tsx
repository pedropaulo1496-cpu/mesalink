import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    success?: string;
  }>;
};

export default async function RestaurantWebsitePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const saved = query?.success === "1";

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  if (!restaurant) notFound();

  const publicUrl = `/s/${restaurant.slug}`;
  const fullPublicUrl = `mesalink.pt/s/${restaurant.slug}`;

  const completionItems = [
    {
      label: "Mini-site ativo",
      done: restaurant.websiteEnabled,
    },
    {
      label: "Título principal",
      done: Boolean(restaurant.websiteHeadline),
    },
    {
      label: "Descrição",
      done: Boolean(restaurant.websiteDescription),
    },
    {
      label: "Foto principal",
      done: Boolean(restaurant.websiteHeroImage),
    },
    {
      label: "Contacto",
      done: Boolean(restaurant.phone || restaurant.email),
    },
  ];

  const completed = completionItems.filter((item) => item.done).length;
  const score = Math.round((completed / completionItems.length) * 100);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#050505]/85 px-4 py-4 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href={`/restaurants/${restaurant.id}`}
                className="text-sm font-bold text-white/45 hover:text-white"
              >
                ← Voltar ao dashboard
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-[-0.05em]">
                  Mini-site
                </h1>

                <span
                  className={
                    restaurant.websiteEnabled
                      ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200"
                      : "rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs font-black text-orange-200"
                  }
                >
                  {restaurant.websiteEnabled ? "Online" : "Offline"}
                </span>

                {saved && (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                    Guardado
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-white/45">
                Cria uma página pública premium para receber reservas.
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
          className="grid gap-6 py-8 lg:grid-cols-[1fr_390px]"
        >
          <section className="space-y-6">
            <EditorBlock
              number="01"
              title="Publicação"
              description="Controla se o mini-site está visível e qual é o link público."
            >
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <label className="flex cursor-pointer items-start gap-4">
                  <input
                    type="checkbox"
                    name="websiteEnabled"
                    defaultChecked={restaurant.websiteEnabled}
                    className="mt-1 h-5 w-5 rounded border-white/20 bg-black"
                  />

                  <div>
                    <p className="font-black">Ativar mini-site público</p>
                    <p className="mt-1 text-sm leading-6 text-white/45">
                      Quando ativo, qualquer pessoa pode visitar o link público
                      e fazer uma reserva online.
                    </p>
                  </div>
                </label>
              </div>

              <Field label="Link público" hint="Usa letras, números e hífens.">
                <div className="grid gap-3 md:grid-cols-[150px_1fr]">
                  <div className="flex h-12 items-center rounded-2xl border border-white/10 bg-black/35 px-4 text-sm font-bold text-white/35">
                    mesalink.pt/s/
                  </div>

                  <input
                    name="slug"
                    defaultValue={restaurant.slug}
                    placeholder="taberna-tuga"
                    className="input-dark h-12"
                    required
                  />
                </div>
              </Field>

              <Field label="Template" hint="Preparado para futuros designs.">
                <select
                  name="websiteTemplate"
                  defaultValue={restaurant.websiteTemplate || "PREMIUM"}
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
              description="Esta é a parte que aparece logo quando alguém abre o site."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome comercial / headline">
                  <input
                    name="websiteHeadline"
                    defaultValue={restaurant.websiteHeadline ?? ""}
                    placeholder={restaurant.name}
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Tipo de cozinha">
                  <input
                    name="websiteCuisine"
                    defaultValue={restaurant.websiteCuisine ?? ""}
                    placeholder="Portuguesa, Japonesa, Brunch..."
                    className="input-dark h-12"
                  />
                </Field>
              </div>

              <Field
                label="Descrição curta"
                hint="Uma frase bonita que venda o restaurante em poucos segundos."
              >
                <textarea
                  name="websiteDescription"
                  defaultValue={restaurant.websiteDescription ?? ""}
                  rows={4}
                  placeholder="Um espaço acolhedor para comer bem, ficar mais um pouco e voltar."
                  className="input-dark min-h-32 py-3"
                />
              </Field>
            </EditorBlock>

            <EditorBlock
              number="03"
              title="História e destaque"
              description="Dá alma ao site. Aqui o restaurante deixa de parecer genérico."
            >
              <Field label="Título da secção sobre">
                <input
                  name="websiteAboutTitle"
                  defaultValue={restaurant.websiteAboutTitle ?? ""}
                  placeholder="A nossa casa"
                  className="input-dark h-12"
                />
              </Field>

              <Field label="Texto sobre o restaurante">
                <textarea
                  name="websiteAboutText"
                  defaultValue={restaurant.websiteAboutText ?? ""}
                  rows={5}
                  placeholder="Conta a história, o conceito, a atmosfera e o que torna o restaurante especial."
                  className="input-dark min-h-36 py-3"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Destaque">
                  <input
                    name="websiteFeatureTitle"
                    defaultValue={restaurant.websiteFeatureTitle ?? ""}
                    placeholder="Pratos para partilhar"
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Texto do destaque">
                  <input
                    name="websiteFeatureText"
                    defaultValue={restaurant.websiteFeatureText ?? ""}
                    placeholder="Uma experiência pensada para reunir pessoas à mesa."
                    className="input-dark h-12"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock
              number="04"
              title="Imagens"
              description="Fotos fortes fazem a diferença. Começa pela imagem principal."
            >
              <Field label="Foto principal" hint="URL da imagem de capa.">
                <input
                  name="websiteHeroImage"
                  defaultValue={restaurant.websiteHeroImage ?? ""}
                  placeholder="https://..."
                  className="input-dark h-12"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Galeria 1">
                  <input
                    name="websiteGalleryImage1"
                    defaultValue={restaurant.websiteGalleryImage1 ?? ""}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 2">
                  <input
                    name="websiteGalleryImage2"
                    defaultValue={restaurant.websiteGalleryImage2 ?? ""}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 3">
                  <input
                    name="websiteGalleryImage3"
                    defaultValue={restaurant.websiteGalleryImage3 ?? ""}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Galeria 4">
                  <input
                    name="websiteGalleryImage4"
                    defaultValue={restaurant.websiteGalleryImage4 ?? ""}
                    placeholder="https://..."
                    className="input-dark h-12"
                  />
                </Field>
              </div>
            </EditorBlock>

            <EditorBlock
              number="05"
              title="Contactos e estilo"
              description="A identidade final: cor, Instagram e contactos rápidos."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Instagram">
                  <input
                    name="websiteInstagram"
                    defaultValue={restaurant.websiteInstagram ?? ""}
                    placeholder="@restaurante ou https://instagram.com/..."
                    className="input-dark h-12"
                  />
                </Field>

                <Field label="Cor principal">
                  <input
                    type="color"
                    name="websitePrimaryColor"
                    defaultValue={restaurant.websitePrimaryColor ?? "#111827"}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 p-2"
                  />
                </Field>
              </div>
            </EditorBlock>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
              <div className="relative min-h-[250px] bg-[#1d120b]">
                {restaurant.websiteHeroImage ? (
                  <img
                    src={restaurant.websiteHeroImage}
                    alt={restaurant.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.25),transparent_45%),linear-gradient(to_bottom,#2a1208,#120b07)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/80" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-200/70">
                    {restaurant.websiteCuisine || "Restaurante"}
                  </p>

                  <h2 className="mt-3 text-4xl font-black leading-[0.9] tracking-[-0.06em]">
                    {restaurant.websiteHeadline || restaurant.name}
                  </h2>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/30">
                    Link público
                  </p>
                  <p className="mt-2 truncate text-sm font-bold text-white">
                    {fullPublicUrl}
                  </p>
                </div>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 items-center justify-center rounded-full bg-white text-sm font-black text-black"
                >
                  Abrir site
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/30">
                    Qualidade
                  </p>
                  <p className="mt-2 text-3xl font-black">{score}%</p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-black">
                  {completed}/{completionItems.length}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {completionItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="font-semibold text-white/55">
                      {item.label}
                    </span>
                    <span
                      className={
                        item.done
                          ? "font-black text-emerald-300"
                          : "font-black text-white/25"
                      }
                    >
                      {item.done ? "✓" : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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