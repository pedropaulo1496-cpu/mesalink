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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={
            billing === "monthly"
              ? "rounded-2xl bg-[#f0c36a] px-4 py-3 font-black text-black"
              : "rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 py-3 font-bold text-[#d6c7ad]"
          }
        >
          Mensal
        </button>

        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={
            billing === "yearly"
              ? "rounded-2xl bg-[#f0c36a] px-4 py-3 font-black text-black"
              : "rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 py-3 font-bold text-[#d6c7ad]"
          }
        >
          Anual
        </button>
      </div>

      <button
        type="button"
        onClick={checkout}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center rounded-full bg-[#f0c36a] px-8 text-base font-black text-black hover:bg-[#ffd982] disabled:opacity-60"
      >
        {loading ? "A abrir checkout..." : "Começar Starter"}
      </button>
    </div>
  );
}