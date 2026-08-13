"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function BackofficeSignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/backoffice-access" })}
      className={compact
        ? "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#17130F] px-3 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(23,19,15,0.15)] transition hover:bg-[#2A2118]"
        : "inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-bold text-white transition hover:bg-white/10"}
    >
      <LogOut size={14} /> {compact ? "Sair" : "Terminar sessão"}
    </button>
  );
}
