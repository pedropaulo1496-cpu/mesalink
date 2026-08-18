import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import BackofficeNavigation from "@/components/backoffice/BackofficeNavigation";
import BackofficeSignOutButton from "@/components/backoffice/BackofficeSignOutButton";
import HqPushNotifications from "@/components/backoffice/HqPushNotifications";
import { requireStaff } from "@/lib/staff-auth";

export const metadata: Metadata = {
  title: "MesaLink Backoffice",
  description: "Aplicação privada da equipa comercial MesaLink.",
  manifest: "/backoffice/manifest.webmanifest",
  robots: { index: false, follow: false },
};

export default async function BackofficeLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="min-h-screen bg-[#F3EEE6] text-[#17130F]" style={{ backgroundImage: "radial-gradient(circle at 85% 3%, rgba(215,178,103,.13), transparent 27rem), radial-gradient(circle at 15% 75%, rgba(78,111,83,.07), transparent 30rem)" }}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden border-r border-white/10 bg-[#17130F] p-4 text-white shadow-[12px_0_40px_rgba(23,19,15,0.08)] lg:flex lg:flex-col">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#D7B267]/10 blur-3xl" />
        <Link href="/backoffice" className="relative flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#D7B267] text-lg font-black text-[#17130F]">M</span><span><span className="block text-[1.3rem] font-semibold tracking-[-0.055em]"><span className="text-[#D7B267]">Mesa</span>Link</span><span className="block text-[7px] font-black uppercase tracking-[0.22em] text-white/30">{staff.role === "ADMIN" ? "HQ · Administração" : "Área comercial"}</span></span></Link>
        <BackofficeNavigation role={staff.role} variant="desktop" />
        <div className="relative mt-auto rounded-[18px] border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur">
          <div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${staff.role === "ADMIN" ? "bg-[#D7B267] text-[#17130F]" : "bg-[#6E8D72] text-white"}`}>{(staff.name || staff.email || "M").charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-[12px] font-bold">{staff.name || staff.email}</p><p className="mt-0.5 truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/35">{staff.role === "ADMIN" ? "Administrador" : "Comercial MesaLink"}</p></div></div>
          <div className="mt-3 border-t border-white/10 pt-3"><BackofficeSignOutButton /></div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#DCC9AA] bg-[#F4ECDF]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/backoffice" className="text-xl font-semibold tracking-[-0.05em]"><span className="text-[#A97936]">Mesa</span>Link <span className="text-xs tracking-normal text-[#776B5E]">{staff.role === "ADMIN" ? "HQ" : "Staff"}</span></Link>
            <div className="flex items-center gap-2">
              <HqPushNotifications />
              {staff.role === "ADMIN" && <Link href="/backoffice/team" className="hidden rounded-full border border-[#D7B267] px-3 py-2 text-xs font-bold sm:inline-flex">Equipa</Link>}
              <BackofficeSignOutButton compact />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1420px] px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-10">{children}</main>
      </div>
      <BackofficeNavigation role={staff.role} variant="mobile" />
    </div>
  );
}
