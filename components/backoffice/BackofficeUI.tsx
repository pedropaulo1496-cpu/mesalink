import type { ReactNode } from "react";

export const euroCents = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value / 100);
export const euroAmount = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
export const shortDate = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(value) : "—";
export const dateTime = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(value) : "—";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="relative overflow-hidden rounded-[24px] border border-[#DCC9AA] bg-white px-5 py-5 shadow-[0_12px_38px_rgba(73,50,27,0.045)] sm:px-6"><span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#D7B267] via-[#A97839] to-[#536F58]" /><div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">{eyebrow}</p><h1 className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.05em] sm:text-[2.25rem]">{title}</h1><p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#6B6258]">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div></div>;
}

export function StatCard({ label, value, note, tone = "plain" }: { label: string; value: string; note: string; tone?: "plain" | "green" | "red" | "gold" | "blue" }) {
  const colors = { plain: "bg-white", green: "bg-[#F1F8F0]", red: "bg-[#FFF4EF]", gold: "bg-[#FFF8E9]", blue: "bg-[#F0F7FA]" };
  const dots = { plain: "bg-[#A88A62]", green: "bg-[#5D8A62]", red: "bg-[#B65D45]", gold: "bg-[#BF8A36]", blue: "bg-[#4F7E94]" };
  return <div className={`relative min-w-0 overflow-hidden rounded-[18px] border border-[#DCC9AA] px-4 py-3.5 shadow-[0_8px_24px_rgba(80,55,30,0.035)] ${colors[tone]}`}><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dots[tone]}`} /><p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-[#80684C]">{label}</p></div><p className="mt-2 truncate text-[1.45rem] font-semibold leading-none tracking-[-0.045em] sm:text-[1.65rem]">{value}</p><p className="mt-2 min-h-4 text-[9px] leading-4 text-[#6B6258]">{note}</p></div>;
}

export function RiskPill({ level, score }: { level: "LOW" | "MEDIUM" | "HIGH"; score: number }) {
  const styles = level === "HIGH" ? "bg-[#FFE2D8] text-[#9C412B]" : level === "MEDIUM" ? "bg-[#FFF0CA] text-[#80601E]" : "bg-[#E3F1E2] text-[#35603A]";
  const label = level === "HIGH" ? "Risco alto" : level === "MEDIUM" ? "Risco médio" : "Saudável";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${styles}`}>{label} · {score}</span>;
}

export function DoneNotice({ done }: { done?: string }) {
  if (!done) return null;
  return <div className="mb-4 rounded-xl border border-[#B8D3B7] bg-[#EEF8EC] px-3.5 py-2.5 text-xs font-semibold text-[#315C36]">Alteração concluída e registada.</div>;
}

export const inputClass = "h-10 w-full rounded-xl border border-[#DCC9AA] bg-white px-3 text-[13px] outline-none transition focus:border-[#9B6F3B] focus:ring-2 focus:ring-[#D7B267]/20";
export const buttonClass = "inline-flex h-10 items-center justify-center rounded-xl bg-[#17130F] px-4 text-[13px] font-bold text-white transition hover:bg-[#2B231B] disabled:opacity-50";
