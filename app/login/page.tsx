"use client";

import Footer from "@/components/Footer";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(240,195,106,0.18),transparent_32%),linear-gradient(to_bottom,#070504,#120d08)]" />

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

            <h1 className="mt-6 text-4xl font-black">
              Bem-vindo de volta
            </h1>

            <p className="mt-3 mb-8 text-[#a99a82]">
              Entre na sua conta MesaLink.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
                  required
                />

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
                  required
                />
              </div>

              <div className="mt-3 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-[#f0c36a] hover:text-[#ffd982]"
                >
                  Esqueceste-te da password?
                </Link>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-14 w-full rounded-full bg-[#f0c36a] text-base font-bold text-black hover:bg-[#ffd982] disabled:opacity-60"
              >
                {loading ? "A entrar..." : "Entrar"}
              </button>
            </form>

            <div className="mt-8 border-t border-[#f0c36a]/10 pt-6 text-center">
              <p className="text-sm text-[#a99a82]">
                Ainda não tem conta?
              </p>

              <Link
                href="/register"
                className="mt-2 inline-block font-bold text-[#f0c36a] hover:text-[#ffd982]"
              >
                Criar conta
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#7d725f]">
            Reservas online para restaurantes.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}