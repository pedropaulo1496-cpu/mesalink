"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ExternalLink, ImageIcon, MapPin, Search, ShieldCheck, UtensilsCrossed } from "lucide-react";

export type PartnerRestaurant = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  description: string;
  heroImage: string;
  galleryImages: string[];
  highlights: string[];
  menuUrl: string;
  menuSections: Array<{ title: string; items: string[] }>;
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
  const [targetMode, setTargetMode] = useState<"ALL" | "FILTERED" | "SELECTED">("SELECTED");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("ALL");
  const [adults, setAdults] = useState(6);
  const [children, setChildren] = useState(0);
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
      const matchesQuery = !normalized || `${restaurant.name} ${restaurant.cuisine} ${restaurant.address} ${restaurant.description} ${restaurant.highlights.join(" ")}`.toLowerCase().includes(normalized);
      return matchesCuisine && matchesQuery;
    });
  }, [restaurants, query, cuisine]);

  const guests = adults + children;
  const gross = commissionType === "PER_PERSON" ? guests * commissionAmount : commissionAmount;
  const mesaLinkFee = Math.round(gross * 15) / 100;
  const partnerNet = gross - mesaLinkFee;
  const money = (value: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0);

  function toggle(id: string) {
    setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (targetMode === "SELECTED" && selected.length === 0) {
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
          targetMode,
          restaurantQuery: query,
          restaurantCuisine: cuisine,
          desiredDate: form.get("desiredDate"),
          alternativeDate: form.get("alternativeDate") || null,
          adults,
          children,
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
          customerName: form.get("customerName"),
          customerPhone: form.get("customerPhone"),
          customerEmail: form.get("customerEmail"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || "Não foi possível publicar o grupo.");
        return;
      }

      setSuccess(true);
      setMessage(`Grupo ${data.publicCode} publicado para ${data.restaurantCount} restaurante(s).`);
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
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]"><ShieldCheck size={16} /> Contacto protegido</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.045em]">Quando e para quantas pessoas?</h2>
          <div className="mt-5 rounded-[24px] border border-[#D7E4D4] bg-[#F3FAF2] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4F6C4D]">Contacto protegido</p>
            <p className="mt-1 text-xs leading-5 text-[#587255]">Só o restaurante que concluir a autorização do cartão e ficar com a reserva verá estes dados.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><Field label="Nome do cliente"><input name="customerName" required maxLength={100} placeholder="Nome da reserva" className="input-premium h-12" /></Field><Field label="Telemóvel"><input name="customerPhone" required maxLength={30} placeholder="+351 9…" className="input-premium h-12" /></Field><Field label="Email"><input name="customerEmail" type="email" maxLength={160} placeholder="Opcional" className="input-premium h-12" /></Field></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Data e hora preferida"><input name="desiredDate" type="datetime-local" required className="input-premium h-12" /></Field>
            <Field label="Data alternativa"><input name="alternativeDate" type="datetime-local" className="input-premium h-12" /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Adultos"><input value={adults} onChange={(event) => setAdults(Math.max(1, Number(event.target.value)))} type="number" min="1" max="200" required className="input-premium h-12" /></Field><Field label="Crianças"><input value={children} onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))} type="number" min="0" max="199" required className="input-premium h-12" /></Field></div>
            <Field label="Budget por pessoa"><input name="budgetPerPerson" type="number" min="1" step="0.01" placeholder="35" className="input-premium h-12" /></Field>
            <Field label="Cidade"><input name="city" placeholder="Lisboa" className="input-premium h-12" /></Field>
            <Field label="Zona preferida"><input name="area" placeholder="Chiado, centro…" className="input-premium h-12" /></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Ocasião"><select name="occasion" className="input-premium h-12"><option value="NONE">Não indicada</option><option value="BIRTHDAY">Aniversário</option><option value="BUSINESS">Jantar de empresa</option><option value="CELEBRATION">Celebração</option></select></Field>
            <Field label="Acessibilidade"><select name="accessibility" className="input-premium h-12"><option value="NONE">Sem pedido</option><option value="STEP_FREE">Acesso sem degraus</option><option value="WHEELCHAIR">Espaço para cadeira de rodas</option></select></Field>
            <Field label="Alimentação"><select name="dietary" className="input-premium h-12"><option value="NONE">Sem pedido</option><option value="VEGETARIAN">Opções vegetarianas</option><option value="VEGAN">Opções vegan</option><option value="GLUTEN_FREE">Opções sem glúten</option><option value="MIXED">Necessidades variadas</option></select></Field>
          </div>
          <p className="mt-4 rounded-2xl border border-[#D7E4D4] bg-[#F3FAF2] p-4 text-xs leading-5 text-[#4F6C4D]">Enquanto o grupo está aberto, os restaurantes veem apenas os detalhes do pedido. Nome, telefone e email permanecem protegidos até existir uma reserva confirmada.</p>
        </div>

        <div className="rounded-[30px] border border-[#E1D0B8] bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Restaurantes</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">Envia para todos, por filtro ou manualmente</h2></div><span className="rounded-full bg-[#F1E6D5] px-3 py-1 text-xs font-bold text-[#795D38]">{restaurants.length} restaurantes MesaLink</span></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">{([{"value":"ALL","label":"Todos","note":`${restaurants.length} restaurantes`},{"value":"FILTERED","label":"Resultados do filtro","note":`${filtered.length} restaurantes`},{"value":"SELECTED","label":"Escolher manualmente","note":`${selected.length} selecionados`}] as const).map((option) => <button key={option.value} type="button" onClick={() => setTargetMode(option.value)} className={`rounded-[20px] border p-4 text-left ${targetMode === option.value ? "border-[#8A6130] bg-[#FFF3DF] ring-2 ring-[#C8A56A]/20" : "border-[#E1D0B8] bg-white"}`}><span className="block text-sm font-black">{option.label}</span><span className="mt-1 block text-xs text-[#74685B]">{option.note}</span></button>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7E6E]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, cozinha ou zona" className="input-premium h-12 pl-11" /></label>
            <select value={cuisine} onChange={(event) => setCuisine(event.target.value)} className="input-premium h-12"><option value="ALL">Todas as cozinhas</option>{cuisines.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {filtered.map((restaurant) => {
              const isSelected = selected.includes(restaurant.id);
              return <article key={restaurant.id} className={`overflow-hidden rounded-[24px] border transition ${isSelected ? "border-[#9E733D] bg-[#FFF7E9] ring-2 ring-[#C8A56A]/25" : "border-[#E1D0B8] bg-[#FFFDFC] hover:border-[#C8A56A]"}`}>
                <div className="relative">
                  {restaurant.heroImage ? <div className="h-32 bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.heroImage})` }} /> : <div className="grid h-32 place-items-center bg-[#EADCC7] text-[#9B7D57]"><ImageIcon size={24} /></div>}
                  {targetMode === "SELECTED" && <button type="button" aria-pressed={isSelected} onClick={() => toggle(restaurant.id)} className={`absolute right-3 top-3 inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-black shadow-sm ${isSelected ? "bg-[#17120D] text-white" : "border border-white/80 bg-white/95 text-[#4E3B28]"}`}><span className={`grid h-5 w-5 place-items-center rounded-full border ${isSelected ? "border-white/40 bg-white/15" : "border-[#D3BE9C]"}`}>{isSelected && <Check size={12} />}</span>{isSelected ? "Selecionado" : "Escolher"}</button>}
                </div>
                <div className="p-4">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.025em]">{restaurant.name}</p>
                    <p className="mt-1 text-xs font-bold text-[#80613D]">{restaurant.cuisine || "Restaurante"}</p>
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#6B6258]"><MapPin size={14} className="mt-0.5 shrink-0 text-[#9B6F3B]" /><span><span className="font-black text-[#5E4326]">Localização:</span> {restaurant.address || "Portugal"}</span></p>
                  </div>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#6B6258]">{restaurant.description}</p>
                  {restaurant.highlights.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{restaurant.highlights.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-[#F1E6D5] px-2.5 py-1 text-[9px] font-bold text-[#795D38]">{item}</span>)}</div>}
                  <details className="group mt-4 rounded-2xl border border-[#E7DAC7] bg-white px-3.5 py-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold text-[#6E5232]"><span className="inline-flex items-center gap-2"><UtensilsCrossed size={14} /> Ver perfil, imagens e menu</span><span className="transition group-open:rotate-180">⌄</span></summary>
                    <div className="mt-3 border-t border-[#EEE3D3] pt-3">
                      {restaurant.galleryImages.length > 0 && <div className="grid grid-cols-3 gap-2">{restaurant.galleryImages.slice(0, 3).map((image) => <div key={image} className="h-16 rounded-xl bg-[#EADCC7] bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />)}</div>}
                      {restaurant.menuSections.length > 0 && <div className="mt-3 space-y-2">{restaurant.menuSections.slice(0, 3).map((section) => <div key={section.title}><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A6130]">{section.title}</p><p className="mt-1 text-[11px] leading-4 text-[#6B6258]">{section.items.join(" · ")}</p></div>)}</div>}
                      {restaurant.menuUrl && <a href={restaurant.menuUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#7B572B]">Abrir menu completo <ExternalLink size={13} /></a>}
                      {!restaurant.menuUrl && restaurant.menuSections.length === 0 && <p className="text-xs text-[#7A6D60]">O restaurante ainda não publicou o menu.</p>}
                      {restaurant.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noreferrer" className="mt-3 flex w-fit items-center gap-1.5 text-xs font-black text-[#7B572B]"><MapPin size={13} /> Ver localização no mapa <ExternalLink size={12} /></a>}
                    </div>
                  </details>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E9DECE] pt-3"><p className="text-xs font-bold text-[#8A6130]">{restaurant.hasAgreement ? "Acordo ativo" : "Comissão base"}</p><p className="text-sm font-black text-[#5E4326]">{restaurant.commissionType === "PER_PERSON" ? `${money(restaurant.commissionAmount)} / pessoa` : `${money(restaurant.commissionAmount)} total`}</p></div>
                </div>
              </article>;
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
        <button disabled={loading || (targetMode === "SELECTED" && selected.length === 0) || (targetMode === "FILTERED" && filtered.length === 0)} className="h-14 w-full rounded-full bg-[#C8A56A] px-6 text-sm font-black text-[#17120D] shadow-[0_18px_45px_rgba(156,112,51,0.22)] disabled:cursor-not-allowed disabled:opacity-45">{loading ? "A publicar…" : `Publicar para ${targetMode === "ALL" ? restaurants.length : targetMode === "FILTERED" ? filtered.length : selected.length} restaurante(s)`}</button>
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
