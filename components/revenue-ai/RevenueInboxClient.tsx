"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, CircleDollarSign, Inbox, Loader2, Mail, MessageCircleMore, Phone, RefreshCw, Send, UserRoundCheck } from "lucide-react";

type Message = { id: string; direction: string; sender: string; channel: string; content: string; status: string; sentAt: string | null; deliveredAt: string | null; readAt: string | null; createdAt: string };
type Conversation = {
  id: string; opportunityType: string; channel: string; status: string; contactName: string; contactEmail: string | null; contactPhone: string | null;
  lastMessagePreview: string | null; aiSummary: string | null; nextFollowUpAt: string | null; lastMessageAt: string; estimatedRevenue: number; recoveredRevenue: number; marketingOptIn: boolean; messages: Message[];
};

export default function RevenueInboxClient({ restaurantId, restaurantName, initialCredits, initialEmails, initialWhatsapp, initialConversations }: { restaurantId: string; restaurantName: string; initialCredits: number; initialEmails: number; initialWhatsapp: number; initialConversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [credits, setCredits] = useState(initialCredits);
  const [emails, setEmails] = useState(initialEmails);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);
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

  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || loading) return;
      const response = await fetch(`/api/restaurants/${restaurantId}/revenue-ai/conversations`, { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;
      const result = await response.json();
      if (Array.isArray(result.conversations)) setConversations(result.conversations);
      if (typeof result.creditsRemaining === "number") setCredits(result.creditsRemaining);
      if (typeof result.emailsRemaining === "number") setEmails(result.emailsRemaining);
      if (typeof result.whatsappRemaining === "number") setWhatsapp(result.whatsappRemaining);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loading, restaurantId]);

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

  async function sendMessage() {
    if (!selected || !draft.trim()) return;
    setLoading("send"); setMessage("");
    const response = await fetch(`/api/revenue-ai/conversations/${selected.id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: draft }) });
    const result = await response.json();
    setLoading("");
    if (!response.ok) return setMessage(result.error || "Não foi possível enviar.");
    if (typeof result.creditsRemaining === "number") setCredits(result.creditsRemaining);
    if (typeof result.emailsRemaining === "number") setEmails(result.emailsRemaining);
    if (typeof result.whatsappRemaining === "number") setWhatsapp(result.whatsappRemaining);
    setMessage(result.channel === "WHATSAPP" ? "WhatsApp aceite pelo fornecedor. A entrega e a leitura aparecem aqui automaticamente." : "Email enviado. Seguimento agendado para 48 horas.");
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

  return (
    <section className="min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link href={`/restaurants/${restaurantId}/revenue-ai`} className="inline-flex items-center gap-2 text-xs font-bold text-[#806D56]"><ArrowLeft size={14} /> Revenue AI</Link>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.26em] text-[#9B6F3B]">Caixa Revenue AI</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">Conversas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-[#6B6258]">WhatsApp, email e oportunidades de {restaurantName}, organizados num só lugar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/billing?restaurantId=${restaurantId}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D4BE99] bg-white px-4 text-xs font-bold text-[#704E27]"><CircleDollarSign size={14} /> {emails} emails · {whatsapp} WhatsApp · {credits} créditos</Link>
          <button onClick={sync} disabled={loading === "sync"} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-50">{loading === "sync" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Atualizar</button>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-[22px] border border-[#DCCCAD] bg-white shadow-[0_12px_35px_rgba(80,55,30,0.04)] lg:grid-cols-4">
        <Metric icon={<CircleDollarSign size={16} />} label="Receita recuperada" value={formatMoney(recovered)} />
        <Metric icon={<Inbox size={16} />} label="Pipeline em risco" value={formatMoney(pipeline)} />
        <Metric icon={<MessageCircleMore size={16} />} label="Conversas abertas" value={String(conversations.filter((item) => !["RECOVERED", "LOST", "ARCHIVED"].includes(item.status)).length)} />
        <Metric icon={<CheckCircle2 size={16} />} label="Recuperadas" value={String(conversations.filter((item) => item.status === "RECOVERED").length)} />
      </section>

      <section className="mt-5 overflow-hidden rounded-[26px] border border-[#DCCCAD] bg-white shadow-[0_20px_55px_rgba(80,55,30,0.07)] xl:grid xl:min-h-[650px] xl:grid-cols-[340px_1fr]">
        <aside className="border-b border-[#E8DCCB] bg-[#FFFCF7] xl:border-b-0 xl:border-r">
          <div className="border-b border-[#E8DCCB] p-4">
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Caixa de entrada</h2><span className="rounded-full bg-[#F1E6D5] px-2.5 py-1 text-[10px] font-black text-[#795D38]">{filtered.length}</span></div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto">{["OPEN", "NEEDS_HUMAN", "RECOVERED", "ALL"].map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] transition ${filter === value ? "bg-[#17120D] text-white" : "border border-[#E4D6C2] bg-white text-[#806D56] hover:border-[#B98A4A]"}`}>{statusLabel(value)}</button>)}</div>
          </div>
          <div className="max-h-[390px] overflow-y-auto xl:max-h-[570px]">
            {filtered.map((conversation) => (
              <button key={conversation.id} onClick={() => { setSelectedId(conversation.id); setDraft(""); setMessage(""); setRecoveredAmount(String(conversation.recoveredRevenue || conversation.estimatedRevenue || "")); }} className={`relative w-full border-b border-[#EFE5D7] px-4 py-3.5 text-left transition ${selected?.id === conversation.id ? "bg-[#FFF1DA]" : "hover:bg-white"}`}>
                {selected?.id === conversation.id && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#B9853E]" />}
                <div className="flex items-start gap-3"><ChannelIcon channel={conversation.channel} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm font-bold">{conversation.contactName}</p><time className="shrink-0 text-[9px] text-[#9A8C7C]">{relativeDate(conversation.lastMessageAt)}</time></div><div className="mt-1 flex items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.09em] text-[#9B6F3B]">{typeLabel(conversation.opportunityType)}</span><span className="h-1 w-1 rounded-full bg-[#C9B79D]" /><span className="truncate text-[9px] font-bold text-[#74695D]">{statusLabel(conversation.status)}</span></div><p className="mt-1.5 line-clamp-2 text-xs leading-4 text-[#74695D]">{conversation.lastMessagePreview || "Sem mensagens"}</p></div></div>
              </button>
            ))}
            {filtered.length === 0 && <div className="grid min-h-56 place-items-center px-8 text-center"><div><Inbox className="mx-auto text-[#B98A4A]" size={24} /><p className="mt-3 text-sm font-bold">Tudo tratado por aqui.</p><p className="mt-1 text-xs leading-5 text-[#7A6D60]">Não existem conversas neste filtro.</p></div></div>}
          </div>
        </aside>

        <div className="min-w-0 bg-[#F7F1E8]">
          {selected ? (
            <div className="flex min-h-[650px] flex-col">
              <header className="flex items-center gap-3 border-b border-[#E8DCCB] bg-white px-4 py-3.5 sm:px-5">
                <ChannelIcon channel={selected.channel} />
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-base font-bold">{selected.contactName}</h2><span className="rounded-full bg-[#FFF0D8] px-2 py-1 text-[8px] font-black uppercase tracking-[0.09em] text-[#8A6130]">{statusLabel(selected.status)}</span></div><p className="mt-0.5 truncate text-[11px] text-[#786D61]">{selected.contactEmail || selected.contactPhone || "Sem contacto"} · {typeLabel(selected.opportunityType)}</p></div>
                <div className="text-right"><p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#9A8C7C]">Potencial</p><p className="mt-0.5 text-sm font-bold text-[#704E27]">{formatMoney(selected.estimatedRevenue)}</p></div>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {selected.aiSummary && <details className="group mx-auto mb-5 max-w-2xl rounded-[18px] border border-[#E1D0B8] bg-[#FFF9F0]/90"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-[#76572F]"><span className="inline-flex items-center gap-2"><Bot size={14} /> Resumo da IA</span><span className="text-[10px] group-open:hidden">Ver ↓</span><span className="hidden text-[10px] group-open:inline">Fechar ↑</span></summary><p className="border-t border-[#E8DCCB] px-4 py-3 text-xs leading-5 text-[#5F554B]">{selected.aiSummary}</p></details>}
                <div className="mx-auto max-w-3xl space-y-3">
                  {selected.messages.map((item) => <div key={item.id} className={`w-fit max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-5 shadow-sm ${item.direction === "OUTBOUND" ? "ml-auto rounded-br-md bg-[#17120D] text-white" : "rounded-bl-md border border-[#E3D7C6] bg-white text-[#2D251E]"}`}><p className="whitespace-pre-wrap">{item.content}</p><p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.09em] opacity-50">{messageStatusLabel(item)} · {messageTime(item)}</p></div>)}
                  {selected.messages.length === 0 && <div className="py-16 text-center"><MessageCircleMore className="mx-auto text-[#B98A4A]" size={28} /><p className="mt-3 text-sm font-bold">Conversa pronta para começar.</p><p className="mt-1 text-xs text-[#7A6D60]">A IA pode preparar a primeira resposta.</p></div>}
                </div>
              </div>

              <div className="border-t border-[#E1D0B8] bg-white p-4 sm:p-5">
                <div className="rounded-[20px] border border-[#DCCCAD] bg-[#FFFCF8] p-3 focus-within:border-[#B98A4A] focus-within:ring-2 focus-within:ring-[#B98A4A]/10"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} placeholder="Escreve uma resposta ou deixa a IA preparar…" className="w-full resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-[#A39484]" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><button onClick={generateDraft} disabled={Boolean(loading)} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D4BE99] bg-white px-3.5 text-[11px] font-bold disabled:opacity-50">{loading === "draft" ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />} Preparar com IA · 1 crédito</button>{selected.channel === "PHONE" ? <Link href={`/restaurants/${restaurantId}/revenue-ai/integrations`} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#8A6130] px-4 text-[11px] font-bold text-white"><Phone size={13} /> Ativar WhatsApp</Link> : <button onClick={sendMessage} disabled={Boolean(loading) || !draft.trim()} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#17120D] px-4 text-[11px] font-bold text-white disabled:opacity-40">{loading === "send" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Enviar</button>}</div></div>
                <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><button onClick={() => updateStatus("NEEDS_HUMAN")} disabled={Boolean(loading)} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D4BE99] bg-white px-3.5 text-[10px] font-bold"><UserRoundCheck size={13} /> Passar a humano</button><div className="flex items-center rounded-full border border-[#BCD0C1] bg-[#F5FBF6] pl-3"><label htmlFor="recovered-amount" className="text-[9px] font-black uppercase tracking-[0.06em] text-[#3F6A4D]">Recuperado €</label><input id="recovered-amount" inputMode="decimal" value={recoveredAmount} onChange={(event) => setRecoveredAmount(event.target.value)} className="h-9 w-16 bg-transparent px-2 text-xs font-bold outline-none" aria-label="Valor realmente recuperado em euros" /><button onClick={() => updateStatus("RECOVERED")} disabled={Boolean(loading)} className="inline-flex h-9 items-center rounded-full bg-[#3F6A4D] px-3 text-[10px] font-bold text-white">Confirmar</button></div></div><p className="text-[10px] text-[#85786A]">{selected.channel === "WHATSAPP" ? `${whatsapp} mensagens disponíveis` : `${emails} emails disponíveis`}</p></div>
                {!selected.marketingOptIn && selected.channel === "EMAIL" && !isReservationFollowUp(selected.opportunityType) && <p className="mt-3 text-xs text-[#9A6530]">Sem consentimento de marketing: o envio por email está bloqueado.</p>}
                {message && <p className="mt-3 rounded-xl bg-[#FFF4E2] px-3 py-2 text-xs font-semibold text-[#76572F]">{message}</p>}
              </div>
            </div>
          ) : <div className="grid min-h-[650px] place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F1E6D5] text-[#9B6F3B]"><Inbox size={24} /></span><p className="mt-4 font-bold">Ainda não há conversas.</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#7A6D60]">As remarcações por email e as respostas de WhatsApp aparecem aqui automaticamente.</p></div></div>}
        </div>
      </section>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="border-b border-r border-[#E8DCCB] p-3.5 last:border-r-0 lg:border-b-0"><div className="flex items-center gap-2 text-[#9B6F3B]">{icon}<p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#8A7863]">{label}</p></div><p className="mt-2 text-xl font-semibold">{value}</p></div>; }
function ChannelIcon({ channel }: { channel: string }) { const icon = channel === "EMAIL" ? <Mail size={16} /> : channel === "PHONE" ? <Phone size={16} /> : <MessageCircleMore size={16} />; return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-[#F1E6D5] text-[#8A6130]">{icon}</span>; }
function typeLabel(value: string) { if (value === "NO_SHOW") return "No-show"; if (value === "CANCELLED_RESERVATION") return "Reserva cancelada"; if (value === "INACTIVE_CUSTOMER") return "Cliente inativo"; if (value === "ABANDONED_LEAD") return "Lead abandonado"; if (value === "MISSED_CALL") return "Chamada não atendida"; if (value === "WHATSAPP_INBOUND") return "WhatsApp recebido"; return value; }
function isReservationFollowUp(value: string) { return ["CANCELLED_RESERVATION", "NO_SHOW"].includes(value); }
function statusLabel(value: string) { if (value === "OPEN") return "Abertas"; if (value === "NEW") return "Nova"; if (value === "AI_DRAFTED") return "Rascunho IA"; if (value === "WAITING_CUSTOMER") return "A aguardar"; if (value === "NEEDS_HUMAN") return "Precisa humano"; if (value === "RECOVERED") return "Recuperada"; if (value === "ALL") return "Todas"; return value; }
function messageStatusLabel(message: Message) { if (message.readAt || message.status === "READ") return "Lida"; if (message.deliveredAt || message.status === "DELIVERED") return "Entregue"; if (message.status === "FAILED") return "Falhou"; if (message.status === "QUEUED" || message.status === "ACCEPTED") return "Em envio"; if (message.status === "RECEIVED") return "Recebida"; if (message.status === "SENT") return "Enviada"; if (message.status === "DRAFT") return "Rascunho"; return message.status; }
function formatMoney(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0); }
function relativeDate(value: string) { const date = new Date(value); const sameDay = date.toDateString() === new Date().toDateString(); return new Intl.DateTimeFormat("pt-PT", sameDay ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }).format(date); }
function messageTime(message: Message) { return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.sentAt || message.createdAt)); }
