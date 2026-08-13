"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copiar link",
  copiedLabel = "Link copiado",
  compact = false,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#16120E] font-semibold text-white transition-all duration-200 hover:bg-[#2A2118] active:scale-[0.99] ${compact ? "h-10 w-auto px-4 text-xs" : "h-11 w-full px-5 text-sm hover:scale-[1.01]"}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
