"use client";

import { useState } from "react";
import { Check, CheckCircle2, ChevronDown, Copy, Globe2, Loader2, Mail, PhoneCall, Save, Sparkles } from "lucide-react";

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
  initialRequest: { requestedAt: string; channels: string; status: string } | null;
  websiteEnabled: boolean;
  webhookBaseUrl: string;
  whatsappBalance: number;
  aiCredits: number;
};

export default function RevenueChannelsClient({ restaurantId, restaurantName, initial, initialStatus, initialRequest, websiteEnabled, webhookBaseUrl, whatsappBalance, aiCredits }: Props) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [wantsWhatsapp, setWantsWhatsapp] = useState(Boolean(initialRequest?.channels.includes("WHATSAPP")));
  const [wantsCalls, setWantsCalls] = useState(Boolean(initialRequest?.channels.includes("VOICE")));
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
    setRequest({ requestedAt: result.requestedAt, channels: result.channels, status: "REQUESTED" });
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
  const requestPending = Boolean(request && ["REQUESTED", "PREPARING"].includes(request.status) && (!status.whatsappReady || request.channels.includes("VOICE") && !status.voiceReady));
  const requestStatusLabel = request?.status === "COMPLETED" ? "Ativação concluída" : request?.status === "PREPARING" ? "Em preparação pela MesaLink" : "Pedido recebido";

  return <div className="space-y-5">
    <section className="rounded-[26px] border border-[#E1D0B8] bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Canais</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">Estado da ligação</h2></div><p className="max-w-xl text-xs leading-5 text-[#6B6258]">O telefone público do restaurante não muda. Só as chamadas não atendidas são encaminhadas para o MesaLink.</p></div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SimpleChannel icon={<Mail size={20} />} title="Email MesaLink" status="Já funciona" text="Follow-up de clientes inativos e respostas individuais pela caixa Revenue AI." price="Usa os 1.000 emails incluídos" active />
        <SimpleChannel icon={<Globe2 size={20} />} title="Reservas e website" status={websiteEnabled ? "Ligado" : "Ligar website"} text="O MesaLink encontra cancelamentos, no-shows e formulários que não chegaram a reserva." price="Sem configuração técnica" active={websiteEnabled} />
        <SimpleChannel icon={<PhoneCall size={20} />} title="Chamadas não atendidas" status={status.voiceReady && status.whatsappReady ? "Ativo" : request?.channels.includes("VOICE") ? requestStatusLabel : "Extra opcional"} text="Deteta a chamada sem resposta e envia automaticamente pelo WhatsApp atribuído o link de reserva. As respostas ficam na caixa Revenue AI." price={`1 crédito por chamada + ≈ 0,03€/mensagem · saldos ${aiCredits}/${whatsappBalance}`} active={status.voiceReady && status.whatsappReady} pending={Boolean(request?.channels.includes("VOICE") && request.status !== "COMPLETED" && (!status.voiceReady || !status.whatsappReady))} />
      </div>
    </section>

    {(!status.whatsappReady || !status.voiceReady) && <section className="rounded-[26px] border border-[#D7B267] bg-[#FFF7E8] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9B6F3B]">Ativar extra</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.045em]">Chamadas não atendidas</h2><p className="mt-1 text-xs leading-5 text-[#6B6258]">Indica o telefone público de {restaurantName}. A MesaLink configura a deteção e o WhatsApp que envia o link de reserva.</p></div>{request && <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#F1E0B9] px-4 py-2 text-xs font-black text-[#715021]"><CheckCircle2 size={15} /> {requestStatusLabel}</span>}</div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.1fr_auto]">
        <Choice checked={wantsCalls} onChange={(checked) => { setWantsCalls(checked); setWantsWhatsapp(checked); }} title="Ativar chamadas não atendidas" note="Inclui a mensagem WhatsApp automática com o link de reserva" />
        <label className="rounded-[22px] border border-[#DFC9A5] bg-white p-4"><span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">Telefone público do restaurante</span><input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+351 213 000 000" inputMode="tel" className="mt-2 h-11 w-full bg-transparent text-sm font-bold outline-none" /><span className="text-[10px] leading-4 text-[#8A7863]">É o número que os clientes já conhecem. Não será substituído.</span></label>
        <button onClick={requestActivation} disabled={requesting || requestPending || (!wantsWhatsapp && !wantsCalls)} className="inline-flex min-h-16 items-center justify-center gap-2 rounded-[18px] bg-[#17120D] px-5 text-sm font-black text-white disabled:opacity-40">{requesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {requestPending ? "Pedido enviado" : "Pedir ativação"}</button>
      </div>
      {request && <p className="mt-4 text-xs font-semibold text-[#72572F]">Pedido enviado em {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.requestedAt))}. A equipa MesaLink vai confirmar preços e ativação antes de existir qualquer custo.</p>}
    </section>}

    {feedback && <p className={`rounded-[22px] border px-5 py-4 text-sm font-semibold ${feedback.toLowerCase().includes("não") ? "border-[#E7B7A8] bg-[#FFF0EA] text-[#A14E36]" : "border-[#B8D7B9] bg-[#EFF9EF] text-[#3F6A4D]"}`}>{feedback}</p>}

    <details className="group rounded-[24px] border border-[#DCCDB7] bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5"><div><p className="text-sm font-black">Configuração técnica</p><p className="mt-1 text-xs text-[#7B7064]">Abre apenas se a equipa MesaLink ou um técnico te pedir.</p></div><ChevronDown className="transition group-open:rotate-180" size={18} /></summary>
      <div className="border-t border-[#E8DCCB] p-5 sm:p-7">
        <p className="mb-5 rounded-2xl bg-[#FFF4E2] p-4 text-xs leading-5 text-[#71552F]">Estes campos são números atribuídos pelo MesaLink e identificadores do fornecedor. Não coloques aqui o WhatsApp pessoal do restaurante sem indicação da nossa equipa.</p>
        <div className="grid gap-6 xl:grid-cols-2">
          <AdvancedCard title="WhatsApp"><Toggle checked={form.whatsappEnabled} onChange={(value) => setValue("whatsappEnabled", value)} label="Canal ativo" /><Field label="Número atribuído pelo MesaLink" value={form.whatsappNumber} onChange={(value) => setValue("whatsappNumber", value)} placeholder="+351…" /><Field label="Modelo aprovado (Content SID)" value={form.contentSid} onChange={(value) => setValue("contentSid", value)} placeholder="HX…" /><Toggle checked={form.whatsappAutoReply} onChange={(value) => setValue("whatsappAutoReply", value)} label="Resposta automática AI" /><Webhook value={whatsappWebhook} copied={copied === "whatsapp"} onCopy={() => copy(whatsappWebhook, "whatsapp")} /></AdvancedCard>
          <AdvancedCard title="Chamadas"><Toggle checked={form.voiceEnabled} onChange={(value) => setValue("voiceEnabled", value)} label="Canal ativo" /><Field label="Número de deteção atribuído pelo MesaLink" value={form.voiceNumber} onChange={(value) => setValue("voiceNumber", value)} placeholder="+351…" /><Field label="Telefone público do restaurante" value={form.forwardNumber} onChange={(value) => setValue("forwardNumber", value)} placeholder="+351 213…" /><Toggle checked={form.missedCallAutoReply} onChange={(value) => setValue("missedCallAutoReply", value)} label="WhatsApp após chamada não atendida" /><Webhook value={voiceWebhook} copied={copied === "voice"} onCopy={() => copy(voiceWebhook, "voice")} /></AdvancedCard>
        </div>
        <button onClick={saveAdvanced} disabled={saving} className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#17120D] px-5 text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar configuração técnica</button>
      </div>
    </details>
  </div>;
}

function SimpleChannel({ icon, title, status, text, price, active, pending = false }: { icon: React.ReactNode; title: string; status: string; text: string; price: string; active: boolean; pending?: boolean }) { return <article className={`rounded-[20px] border p-4 ${active ? "border-[#B8D7B9] bg-[#F3FAF3]" : pending ? "border-[#D7B267] bg-[#FFF7E8]" : "border-[#E1D0B8] bg-[#FFFDFC]"}`}><div className="flex items-center justify-between gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-[#DDEEDD] text-[#3F6A4D]" : "bg-[#F1E5D2] text-[#8A6130]"}`}>{icon}</span><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${active ? "bg-[#DDEEDD] text-[#3F6A4D]" : pending ? "bg-[#F1E0B9] text-[#715021]" : "bg-[#EFEAE3] text-[#766A5D]"}`}>{status}</span></div><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-[11px] leading-4 text-[#6B6258]">{text}</p><p className="mt-3 border-t border-[#E8DCCB] pt-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#8A6130]">{price}</p></article>; }
function Choice({ checked, onChange, title, note }: { checked: boolean; onChange: (value: boolean) => void; title: string; note: string }) { return <label className={`flex cursor-pointer gap-3 rounded-[22px] border p-4 ${checked ? "border-[#17120D] bg-[#17120D] text-white" : "border-[#DFC9A5] bg-white"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D7B267]" /><span><span className="block text-sm font-black">{title}</span><span className={`mt-1 block text-[10px] leading-4 ${checked ? "text-white/55" : "text-[#7B7064]"}`}>{note}</span></span></label>; }
function AdvancedCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-4 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5"><h3 className="font-black">{title}</h3>{children}</section>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-[#79664E]">{label}</span><input className="input-premium" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" /></label>; }
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#E5D6C0] bg-white p-4"><span className="text-sm font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-[#17120D]" /></label>; }
function Webhook({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: () => void }) { return <button type="button" onClick={onCopy} className="flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-2xl border border-[#E5D6C0] bg-white p-3 text-left"><code className="min-w-0 flex-1 truncate text-[10px] text-[#5E5449]">{value}</code>{copied ? <Check size={15} className="shrink-0 text-[#3F6A4D]" /> : <Copy size={15} className="shrink-0 text-[#806D56]" />}</button>; }
