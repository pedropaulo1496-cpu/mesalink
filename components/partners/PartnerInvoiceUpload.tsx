"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { UploadDropzone } from "@/lib/uploadthing";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";

type InvoiceRecipient = {
  legalName?: string | null;
  taxId?: string | null;
  addressLine1?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
};

export default function PartnerInvoiceUpload({ groupId, recipient }: { groupId: string; recipient?: InvoiceRecipient }) {
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/partner-groups/${groupId}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceUrl, invoiceNumber }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível anexar a fatura.");
    setMessage("Fatura anexada ao grupo.");
    setTimeout(() => window.location.reload(), 700);
  }

  return <div className="mt-3 rounded-2xl border border-[#E2CDA9] bg-[#FFF7E8] p-3">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#7A592F]"><FileText size={14} /> Fatura obrigatória</div>
    <p className="mt-1 text-[11px] leading-4 text-[#74685B]">Emite a fatura ao restaurante e anexa aqui o PDF para entrar no pagamento semanal.</p>
    {recipient?.legalName && recipient.taxId ? <div className="mt-3 rounded-xl border border-[#E1D0B8] bg-white p-3 text-[11px] leading-5 text-[#5F554A]"><p className="font-black uppercase tracking-[0.1em] text-[#7A592F]">Dados do cliente da fatura</p><p className="mt-1 font-bold">{recipient.legalName}</p><p>NIF/IVA: {recipient.taxId}</p><p>{[recipient.addressLine1, recipient.postalCode, recipient.city, recipient.country].filter(Boolean).join(" · ")}</p></div> : <p className="mt-3 rounded-xl border border-[#E8C8B9] bg-[#FFF0EA] p-3 text-[11px] font-semibold text-[#934A35]">A ficha fiscal do restaurante ainda está a sincronizar com o Stripe. Contacta o MesaLink antes de emitir.</p>}
    <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Número da fatura" className="input-premium mt-3 h-10" />
    <div className="mt-3"><InteractiveUploadSurface label="Carregar fatura em PDF" uploading={uploading} progress={progress}><UploadDropzone endpoint="partnerInvoicePdf" appearance={{ container: "min-h-[120px] rounded-2xl border border-dashed border-[#D6C3A5] bg-white p-3", button: "hidden", label: "text-xs font-bold text-[#59452F]", allowedContent: "text-[10px] text-[#8A7863]" }} content={{ label: invoiceUrl ? "Arrasta outro PDF para substituir" : "Arrasta a fatura em PDF diretamente", allowedContent: "Começa automaticamente · ou toca na caixa · até 16MB" }} onUploadBegin={() => { setUploading(true); setProgress(4); setMessage(""); }} onUploadProgress={setProgress} onUploadError={(uploadError) => { setUploading(false); setProgress(0); setMessage(uploadError.message || "Não foi possível carregar o PDF."); }} onClientUploadComplete={(files) => { setUploading(false); setProgress(100); if (files?.[0]?.ufsUrl) setInvoiceUrl(files[0].ufsUrl); }} /></InteractiveUploadSurface></div>
    {invoiceUrl && <p className="mt-2 text-xs font-bold text-[#3F6A4D]">PDF carregado e pronto a guardar.</p>}
    {message && <p className="mt-2 text-xs font-semibold text-[#7A592F]">{message}</p>}
    <button type="button" onClick={save} disabled={loading || !invoiceUrl || !invoiceNumber.trim() || !recipient?.taxId} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-40">{loading && <Loader2 size={13} className="animate-spin" />} Anexar ao grupo</button>
  </div>;
}
