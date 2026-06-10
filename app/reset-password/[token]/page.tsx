"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();

  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("As passwords não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Erro.");
        return;
      }

      setMessage("Password alterada com sucesso.");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(240,195,106,0.18),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 shadow-2xl">
          <h1 className="text-3xl font-black">
            Nova Password
          </h1>

          <p className="mt-3 text-[#a99a82]">
            Escolha uma nova password para a sua conta.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="Nova password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white"
              required
            />

            <input
              type="password"
              placeholder="Confirmar password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white"
              required
            />

            {message && (
              <p className="text-sm text-[#f0c36a]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-14 w-full rounded-full bg-[#f0c36a] font-bold text-black"
            >
              {loading ? "A guardar..." : "Guardar password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}