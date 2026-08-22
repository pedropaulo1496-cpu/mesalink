"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";

export default function AccountDeletionButton({ accountLabel = "MesaLink" }: { accountLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  async function requestDeletion() {
    if (!confirmed || loading) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/account-deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation: "DELETE_ACCOUNT" }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setLoading(false);
    if (!response?.ok) return setMessage(data?.error || "Não foi possível registar o pedido.");
    setSuccess(true);
    setMessage("Pedido de eliminação recebido. A equipa MesaLink vai confirmar a conclusão por email.");
  }

  function close() {
    if (loading) return;
    setOpen(false);
    setConfirmed(false);
    setMessage("");
    setSuccess(false);
  }

  return <>
    <section className="rounded-[24px] border border-[#E4BFB3] bg-[#FFF8F4] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#A14E36]">Conta</p><h2 className="mt-1 text-lg font-semibold text-[#5F2E24]">Eliminar conta</h2><p className="mt-1 max-w-xl text-xs leading-5 text-[#80655F]">Elimina o acesso e os dados associados à conta {accountLabel}. Os documentos que tenham de ser conservados por obrigação legal permanecem apenas durante o prazo aplicável.</p></div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#D59D8D] bg-white px-5 text-[10px] font-bold text-[#934A35]"><Trash2 size={13} /> Eliminar conta</button>
      </div>
    </section>

    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#17120D]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <div className="w-full max-w-md rounded-[26px] border border-[#E4C1B5] bg-white p-5 shadow-[0_28px_90px_rgba(23,18,13,.28)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF0EA] text-[#A14E36]"><AlertTriangle size={20} /></span><button type="button" onClick={close} disabled={loading} aria-label="Fechar" className="grid h-9 w-9 place-items-center rounded-full bg-[#F5EFE6] text-[#75695D]"><X size={15} /></button></div>
        <h2 id="delete-account-title" className="mt-4 text-2xl font-semibold tracking-[-.04em]">Tens a certeza?</h2>
        <p className="mt-2 text-sm leading-6 text-[#6B6258]">A eliminação encerra a conta e remove os dados que já não tenham de ser legalmente conservados. Esta ação não deve ser iniciada por engano.</p>
        {!success && <label className="mt-4 flex items-start gap-3 rounded-[16px] border border-[#E4C1B5] bg-[#FFF8F4] p-3 text-xs font-semibold leading-5 text-[#70463C]"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#934A35]" /> Sim, tenho a certeza de que quero eliminar esta conta.</label>}
        {message && <p className={`mt-4 rounded-[14px] px-3 py-2.5 text-xs font-semibold ${success ? "bg-[#EFF8EF] text-[#3F6A4D]" : "bg-[#FFF0EA] text-[#934A35]"}`}>{message}</p>}
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={close} disabled={loading} className="h-10 rounded-full border border-[#D8C6A9] bg-white px-4 text-[10px] font-bold">{success ? "Fechar" : "Cancelar"}</button>{!success && <button type="button" onClick={() => void requestDeletion()} disabled={!confirmed || loading} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#934A35] px-5 text-[10px] font-bold text-white disabled:opacity-45">{loading ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}{loading ? "A confirmar…" : "Confirmar eliminação"}</button>}</div>
      </div>
    </div>}
  </>;
}
