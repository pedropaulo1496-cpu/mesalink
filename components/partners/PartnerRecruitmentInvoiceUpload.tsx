"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { InteractiveUploadSurface } from "@/components/InteractiveUploadSurface";
import { UploadDropzone } from "@/lib/uploadthing";

export default function PartnerRecruitmentInvoiceUpload({ rewardId }: { rewardId: string }) {
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxAmount, setTaxAmount] = useState("23.00");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/partners/recruitment-rewards/${rewardId}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceUrl, invoiceNumber, taxAmount: Number(taxAmount) }),
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Não foi possível anexar a fatura.");
    setMessage("Fatura enviada para verificação.");
    setTimeout(() => window.location.reload(), 700);
  }

  return <div className="mt-3 rounded-2xl border border-[#E2CDA9] bg-[#FFF7E8] p-3">
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#7A592F]"><FileText size={14} /> Receber o prémio</div>
    <p className="mt-1 text-[11px] leading-4 text-[#74685B]">Emite uma fatura à MesaLink no valor de 100 € acrescido do IVA aplicável ao teu regime fiscal e anexa o PDF. Se precisares dos dados fiscais, solicita-os no chat de ajuda.</p>
    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-[#D9C5A3] bg-white p-3 text-center"><Amount label="Base" value="100,00 €" /><Amount label="IVA aplicável" value={`${normalizedTax(taxAmount).toFixed(2).replace(".", ",")} €`} /><Amount label="Total" value={`${(100 + normalizedTax(taxAmount)).toFixed(2).replace(".", ",")} €`} accent /></div>
    <label className="mt-3 block text-[9px] font-black uppercase tracking-[0.1em] text-[#7A592F]">IVA indicado na fatura (€)<input value={taxAmount} onChange={(event) => setTaxAmount(event.target.value)} inputMode="decimal" className="input-premium mt-1 h-10" /></label>
    <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Número da fatura" className="input-premium mt-3 h-10" />
    <div className="mt-3"><InteractiveUploadSurface label="Carregar fatura em PDF" uploading={uploading} progress={progress}><UploadDropzone endpoint="partnerInvoicePdf" appearance={{ container: "min-h-[120px] rounded-2xl border border-dashed border-[#D6C3A5] bg-white p-3", button: "hidden", label: "text-xs font-bold text-[#59452F]", allowedContent: "text-[10px] text-[#8A7863]" }} content={{ label: invoiceUrl ? "Arrasta outro PDF para substituir" : "Arrasta a fatura em PDF diretamente", allowedContent: "Começa automaticamente · ou toca na caixa · até 16MB" }} onUploadBegin={() => { setUploading(true); setProgress(4); setMessage(""); }} onUploadProgress={setProgress} onUploadError={(error) => { setUploading(false); setProgress(0); setMessage(error.message || "Não foi possível carregar o PDF."); }} onClientUploadComplete={(files) => { setUploading(false); setProgress(100); if (files?.[0]?.ufsUrl) setInvoiceUrl(files[0].ufsUrl); }} /></InteractiveUploadSurface></div>
    {invoiceUrl && <p className="mt-2 text-xs font-bold text-[#3F6A4D]">PDF carregado e pronto a guardar.</p>}
    {message && <p className="mt-2 text-xs font-semibold text-[#7A592F]">{message}</p>}
    <button type="button" onClick={save} disabled={loading || !invoiceUrl || !invoiceNumber.trim() || !Number.isFinite(Number(taxAmount)) || Number(taxAmount) < 0 || Number(taxAmount) > 30} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-40">{loading && <Loader2 size={13} className="animate-spin" />} Enviar fatura</button>
  </div>;
}

function normalizedTax(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.min(30, Math.max(0, Math.round(amount * 100) / 100)) : 0;
}

function Amount({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div><p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#8A7863]">{label}</p><p className={`mt-1 text-sm font-bold ${accent ? "text-[#6C4B25]" : ""}`}>{value}</p></div>;
}
