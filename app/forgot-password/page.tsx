"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email"));

    await fetch("/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    setSent(true);
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-semibold tracking-[-0.05em]">
            <span className="text-[#C8A56A]">Mesa</span>
            <span className="text-[#16120E]">Link</span>
          </Link>
        </div>

        <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] sm:p-8">
          <Link href="/login" className="text-sm font-semibold text-[#6B6258] hover:text-[#16120E]">
            ← Voltar ao login
          </Link>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.055em]">
            Recuperar password
          </h1>

          {sent ? (
            <p className="mt-4 rounded-2xl border border-[#9CCB9B] bg-[#ECF7EC] p-4 text-sm leading-6 text-[#3F6A4D]">
              Se existir uma conta com esse email, enviámos um link para recuperar a password.
            </p>
          ) : (
            <form action={handleSubmit} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="O teu email"
                className="h-14 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-[#16120E] outline-none placeholder:text-[#9B8F82] focus:border-[#C8A56A]"
              />

              <button
                type="submit"
                className="flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] font-semibold text-white transition hover:bg-[#2A2118]"
              >
                Enviar link
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}