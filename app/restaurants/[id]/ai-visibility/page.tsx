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
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import RestaurantSidebar from "@/components/RestaurantSidebar";
import { authOptions } from "@/lib/auth";
import { calculateAiVisibility, type VisibilityOpportunity } from "@/lib/ai-visibility";
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

  const [restaurant, reviewAggregate] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id },
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
  const cuisine = restaurant.websiteCuisine?.trim() || restaurant.name;
  const location = restaurant.address?.split(",").at(-1)?.trim() || "a sua cidade";
  const scoreMessage =
    report.overall >= 75 ? t("scoreHigh") : report.overall >= 45 ? t("scoreMedium") : t("scoreLow");

  const metrics = [
    { label: t("metrics.chatgpt"), value: report.chatgpt, icon: <Bot size={18} /> },
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
          <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">
                  {t("eyebrow")}
                </p>
                <span className="rounded-full border border-[#DCC397] bg-[#FFF8EC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
                  {t("beta")}
                </span>
              </div>
              <h1 className="mt-3 text-4xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-5xl">
                {t("title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6B6258]">{t("subtitle")}</p>
            </div>

            <Link
              href={`/restaurants/${id}/ai-visibility?refresh=1`}
              className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
            >
              <RefreshCw size={16} />
              {t("rescan")}
            </Link>
          </header>

          <section className="mt-7 overflow-hidden rounded-[38px] border border-[#2C2117] bg-[#17120D] text-white shadow-[0_35px_100px_rgba(44,31,18,0.24)]">
            <div className="grid xl:grid-cols-[380px_1fr]">
              <div className="flex flex-col items-center justify-center border-b border-white/10 p-8 text-center xl:border-b-0 xl:border-r">
                <div
                  className="grid h-48 w-48 place-items-center rounded-full p-[11px]"
                  style={{ background: `conic-gradient(#D7B267 ${report.overall}%, rgba(255,255,255,.1) 0)` }}
                >
                  <div className="grid h-full w-full place-items-center rounded-full bg-[#17120D]">
                    <div>
                      <p className="text-6xl font-semibold tracking-[-0.08em]">{report.overall}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                        {t("scoreOutOf")}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-[#D7B267]">{t("scoreLabel")}</p>
                <p className="mt-2 text-sm text-[#EADBC5]">{scoreMessage}</p>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-2 text-xs font-semibold text-white/45">
                  <Sparkles size={14} className="text-[#D7B267]" />
                  {t("lastAnalysis")}
                </div>
                <div className="mt-7 grid gap-x-8 gap-y-6 md:grid-cols-2">
                  {metrics.map((metric) => (
                    <ScoreMetric key={metric.label} {...metric} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[34px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_75px_rgba(80,55,30,0.07)] sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B58A45]">{t("opportunitiesEyebrow")}</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.055em]">{t("opportunitiesTitle", { count: actionableCount })}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">{t("opportunitiesSubtitle")}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 xl:grid-cols-2">
              {report.opportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.key} item={opportunity} restaurantId={id} t={t} />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
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
                  <Sparkles size={17} /> {t("nextPhase")}
                </div>
                <p className="mt-2 text-sm leading-6 text-[#EADBC5]">{t("nextPhaseText")}</p>
              </div>
            </div>
          </section>
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
