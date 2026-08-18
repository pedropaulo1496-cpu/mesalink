"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, MapPinned, Power } from "lucide-react";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";
import { UploadDropzone } from "@/lib/uploadthing";

type Earning = { groupId: string; restaurantName: string; date: string; amount: number; status: string; invoiceStatus: string; invoiceUrl: string | null };

export default function RestaurantReferralEarnings({ restaurantId, enabled, payoutReady, earnings }: { restaurantId: string; enabled: boolean; payoutReady: boolean; earnings: Earning[] }) {
  const [active, setActive] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function toggle() {
    setSaving(true); setMessage("");
    const response = await fetch(`/api/restaurants/${restaurantId}/nearby-referrals/settings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !active }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível alterar.");
    setActive(!active); setMessage(!active ? "Encaminhamentos ativos." : "Encaminhamentos pausados.");
  }
  return <section className="rounded-[26px] border border-[#D5C29F] bg-[#FFF9ED] p-5 shadow-[0_12px_38px_rgba(88,62,31,0.045)] sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#17120D] text-[#D7B267]"><MapPinned size={19}/></span><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9B6F3B]">Não há mesa aqui, mas há perto</p><h2 className="mt-1 text-xl font-semibold">Recebe comissões quando encaminhas clientes</h2><p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#75695D]">Quando estiveres cheio, mostramos restaurantes MesaLink Partners próximos com mesa real. O restaurante escolhido paga a comissão que definiu; o MesaLink retém a percentagem e os custos habituais.</p></div></div>{payoutReady ? <button type="button" onClick={toggle} disabled={saving} className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-[10px] font-black ${active ? "bg-[#315B36] text-white" : "border border-[#CDBA98] bg-white text-[#6D573A]"}`}>{saving ? <Loader2 size={13} className="animate-spin"/> : <Power size={13}/>} {active ? "Ativo" : "Ativar"}</button> : <form action={`/api/restaurants/${restaurantId}/nearby-referrals/connect`} method="POST"><button className="inline-flex h-10 items-center gap-2 rounded-full bg-[#17120D] px-4 text-[10px] font-black text-white">Adicionar IBAN e ativar <ArrowRight size={13}/></button></form>}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-3"><Step number="1" text="O cliente encontra o teu restaurante cheio."/><Step number="2" text="Escolhe uma mesa próxima e reserva."/><Step number="3" text="Recebes a comissão após enviares a fatura."/></div>
    {message && <p className="mt-3 text-[10px] font-bold text-[#6D573A]">{message}</p>}
    {earnings.length > 0 && <div className="mt-5 border-t border-[#E1D2B9] pt-4"><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#9B6F3B]">Comissões de encaminhamento</p><div className="mt-3 grid gap-2">{earnings.map((earning) => <div key={earning.groupId} className="rounded-[16px] border border-[#E2D5C2] bg-white p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold">{earning.restaurantName}</p><p className="mt-1 text-[9px] text-[#7A6C5D]">{new Date(earning.date).toLocaleString("pt-PT")} · líquido {formatMoney(earning.amount)}</p></div>{earning.invoiceUrl ? <span className="inline-flex items-center gap-1 text-[9px] font-black text-[#3F6A4D]"><CheckCircle2 size={12}/> Fatura {earning.invoiceStatus === "VERIFIED" ? "validada" : "enviada"}</span> : earning.status === "COMPLETED" ? <InvoiceUpload restaurantId={restaurantId} groupId={earning.groupId} amount={earning.amount}/> : <span className="text-[9px] font-bold text-[#806F5C]">Aguarda confirmação da visita</span>}</div></div>)}</div></div>}
  </section>;
}

function Step({ number, text }: { number: string; text: string }) { return <div className="flex items-center gap-2 rounded-[14px] border border-[#E4D5BD] bg-white p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F0E3CF] text-[9px] font-black text-[#805D2E]">{number}</span><p className="text-[9px] leading-4 text-[#6F6253]">{text}</p></div>; }

function InvoiceUpload({ restaurantId, groupId, amount }: { restaurantId: string; groupId: string; amount: number }) {
  const [open, setOpen] = useState(false); const [url, setUrl] = useState(""); const [number, setNumber] = useState(""); const [uploading, setUploading] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  async function save() { setSaving(true); const response = await fetch(`/api/restaurants/${restaurantId}/nearby-referrals/groups/${groupId}/invoice`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceUrl: url, invoiceNumber: number }) }); const result = await response.json(); setSaving(false); if (!response.ok) return setMessage(result.error || "Não foi possível enviar."); window.location.reload(); }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#17120D] px-3 text-[9px] font-black text-white"><FileText size={11}/> Passar fatura · {formatMoney(amount)}</button>;
  return <div className="w-full max-w-sm"><input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Número da fatura" className="mb-2 h-8 w-full rounded-lg border px-2 text-[10px]"/><InteractiveUploadSurface label="PDF" uploading={uploading} progress={uploading ? 35 : url ? 100 : 0}><UploadDropzone endpoint="partnerInvoicePdf" appearance={{ container: "min-h-[34px] rounded-lg border border-dashed p-1", button: "hidden", allowedContent: "hidden", label: "text-[9px]" }} content={{ label: url ? "PDF pronto" : "Escolher fatura PDF", allowedContent: "" }} onUploadBegin={() => setUploading(true)} onUploadError={(error) => { setUploading(false); setMessage(error.message); }} onClientUploadComplete={(files) => { setUploading(false); setUrl(files?.[0]?.ufsUrl || ""); }}/></InteractiveUploadSurface><button type="button" onClick={save} disabled={saving || uploading || !url || !number.trim()} className="mt-2 h-8 rounded-full bg-[#17120D] px-3 text-[9px] font-black text-white disabled:opacity-40">{saving ? "A enviar…" : "Enviar fatura"}</button>{message && <p className="mt-1 text-[9px] text-[#A14E36]">{message}</p>}</div>;
}

function formatMoney(value: number) { return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value || 0); }
