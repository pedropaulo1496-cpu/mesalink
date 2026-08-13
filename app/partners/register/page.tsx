"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const inputClass = "h-11 w-full rounded-xl border border-[#DED1BD] bg-[#FFF9F0] px-3.5 text-sm outline-none transition focus:border-[#B98A45]";

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Não foi possível criar a conta.");
        return;
      }

      const result = await signIn("partner-credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/partners/login");
        return;
      }

      router.push("/partners/app");
      router.refresh();
    } catch {
      setError("Não foi possível criar a conta. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5EFE6] px-4 py-8 text-[#17120D] sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link href="/partners" className="text-3xl font-black tracking-[-0.08em]"><span className="text-[#C8A56A]">Mesa</span>Link <span className="text-sm font-semibold tracking-normal text-[#8A6130]">Partners</span></Link>
        <div className="mt-8 overflow-hidden rounded-[36px] border border-[#E1D0B8] bg-white shadow-[0_28px_90px_rgba(80,55,30,0.1)]">
          <div className="bg-[#17120D] p-7 text-white sm:p-9">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">Conta de parceiro</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Começa a enviar grupos.</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">Para hotéis, concierges, influencers, guias, empresas ou particulares. Cada parceiro tem conta pessoal, IBAN verificado e histórico próprio.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="businessName" required placeholder="Nome do parceiro, projeto ou empresa" className={inputClass} />
              <input name="contactName" required placeholder="O teu nome" className={inputClass} />
            </div>
            <select name="partnerType" className={inputClass} defaultValue="" required>
              <option value="" disabled>Escolhe o tipo de parceiro</option>
              <option value="HOTEL">Hotel / alojamento</option>
              <option value="CONCIERGE">Concierge</option>
              <option value="INFLUENCER">Influencer / criador de conteúdo</option>
              <option value="GUIDE">Guia turístico</option>
              <option value="AGENCY">Agência / operador turístico</option>
              <option value="COMPANY">Empresa</option>
              <option value="OTHER">Outro / particular</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="email" type="email" required placeholder="Email profissional" className={inputClass} />
              <input name="password" type="password" minLength={8} required placeholder="Password (mín. 8 caracteres)" className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <select name="commissionType" className={inputClass} defaultValue="PER_PERSON">
                <option value="PER_PERSON">Comissão por pessoa</option>
                <option value="TOTAL">Comissão total</option>
              </select>
              <div className="relative"><input name="commissionAmount" type="number" min="1" max="1000" step="0.01" defaultValue="1" required className={`${inputClass} pr-10`} /><span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#8A6130]">€</span></div>
            </div>
            <div className="rounded-xl border border-[#E4D2B4] bg-[#FFF9ED] px-3.5 py-3 text-[11px] leading-4 text-[#6B6258]">O valor a receber é apresentado líquido, após a comissão MesaLink, taxas e impostos aplicáveis. Os pagamentos são processados após a refeição e a verificação da fatura.</div>
            <label className="flex items-start gap-3 text-xs leading-5 text-[#6B6258]"><input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 accent-[#17120D]" /><span>Aceito os <Link href="/terms" target="_blank" className="font-bold text-[#17120D] underline">Termos e Condições</Link> do MesaLink.</span></label>
            <label className="flex items-start gap-3 text-xs leading-5 text-[#6B6258]"><input name="acceptedPrivacy" type="checkbox" required className="mt-1 h-4 w-4 accent-[#17120D]" /><span>Li a <Link href="/privacy" target="_blank" className="font-bold text-[#17120D] underline">Política de Privacidade</Link> e confirmo que tenho autorização para fornecer o contacto necessário à reserva.</span></label>
            {error && <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-semibold text-[#A14E36]">{error}</p>}
            <button disabled={loading} className="h-13 w-full rounded-full bg-[#17120D] px-6 text-sm font-black text-white disabled:opacity-50">{loading ? "A criar conta…" : "Criar conta Partner"}</button>
            <p className="text-center text-xs text-[#766C61]">Já tens conta? <Link href="/partners/login" className="font-bold text-[#17120D]">Entrar em Partners</Link></p>
          </form>
        </div>
      </div>
    </main>
  );
}
