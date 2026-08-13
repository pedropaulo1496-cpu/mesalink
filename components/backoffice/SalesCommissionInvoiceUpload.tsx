"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";
import { UploadDropzone } from "@/lib/uploadthing";

export default function SalesCommissionInvoiceUpload({ period, amount }: { period: string; amount: string }) {
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/backoffice/commissions/invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, invoiceUrl, invoiceNumber }),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível anexar a fatura.");
    setMessage("Fatura enviada para verificação.");
    setTimeout(() => window.location.reload(), 600);
  }

  return <div className="mt-2 rounded-xl border border-[#E1CEAD] bg-[#FFF8EC] p-3">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#76552E]"><FileText size={13} /> Fatura obrigatória</p><strong className="text-[12px]">{amount}</strong></div>
    <div className="mt-2 grid gap-2 sm:grid-cols-[170px_1fr]"><input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Número da fatura" className="h-9 rounded-lg border border-[#D6C3A5] bg-white px-3 text-[11px] outline-none" /><InteractiveUploadSurface label="Carregar PDF" uploading={uploading} progress={progress}><UploadDropzone endpoint="partnerInvoicePdf" appearance={{ container: "min-h-[36px] rounded-lg border border-dashed border-[#D6C3A5] bg-white p-1", button: "hidden", label: "text-[10px] font-bold text-[#59452F]", allowedContent: "hidden" }} content={{ label: invoiceUrl ? "PDF pronto · arrasta para substituir" : "Arrasta ou escolhe a fatura PDF", allowedContent: "" }} onUploadBegin={() => { setUploading(true); setProgress(5); setMessage(""); }} onUploadProgress={setProgress} onUploadError={(error) => { setUploading(false); setProgress(0); setMessage(error.message); }} onClientUploadComplete={(files) => { setUploading(false); setProgress(100); if (files?.[0]?.ufsUrl) setInvoiceUrl(files[0].ufsUrl); }} /></InteractiveUploadSurface></div>
    <div className="mt-2 flex items-center justify-between gap-3">{message ? <p className="text-[10px] font-semibold text-[#7A592F]">{message}</p> : <p className="text-[9px] text-[#8A7863]">O saldo continua acumulado até a fatura ser aprovada.</p>}<button type="button" onClick={save} disabled={saving || uploading || !invoiceUrl || !invoiceNumber.trim()} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#17130F] px-3 text-[10px] font-bold text-white disabled:opacity-40">{saving && <Loader2 size={11} className="animate-spin" />} Enviar</button></div>
  </div>;
}
