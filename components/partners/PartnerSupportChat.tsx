"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MessageCircleMore, Send } from "lucide-react";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  senderName: string;
  createdAt: string;
  readAt: string | null;
};

export default function PartnerSupportChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/partners/support", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (response.ok && Array.isArray(data?.messages)) setMessages(data.messages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = body.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    const response = await fetch("/api/partners/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: message }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setBody("");
      await load();
    } else {
      setError(data?.error || "Não foi possível enviar a mensagem.");
    }
    setSending(false);
  }

  return <section className="flex min-h-[620px] w-full min-w-0 flex-col overflow-hidden rounded-[26px] border border-[#D9C7AA] bg-white shadow-[0_14px_40px_rgba(72,48,21,0.06)]">
    <header className="border-b border-[#E2D3BC] bg-[#FFF9F0] px-5 py-4"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9B6F3B]">Ajuda MesaLink</p><h1 className="mt-1 text-2xl font-semibold">Chat com o HQ</h1><p className="mt-1 text-xs text-[#776B5E]">Envia-nos qualquer dúvida. A equipa MesaLink responderá assim que possível.</p></header>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FFFCF7] p-4 sm:p-5">
      {loading && <div className="grid h-full min-h-[280px] place-items-center text-[#8A7863]"><LoaderCircle className="animate-spin" /></div>}
      {!loading && messages.length === 0 && <div className="grid h-full min-h-[280px] place-items-center"><div className="max-w-sm text-center"><MessageCircleMore className="mx-auto text-[#C7A66E]" size={36} /><p className="mt-3 font-bold">Como podemos ajudar?</p><p className="mt-1 text-sm leading-6 text-[#776B5E]">Questões sobre reservas, pagamentos, comissões ou configuração podem ser tratadas aqui.</p></div></div>}
      {messages.map((message) => { const own = message.senderRole === "PARTNER"; return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-[20px] px-4 py-3 sm:max-w-[72%] ${own ? "rounded-br-md bg-[#17120D] text-white" : "rounded-bl-md border border-[#E2D3BC] bg-white"}`}><p className={`mb-1 text-[9px] font-black uppercase tracking-wider ${own ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{own ? "Tu" : message.senderName}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${own ? "text-white/40" : "text-[#8A7C6D]"}`}>{new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(message.createdAt))}{own && message.readAt ? " · Lida" : ""}</p></div></div>; })}
      <div ref={endRef} />
    </div>
    <form onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-2 border-t border-[#E2D3BC] bg-white p-3 sm:p-4"><textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} rows={1} placeholder="Escrever mensagem…" className="h-12 min-w-0 w-full resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none focus:border-[#9B6F3B]" /><button disabled={sending} aria-label="Enviar mensagem" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-white disabled:opacity-50">{sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}</button>{error && <p className="col-span-2 text-xs font-semibold text-[#A14E36]">{error}</p>}</form>
  </section>;
}
