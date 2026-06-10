"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-red-500/20 px-5 py-3 text-sm font-bold text-red-300 hover:border-red-500/40"
    >
      Sair
    </button>
  );
}