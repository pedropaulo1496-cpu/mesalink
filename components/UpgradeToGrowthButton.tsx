"use client";

import { useState } from "react";

export default function UpgradeToGrowthButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/stripe/upgrade", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Erro ao fazer upgrade.");
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="w-full sm:w-auto">
      <button
        type="button"
        onClick={upgrade}
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#16120E] px-6 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.16)] transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "A atualizar..." : "Atualizar para Growth →"}
      </button>

      {error && (
        <p className="mt-3 max-w-xs text-sm font-semibold text-[#A14E36]">
          {error}
        </p>
      )}
    </div>
  );
}
