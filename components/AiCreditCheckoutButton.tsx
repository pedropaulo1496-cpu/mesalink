"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

export default function AiCreditCheckoutButton({ packId, label, featured = false }: { packId: "STARTER" | "GROWTH" | "SCALE"; label: string; featured?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Não foi possível abrir o pagamento.");
      window.location.href = result.url;
    } catch (checkoutError) {
      setLoading(false);
      setError(checkoutError instanceof Error ? checkoutError.message : "Não foi possível abrir o pagamento.");
    }
  }

  return <div>
    <button type="button" onClick={checkout} disabled={loading} className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition disabled:opacity-50 ${featured ? "bg-[#D7B267] text-[#17120D] hover:bg-[#E4C887]" : "border border-white/20 bg-white/8 text-white hover:bg-white/12"}`}>
      {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}
      {loading ? "A abrir pagamento…" : label}
    </button>
    {error && <p className="mt-2 text-xs font-semibold text-[#F3B8A5]">{error}</p>}
  </div>;
}
