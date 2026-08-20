"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";

export default function PartnerHelpButton({ active = false }: { active?: boolean }) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (active) {
      queueMicrotask(() => setUnread(0));
      return;
    }
    async function load() {
      try {
        const response = await fetch("/api/partners/support/unread", { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (response.ok) setUnread(Number(data?.count || 0));
      } catch { /* O botão continua disponível sem ligação temporária. */ }
    }
    void load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [active]);
  return <Link href="/partners/app?tab=help" aria-label="Abrir ajuda e chat" title="Ajuda" className="fixed bottom-4 right-4 z-50 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#17120D] text-[#D7B267] shadow-[0_12px_30px_rgba(23,18,13,.28)] transition hover:scale-105 sm:bottom-5 sm:right-5">
    <CircleHelp size={19} />
    {unread > 0 && <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-[#17120D] bg-red-500" /></span>}
  </Link>;
}
