import type { ReactNode } from "react";

export const euroCents = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value / 100);
export const euroAmount = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
export const shortDate = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(value) : "—";
export const dateTime = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(value) : "—";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">{eyebrow}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B6258]">{description}</p></div>{action}</div>;
}

export function StatCard({ label, value, note, tone = "plain" }: { label: string; value: string; note: string; tone?: "plain" | "green" | "red" | "gold" | "blue" }) {
  const colors = { plain: "bg-white", green: "bg-[#EBF5EA]", red: "bg-[#FFF0EA]", gold: "bg-[#FFF6E5]", blue: "bg-[#EBF4F8]" };
  return <div className={`rounded-[24px] border border-[#DCC9AA] p-4 ${colors[tone]}`}><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A6A42]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p><p className="mt-1 text-xs text-[#6B6258]">{note}</p></div>;
}

export function RiskPill({ level, score }: { level: "LOW" | "MEDIUM" | "HIGH"; score: number }) {
  const styles = level === "HIGH" ? "bg-[#FFE2D8] text-[#9C412B]" : level === "MEDIUM" ? "bg-[#FFF0CA] text-[#80601E]" : "bg-[#E3F1E2] text-[#35603A]";
  const label = level === "HIGH" ? "Risco alto" : level === "MEDIUM" ? "Risco médio" : "Saudável";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${styles}`}>{label} · {score}</span>;
}

export function DoneNotice({ done }: { done?: string }) {
  if (!done) return null;
  return <div className="mb-5 rounded-2xl border border-[#B8D3B7] bg-[#EEF8EC] px-4 py-3 text-sm font-semibold text-[#315C36]">Alteração concluída e registada.</div>;
}

export const inputClass = "h-11 w-full rounded-xl border border-[#DCC9AA] bg-white px-3 text-sm outline-none focus:border-[#9B6F3B]";
export const buttonClass = "inline-flex h-11 items-center justify-center rounded-xl bg-[#17130F] px-4 text-sm font-bold text-white hover:bg-[#2B231B] disabled:opacity-50";
