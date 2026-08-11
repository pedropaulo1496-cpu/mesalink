"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, CircleDollarSign, Inbox, Loader2, Mail, MessageCircleMore, Phone, RefreshCw, Send, UserRoundCheck } from "lucide-react";

type Message = { id: string; direction: string; sender: string; channel: string; content: string; status: string; sentAt: string | null; createdAt: string };
type Conversation = {
  id: string; opportunityType: string; channel: string; status: string; contactName: string; contactEmail: string | null; contactPhone: string | null;
  lastMessagePreview: string | null; aiSummary: string | null; nextFollowUpAt: string | null; lastMessageAt: string; estimatedRevenue: number; recoveredRevenue: number; marketingOptIn: boolean; messages: Message[];
};

export default function RevenueInboxClient({ restaurantId, restaurantName, initialCredits, initialEmails, initialConversations }: { restaurantId: string; restaurantName: string; initialCredits: number; initialEmails: number; initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [credits, setCredits] = useState(initialCredits);
  const [emails, setEmails] = useState(initialEmails);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || "");
  const [filter, setFilter] = useState("OPEN");
  const [draft, setDraft] = useState("");
  const [recoveredAmount, setRecoveredAmount] = useState(String(initialConversations[0]?.estimatedRevenue || ""));
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const selected = conversations.find((conversation) => conversation.id === selectedId) || conversations[0];
  const filtered = useMemo(() => conversations.filter((conversation) => filter === "ALL" || (filter === "OPEN" ? !["RECOVERED", "LOST", "ARCHIVED"].includes(conversation.status) : conversation.status === filter)), [conversations, filter]);
  const recovered = conversations.reduce((sum, conversation) => sum + conversation.recoveredRevenue, 0);
  const pipeline = conversations.filter((conversation) => !["RECOVERED", "LOST", "ARCHIVED"].includes(conversation.status)).reduce((sum, conversation) => sum + conversation.estimatedRevenue, 0);

  async function sync() {
    setLoading("sync"); setMessage("");
    const response = await fetch(`/api/restaurants/${restaurantId}/revenue-ai/sync`, { method: "POST" });
    const result = await response.json();
    if (!response.ok) { setLoading(""); return setMessage(result.error || "Não foi possível sincronizar."); }
    window.location.reload();
  }

  async function generateDraft() {
    if (!selected) return;
    setLoading("draft"); setMessage("");
    const response = await fetch(`/api/revenue-ai/conversations/${selected.id}/draft`, { method: "POST" });
    const result = await response.json();
    setLoading("");
    if (!response.ok) return setMessage(result.error || "Não foi possível gerar a resposta.");
    if (typeof result.creditsRemaining === "number") setCredits(result.creditsRemaining);
    setDraft(result.message.content);
    setMessage("Rascunho criado. Revê antes de enviar.");
  }

  async function sendEmail() {
    if (!selected || !draft.trim()) return;
    setLoading("send"); setMessage("");
    const response = await fetch(`/api/revenue-ai/conversations/${selected.id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: draft }) });
    const result = await response.json();
    setLoading("");
    if (!response.ok) return setMessage(result.error || "Não foi possível enviar.");
    if (typeof result.creditsRemaining === "number") setCredits(result.creditsRemaining);
    if (typeof result.emailsRemaining === "number") setEmails(result.emailsRemaining);
    setMessage("Email enviado. Seguimento agendado para 48 horas.");
    setDraft("");
    setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, status: "WAITING_CUSTOMER", lastMessagePreview: result.message.content, messages: [...item.messages, result.message] } : item));
  }

  async function updateStatus(status: string) {
    if (!selected) return;
    const amount = status === "RECOVERED" ? Number(recoveredAmount.replace(",", ".")) : null;
    if (status === "RECOVERED" && (!Number.isFinite(amount) || Number(amount) < 0)) {
      return setMessage("Indica um valor recuperado válido.");
    }
    setLoading(status); setMessage("");
    const response = await fetch(`/api/revenue-ai/conversations/${selected.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, recoveredRevenue: amount }) });
    const result = await response.json();
    setLoading("");
    if (!response.ok) return setMessage(result.error || "Não foi possível atualizar.");
    setConversations((items) => items.map((item) => item.id === selected.id ? { ...item, status, recoveredRevenue: status === "RECOVERED" ? Number(amount) : item.recoveredRevenue } : item));
    setMessage(status === "RECOVERED" ? "Receita recuperada registada." : "Conversa encaminhada para uma pessoa.");
  }

  return <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><Link href={`/restaurants/${restaurantId}/revenue-ai`} className="inline-flex items-center gap-2 text-xs font-bold text-[#806D56]"><ArrowLeft size={14} /> Revenue AI</Link><p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-[#9B6F3B]">Unified inbox</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">Cada oportunidade, uma conversa.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B6258]">{restaurantName} vê leads, cancelamentos, no-shows e clientes inativos num só lugar. A IA prepara; uma pessoa mantém o controlo.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Link href={`/billing?restaurantId=${restaurantId}`} className="inline-flex h-12 items-center justify-center rounded-full border border-[#D4BE99] bg-white px-5 text-sm font-bold text-[#704E27]"><CircleDollarSign size={16} /> {emails} emails · {credits} créditos</Link><button onClick={sync} disabled={loading === "sync"} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white disabled:opacity-50">{loading === "sync" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Detetar oportunidades</button></div></header>

    <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric icon={<CircleDollarSign size={18} />} label="Receita recuperada" value={formatMoney(recovered)} /><Metric icon={<Inbox size={18} />} label="Pipeline em risco" value={formatMoney(pipeline)} /><Metric icon={<MessageCircleMore size={18} />} label="Conversas abertas" value={String(conversations.filter((item) => !["RECOVERED", "LOST", "ARCHIVED"].includes(item.status)).length)} /><Metric icon={<CheckCircle2 size={18} />} label="Recuperadas" value={String(conversations.filter((item) => item.status === "RECOVERED").length)} /></section>

    <section className="mt-6 overflow-hidden rounded-[34px] border border-[#DCCCAD] bg-white shadow-[0_24px_75px_rgba(80,55,30,0.08)] xl:grid xl:min-h-[680px] xl:grid-cols-[390px_1fr]">
      <aside className="border-b border-[#E8DCCB] xl:border-b-0 xl:border-r"><div className="flex gap-2 overflow-x-auto border-b border-[#E8DCCB] p-4">{["OPEN", "NEEDS_HUMAN", "RECOVERED", "ALL"].map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${filter === value ? "bg-[#17120D] text-white" : "bg-[#FFF9F0] text-[#806D56]"}`}>{statusLabel(value)}</button>)}</div><div className="max-h-[420px] overflow-y-auto xl:max-h-[620px]">{filtered.map((conversation) => <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); setDraft(""); setMessage(""); setRecoveredAmount(String(conversation.recoveredRevenue || conversation.estimatedRevenue || "")); }} className={`w-full border-b border-[#F0E7DA] p-4 text-left transition ${selected?.id === conversation.id ? "bg-[#FFF4E2]" : "hover:bg-[#FFFDFC]"}`}><div className="flex items-start gap-3"><ChannelIcon channel={conversation.channel} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{conversation.contactName}</p><p className="text-xs font-bold text-[#795D38]">{formatMoney(conversation.estimatedRevenue)}</p></div><p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#9B6F3B]">{typeLabel(conversation.opportunityType)}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#74695D]">{conversation.lastMessagePreview}</p></div></div></button>)}{filtered.length === 0 && <p className="p-8 text-center text-sm text-[#6B6258]">Sem conversas neste filtro.</p>}</div></aside>

      <div className="min-w-0 p-5 sm:p-7">{selected ? <><div className="flex flex-col gap-4 border-b border-[#E8DCCB] pb-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold">{selected.contactName}</h2><span className="rounded-full bg-[#FFF0D8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#8A6130]">{statusLabel(selected.status)}</span></div><p className="mt-2 text-sm text-[#6B6258]">{selected.contactEmail || selected.contactPhone || "Sem contacto utilizável"} · {typeLabel(selected.opportunityType)}</p></div><div className="text-left sm:text-right"><p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8A7863]">Potencial</p><p className="mt-1 text-xl font-semibold text-[#704E27]">{formatMoney(selected.estimatedRevenue)}</p></div></div>
        <div className="mt-5 rounded-[22px] border border-[#E1D0B8] bg-[#FFF9F0] p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9B6F3B]">Resumo IA</p><p className="mt-2 text-sm leading-6 text-[#5F554B]">{selected.aiSummary}</p></div>
        <div className="mt-5 max-h-60 space-y-3 overflow-y-auto">{selected.messages.map((item) => <div key={item.id} className={`max-w-[88%] rounded-[20px] p-4 text-sm leading-6 ${item.direction === "OUTBOUND" ? "ml-auto bg-[#17120D] text-white" : "bg-[#F1E6D5]"}`}><p>{item.content}</p><p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] opacity-50">{item.sender} · {item.status}</p></div>)}{selected.messages.length === 0 && <p className="py-6 text-center text-sm text-[#8A7C6D]">Ainda não há mensagens. Gera um rascunho para iniciar a conversa.</p>}</div>
        <div className="mt-5"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} placeholder="A mensagem aparece aqui para revisão…" className="input-premium min-h-32 resize-y py-3" /><div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><button onClick={generateDraft} disabled={Boolean(loading)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D4BE99] bg-[#FFF9F0] px-4 text-xs font-bold disabled:opacity-50">{loading === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />} Gerar resposta · 1 crédito</button><button onClick={sendEmail} disabled={Boolean(loading) || !draft.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-40">{loading === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar email · saldo {emails}</button><button onClick={() => updateStatus("NEEDS_HUMAN")} disabled={Boolean(loading)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D4BE99] bg-white px-4 text-xs font-bold"><UserRoundCheck size={14} /> Passar a humano</button><div className="flex min-w-0 items-center rounded-full border border-[#BCD0C1] bg-[#F5FBF6] pl-4 focus-within:ring-2 focus-within:ring-[#3F6A4D]/20"><label htmlFor="recovered-amount" className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] text-[#3F6A4D]">Recuperado €</label><input id="recovered-amount" inputMode="decimal" value={recoveredAmount} onChange={(event) => setRecoveredAmount(event.target.value)} className="h-11 min-w-0 w-20 bg-transparent px-2 text-sm font-bold outline-none" aria-label="Valor realmente recuperado em euros" /><button onClick={() => updateStatus("RECOVERED")} disabled={Boolean(loading)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#3F6A4D] px-4 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={14} /> Confirmar</button></div></div><p className="mt-3 text-[11px] text-[#7A6D60]">1 crédito AI adiciona automaticamente 75 emails quando o saldo chegar a zero.</p>{!selected.marketingOptIn && <p className="mt-3 text-xs text-[#9A6530]">Sem consentimento de marketing: pode gerar um rascunho, mas o envio por email fica bloqueado.</p>}{message && <p className="mt-3 rounded-xl bg-[#FFF4E2] px-3 py-2 text-xs font-semibold text-[#76572F]">{message}</p>}</div>
      </> : <div className="grid min-h-96 place-items-center text-center"><div><Inbox className="mx-auto text-[#9B6F3B]" /><p className="mt-4 font-semibold">Deteta oportunidades para começar.</p></div></div>}</div>
    </section>
  </section>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="rounded-[25px] border border-[#E1D0B8] bg-white p-4"><div className="text-[#9B6F3B]">{icon}</div><p className="mt-4 text-2xl font-semibold">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-[#8A7863]">{label}</p></div>; }
function ChannelIcon({ channel }: { channel: string }) { const icon = channel === "EMAIL" ? <Mail size={16} /> : channel === "PHONE" ? <Phone size={16} /> : <MessageCircleMore size={16} />; return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1E6D5] text-[#8A6130]">{icon}</span>; }
function typeLabel(value: string) { if (value === "NO_SHOW") return "No-show"; if (value === "CANCELLED_RESERVATION") return "Reserva cancelada"; if (value === "INACTIVE_CUSTOMER") return "Cliente inativo"; if (value === "ABANDONED_LEAD") return "Lead abandonado"; return value; }
function statusLabel(value: string) { if (value === "OPEN") return "Abertas"; if (value === "NEW") return "Nova"; if (value === "AI_DRAFTED") return "Rascunho IA"; if (value === "WAITING_CUSTOMER") return "A aguardar"; if (value === "NEEDS_HUMAN") return "Precisa humano"; if (value === "RECOVERED") return "Recuperada"; if (value === "ALL") return "Todas"; return value; }
function formatMoney(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0); }
