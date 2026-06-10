"use client";

import { useState } from "react";

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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-8">
        <h1 className="text-center text-4xl font-black">
          Mesa<span className="text-[#f0c36a]">Link</span>
        </h1>

        <div className="mt-10 rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8">
          <h2 className="text-3xl font-black">Recuperar password</h2>

          {sent ? (
            <p className="mt-4 text-[#a99a82]">
              Se existir uma conta com esse email, enviámos um link para recuperar a password.
            </p>
          ) : (
            <form action={handleSubmit} className="mt-6 space-y-4">
              <input
                name="email"
                type="email"
                required
                placeholder="O teu email"
                className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-[#fff7ea] outline-none placeholder:text-[#a99a82]"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#f0c36a] px-5 py-4 font-black text-black"
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