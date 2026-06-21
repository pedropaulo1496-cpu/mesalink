"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: emailAddress, password }),
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
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-3xl font-semibold tracking-[-0.05em]">
              <span className="text-[#C8A56A]">Mesa</span>
              <span className="text-[#16120E]">Link</span>
            </Link>
          </div>

          <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
            <Link
              href="/"
              className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]"
            >
              ← Voltar
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em]">
              Comece hoje
            </h1>

            <p className="mb-8 mt-3 text-sm leading-6 text-[#6B6258]">
              Crie a sua conta e comece com 7 dias grátis.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Nome" className={inputClass} required />
                <input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} type="email" placeholder="Email" className={inputClass} required />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className={inputClass} required />
              </div>

              <div className="mt-6 flex items-start gap-3">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 accent-[#16120E]" />

                <label className="text-sm leading-relaxed text-[#6B6258]">
                  Li e aceito os{" "}
                  <a href="/terms" target="_blank" className="font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                    Termos e Condições
                  </a>{" "}
                  e a{" "}
                  <a href="/privacy" target="_blank" className="font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                    Política de Privacidade
                  </a>
                  .
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-3 text-sm text-[#A14E36]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] text-base font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A criar conta..." : "Criar conta"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E8DCCB] pt-6 text-center">
              <p className="text-sm text-[#6B6258]">Já tem conta?</p>

              <Link href="/login" className="mt-2 inline-block font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                Entrar
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#9B8F82]">
            17,50€ + IVA / mês · Sem comissões · 7 dias grátis
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}