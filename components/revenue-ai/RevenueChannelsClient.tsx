"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronDown, Copy, Globe2, Loader2, Mail, MessageCircleMore, PhoneCall, Save, Sparkles } from "lucide-react";

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
  initialRequest: { requestedAt: string; channels: string } | null;
  websiteEnabled: boolean;
  webhookBaseUrl: string;
  whatsappBalance: number;
  aiCredits: number;
};

export default function RevenueChannelsClient({ restaurantId, restaurantName, initial, initialStatus, initialRequest, websiteEnabled, webhookBaseUrl, whatsappBalance, aiCredits }: Props) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [wantsWhatsapp, setWantsWhatsapp] = useState(!initialStatus.whatsappReady);
  const [wantsCalls, setWantsCalls] = useState(false);
  const [contactPhone, setContactPhone] = useState(initial.forwardNumber);
  const [request, setRequest] = useState(initialRequest);
  const [requesting, setRequesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState("");

  function setValue<Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function requestActivation() {
    setRequesting(true);
    setFeedback("");
    const response = await fetch(`/api/restaurants/${restaurantId}/revenue-ai/activation-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wantsWhatsapp, wantsCalls, contactPhone }),
    });
    const result = await response.json().catch(() => ({}));
    setRequesting(false);
    if (!response.ok) return setFeedback(result.error || "Não foi possível enviar o pedido.");
    setRequest({ requestedAt: result.requestedAt, channels: result.channels });
    setFeedback("Pedido recebido. A equipa MesaLink vai preparar os canais e contactar-te.");
  }

  async function saveAdvanced() {
    setSaving(true);
    setFeedback("");
    const response = await fetch(`/api/restaurants/${restaurantId}/revenue-ai/channels`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setFeedback(result.error || "Não foi possível guardar a configuração técnica.");
    if (result.status) setStatus(result.status);
    setFeedback(result.warning || "Configuração técnica guardada.");
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  const whatsappWebhook = `${webhookBaseUrl}/api/revenue-ai/webhooks/twilio/whatsapp`;
  const voiceWebhook = `${webhookBaseUrl}/api/revenue-ai/webhooks/twilio/voice/incoming`;
  const requestPending = Boolean(request && (!status.whatsappReady || request.channels.includes("VOICE") && !status.voiceReady));

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[36px] border border-[#2C2117] bg-[#17120D] text-white shadow-[0_26px_80px_rgba(45,31,18,0.18)]">
      <div className="p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D7B267]">O benefício, sem linguagem técnica</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.055em]">O Revenue AI encontra pessoas que demonstraram interesse, mas ainda não compraram ou não voltaram.</h2><div className="mt-7 grid gap-3 md:grid-cols-3"><Benefit number="1" title="Encontra" text="Deteta leads sem reserva, cancelamentos, no-shows, chamadas perdidas e clientes desaparecidos." /><Benefit number="2" title="Responde" text="Prepara ou envia a mensagem certa por email ou WhatsApp, seguindo as regras do restaurante." /><Benefit number="3" title="Mede" text="Mostra conversas abertas e euros realmente recuperados — não apenas emails enviados." /></div></div>
    </section>

    <section className="rounded-[34px] border border-[#E1D0B8] bg-white p-5 sm:p-8">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">O que já funciona e o que é extra</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Escolhe onde a IA pode falar com o cliente</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B6258]">Não tens de preencher tudo. Email e dados do MesaLink funcionam de imediato; WhatsApp e chamadas são extras pagos e precisam de uma ativação única.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SimpleChannel icon={<Mail size={20} />} title="Email MesaLink" status="Já funciona" text="Follow-up de clientes inativos e respostas individuais pela caixa Revenue AI." price="Usa os 1.000 emails incluídos" active />
        <SimpleChannel icon={<Globe2 size={20} />} title="Reservas e website" status={websiteEnabled ? "Ligado" : "Ligar website"} text="O MesaLink encontra cancelamentos, no-shows e formulários que não chegaram a reserva." price="Sem configuração técnica" active={websiteEnabled} />
        <SimpleChannel icon={<MessageCircleMore size={20} />} title="WhatsApp AI" status={status.whatsappReady ? "Ativo" : request?.channels.includes("WHATSAPP") ? "Pedido recebido" : "Extra opcional"} text="Responde depressa e faz follow-up quando o cliente prefere mensagens." price={`≈ 0,03€ por mensagem · saldo ${whatsappBalance}`} active={status.whatsappReady} pending={request?.channels.includes("WHATSAPP") && !status.whatsappReady} />
        <SimpleChannel icon={<PhoneCall size={20} />} title="Chamadas perdidas" status={status.voiceReady ? "Ativo" : request?.channels.includes("VOICE") ? "Pedido recebido" : "Extra opcional"} text="Se ninguém atender, cria logo uma oportunidade e pode enviar WhatsApp." price={`1 crédito / 2 min · saldo ${aiCredits}`} active={status.voiceReady} pending={request?.channels.includes("VOICE") && !status.voiceReady} />
      </div>
    </section>

    {(!status.whatsappReady || !status.voiceReady) && <section className="rounded-[34px] border border-[#D7B267] bg-[#FFF7E8] p-5 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Ativar extras</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">Só tens de escolher e deixar um contacto.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B6258]">A equipa MesaLink atribui os números, liga o fornecedor e testa tudo para {restaurantName}. Não precisas de criar contas externas nem copiar códigos.</p></div>{requestPending && <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#F1E0B9] px-4 py-2 text-xs font-black text-[#715021]"><CheckCircle2 size={15} /> Pedido em preparação</span>}</div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1.1fr_auto]">
        <Choice checked={wantsWhatsapp} onChange={setWantsWhatsapp} title="Quero WhatsApp AI" note="Cerca de 0,03€ por mensagem enviada" />
        <Choice checked={wantsCalls} onChange={setWantsCalls} title="Quero recuperar chamadas" note="Recebes um número MesaLink que encaminha para ti" />
        <label className="rounded-[22px] border border-[#DFC9A5] bg-white p-4"><span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">O teu contacto</span><input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+351 912 345 678" className="mt-2 h-11 w-full bg-transparent text-sm font-bold outline-none" /><span className="text-[10px] text-[#8A7863]">Para a ativação e para receber chamadas.</span></label>
        <button onClick={requestActivation} disabled={requesting || (!wantsWhatsapp && !wantsCalls)} className="inline-flex min-h-20 items-center justify-center gap-2 rounded-[22px] bg-[#17120D] px-6 text-sm font-black text-white disabled:opacity-40">{requesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Pedir ativação</button>
      </div>
      {request && <p className="mt-4 text-xs font-semibold text-[#72572F]">Pedido enviado em {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.requestedAt))}. A equipa MesaLink vai confirmar preços e ativação antes de existir qualquer custo.</p>}
    </section>}

    {feedback && <p className={`rounded-[22px] border px-5 py-4 text-sm font-semibold ${feedback.toLowerCase().includes("não") ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]" : "border-[#B8D7B9] bg-[#EFF9EF] text-[#3F6A4D]"}`}>{feedback}</p>}

    <details className="group rounded-[28px] border border-[#DCCDB7] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="text-sm font-black">Configuração técnica</p><p className="mt-1 text-xs text-[#7B7064]">Abre apenas se a equipa MesaLink ou um técnico te pedir.</p></div><ChevronDown className="transition group-open:rotate-180" size={18} /></summary>
      <div className="border-t border-[#E8DCCB] p-5 sm:p-7">
        <p className="mb-5 rounded-2xl bg-[#FFF4E2] p-4 text-xs leading-5 text-[#71552F]">Estes campos são números atribuídos pelo MesaLink e identificadores do fornecedor. Não coloques aqui o WhatsApp pessoal do restaurante sem indicação da nossa equipa.</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <AdvancedCard title="WhatsApp"><Toggle checked={form.whatsappEnabled} onChange={(value) => setValue("whatsappEnabled", value)} label="Canal ativo" /><Field label="Número atribuído pelo MesaLink" value={form.whatsappNumber} onChange={(value) => setValue("whatsappNumber", value)} placeholder="+351…" /><Field label="Modelo aprovado (Content SID)" value={form.contentSid} onChange={(value) => setValue("contentSid", value)} placeholder="HX…" /><Toggle checked={form.whatsappAutoReply} onChange={(value) => setValue("whatsappAutoReply", value)} label="Resposta automática AI" /><Webhook value={whatsappWebhook} copied={copied === "whatsapp"} onCopy={() => copy(whatsappWebhook, "whatsapp")} /></AdvancedCard>
          <AdvancedCard title="Chamadas"><Toggle checked={form.voiceEnabled} onChange={(value) => setValue("voiceEnabled", value)} label="Canal ativo" /><Field label="Número atribuído pelo MesaLink" value={form.voiceNumber} onChange={(value) => setValue("voiceNumber", value)} placeholder="+351…" /><Field label="Telefone que deve tocar" value={form.forwardNumber} onChange={(value) => setValue("forwardNumber", value)} placeholder="+351…" /><Toggle checked={form.missedCallAutoReply} onChange={(value) => setValue("missedCallAutoReply", value)} label="WhatsApp após chamada perdida" /><Webhook value={voiceWebhook} copied={copied === "voice"} onCopy={() => copy(voiceWebhook, "voice")} /></AdvancedCard>
        </div>
        <button onClick={saveAdvanced} disabled={saving} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar configuração técnica</button>
      </div>
    </details>
  </div>;
}

function Benefit({ number, title, text }: { number: string; title: string; text: string }) { return <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5"><span className="text-xs font-black text-[#D7B267]">0{number}</span><p className="mt-3 text-lg font-semibold">{title}</p><p className="mt-2 text-xs leading-5 text-white/55">{text}</p></div>; }
function SimpleChannel({ icon, title, status, text, price, active, pending = false }: { icon: React.ReactNode; title: string; status: string; text: string; price: string; active: boolean; pending?: boolean }) { return <article className={`rounded-[26px] border p-5 ${active ? "border-[#B8D7B9] bg-[#F3FAF3]" : pending ? "border-[#D7B267] bg-[#FFF7E8]" : "border-[#E1D0B8] bg-[#FFFDFC]"}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-full ${active ? "bg-[#DDEEDD] text-[#3F6A4D]" : "bg-[#F1E5D2] text-[#8A6130]"}`}>{icon}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${active ? "bg-[#DDEEDD] text-[#3F6A4D]" : pending ? "bg-[#F1E0B9] text-[#715021]" : "bg-[#EFEAE3] text-[#766A5D]"}`}>{status}</span></div><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6B6258]">{text}</p><p className="mt-4 border-t border-[#E8DCCB] pt-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#8A6130]">{price}</p></article>; }
function Choice({ checked, onChange, title, note }: { checked: boolean; onChange: (value: boolean) => void; title: string; note: string }) { return <label className={`flex cursor-pointer gap-3 rounded-[22px] border p-4 ${checked ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#DFC9A5] bg-white"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D7B267]" /><span><span className="block text-sm font-black">{title}</span><span className={`mt-1 block text-[10px] leading-4 ${checked ? "text-white/55" : "text-[#7B7064]"}`}>{note}</span></span></label>; }
function AdvancedCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5"><h3 className="font-black">{title}</h3>{children}</section>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">{label}</span><input className="input-premium" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" /></label>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E5D6C0] bg-white p-4"><span className="text-sm font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#17120D]" /></label>; }
function Webhook({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) { return <button type="button" onClick={onCopy} className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#E5D6C0] bg-white p-3 text-left"><code className="min-w-0 flex-1 truncate text-[10px] text-[#5E5449]">{value}</code>{copied ? <Check size={15} className="shrink-0 text-[#3F6A4D]" /> : <Copy size={15} className="shrink-0 text-[#806D56]" />}</button>; }
