"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, Search, ShieldCheck } from "lucide-react";

export type PartnerRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  description: string;
  heroImage: string;
  averageTicket: number;
  commissionType: string;
  commissionAmount: number;
  hasAgreement: boolean;
};

export default function NewReferralGroupForm({
  restaurants,
  defaultCommissionType,
  defaultCommissionAmount,
}: {
  restaurants: PartnerRestaurant[];
  defaultCommissionType: string;
  defaultCommissionAmount: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("ALL");
  const [guests, setGuests] = useState(6);
  const [commissionType, setCommissionType] = useState(defaultCommissionType);
  const [commissionAmount, setCommissionAmount] = useState(defaultCommissionAmount);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const cuisines = useMemo(
    () => [...new Set(restaurants.map((restaurant) => restaurant.cuisine).filter(Boolean))].sort(),
    [restaurants],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesCuisine = cuisine === "ALL" || restaurant.cuisine === cuisine;
      const matchesQuery = !normalized || `${restaurant.name} ${restaurant.cuisine} ${restaurant.address}`.toLowerCase().includes(normalized);
      return matchesCuisine && matchesQuery;
    });
  }, [restaurants, query, cuisine]);

  const gross = commissionType === "PER_PERSON" ? guests * commissionAmount : commissionAmount;
  const mesaLinkFee = Math.round(gross * 15) / 100;
  const partnerNet = gross - mesaLinkFee;
  const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);

  function toggle(id: string) {
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 10 ? [...items, id] : items);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (selected.length === 0) {
      setMessage("Escolhe pelo menos um restaurante.");
      return;
    }

    const form = new FormData(event.currentTarget);
    setLoading(true);

    try {
      const response = await fetch("/api/partner-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantIds: selected,
          desiredDate: form.get("desiredDate"),
          alternativeDate: form.get("alternativeDate") || null,
          guests,
          city: form.get("city"),
          area: form.get("area"),
          budgetPerPerson: form.get("budgetPerPerson"),
          occasion: form.get("occasion"),
          accessibility: form.get("accessibility"),
          dietary: form.get("dietary"),
          cuisineTypes: cuisine === "ALL" ? [] : [cuisine],
          commissionType,
          commissionAmount,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Não foi possível publicar o grupo.");
        return;
      }

      setSuccess(true);
      setMessage(`Grupo ${data.publicCode} publicado para ${selected.length} restaurante(s).`);
      setSelected([]);
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      setMessage("Não foi possível publicar o grupo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 xl:grid-cols-[1fr_370px]">
      <div className="space-y-5">
        <div className="rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-7">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]"><ShieldCheck size={16} /> Grupo anónimo</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.045em]">Quando e para quantas pessoas?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Data e hora preferida"><input name="desiredDate" type="datetime-local" required className="input-premium h-12" /></Field>
            <Field label="Data alternativa"><input name="alternativeDate" type="datetime-local" className="input-premium h-12" /></Field>
            <Field label="Número de pessoas"><input value={guests} onChange={(event) => setGuests(Number(event.target.value))} type="number" min="1" max="200" required className="input-premium h-12" /></Field>
            <Field label="Budget por pessoa"><input name="budgetPerPerson" type="number" min="1" step="0.01" placeholder="35" className="input-premium h-12" /></Field>
            <Field label="Cidade"><input name="city" placeholder="Lisboa" className="input-premium h-12" /></Field>
            <Field label="Zona preferida"><input name="area" placeholder="Chiado, centro…" className="input-premium h-12" /></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Ocasião"><select name="occasion" className="input-premium h-12"><option value="NONE">Não indicada</option><option value="BIRTHDAY">Aniversário</option><option value="BUSINESS">Jantar de empresa</option><option value="CELEBRATION">Celebração</option></select></Field>
            <Field label="Acessibilidade"><select name="accessibility" className="input-premium h-12"><option value="NONE">Sem pedido</option><option value="STEP_FREE">Acesso sem degraus</option><option value="WHEELCHAIR">Espaço para cadeira de rodas</option></select></Field>
            <Field label="Alimentação"><select name="dietary" className="input-premium h-12"><option value="NONE">Sem pedido</option><option value="VEGETARIAN">Opções vegetarianas</option><option value="VEGAN">Opções vegan</option><option value="GLUTEN_FREE">Opções sem glúten</option><option value="MIXED">Necessidades variadas</option></select></Field>
          </div>
          <p className="mt-4 rounded-2xl border border-[#D7E4D4] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#4F6C4D]">Não pedimos nem aceitamos nome, telefone ou email do cliente. A comunicação usa apenas o código anónimo do grupo.</p>
        </div>

        <div className="rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Restaurantes</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Escolhe até 10</h2></div><span className="rounded-full bg-[#F1E6D5] px-3 py-1 text-xs font-bold text-[#795D38]">{selected.length} selecionados</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7E6E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, cozinha ou zona" className="input-premium h-12 pl-11" /></label>
            <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="input-premium h-12"><option value="ALL">Todas as cozinhas</option>{cuisines.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filtered.map((restaurant) => {
              const isSelected = selected.includes(restaurant.id);
              return <button key={restaurant.id} type="button" onClick={() => toggle(restaurant.id)} className={`overflow-hidden rounded-[24px] border text-left transition ${isSelected ? "border-[#9E733D] bg-[#FFF7E9] ring-2 ring-[#C8A56A]/25" : "border-[#E1D0B8] bg-[#FFFDFC] hover:border-[#C8A56A]"}`}>
                {restaurant.heroImage && <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.heroImage})` }} />}
                <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{restaurant.name}</p><p className="mt-1 text-xs text-[#776B5E]">{restaurant.cuisine || "Restaurante"} · {restaurant.address || "Portugal"}</p></div><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${isSelected ? "border-[#8A6130] bg-[#8A6130] text-white" : "border-[#D9CAB3]"}`}>{isSelected && <Check size={15} />}</span></div><p className="mt-3 text-xs font-bold text-[#8A6130]">{restaurant.hasAgreement ? "Acordo ativo: " : "Comissão base: "}{restaurant.commissionType === "PER_PERSON" ? `${money(restaurant.commissionAmount)} / pessoa` : `${money(restaurant.commissionAmount)} total`}</p></div>
              </button>;
            })}
            {filtered.length === 0 && <div className="md:col-span-2 rounded-[24px] border border-dashed border-[#D6C3A5] p-8 text-center text-sm text-[#6B6258]">Ainda não existem restaurantes disponíveis com estes filtros.</div>}
          </div>
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[30px] border border-[#2C2117] bg-[#17120D] p-6 text-white">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D7B267]">Comissão proposta</p>
          <div className="mt-5 grid gap-3">
            <select value={commissionType} onChange={(event) => setCommissionType(event.target.value)} className="h-12 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm"><option className="text-black" value="PER_PERSON">Por pessoa</option><option className="text-black" value="TOTAL">Total</option></select>
            <input value={commissionAmount} onChange={(event) => setCommissionAmount(Number(event.target.value))} type="number" min="1" max="1000" step="0.01" className="h-12 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm" />
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm"><MoneyRow label="Comissão bruta" value={money(gross)} /><MoneyRow label="MesaLink · 15%" value={money(mesaLinkFee)} muted /><MoneyRow label="Recebes · 85%" value={money(partnerNet)} strong /></div>
          <p className="mt-4 text-[11px] leading-5 text-white/40">Um acordo pré-definido com o restaurante substitui esta proposta para esse restaurante.</p>
        </div>
        {message && <div className={`rounded-[22px] border p-4 text-sm font-semibold ${success ? "border-[#A8D3A6] bg-[#EFF9EF] text-[#3F6A4D]" : "border-[#EDC7BB] bg-[#FFF0EA] text-[#A14E36]"}`}>{message}</div>}
        <button disabled={loading || selected.length === 0} className="h-14 w-full rounded-full bg-[#C8A56A] px-6 text-sm font-black text-[#17120D] shadow-[0_18px_45px_rgba(156,112,51,0.22)] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "A publicar…" : `Publicar para ${selected.length || 0} restaurante(s)`}</button>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mt-4 block"><span className="mb-2 block text-xs font-bold text-[#655A4E]">{label}</span>{children}</label>;
}

function MoneyRow({ label, value, muted = false, strong = false }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${muted ? "text-white/45" : ""} ${strong ? "border-t border-white/10 pt-3 text-base font-bold text-[#E8C985]" : ""}`}><span>{label}</span><span>{value}</span></div>;
}
