"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function VisibilityScanButton({ restaurantId, label, credits, canScan }: { restaurantId: string; label: string; credits: number; canScan: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function scan() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/restaurants/${restaurantId}/ai-visibility/scan`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) {
      setLoading(false);
      setError(result.error || "Não foi possível concluir a análise.");
      return;
    }
    window.location.reload();
  }

  if (!canScan) return <Link href={`/billing?restaurantId=${restaurantId}`} className="inline-flex h-12 items-center justify-center rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white">Ativar Growth para medir</Link>;

  return <div className="flex flex-col items-start gap-2 xl:items-end">
    <button onClick={scan} disabled={loading} className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-full bg-[#16120E] px-5 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:opacity-55">
      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
      {loading ? "A pesquisar Google e a web…" : label}
    </button>
    <Link href={`/billing?restaurantId=${restaurantId}`} className="text-xs font-bold text-[#806D56]">Saldo: {credits} créditos · Comprar</Link>
    {error && <p className="max-w-xs text-xs font-semibold text-[#A14E36]">{error}</p>}
  </div>;
}
