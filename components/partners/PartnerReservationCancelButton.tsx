"use client";

import { useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PartnerReservationCancelButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [message, setMessage] = useState("");

  async function cancelRequest() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/partner-groups/${groupId}`, { method: "DELETE" }).catch(() => null);
    const result = await response?.json().catch(() => null);
    setLoading(false);
    if (!response?.ok) return setMessage(result?.error || "Não foi possível cancelar o pedido.");
    setCancelled(true);
    setConfirming(false);
    setMessage(result?.restaurantNotified === false
      ? "Pedido cancelado. O link ficou desativado; o aviso por email será reenviado pelo suporte."
      : "Pedido cancelado e restaurante avisado.");
    router.refresh();
  }

  if (cancelled) return <p className="mt-2 text-[9px] font-semibold text-[#3F6A4D]">{message}</p>;

  return <div className="mt-3">
    {!confirming ? <button type="button" onClick={() => { setConfirming(true); setMessage(""); }} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#DFC0B2] bg-[#FFF7F3] px-3 text-[9px] font-bold text-[#934A35]"><Trash2 size={11} /> Cancelar pedido</button> : <div className="max-w-md rounded-[16px] border border-[#E5BFAF] bg-[#FFF5F0] p-3">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black text-[#7D3F30]">Cancelar este pedido?</p><p className="mt-1 text-[9px] leading-4 text-[#806457]">O restaurante será avisado e a ligação que recebeu deixará imediatamente de funcionar.</p></div><button type="button" onClick={() => setConfirming(false)} disabled={loading} aria-label="Manter pedido" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#806457] disabled:opacity-50"><X size={12} /></button></div>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setConfirming(false)} disabled={loading} className="h-8 rounded-full border border-[#D8C6A9] bg-white px-3 text-[9px] font-bold text-[#6E5232] disabled:opacity-50">Manter pedido</button><button type="button" onClick={() => void cancelRequest()} disabled={loading} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#934A35] px-3 text-[9px] font-black text-white disabled:opacity-50">{loading ? <LoaderCircle size={11} className="animate-spin" /> : <Trash2 size={11} />}{loading ? "A cancelar…" : "Sim, cancelar"}</button></div>
    </div>}
    {message && <p className="mt-2 text-[9px] font-semibold text-[#A14E36]">{message}</p>}
  </div>;
}
