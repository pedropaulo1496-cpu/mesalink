"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!acceptedTerms) {
      setError("Tem de aceitar os Termos e a Política de Privacidade.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: emailAddress,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao criar conta.");
        return;
      }

      const loginResult = await signIn("credentials", {
        email: emailAddress,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Conta criada, mas erro ao iniciar sessão.");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-3xl font-black tracking-tight">
              Mesa
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Link
              </span>
            </Link>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_80px_rgba(34,211,238,0.14)] backdrop-blur-2xl sm:p-8">
            <Link href="/" className="text-sm text-slate-400 hover:text-white">
              ← Voltar
            </Link>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">
              Comece hoje
            </h1>

            <p className="mb-8 mt-3 text-sm leading-6 text-slate-400">
              Crie a sua conta e comece com 7 dias grátis.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Nome"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
                  required
                />

                <input
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
                  required
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
                  required
                />
              </div>

              <div className="mt-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-cyan-300"
                />

                <label className="text-sm leading-relaxed text-slate-400">
                  Li e aceito os{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    Termos e Condições
                  </a>{" "}
                  e a{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A criar conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
              <p className="text-sm text-slate-400">Já tem conta?</p>

              <Link
                href="/login"
                className="mt-2 inline-block font-bold text-cyan-300 hover:text-cyan-200"
              >
                Entrar
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            17,50€ + IVA / mês · Sem comissões · 7 dias grátis
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute bottom-[-180px] left-[-120px] h-[360px] w-[360px] rounded-full bg-blue-500/15 blur-[100px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}