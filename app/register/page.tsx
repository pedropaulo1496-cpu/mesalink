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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(240,195,106,0.18),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-4xl font-black tracking-tight">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </Link>
          </div>

          <div className="rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 shadow-2xl">
            <Link href="/" className="text-sm text-[#a99a82] hover:text-white">
              ← Voltar
            </Link>

            <h1 className="mt-6 text-4xl font-black">Comece hoje</h1>

            <p className="mt-3 mb-8 text-[#a99a82]">
              Crie a sua conta e comece com 7 dias grátis.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Nome"
                  className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:outline-none focus:border-[#f0c36a]/40"
                  required
                />

                <input
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:outline-none focus:border-[#f0c36a]/40"
                  required
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:outline-none focus:border-[#f0c36a]/40"
                  required
                />
              </div>

              <div className="mt-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-[#f0c36a]"
                />

                <label className="text-sm leading-relaxed text-[#a99a82]">
                  Li e aceito os{" "}
                  <a href="/terms" target="_blank" className="text-[#f0c36a]">
                    Termos e Condições
                  </a>{" "}
                  e a{" "}
                  <a href="/privacy" target="_blank" className="text-[#f0c36a]">
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 h-14 w-full rounded-full bg-[#f0c36a] text-base font-bold text-black hover:bg-[#ffd982] disabled:opacity-60"
              >
                {loading ? "A criar conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#f0c36a]/10 pt-6 text-center">
              <p className="text-sm text-[#a99a82]">Já tem conta?</p>

              <Link
                href="/login"
                className="mt-2 inline-block font-bold text-[#f0c36a] hover:text-[#ffd982]"
              >
                Entrar
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#7d725f]">
            17,50€ + IVA / mês • Sem comissões • 7 dias grátis
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}