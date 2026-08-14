import { notFound } from "next/navigation";
import Link from "next/link";
import { BriefcaseBusiness, ExternalLink, FileText, Filter, Globe2, Languages, Search, UserRoundCheck } from "lucide-react";
import { Prisma } from "@prisma/client";
import { DoneNotice, PageHeading, StatCard, buttonClass, dateTime, inputClass } from "@/components/backoffice/BackofficeUI";
import { commercialPartnerScoreLabel, type CommercialPartnerScoreBreakdown } from "@/lib/commercial-partner-score";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff-auth";
import { updateCandidateReview } from "./actions";

export const dynamic = "force-dynamic";

const statusOptions = [
  ["NEW", "Nova"], ["REVIEWING", "Em revisão"], ["SHORTLISTED", "Pré-selecionada"],
  ["INTERVIEW", "Entrevista"], ["APPROVED", "Aprovada"], ["REJECTED", "Não avançar"],
] as const;

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; done?: string }> }) {
  const staff = await requireStaff();
  if (staff.role !== "ADMIN") notFound();
  const params = await searchParams;
  const status = statusOptions.some(([value]) => value === params.status) ? params.status : "";
  const q = String(params.q || "").trim().slice(0, 100);
  const where: Prisma.CommercialPartnerApplicationWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ] } : {}),
  };
  const [applications, all] = await Promise.all([
    prisma.commercialPartnerApplication.findMany({ where, orderBy: [{ score: "desc" }, { createdAt: "desc" }], take: 200 }),
    prisma.commercialPartnerApplication.findMany({ select: { status: true, score: true, country: true, createdAt: true } }),
  ]);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const countryCount = new Set(all.map((item) => item.country.toLocaleLowerCase())).size;

  return (
    <>
      <DoneNotice done={params.done} />
      <PageHeading eyebrow="Recrutamento internacional" title="Candidaturas comerciais" description="Priorização transparente por experiência e capacidade comercial. A decisão final é sempre humana; o sistema nunca rejeita automaticamente." action={<Link href="/global-sales-partners" target="_blank" className={`${buttonClass} gap-2`}>Ver página pública <ExternalLink size={13} /></Link>} />

      <section className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Candidaturas" value={String(all.length)} note="total recebido" tone="plain" />
        <StatCard label="Novas esta semana" value={String(all.filter((item) => item.createdAt >= weekAgo).length)} note="por rever" tone="blue" />
        <StatCard label="Perfis prioritários" value={String(all.filter((item) => item.score >= 80 && !["REJECTED", "APPROVED"].includes(item.status)).length)} note="pontuação 80+" tone="gold" />
        <StatCard label="Mercados" value={String(countryCount)} note="países representados" tone="green" />
      </section>

      <form className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#DCC9AA] bg-white p-3 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9B6F3B]" /><input name="q" defaultValue={q} placeholder="Nome, email, país ou cidade" className={`${inputClass} pl-9`} /></label>
        <label className="relative sm:w-52"><Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9B6F3B]" /><select name="status" defaultValue={status} className={`${inputClass} pl-9`}><option value="">Todos os estados</option>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <button className={buttonClass}>Filtrar</button>
        {(q || status) && <Link href="/backoffice/candidates" className="inline-flex h-10 items-center justify-center px-3 text-xs font-bold text-[#8A6130]">Limpar</Link>}
      </form>

      <section className="mt-4 space-y-2.5">
        {applications.map((application) => {
          const breakdown = scoreBreakdown(application.scoreBreakdown);
          return (
            <details key={application.id} className="group overflow-hidden rounded-[20px] border border-[#DCC9AA] bg-white shadow-[0_8px_26px_rgba(80,55,30,.035)]">
              <summary className="cursor-pointer list-none p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#F2E7D7] text-[#8A6130]"><BriefcaseBusiness size={18} /></span>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-semibold">{application.fullName}</h2><StatusBadge status={application.status} /></div><p className="mt-1 truncate text-[11px] text-[#6B6258]">{application.email}{application.phone ? ` · ${application.phone}` : ""}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[600px]">
                    <Mini icon={<Globe2 size={12} />} label="Mercado" value={`${application.city ? `${application.city}, ` : ""}${application.country}`} />
                    <Mini icon={<Languages size={12} />} label="Idiomas" value={application.languages.join(" · ")} />
                    <Mini icon={<UserRoundCheck size={12} />} label="Experiência" value={`${application.salesYears}a vendas · ${application.hospitalityYears}a restauração`} />
                    <div className={`rounded-xl px-3 py-2 ${application.score >= 80 ? "bg-[#E7F2E5] text-[#315C36]" : application.score >= 60 ? "bg-[#FFF2D8] text-[#75541F]" : "bg-[#F3EEE7] text-[#62584E]"}`}><p className="text-[8px] font-black uppercase tracking-wider">Adequação</p><p className="mt-0.5 text-lg font-black">{application.score}<span className="text-[10px] opacity-60">/100</span></p></div>
                  </div>
                  <span className="text-[10px] font-bold text-[#9B6F3B] group-open:hidden">Abrir ↓</span>
                </div>
              </summary>

              <div className="border-t border-[#E9DDCC] bg-[#FFFCF8] p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                  <div className="space-y-4">
                    <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9B6F3B]">Motivação e abordagem</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#5F554A]">{application.motivation}</p></div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Mercados" value={application.markets.join(", ")} />
                      <Info label="Rede de contactos" value={networkLabel(application.networkSize)} />
                      <Info label="Disponibilidade" value={availabilityLabel(application.weeklyAvailability)} />
                      <Info label="Experiência adicional" value={[application.hasSaasExperience && "SaaS", application.hasCommissionExperience && "Comissão"].filter(Boolean).join(" · ") || "Não indicada"} />
                    </div>
                    <div className="rounded-2xl border border-[#E4D6C2] bg-white p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9B6F3B]">Pontuação explicável</p><p className="mt-1 text-xs text-[#6B6258]">{commercialPartnerScoreLabel(application.score)} · não constitui decisão automática.</p></div><strong className="text-2xl">{application.score}/100</strong></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Score label="Vendas" value={breakdown.salesExperience} max={25} /><Score label="Restauração" value={breakdown.hospitalityExperience} max={20} /><Score label="SaaS" value={breakdown.saasExperience} max={10} /><Score label="Comissão" value={breakdown.commissionExperience} max={10} /><Score label="Idiomas" value={breakdown.languages} max={12} /><Score label="Mercados" value={breakdown.markets} max={8} /><Score label="Rede" value={breakdown.restaurantNetwork} max={10} /><Score label="Disponibilidade" value={breakdown.availability} max={5} /></div></div>
                    <div className="flex flex-wrap gap-2">{application.cvUrl && <a href={application.cvUrl} target="_blank" rel="noreferrer" className={`${buttonClass} gap-2`}><FileText size={14} /> Abrir CV</a>}{application.linkedinUrl && <a href={application.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#CDB68F] px-4 text-xs font-bold">LinkedIn <ExternalLink size={12} /></a>}<span className="inline-flex h-10 items-center rounded-xl bg-[#F1E9DD] px-3 text-[10px] font-semibold text-[#6B6258]">Recebida {dateTime(application.createdAt)} · fonte {application.source}</span></div>
                  </div>

                  <form action={updateCandidateReview} className="rounded-2xl border border-[#DCC9AA] bg-white p-4">
                    <input type="hidden" name="id" value={application.id} />
                    <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9B6F3B]">Revisão humana</p>
                    <label className="mt-3 block text-[10px] font-bold text-[#6B6258]">Estado<select name="status" defaultValue={application.status} className={`${inputClass} mt-1`}>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label className="mt-3 block text-[10px] font-bold text-[#6B6258]">Notas privadas<textarea name="adminNote" defaultValue={application.adminNote || ""} rows={6} maxLength={2000} className="mt-1 w-full resize-y rounded-xl border border-[#DCC9AA] bg-white p-3 text-xs leading-5 outline-none focus:border-[#9B6F3B]" placeholder="Pontos fortes, dúvidas e próximo passo…" /></label>
                    <button className={`${buttonClass} mt-3 w-full`}>Guardar revisão</button>
                    <p className="mt-3 text-[9px] leading-4 text-[#918477]">Antes de avançar ou recusar, confirme o CV e a informação apresentada. Não use fotografia, idade, género, origem ou outros fatores pessoais.</p>
                  </form>
                </div>
              </div>
            </details>
          );
        })}
        {!applications.length && <div className="rounded-[22px] border border-dashed border-[#C9A66B] bg-white/60 p-10 text-center"><BriefcaseBusiness className="mx-auto text-[#B08349]" /><h2 className="mt-4 text-lg font-semibold">Sem candidaturas neste filtro.</h2><p className="mt-1 text-sm text-[#6B6258]">Partilha a página pública ou limpa os filtros.</p></div>}
      </section>
    </>
  );
}

function scoreBreakdown(value: Prisma.JsonValue): CommercialPartnerScoreBreakdown {
  const fallback = { salesExperience: 0, hospitalityExperience: 0, saasExperience: 0, commissionExperience: 0, languages: 0, markets: 0, restaurantNetwork: 0, availability: 0 };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return { ...fallback, ...value } as CommercialPartnerScoreBreakdown;
}
function StatusBadge({ status }: { status: string }) { const config: Record<string, [string, string]> = { NEW: ["Nova", "bg-[#EAF3F8] text-[#3D6577]"], REVIEWING: ["Em revisão", "bg-[#FFF0D5] text-[#7B5A22]"], SHORTLISTED: ["Pré-selecionada", "bg-[#E8F3E6] text-[#37613C]"], INTERVIEW: ["Entrevista", "bg-[#ECE7FA] text-[#5A4780]"], APPROVED: ["Aprovada", "bg-[#DFF1DD] text-[#315C36]"], REJECTED: ["Não avançar", "bg-[#F2E8E4] text-[#80584A]"] }; const item = config[status] || [status, "bg-[#EFEAE3] text-[#62584E]"]; return <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider ${item[1]}`}>{item[0]}</span>; }
function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-[#F7F1E8] px-3 py-2"><p className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{icon}{label}</p><p className="mt-1 truncate text-[11px] font-bold">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F5EEE4] p-3"><p className="text-[8px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-[11px] font-semibold leading-4">{value}</p></div>; }
function Score({ label, value, max }: { label: string; value: number; max: number }) { return <div><div className="flex items-center justify-between text-[9px] font-bold"><span>{label}</span><span>{value}/{max}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EEE5D9]"><div className="h-full rounded-full bg-[#B98A4C]" style={{ width: `${Math.min(100, value / max * 100)}%` }} /></div></div>; }
function networkLabel(value: string) { return ({ NONE: "A construir", SMALL: "1–10 contactos", MEDIUM: "11–40 contactos", LARGE: "40+ contactos" } as Record<string, string>)[value] || value; }
function availabilityLabel(value: string) { return ({ LT_5: "< 5h / semana", H5_10: "5–10h / semana", H10_20: "10–20h / semana", H20_PLUS: "20h+ / semana" } as Record<string, string>)[value] || value; }
