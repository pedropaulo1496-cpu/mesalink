"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function PartnerCodeCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copyCode} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D7C29F] bg-white/75 px-3 text-[9px] font-black text-[#704E27] transition hover:bg-white" aria-label={`Copiar código de parceiro ${code}`}>
      <span className="font-mono tracking-[0.08em]">{code}</span>
      {copied ? <Check size={12} className="text-[#4F7653]" /> : <Copy size={12} />}
      <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
