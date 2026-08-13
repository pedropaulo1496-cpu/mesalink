import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import BackofficeNavigation from "@/components/backoffice/BackofficeNavigation";
import BackofficeSignOutButton from "@/components/backoffice/BackofficeSignOutButton";
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#17130F]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-white/10 bg-[#17130F] p-4 text-white lg:flex lg:flex-col">
        <Link href="/backoffice" className="text-[1.35rem] font-semibold tracking-[-0.05em]">
          <span className="text-[#D7B267]">Mesa</span>Link
        </Link>
        <p className="mt-1 text-[8px] font-black uppercase tracking-[0.24em] text-white/35">{staff.role === "ADMIN" ? "HQ · Administração" : "Área comercial"}</p>
        <BackofficeNavigation role={staff.role} variant="desktop" />
        <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.05] p-3">
          <p className="truncate text-[13px] font-bold">{staff.name || staff.email}</p>
          <p className="mt-1 truncate text-[10px] text-white/40">{staff.role === "ADMIN" ? "Administração" : "Comercial"}</p>
          <div className="mt-3"><BackofficeSignOutButton /></div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-56">
        <header className="sticky top-0 z-30 border-b border-[#DCC9AA] bg-[#F4ECDF]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/backoffice" className="text-xl font-semibold tracking-[-0.05em]"><span className="text-[#A97936]">Mesa</span>Link <span className="text-xs tracking-normal text-[#776B5E]">{staff.role === "ADMIN" ? "HQ" : "Staff"}</span></Link>
            {staff.role === "ADMIN" && <Link href="/backoffice/team" className="rounded-full border border-[#D7B267] px-3 py-2 text-xs font-bold">Equipa</Link>}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1320px] px-4 pb-28 pt-5 sm:px-6 sm:pt-6 lg:pb-8">{children}</main>
      </div>
      <BackofficeNavigation role={staff.role} variant="mobile" />
    </div>
  );
}
