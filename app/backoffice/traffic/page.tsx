import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Globe2, MonitorSmartphone, MousePointerClick, UsersRound } from "lucide-react";
import { PageHeading, StatCard } from "@/components/backoffice/BackofficeUI";
import { getSiteTrafficAnalytics } from "@/lib/site-analytics";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") notFound();

  const params = await searchParams;
  const requestedDays = Number(params.days || 30);
  const analytics = await getSiteTrafficAnalytics(requestedDays);
  const maxDailyVisitors = Math.max(1, ...analytics.daily.map((day) => day.visitors));

  return (
    <>
      <PageHeading
        eyebrow="MesaLink.pt · dados reais"
        title="Tráfego do site"
        description="Visitantes anónimos, origem, páginas vistas e criação de contas. O HQ, dashboards e restantes áreas privadas não entram nestes números."
        action={<RangePicker active={analytics.days} />}
      />

      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitantes únicos" value={formatNumber(analytics.current.visitors)} note={`${changeText(analytics.current.visitors, analytics.previous.visitors)} · navegadores diferentes`} tone="gold" />
        <StatCard label="Visitas" value={formatNumber(analytics.current.sessions)} note={`${changeText(analytics.current.sessions, analytics.previous.sessions)} · sessões de navegação`} tone="blue" />
        <StatCard label="Páginas vistas" value={formatNumber(analytics.current.views)} note={`${analytics.pagesPerSession.toFixed(1).replace(".", ",")} páginas por visita`} tone="plain" />
        <StatCard label="Contas criadas" value={formatNumber(analytics.registrations)} note={`${analytics.conversionRate.toFixed(1).replace(".", ",")}% dos visitantes · ${changeText(analytics.registrations, analytics.previousRegistrations)}`} tone="green" />
      </section>

      <section className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-[#30271E] bg-[#332B23] sm:grid-cols-4">
        <CompactMetric label="Visitantes hoje" value={formatNumber(analytics.today.visitors)} />
        <CompactMetric label="Novos visitantes" value={formatNumber(analytics.current.newVisitors)} />
        <CompactMetric label="Regressaram" value={formatNumber(analytics.returningVisitors)} />
        <CompactMetric label="Uma só página" value={`${Math.round(analytics.singlePageRate)}%`} />
      </section>

      <section className="mt-4 rounded-[22px] border border-[#DCC9AA] bg-white p-4 shadow-[0_12px_34px_rgba(75,52,29,0.04)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Evolução diária</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.035em]">Pessoas diferentes por dia</h2></div>
          <div className="hidden items-center gap-4 text-[9px] font-bold text-[#6B6258] sm:flex"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#B78642]" /> Visitantes</span><span>{formatDate(analytics.start)}–{formatDate(analytics.end)}</span></div>
        </div>
        <div className="mt-5 overflow-x-auto pb-1">
          <div className={`flex h-44 items-end gap-1 ${analytics.days > 30 ? "min-w-[900px]" : "min-w-[560px]"}`}>
            {analytics.daily.map((day, index) => {
              const height = day.visitors ? Math.max(7, Math.round((day.visitors / maxDailyVisitors) * 100)) : 2;
              const showLabel = analytics.days === 7 || index === 0 || index === analytics.daily.length - 1 || index % (analytics.days === 30 ? 5 : 10) === 0;
              return <div key={day.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${formatDate(day.date)} · ${day.visitors} visitantes · ${day.views} páginas`}><div className="relative flex flex-1 items-end"><span className="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#17130F] px-2 py-1 text-[9px] font-bold text-white group-hover:block">{day.visitors} visitantes</span><div className="w-full rounded-t-md bg-gradient-to-t from-[#8B622D] to-[#D9B96F] transition group-hover:from-[#5B3D1B]" style={{ height: `${height}%` }} /></div><p className="mt-2 h-4 text-center text-[8px] font-bold text-[#8A7C6D]">{showLabel ? day.date.getUTCDate() : ""}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ListCard eyebrow="Conteúdo" title="Páginas mais visitadas" icon={<MousePointerClick size={17} />}>
          {analytics.pages.map((page, index) => <RankRow key={page.path} index={index + 1} title={pageLabel(page.path)} subtitle={page.path} value={`${formatNumber(page.visitors)} pessoas`} note={`${formatNumber(page.views)} vistas`} />)}
          {!analytics.pages.length && <EmptyState />}
        </ListCard>

        <ListCard eyebrow="Aquisição" title="De onde chegam" icon={<Globe2 size={17} />}>
          {analytics.sources.map((source, index) => <RankRow key={source.source} index={index + 1} title={sourceLabel(source.source)} subtitle="Origem identificada" value={`${formatNumber(source.visitors)} pessoas`} note={`${formatNumber(source.views)} vistas`} />)}
          {!analytics.sources.length && <EmptyState />}
        </ListCard>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1.15fr]">
        <ListCard eyebrow="Dispositivos" title="Como visitam" icon={<MonitorSmartphone size={17} />}>
          {analytics.devices.map((device, index) => <RankRow key={device.device} index={index + 1} title={deviceLabel(device.device)} subtitle="Visitantes únicos" value={formatNumber(device.visitors)} note={`${formatNumber(device.views)} vistas`} />)}
          {!analytics.devices.length && <EmptyState />}
        </ListCard>

        <ListCard eyebrow="Localização" title="Países" icon={<Globe2 size={17} />}>
          {analytics.countries.map((country, index) => <RankRow key={country.country} index={index + 1} title={countryLabel(country.country)} subtitle="Localização aproximada" value={formatNumber(country.visitors)} />)}
          {!analytics.countries.length && <EmptyState />}
        </ListCard>

        <div className="rounded-[22px] bg-[#17130F] p-5 text-white shadow-[0_16px_38px_rgba(23,19,15,0.14)]">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D7B267]">Funil comercial</p><h2 className="mt-1 text-xl font-semibold">Da visita à conta</h2></div><UsersRound size={20} className="text-[#D7B267]" /></div>
          <FunnelRow label="Visitantes únicos" value={analytics.current.visitors} percent={100} />
          <FunnelRow label="Chegaram ao registo" value={analytics.registerVisitors} percent={percentage(analytics.registerVisitors, analytics.current.visitors)} />
          <FunnelRow label="Criaram conta" value={analytics.registrations} percent={analytics.conversionRate} />
          <Link href="/backoffice/clients" className="mt-5 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#D7B267] text-[11px] font-black text-[#17130F]">Ver novos clientes <ArrowUpRight size={13} /></Link>
        </div>
      </section>

      <p className="mt-4 text-center text-[9px] leading-4 text-[#8A7C6D]">Medição própria e sem custos adicionais. Não guardamos IP, nome ou email; “visitante único” corresponde a um navegador anónimo. Bots conhecidos e pessoas com “Do Not Track” ativo são excluídos.</p>
    </>
  );
}

function RangePicker({ active }: { active: number }) {
  return <div className="inline-flex rounded-xl border border-[#DCC9AA] bg-[#FFF9F0] p-1">{[7, 30, 90].map((days) => <Link key={days} href={`/backoffice/traffic?days=${days}`} className={`grid h-8 min-w-12 place-items-center rounded-lg px-2 text-[10px] font-black ${active === days ? "bg-[#17130F] text-white" : "text-[#76552E]"}`}>{days}d</Link>)}</div>;
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 bg-white/[0.035] px-4 py-3"><p className="truncate text-[9px] font-bold text-white/48">{label}</p><p className="text-sm font-black text-[#F0D28F]">{value}</p></div>;
}

function ListCard({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-[22px] border border-[#DCC9AA] bg-white shadow-[0_12px_34px_rgba(75,52,29,0.04)]"><div className="flex items-center justify-between px-4 py-3.5"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold tracking-[-0.03em]">{title}</h2></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F3E7D5] text-[#8B622D]">{icon}</span></div><div className="border-t border-[#E8DDCD] px-4">{children}</div></div>;
}

function RankRow({ index, title, subtitle, value, note }: { index: number; title: string; subtitle: string; value: string; note?: string }) {
  return <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[#EEE4D6] py-2.5 last:border-0"><span className="grid h-6 w-6 place-items-center rounded-lg bg-[#F5EFE6] text-[9px] font-black text-[#9B6F3B]">{index}</span><div className="min-w-0"><p className="truncate text-[12px] font-bold">{title}</p><p className="mt-0.5 truncate text-[9px] text-[#887A6B]">{subtitle}</p></div><div className="text-right"><p className="text-[11px] font-black">{value}</p>{note && <p className="mt-0.5 text-[9px] text-[#887A6B]">{note}</p>}</div></div>;
}

function FunnelRow({ label, value, percent }: { label: string; value: number; percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return <div className="mt-4"><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-white/65">{label}</span><span className="text-[12px] font-black">{formatNumber(value)} <small className="ml-1 font-bold text-[#D7B267]">{Math.round(safePercent)}%</small></span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#D7B267]" style={{ width: `${safePercent}%` }} /></div></div>;
}

function EmptyState() { return <p className="py-6 text-center text-[11px] text-[#887A6B]">Os primeiros dados aparecem assim que existirem novas visitas.</p>; }
function formatNumber(value: number) { return new Intl.NumberFormat("pt-PT").format(value); }
function formatDate(value: Date) { return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", timeZone: "UTC" }).format(value).replace(".", ""); }
function percentage(value: number, total: number) { return total ? (value / total) * 100 : 0; }
function changeText(current: number, previous: number) { if (!previous) return current ? "primeiro período medido" : "sem dados no período"; const value = Math.round(((current - previous) / previous) * 100); return `${value >= 0 ? "+" : ""}${value}% vs. período anterior`; }
function sourceLabel(value: string) { const labels: Record<string, string> = { direct: "Acesso direto", google: "Google", bing: "Bing", instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn", referral: "Outro website" }; return labels[value] || value; }
function deviceLabel(value: string) { return value === "mobile" ? "Telemóvel" : value === "tablet" ? "Tablet" : "Computador"; }
function countryLabel(value: string) { const labels: Record<string, string> = { PT: "Portugal", ES: "Espanha", FR: "França", GB: "Reino Unido", US: "Estados Unidos", BR: "Brasil", DE: "Alemanha", IT: "Itália", NL: "Países Baixos", "—": "Localização desconhecida" }; return labels[value] || value; }
function pageLabel(path: string) { if (path === "/") return "Página inicial"; if (path === "/pricing") return "Preços"; if (path === "/register") return "Criar conta"; if (path === "/mobile") return "Apps MesaLink"; if (path.startsWith("/reserve/")) return `Reserva pública · ${path.split("/").filter(Boolean).at(-1)}`; if (path.startsWith("/s/")) return `Website de restaurante · ${path.split("/").filter(Boolean).at(-1)}`; return path.split("/").filter(Boolean).map((part) => part.replaceAll("-", " ")).join(" · ") || "Página inicial"; }
