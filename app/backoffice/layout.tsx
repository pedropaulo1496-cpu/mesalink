import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import BackofficeNavigation from "@/components/backoffice/BackofficeNavigation";
import SignOutButton from "@/components/SignOutButton";
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
    <div className="min-h-screen bg-[#F4ECDF] text-[#17130F]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#17130F] p-5 text-white lg:flex lg:flex-col">
        <Link href="/backoffice" className="text-2xl font-semibold tracking-[-0.05em]">
          <span className="text-[#D7B267]">Mesa</span>Link
        </Link>
        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/35">Backoffice Comercial</p>
        <BackofficeNavigation role={staff.role} variant="desktop" />
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.05] p-3">
          <p className="truncate text-sm font-bold">{staff.name || staff.email}</p>
          <p className="mt-1 truncate text-[10px] text-white/40">{staff.role === "ADMIN" ? "Administração" : "Comercial"}</p>
          <div className="mt-3"><SignOutButton /></div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[#DCC9AA] bg-[#F4ECDF]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/backoffice" className="text-xl font-semibold tracking-[-0.05em]"><span className="text-[#A97936]">Mesa</span>Link <span className="text-xs tracking-normal text-[#776B5E]">Backoffice</span></Link>
            {staff.role === "ADMIN" && <Link href="/backoffice/team" className="rounded-full border border-[#D7B267] px-3 py-2 text-xs font-bold">Equipa</Link>}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 pb-28 pt-5 sm:px-7 sm:pt-8 lg:pb-10">{children}</main>
      </div>
      <BackofficeNavigation role={staff.role} variant="mobile" />
    </div>
  );
}
