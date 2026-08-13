"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { BarChart3, LockKeyhole, ShieldCheck, Users } from "lucide-react";

const inputClass = "h-11 w-full rounded-xl border border-white/12 bg-white/[0.07] px-3.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#D7B267]";

export default function BackofficeAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(searchParams.get("error") === "access" ? "Esta conta não tem acesso ativo ao HQ." : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await signIn("staff-credentials", {
        email: form.get("email"), password: form.get("password"), redirect: false,
      });
      if (result?.error) {
        setError("Email ou password incorretos para o MesaLink HQ.");
        return;
      }
      router.push("/backoffice");
      router.refresh();
    } catch {
      setError("Não foi possível entrar. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#17130F] text-white lg:grid-cols-[1fr_430px]">
      <section className="hidden min-h-screen flex-col justify-between bg-[#F4ECDF] p-12 text-[#17130F] lg:flex">
        <p className="text-3xl font-semibold tracking-[-0.055em]"><span className="text-[#A97936]">Mesa</span>Link <span className="text-sm tracking-normal text-[#6B6258]">HQ</span></p>
        <div className="max-w-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Aplicação interna</p>
          <h1 className="mt-4 text-6xl font-semibold leading-[0.95] tracking-[-0.075em]">Controlo claro de toda a operação.</h1>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Feature icon={<Users size={18} />} label="Clientes e equipa" />
            <Feature icon={<BarChart3 size={18} />} label="Custos e receita" />
            <Feature icon={<ShieldCheck size={18} />} label="Acesso privado" />
          </div>
        </div>
        <p className="text-xs text-[#8A7C6D]">Administração e comerciais MesaLink.</p>
      </section>

      <section className="flex min-h-screen items-center px-5 py-10 sm:px-10">
        <div className="w-full">
          <p className="text-2xl font-semibold tracking-[-0.05em] lg:hidden"><span className="text-[#D7B267]">Mesa</span>Link HQ</p>
          <span className="mt-9 grid h-11 w-11 place-items-center rounded-2xl bg-[#D7B267] text-[#17130F] lg:mt-0"><LockKeyhole size={20} /></span>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.25em] text-[#D7B267]">Sessão exclusiva HQ</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.06em]">Entrar</h2>
          <p className="mt-3 text-sm leading-6 text-white/50">Usa as credenciais internas atribuídas pela administração MesaLink.</p>
          <form onSubmit={handleSubmit} className="mt-7">
            <div className="space-y-3">
              <input name="email" type="email" required autoComplete="email" placeholder="Email HQ" className={inputClass} />
              <input name="password" type="password" required autoComplete="current-password" placeholder="Password HQ" className={inputClass} />
            </div>
            {error && <p className="mt-3 rounded-xl border border-[#C87559]/40 bg-[#7A2F20]/20 px-3.5 py-3 text-xs font-semibold text-[#F1B6A3]">{error}</p>}
            <button disabled={loading} className="mt-5 h-11 w-full rounded-full bg-[#D7B267] text-sm font-black text-[#17130F] disabled:opacity-50">{loading ? "A entrar…" : "Entrar no HQ"}</button>
          </form>
          <p className="mt-5 text-center text-[11px] leading-5 text-white/35">Sem acesso? Pede um convite à administração. Esta conta é independente do MesaLink Restaurante e Partners.</p>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="rounded-2xl border border-[#DCC9AA] bg-white/55 p-4"><span className="text-[#9B6F3B]">{icon}</span><p className="mt-3 text-xs font-bold">{label}</p></div>;
}
