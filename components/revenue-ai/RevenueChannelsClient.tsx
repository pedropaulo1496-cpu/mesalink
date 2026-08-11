"use client";

import { useState } from "react";
import { Check, Copy, Loader2, MessageCircleMore, PhoneCall, Save, ShieldCheck, TriangleAlert } from "lucide-react";

type ChannelStatus = {
  providerConfigured: boolean;
  whatsappConfigured: boolean;
  whatsappReady: boolean;
  whatsappProactiveReady: boolean;
  voiceConfigured: boolean;
  voiceReady: boolean;
};

type Props = {
  restaurantId: string;
  restaurantName: string;
  initial: {
    whatsappEnabled: boolean;
    whatsappNumber: string;
    contentSid: string;
    whatsappAutoReply: boolean;
    voiceEnabled: boolean;
    voiceNumber: string;
    forwardNumber: string;
    missedCallAutoReply: boolean;
    lastError: string;
  };
  initialStatus: ChannelStatus;
  webhookBaseUrl: string;
};

export default function RevenueChannelsClient({ restaurantId, restaurantName, initial, initialStatus, webhookBaseUrl }: Props) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(initial.lastError);
  const [copied, setCopied] = useState("");

  function setValue<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setFeedback("");
    const response = await fetch(`/api/restaurants/${restaurantId}/revenue-ai/channels`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setFeedback(result.error || "Não foi possível guardar a integração.");
    if (result.status) setStatus(result.status);
    setFeedback(result.warning || "Integração guardada e webhooks sincronizados.");
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  const whatsappWebhook = `${webhookBaseUrl}/api/revenue-ai/webhooks/twilio/whatsapp`;
  const voiceWebhook = `${webhookBaseUrl}/api/revenue-ai/webhooks/twilio/voice/incoming`;

  return <div className="space-y-6">
    <section className={`rounded-[28px] border p-5 ${status.providerConfigured ? "border-[#BFD5C2] bg-[#F4FBF5]" : "border-[#E5C8A8] bg-[#FFF7EA]"}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${status.providerConfigured ? "bg-[#D9EBDD] text-[#376348]" : "bg-[#F4DFC3] text-[#946332]"}`}>{status.providerConfigured ? <ShieldCheck size={20} /> : <TriangleAlert size={20} />}</div>
        <div><p className="font-semibold">{status.providerConfigured ? "Conector central autenticado" : "Conector central por ativar"}</p><p className="mt-1 text-sm leading-6 text-[#6C6258]">{status.providerConfigured ? "A ligação segura do MesaLink ao fornecedor está disponível e todos os pedidos recebidos são validados." : "Podes preparar os números. A equipa MesaLink conclui a ligação segura ao fornecedor antes de o canal ficar Ativo."}</p></div>
      </div>
    </section>

    <section className="grid gap-6 xl:grid-cols-2">
      <ChannelCard icon={<MessageCircleMore size={22} />} title="WhatsApp" subtitle="Receber mensagens, responder e recuperar oportunidades" ready={status.whatsappReady} partial={status.whatsappReady && !status.whatsappProactiveReady}>
        <Toggle checked={form.whatsappEnabled} onChange={(value) => setValue("whatsappEnabled", value)} label="Ativar WhatsApp" />
        <Field label="Número WhatsApp" value={form.whatsappNumber} onChange={(value) => setValue("whatsappNumber", value)} placeholder="+351912345678" />
        <Field label="Modelo aprovado Twilio (Content SID)" value={form.contentSid} onChange={(value) => setValue("contentSid", value)} placeholder="HX…" hint="Necessário para o primeiro contacto e para chamadas não atendidas." />
        <Toggle checked={form.whatsappAutoReply} onChange={(value) => setValue("whatsappAutoReply", value)} label="Responder automaticamente com o agente AI" />
        <Webhook label="Webhook de mensagens recebidas" value={whatsappWebhook} copied={copied === "whatsapp"} onCopy={() => copy(whatsappWebhook, "whatsapp")} />
        <div className="rounded-2xl bg-[#F8F0E3] p-4 text-xs leading-5 text-[#685B4B]"><strong>Modelo sugerido:</strong> “Olá {'{{1}}'}, mensagem de {'{{3}}'}: {'{{2}}'}”. Submete-o no Twilio Content Template Builder; a categoria final é decidida pelo WhatsApp.</div>
        <p className="text-[11px] font-semibold text-[#806D56]">Preço MesaLink: 1 crédito por mensagem enviada. Mensagens recebidas entram automaticamente na caixa de entrada.</p>
      </ChannelCard>

      <ChannelCard icon={<PhoneCall size={22} />} title="Chamadas não atendidas" subtitle="Toca no restaurante; se ninguém atender, cria a oportunidade" ready={status.voiceReady}>
        <Toggle checked={form.voiceEnabled} onChange={(value) => setValue("voiceEnabled", value)} label="Ativar chamadas" />
        <Field label="Número MesaLink / Twilio" value={form.voiceNumber} onChange={(value) => setValue("voiceNumber", value)} placeholder="+351210000000" />
        <Field label="Telefone que deve tocar" value={form.forwardNumber} onChange={(value) => setValue("forwardNumber", value)} placeholder="+351912345678" hint={`Telefone real do ${restaurantName}.`} />
        <Toggle checked={form.missedCallAutoReply} onChange={(value) => setValue("missedCallAutoReply", value)} label="Enviar WhatsApp automático quando não atendem" />
        <Webhook label="Webhook de entrada de chamadas" value={voiceWebhook} copied={copied === "voice"} onCopy={() => copy(voiceWebhook, "voice")} />
        <p className="text-[11px] font-semibold text-[#806D56]">Preço MesaLink: 1 crédito por cada 2 minutos iniciados; uma chamada não atendida custa 1 crédito e inclui o follow-up automático quando disponível.</p>
      </ChannelCard>
    </section>

    <div className="sticky bottom-4 z-10 flex flex-col items-stretch justify-between gap-3 rounded-[24px] border border-[#D9C7AA] bg-white/95 p-4 shadow-[0_18px_60px_rgba(55,38,20,0.16)] backdrop-blur sm:flex-row sm:items-center">
      <p className={`text-xs font-semibold ${feedback.toLowerCase().includes("não") || feedback.toLowerCase().includes("falta") ? "text-[#9A6530]" : "text-[#46634B]"}`}>{feedback || "As alterações só entram em funcionamento depois de guardares."}</p>
      <button onClick={save} disabled={saving} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar e ligar</button>
    </div>
  </div>;
}

function ChannelCard({ icon, title, subtitle, ready, partial = false, children }: { icon: React.ReactNode; title: string; subtitle: string; ready: boolean; partial?: boolean; children: React.ReactNode }) {
  return <article className="min-w-0 rounded-[32px] border border-[#DFCDB0] bg-white p-5 shadow-[0_18px_55px_rgba(67,46,23,0.06)] sm:p-7"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F1E5D2] text-[#8A6130]">{icon}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{title}</h2><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${ready ? partial ? "bg-[#FFF0D8] text-[#8A6130]" : "bg-[#E1F2E4] text-[#376348]" : "bg-[#EFEAE3] text-[#766A5D]"}`}>{ready ? partial ? "Receção ativa" : "Ativo" : "Por configurar"}</span></div><p className="mt-1 text-sm text-[#6B6258]">{subtitle}</p></div></div><div className="mt-6 min-w-0 space-y-4">{children}</div></article>;
}

function Field({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; hint?: string }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">{label}</span><input className="input-premium" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />{hint && <span className="mt-1.5 block text-[11px] text-[#7C7165]">{hint}</span>}</label>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E5D6C0] bg-[#FFF9F0] p-4"><span className="text-sm font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#17120D]" /></label>;
}

function Webhook({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return <div className="min-w-0"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">{label}</p><button onClick={onCopy} className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#E5D6C0] bg-[#FAF7F2] p-3 text-left"><code className="min-w-0 flex-1 truncate text-[10px] text-[#5E5449]">{value}</code>{copied ? <Check size={15} className="shrink-0 text-[#3F6A4D]" /> : <Copy size={15} className="shrink-0 text-[#806D56]" />}</button></div>;
}
