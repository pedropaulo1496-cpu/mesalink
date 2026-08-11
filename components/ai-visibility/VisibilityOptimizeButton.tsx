"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

type LastOptimization = {
  status: string;
  beforeScore: number | null;
  afterScore: number | null;
  fieldsFilled: number;
  dishesUpdated: number;
  completedAt: string | null;
} | null;

export default function VisibilityOptimizeButton({
  restaurantId,
  canOptimize,
  lastOptimization,
  labels,
}: {
  restaurantId: string;
  canOptimize: boolean;
  lastOptimization: LastOptimization;
  labels: Record<string, string>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ fieldsFilled: number; dishesUpdated: number } | null>(null);

  async function optimize() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/ai-visibility/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || labels.error);
      setResult({ fieldsFilled: data.fieldsFilled || 0, dishesUpdated: data.dishesUpdated || 0 });
      setConfirming(false);
      window.setTimeout(() => window.location.reload(), 1800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : labels.error);
    } finally {
      setLoading(false);
    }
  }

  if (!canOptimize) {
    return <Link href={`/billing?restaurantId=${restaurantId}`} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#D7B267] px-5 text-sm font-black text-[#17120D]">
      {labels.upgrade} <ArrowRight size={16} />
    </Link>;
  }

  return <div className="mt-5">
    {lastOptimization?.status === "COMPLETED" && !result && (
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Metric value={`${lastOptimization.beforeScore ?? "—"}→${lastOptimization.afterScore ?? "—"}`} label={labels.scoreGain} />
        <Metric value={String(lastOptimization.fieldsFilled)} label={labels.fields} />
        <Metric value={String(lastOptimization.dishesUpdated)} label={labels.dishes} />
      </div>
    )}

    {!confirming && !result && (
      <button onClick={() => setConfirming(true)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#D7B267] px-5 text-sm font-black text-[#17120D] transition hover:bg-[#E7C98D]">
        <Sparkles size={17} /> {labels.button}
      </button>
    )}

    {confirming && !result && (
      <div className="rounded-[22px] border border-[#D7B267]/35 bg-black/20 p-4">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#D7B267]" size={19} />
          <div><p className="text-sm font-black text-white">{labels.confirmTitle}</p><p className="mt-1 text-xs leading-5 text-[#D5C6B4]">{labels.confirmText}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setConfirming(false)} disabled={loading} className="h-11 rounded-full border border-white/15 text-sm font-bold text-white">{labels.cancel}</button>
          <button type="button" onClick={optimize} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#D7B267] text-sm font-black text-[#17120D] disabled:opacity-60">
            {loading && <LoaderCircle size={16} className="animate-spin" />}{loading ? labels.running : labels.confirm}
          </button>
        </div>
      </div>
    )}

    {result && <div className="rounded-[22px] border border-[#84B48A]/35 bg-[#84B48A]/10 p-4 text-sm text-[#DDF2DF]">
      <p className="flex items-center gap-2 font-black"><CheckCircle2 size={17} /> {labels.success}</p>
      <p className="mt-1 text-xs leading-5">{labels.successDetail.replace("{fields}", String(result.fieldsFilled)).replace("{dishes}", String(result.dishesUpdated))}</p>
    </div>}
    {error && <p className="mt-3 rounded-2xl border border-[#C65048]/30 bg-[#C65048]/10 px-4 py-3 text-xs font-semibold leading-5 text-[#FFD9D4]">{error}</p>}
    <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">
      <span>{labels.cost}</span><span>{labels.balance}</span>
    </div>
  </div>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center"><p className="text-lg font-black text-white">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">{label}</p></div>;
}
