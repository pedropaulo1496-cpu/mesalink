"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function PartnerSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/partners/login" })}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D8C6A9] bg-white px-3 text-[11px] font-bold text-[#6B5440] transition hover:border-[#B98A45] hover:text-[#17120D]"
    >
      <LogOut size={13} />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
