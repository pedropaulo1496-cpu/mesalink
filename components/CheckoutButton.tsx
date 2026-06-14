"use client";

import { useState } from "react";

type Product = "PRO" | "WEBSITE";

type CheckoutButtonProps = {
  product?: Product;
  label?: string;
};

export default function CheckoutButton({
  product = "PRO",
  label,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      alert(data.error || "Erro no Stripe");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  const defaultLabel =
    product === "WEBSITE" ? "Ativar Website →" : "Ativar Pro →";

  return (
    <button
      type="button"
      onClick={checkout}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 text-base font-black text-black shadow-[0_0_70px_rgba(96,165,250,0.45)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "A abrir checkout..." : label || defaultLabel}
    </button>
  );
}