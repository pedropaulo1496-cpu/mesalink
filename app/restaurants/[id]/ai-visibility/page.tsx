import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Globe2,
  MessageSquareText,
  Radar,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import VisibilityScanButton from "@/components/ai-visibility/VisibilityScanButton";
import VisibilityOptimizeButton from "@/components/ai-visibility/VisibilityOptimizeButton";
import { authOptions } from "@/lib/auth";
import { calculateAiVisibility, type VisibilityOpportunity } from "@/lib/ai-visibility";
import { hasGrowthAccess } from "@/lib/ai-billing";
import { prisma } from "@/lib/prisma";

export default async function AiVisibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("dashboardAiVisibility");
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { subscription: true } });
  if (!user) redirect("/login");

  const [restaurant, reviewAggregate] = await Promise.all([
    prisma.restaurant.findFirst({
      where: { id, userId: user.id },
      include: {
        websiteMenus: { select: { id: true } },
        orderingCategories: {
          select: {
            products: {
              where: { active: true, activeOnWebsite: true },
              select: { description: true },
            },
          },
        },
        aiVisibilityScans: {
          where: { status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 4,
          include: { results: { orderBy: { createdAt: "asc" } } },
        },
        aiVisibilityOptimizations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.reviewFeedback.aggregate({
      where: { restaurantId: id },
      _count: { id: true },
      _avg: { rating: true },
    }),
  ]);

  if (!restaurant) notFound();

  const products = restaurant.orderingCategories.flatMap((category) => category.products);
  const report = calculateAiVisibility({
    ...restaurant,
    menuCount: restaurant.websiteMenus.length,
    productCount: products.length,
    describedProductCount: products.filter((product) => product.description?.trim()).length,
    reviewCount: reviewAggregate._count.id,
    averageRating: reviewAggregate._avg.rating ?? 0,
  });

  const actionableCount = report.opportunities.filter((item) => item.tone !== "positive").length;
  const latestScan = restaurant.aiVisibilityScans[0];
  const latestOptimization = restaurant.aiVisibilityOptimizations[0];
  const displayedOverall = latestOptimization?.afterScore ?? latestScan?.overallScore ?? report.overall;
  const cuisine = restaurant.websiteCuisine?.trim() || restaurant.name;
  const location = restaurant.address?.split(",").at(-1)?.trim() || "a sua cidade";
  const scoreMessage =
    displayedOverall >= 75 ? t("scoreHigh") : displayedOverall >= 45 ? t("scoreMedium") : t("scoreLow");

  const metrics = [
    { label: t("metrics.chatgpt"), value: latestScan?.visibilityScore ?? report.chatgpt, icon: <Bot size={18} /> },
    { label: t("metrics.search"), value: report.search, icon: <Search size={18} /> },
    { label: t("metrics.reviews"), value: report.reviews, icon: <Star size={18} /> },
    { label: t("metrics.website"), value: report.website, icon: <Globe2 size={18} /> },
    { label: t("metrics.citations"), value: report.citations, icon: <Radar size={18} /> },
  ];

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="grid min-h-screen lg:grid-cols-[286px_1fr]">
        <RestaurantSidebar id={id} restaurantName={restaurant.name} active="aiVisibility" />

        <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">
                  {t("eyebrow")}
                </p>
                <span className="rounded-full border border-[#DCC397] bg-[#FFF8EC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
                  {t("beta")}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-[#6B6258]">Vê se o restaurante é encontrado por pesquisas com IA e corrige o que falta.</p>
            </div>

            <VisibilityScanButton restaurantId={id} credits={user.subscription?.aiCredits || 0} canScan={hasGrowthAccess(user.subscription)} label={`${latestScan ? t("rescan") : t("liveScan.run")} · 10 créditos`} />
          </header>

          <section className="mt-5 overflow-hidden rounded-[26px] border border-[#2C2117] bg-[#17120D] text-white shadow-[0_20px_55px_rgba(44,31,18,0.16)]">
            <div className="grid xl:grid-cols-[260px_1fr]">
              <div className="flex flex-col items-center justify-center border-b border-white/10 p-5 text-center xl:border-b-0 xl:border-r">
                <div
                  className="grid h-32 w-32 place-items-center rounded-full p-[8px]"
                  style={{ background: `conic-gradient(#D7B267 ${displayedOverall}%, rgba(255,255,255,.1) 0)` }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[#17120D]">
                    <div>
                      <p className="text-4xl font-semibold tracking-[-0.065em]">{displayedOverall}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                        {t("scoreOutOf")}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#D7B267]">{t("scoreLabel")}</p>
                <p className="mt-2 text-sm text-[#EADBC5]">{scoreMessage}</p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/45">
                  <Sparkles size={14} className="text-[#D7B267]" />
                  {latestScan ? t("liveScan.measuredAt", { date: new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(latestScan.completedAt || latestScan.createdAt) }) : t("lastAnalysis")}
                </div>
                <div className="mt-4 grid gap-x-6 gap-y-4 md:grid-cols-2">
                  {metrics.map((metric) => (
                    <ScoreMetric key={metric.label} {...metric} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <details className="group mt-5 rounded-[24px] border border-[#E1D0B8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold"><span>Resultados dos testes reais</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Ver detalhes ↓</span><span className="hidden text-xs text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
            <div className="border-t border-[#E8DCCB] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("liveScan.eyebrow")}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">{t("liveScan.title")}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">{t("liveScan.description")}</p></div>
              {latestScan && <div className="grid grid-cols-2 gap-2 sm:flex"><LiveMetric label={t("liveScan.mentionRate")} value={`${latestScan.mentionRate || 0}%`} /><LiveMetric label={t("liveScan.sources")} value={String(latestScan.sourceCount || 0)} /></div>}
            </div>
            {latestScan ? <div className="mt-6 grid gap-3 xl:grid-cols-3">
              {latestScan.results.map((result) => <article key={result.id} className="rounded-[26px] border border-[#E8DCCB] bg-[#FFFDFC] p-5">
                <div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${result.mentioned ? "bg-[#ECF7EC] text-[#3F6A4D]" : "bg-[#FCEBE8] text-[#9C332D]"}`}>{result.mentioned ? t("liveScan.mentioned") : t("liveScan.notMentioned")}</span>{result.position && <span className="text-xs font-black text-[#795D38]">#{result.position}</span>}</div>
                <p className="mt-4 text-sm font-semibold leading-6">“{result.prompt}”</p>
                {result.answerSummary && <p className="mt-3 text-xs leading-5 text-[#6B6258]">{result.answerSummary}</p>}
                {result.competitors.length > 0 && <p className="mt-4 text-xs text-[#75695C]"><strong>{t("liveScan.competitors")}:</strong> {result.competitors.join(", ")}</p>}
                {result.sourceUrls.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{result.sourceUrls.slice(0, 3).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-full border border-[#DCCCAD] bg-white px-3 py-1.5 text-[10px] font-bold text-[#795D38]">{safeHost(url)}</a>)}</div>}
              </article>)}
            </div> : <div className="mt-6 rounded-[26px] border border-dashed border-[#D6C3A5] bg-[#FFF9F0] p-8 text-center"><Radar className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">{t("liveScan.emptyTitle")}</p><p className="mt-2 text-sm text-[#6B6258]">{t("liveScan.emptyText")}</p></div>}
            </div>
          </details>

          <section className="mt-5 rounded-[26px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_50px_rgba(80,55,30,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("opportunitiesEyebrow")}</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.045em]">{t("opportunitiesTitle", { count: actionableCount })}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">{t("opportunitiesSubtitle")}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-2">
              {report.opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.key} item={opportunity} restaurantId={id} t={t} />
              ))}
            </div>
          </section>

          <details className="group mt-5 rounded-[24px] border border-[#E1D0B8] bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold"><span>Pesquisas alvo e otimização automática</span><span className="text-xs text-[#9B6F3B] group-open:hidden">Abrir ↓</span><span className="hidden text-xs text-[#9B6F3B] group-open:block">Fechar ↑</span></summary>
            <div className="grid gap-5 border-t border-[#E8DCCB] p-5 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="overflow-hidden rounded-[34px] border border-[#E1D0B8] bg-[#FFF9F0] p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("queriesEyebrow")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">{t("queriesTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B6258]">{t("queriesSubtitle")}</p>
              <div className="mt-6 space-y-3">
                <Query text={t("query1", { cuisine, location })} />
                <Query text={t("query2", { cuisine })} />
                <Query text={t("query3", { restaurant: restaurant.name })} />
              </div>
            </div>

            <div className="rounded-[34px] border border-[#2C2117] bg-[#17120D] p-6 text-white sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">{t("howItWorksEyebrow")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">{t("howItWorksTitle")}</h2>
              <p className="mt-4 text-sm leading-6 text-[#D5C6B4]">{t("howItWorksText")}</p>
              <div className="mt-6 rounded-[25px] border border-[#D7B267]/25 bg-[#D7B267]/10 p-5">
                <div className="flex items-center gap-2 text-sm font-black text-[#E7C98D]">
                  <Sparkles size={17} /> {t("growthEngine.title")}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#EADBC5]">{t("growthEngine.text")}</p>
                <VisibilityOptimizeButton
                  restaurantId={id}
                  canOptimize={hasGrowthAccess(user.subscription)}
                  lastOptimization={latestOptimization ? {
                    status: latestOptimization.status,
                    beforeScore: latestOptimization.beforeScore,
                    afterScore: latestOptimization.afterScore,
                    fieldsFilled: latestOptimization.fieldsFilled,
                    dishesUpdated: latestOptimization.dishesUpdated,
                    completedAt: latestOptimization.completedAt?.toISOString() || null,
                  } : null}
                  labels={{
                    button: t("growthEngine.button"), upgrade: t("growthEngine.upgrade"), confirmTitle: t("growthEngine.confirmTitle"),
                    confirmText: t("growthEngine.confirmText"), cancel: t("growthEngine.cancel"), confirm: t("growthEngine.confirm"),
                    running: t("growthEngine.running"), success: t("growthEngine.success"), successDetail: t("growthEngine.successDetail"),
                    error: t("growthEngine.error"), cost: t("growthEngine.cost"), balance: t("growthEngine.balance", { credits: user.subscription?.aiCredits || 0 }),
                    scoreGain: t("growthEngine.scoreGain"), fields: t("growthEngine.fields"), dishes: t("growthEngine.dishes"),
                  }}
                />
              </div>
            </div>
            </div>
          </details>
        </section>
      </div>
      <BottomNav id={id} />
    </main>
  );
}

function ScoreMetric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#EADBC5]">{icon}{label}</span>
        <span className="text-lg font-black">{value}<span className="text-xs text-white/35">/100</span></span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#A67B3E] to-[#E2C281]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function OpportunityCard({ item, restaurantId, t }: { item: VisibilityOpportunity; restaurantId: string; t: Awaited<ReturnType<typeof getTranslations>> }) {
  const hrefs = {
    website: `/restaurants/${restaurantId}/website`,
    menu: `/restaurants/${restaurantId}/menu`,
    marketing: `/restaurants/${restaurantId}/marketing`,
    settings: `/restaurants/${restaurantId}/settings`,
  };
  const tone = item.tone === "critical"
    ? { dot: "bg-[#C65048]", badge: "bg-[#FCEBE8] text-[#9C332D]", label: t("critical") }
    : item.tone === "positive"
      ? { dot: "bg-[#4D8B50]", badge: "bg-[#ECF7EC] text-[#3F6A4D]", label: t("positive") }
      : { dot: "bg-[#D0933E]", badge: "bg-[#FFF3DF] text-[#936223]", label: t("warning") };

  return (
    <article className="group flex flex-col justify-between rounded-[25px] border border-[#E8DCCB] bg-[#FFFDFC] p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(80,55,30,0.08)]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${tone.badge}`}>{tone.label}</span>
        </div>
        <h3 className="mt-4 text-lg font-black tracking-[-0.025em]">{t(`opportunities.${item.key}.title`)}</h3>
        <p className="mt-2 text-sm leading-6 text-[#6B6258]">{t(`opportunities.${item.key}.text`)}</p>
      </div>
      {item.tone !== "positive" && (
        <Link href={hrefs[item.href]} className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-[#9B6F3B]">
          {t("openAction")} <ArrowUpRight size={15} />
        </Link>
      )}
    </article>
  );
}

function Query({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[#E8DCCB] bg-white px-4 py-4 text-sm font-semibold text-[#302820]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#F1E3CC] text-[#9B6F3B]"><MessageSquareText size={17} /></span>
      <span className="flex-1">“{text}”</span>
      <CheckCircle2 size={17} className="shrink-0 text-[#BCA98F]" />
    </div>
  );
}

function LiveMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-28 rounded-[20px] border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-3 text-center"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-[#8A7863]">{label}</p></div>;
}

function safeHost(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "fonte"; }
}
