"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass =
  "h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]";

export default function LoginPage() {
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const result = await signIn("credentials", {
        email: emailAddress,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou password inválidos.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erro ao entrar.");
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
            <Link href="/" className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]">
              ← Voltar
            </Link>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em]">
              Bem-vindo de volta
            </h1>

            <p className="mb-8 mt-3 text-sm leading-6 text-[#6B6258]">
              Entre na sua conta MesaLink.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} type="email" placeholder="Email" className={inputClass} required />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className={inputClass} required />
              </div>

              <div className="mt-3 text-right">
                <Link href="/forgot-password" className="text-sm font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                  Esqueceste-te da password?
                </Link>
              </div>

              {error && (
                <p className="mt-4 rounded-2xl border border-[#E7B7A8] bg-[#FFF0EA] p-3 text-sm text-[#A14E36]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] text-base font-semibold text-white transition hover:bg-[#2A2118] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "A entrar..." : "Entrar"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E8DCCB] pt-6 text-center">
              <p className="text-sm text-[#6B6258]">Ainda não tem conta?</p>

              <Link href="/register" className="mt-2 inline-block font-semibold text-[#9B6F3B] hover:text-[#16120E]">
                Criar conta
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#9B8F82]">
            Reservas online para restaurantes.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}