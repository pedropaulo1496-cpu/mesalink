"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function BackofficeSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/backoffice-access" })}
      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-bold text-white transition hover:bg-white/10"
    >
      <LogOut size={14} /> Sair do HQ
    </button>
  );
}
