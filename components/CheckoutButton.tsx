"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      alert(data.error || "Erro no Stripe");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-full border border-white/10 bg-black/25 p-2">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={
            billing === "monthly"
              ? "rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-3 text-sm font-black text-black shadow-[0_0_40px_rgba(96,165,250,0.35)]"
              : "rounded-full px-4 py-3 text-sm font-black text-slate-400 transition hover:text-white"
          }
        >
          Mensal
        </button>

        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={
            billing === "yearly"
              ? "rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-4 py-3 text-sm font-black text-black shadow-[0_0_40px_rgba(96,165,250,0.35)]"
              : "rounded-full px-4 py-3 text-sm font-black text-slate-400 transition hover:text-white"
          }
        >
          Anual
        </button>
      </div>

      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "A abrir checkout..."
          : billing === "yearly"
            ? "Começar anual →"
            : "Começar mensal →"}
      </button>
    </div>
  );
}