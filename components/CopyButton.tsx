"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
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
      onClick={copy}
      className="
        h-11
        w-full
        rounded-full
        bg-[#16120E]
        px-5
        text-sm
        font-semibold
        text-white
        transition-all
        duration-200
        hover:bg-[#2A2118]
        hover:scale-[1.01]
        active:scale-[0.99]
      "
    >
      {copied ? "Link copiado ✓" : "Copiar link"}
    </button>
  );
}