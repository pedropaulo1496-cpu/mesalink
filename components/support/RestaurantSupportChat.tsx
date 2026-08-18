"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Send } from "lucide-react";

type Message = { id: string; body: string; senderRole: string; senderName: string; createdAt: string; readAt: string | null };

export default function RestaurantSupportChat({ restaurantId }: { restaurantId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState("Equipa MesaLink");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/restaurants/${restaurantId}/support`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setMessages(data.messages || []);
    setRecipient(data.recipient || "Equipa MesaLink");
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const response = await fetch(`/api/restaurants/${restaurantId}/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (response.ok) {
      setBody("");
      await load();
    }
    setSending(false);
  }

  return (
    <section className="mx-auto flex h-[calc(100dvh-230px)] min-h-[540px] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[#E3D3BC] bg-white shadow-[0_20px_60px_rgba(72,48,21,0.08)] sm:h-[680px]">
      <header className="flex items-center gap-3 border-b border-[#E7DAC7] bg-[#FFF9F0] p-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#17130F] text-[#D7B267]"><Headphones size={21} /></span>
        <div><h2 className="font-black text-[#17130F]">Ajuda MesaLink</h2><p className="text-xs text-[#776B5E]">Conversa com {recipient}</p></div>
      </header>
      <div className="border-b border-[#E7DAC7] bg-[#F4ECDF] px-5 py-3 text-sm font-semibold text-[#5E4A31]">
        Recebemos a tua mensagem. Iremos responder assim que possível.
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#FFFCF7] p-4 sm:p-6">
        {loading && <p className="py-16 text-center text-sm text-[#776B5E]">A abrir a conversa…</p>}
        {!loading && !messages.length && <p className="mx-auto max-w-md py-20 text-center text-sm leading-6 text-[#776B5E]">Olá! Diz-nos como podemos ajudar. A mensagem será enviada diretamente ao teu comercial ou à equipa de Administração.</p>}
        {messages.map((message) => {
          const own = message.senderRole === "CLIENT";
          return <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[86%] rounded-[22px] px-4 py-3 sm:max-w-[72%] ${own ? "rounded-br-md bg-[#17130F] text-white" : "rounded-bl-md border border-[#E3D3BC] bg-white text-[#17130F]"}`}><p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${own ? "text-[#D7B267]" : "text-[#9B6F3B]"}`}>{own ? "Tu" : message.senderName}</p><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className={`mt-2 text-[9px] ${own ? "text-white/45" : "text-[#8A7C6D]"}`}>{new Date(message.createdAt).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}{own && message.readAt ? " · Lida" : ""}</p></div></div>;
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)_48px] items-center gap-2 border-t border-[#E7DAC7] bg-white p-3 sm:p-4">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={2000} rows={1} placeholder="Escreve a tua mensagem…" className="h-12 w-full resize-none rounded-2xl border border-[#DCC9AA] bg-[#FFFCF7] px-4 py-[13px] text-sm leading-5 outline-none focus:border-[#9B6F3B]" />
        <button disabled={sending || !body.trim()} aria-label="Enviar mensagem" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#17130F] text-white shadow-[0_8px_20px_rgba(23,19,15,0.18)] disabled:opacity-40"><Send size={18} /></button>
      </form>
    </section>
  );
}
