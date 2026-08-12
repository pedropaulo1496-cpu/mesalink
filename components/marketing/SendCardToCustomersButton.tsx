"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Mail, Search, Send, X } from "lucide-react";

type CustomerOption = { id: string; name: string; email: string };

export default function SendCardToCustomersButton({ benefitId, customers }: { benefitId: string; customers: CustomerOption[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => !term || customer.name.toLowerCase().includes(term) || customer.email.toLowerCase().includes(term));
  }, [customers, query]);

  function toggle(customerId: string) {
    setSelected((current) => current.includes(customerId) ? current.filter((id) => id !== customerId) : [...current, customerId]);
  }

  function selectVisible() {
    const visible = filtered.map((customer) => customer.id);
    const allSelected = visible.length > 0 && visible.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !visible.includes(id)) : Array.from(new Set([...current, ...visible])));
  }

  async function send() {
    setSending(true);
    setMessage("");
    const response = await fetch(`/api/referral-benefits/${benefitId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerIds: selected }),
    });
    const result = await response.json().catch(() => null);
    setSending(false);
    if (!response.ok) return setMessage(result?.error || "Não foi possível enviar os cartões.");
    setMessage(`${result.sent} cartão${result.sent === 1 ? "" : "ões"} enviado${result.sent === 1 ? "" : "s"}${result.failed ? ` · ${result.failed} falharam` : ""}.`);
    if (result.sent) setTimeout(() => window.location.reload(), 1100);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={customers.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><Send size={14} /> {customers.length ? "Enviar a clientes" : "Sem clientes elegíveis"}</button>
      {open && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#17120D]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target && !sending) setOpen(false); }}>
        <section className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[30px] border border-[#E1D0B8] bg-[#FFF9F0] shadow-2xl sm:rounded-[30px]">
          <header className="flex items-start justify-between gap-4 border-b border-[#E1D0B8] bg-white p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9B6F3B]">Enviar cartão digital</p><h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Escolhe os clientes</h3><p className="mt-1 text-xs text-[#75695D]">Cada pessoa recebe um número único por email.</p></div><button type="button" onClick={() => setOpen(false)} disabled={sending} className="grid h-9 w-9 place-items-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0]"><X size={15} /></button></header>
          <div className="border-b border-[#E1D0B8] p-4"><div className="flex h-11 items-center gap-2 rounded-2xl border border-[#DCC9AC] bg-white px-3"><Search size={15} className="text-[#9B8267]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por nome ou email" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><div className="mt-3 flex items-center justify-between gap-3"><button type="button" onClick={selectVisible} className="text-xs font-bold text-[#79552B]">{filtered.length && filtered.every((customer) => selected.includes(customer.id)) ? "Desmarcar visíveis" : "Selecionar visíveis"}</button><span className="rounded-full bg-[#F0E2CB] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#76572F]">{selected.length} selecionado{selected.length === 1 ? "" : "s"}</span></div></div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">{filtered.map((customer) => { const checked = selected.includes(customer.id); return <button key={customer.id} type="button" onClick={() => toggle(customer.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${checked ? "border-[#B9853E] bg-[#FFF2D8]" : "border-[#E4D6C2] bg-white"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${checked ? "bg-[#17120D] text-white" : "bg-[#F4EBDD] text-[#8A6130]"}`}>{checked ? <Check size={15} /> : <Mail size={15} />}</span><span className="min-w-0"><strong className="block truncate text-sm">{customer.name}</strong><span className="block truncate text-xs text-[#7A6D60]">{customer.email}</span></span></button>; })}{filtered.length === 0 && <p className="py-10 text-center text-sm text-[#7A6D60]">Nenhum cliente encontrado.</p>}</div>
          <footer className="border-t border-[#E1D0B8] bg-white p-4">{message && <p className="mb-3 rounded-xl bg-[#FFF0E4] px-3 py-2 text-xs font-semibold text-[#845030]">{message}</p>}<button type="button" onClick={send} disabled={sending || selected.length === 0} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#17120D] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {sending ? "A enviar…" : `Enviar ${selected.length || ""} cartão${selected.length === 1 ? "" : "ões"}`}</button><p className="mt-2 text-center text-[10px] text-[#8B7D6D]">Apenas clientes com email e consentimento de marketing aparecem nesta lista.</p></footer>
        </section>
      </div>}
    </>
  );
}
