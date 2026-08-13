"use client";

import { FormEvent, useState } from "react";

export default function PartnerOnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const response = await fetch("/api/partners/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Não foi possível criar o perfil.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Não foi possível criar o perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <input name="businessName" required placeholder="Nome do hotel ou empresa" className="h-14 w-full rounded-2xl border border-[#DED1BD] bg-[#FFF9F0] px-4 text-sm outline-none focus:border-[#B98A45]" />
      <select name="partnerType" defaultValue="HOTEL" className="h-14 w-full rounded-2xl border border-[#DED1BD] bg-[#FFF9F0] px-4 text-sm outline-none focus:border-[#B98A45]">
        <option value="HOTEL">Hotel / alojamento</option>
        <option value="CONCIERGE">Concierge</option>
        <option value="GUIDE">Guia turístico</option>
        <option value="AGENCY">Agência</option>
        <option value="COMPANY">Empresa</option>
      </select>
      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <select name="commissionType" defaultValue="PER_PERSON" className="h-14 rounded-2xl border border-[#DED1BD] bg-[#FFF9F0] px-4 text-sm outline-none">
          <option value="PER_PERSON">Comissão por pessoa</option>
          <option value="TOTAL">Comissão total</option>
        </select>
        <input name="commissionAmount" type="number" min="1" max="1000" step="0.01" defaultValue="1" required className="h-14 rounded-2xl border border-[#DED1BD] bg-[#FFF9F0] px-4 text-sm outline-none" />
      </div>
      <label className="flex items-start gap-3 text-xs leading-5 text-[#6B6258]"><input name="acceptedTerms" type="checkbox" required className="mt-1 h-4 w-4 accent-[#17120D]" /><span>Aceito os Termos e Condições do MesaLink Partners.</span></label>
      <label className="flex items-start gap-3 text-xs leading-5 text-[#6B6258]"><input name="acceptedPrivacy" type="checkbox" required className="mt-1 h-4 w-4 accent-[#17120D]" /><span>Li a Política de Privacidade e tenho autorização para fornecer o contacto necessário às reservas.</span></label>
      {error && <p className="rounded-2xl bg-[#FFF0EA] px-4 py-3 text-sm font-semibold text-[#A14E36]">{error}</p>}
      <button disabled={loading} className="h-13 w-full rounded-full bg-[#17120D] px-6 text-sm font-black text-white disabled:opacity-50">{loading ? "A preparar…" : "Ativar perfil Partner"}</button>
    </form>
  );
}
