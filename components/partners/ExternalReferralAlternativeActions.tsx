"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

export default function ExternalReferralAlternativeActions({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [message, setMessage] = useState("");
  async function respond(action: "ACCEPT" | "REJECT") {
    setLoading(action); setMessage("");
    const response = await fetch(`/api/partner-groups/${groupId}/alternative`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const result = await response.json();
    if (!response.ok) { setLoading(null); return setMessage(result.error || "Não foi possível responder."); }
    window.location.reload();
  }
  return <div className="mt-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => respond("REJECT")} disabled={Boolean(loading)} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#DFC0B2] bg-[#FFF5F0] px-3 text-[9px] font-black text-[#934A35] disabled:opacity-50">{loading === "REJECT" ? <Loader2 size={11} className="animate-spin"/> : <X size={11}/>} Recusar horário</button><button type="button" onClick={() => respond("ACCEPT")} disabled={Boolean(loading)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#315B36] px-3 text-[9px] font-black text-white disabled:opacity-50">{loading === "ACCEPT" ? <Loader2 size={11} className="animate-spin"/> : <Check size={11}/>} Aceitar horário</button></div>{message && <p className="mt-2 text-[9px] font-semibold text-[#A14E36]">{message}</p>}</div>;
}
