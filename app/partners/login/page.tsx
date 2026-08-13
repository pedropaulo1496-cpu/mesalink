"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";

const inputClass = "h-11 w-full rounded-xl border border-[#DCCAAF] bg-[#FFF9F0] px-3.5 text-sm outline-none transition placeholder:text-[#9B8F82] focus:border-[#A97839]";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    try {
      const result = await signIn("partner-credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (result?.error) {
        setError("Email ou password incorretos para o MesaLink Partners.");
        return;
      }
      router.push("/partners/app");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5EFE6] px-4 py-8 text-[#17120D]">
      <div className="w-full max-w-md">
        <Link href="/partners" className="mx-auto flex w-fit items-center gap-2 text-3xl font-black tracking-[-0.08em]">
          <span><span className="text-[#C8A56A]">Mesa</span>Link</span>
          <span className="rounded-full bg-[#E8D8BF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#765027]">Partners</span>
        </Link>

        <section className="mt-7 overflow-hidden rounded-[30px] border border-[#DCCAAF] bg-white shadow-[0_24px_70px_rgba(70,45,20,0.1)]">
          <div className="flex items-center gap-3 bg-[#17120D] px-6 py-5 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#D7B267] text-[#17120D]"><Building2 size={19} /></span>
            <div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#D7B267]">Acesso separado</p><p className="mt-0.5 font-semibold">Conta de parceiro</p></div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-7">
            <h1 className="text-3xl font-semibold tracking-[-0.055em]">Entrar em Partners</h1>
            <p className="mt-2 text-sm leading-6 text-[#6B6258]">Publica pedidos, acompanha reservas, faturas e pagamentos.</p>
            <div className="mt-6 space-y-3">
              <input name="email" type="email" required autoComplete="email" placeholder="Email da conta Partner" className={inputClass} />
              <input name="password" type="password" required autoComplete="current-password" placeholder="Password Partner" className={inputClass} />
            </div>
            {error && <p className="mt-3 rounded-xl border border-[#E7B7A8] bg-[#FFF0EA] px-3.5 py-3 text-xs font-semibold text-[#A14E36]">{error}</p>}
            <button disabled={loading} className="mt-5 h-11 w-full rounded-full bg-[#17120D] text-sm font-black text-white disabled:opacity-50">{loading ? "A entrar…" : "Entrar em Partners"}</button>
            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#6B6258]"><ShieldCheck size={14} className="text-[#4F7A57]" /> Sessão exclusiva desta aplicação</div>
          </form>
        </section>

        <div className="mt-5 flex items-center justify-between gap-4 text-xs">
          <Link href="/partners" className="inline-flex items-center gap-1.5 font-semibold text-[#6B6258]"><ArrowLeft size={13} /> Saber mais</Link>
          <Link href="/partners/register" className="font-black text-[#7A542B]">Criar conta Partner</Link>
        </div>
      </div>
    </main>
  );
}
