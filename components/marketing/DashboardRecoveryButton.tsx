"use client";

import { useState } from "react";

export default function DashboardRecoveryButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function runRecovery() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/marketing/run-recovery", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSuccess(false);
        setMessage(data.error || "Erro ao executar recuperação.");
        return;
      }

      setSuccess(true);
      setMessage(`${data.emailsSent} emails enviados.`);
    } catch {
      setSuccess(false);
      setMessage("Erro ao executar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={runRecovery}
        disabled={loading}
        className="inline-flex rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:opacity-50"
      >
        {loading ? "A enviar..." : "Recuperar clientes"}
      </button>

      {message && (
        <div
          className={`mt-3 rounded-2xl px-4 py-3 text-sm font-medium ${
            success
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {success ? "✅ " : "❌ "}
          {message}
        </div>
      )}
    </div>
  );
}