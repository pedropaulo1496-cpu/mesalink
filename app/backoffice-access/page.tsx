import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import { authOptions } from "@/lib/auth";
import { getStaffIdentity } from "@/lib/staff-auth";

export const metadata = {
  title: "Acesso ao MesaLink HQ",
  robots: { index: false, follow: false },
};

export default async function BackofficeAccessPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login?callbackUrl=/backoffice");
  const staff = await getStaffIdentity();
  if (staff) redirect("/backoffice");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4ECDF] px-5 py-10 text-[#17130F]">
      <section className="w-full max-w-2xl overflow-hidden rounded-[38px] border border-[#DCC9AA] bg-white shadow-[0_28px_90px_rgba(70,45,20,0.12)]">
        <div className="bg-[#17130F] px-6 py-8 text-white sm:px-10">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#D7B267]/15 p-3 text-[#D7B267]"><ShieldCheck size={24} /></span>
            <div><p className="text-2xl font-semibold tracking-[-0.05em]"><span className="text-[#D7B267]">Mesa</span>Link HQ</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Administração e comerciais</p></div>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <div className="flex items-start gap-4">
            <LockKeyhole className="mt-1 shrink-0 text-[#9B6F3B]" size={23} />
            <div><h1 className="text-3xl font-semibold tracking-[-0.055em]">Entraste com uma conta de restaurante ou parceiro.</h1><p className="mt-3 text-sm leading-6 text-[#6B6258]">O MesaLink Restaurante, o MesaLink Parceiros e o MesaLink HQ são aplicações separadas. Para abrir o HQ, entra com a tua conta de administração ou com uma conta comercial autorizada.</p></div>
          </div>
          <div className="mt-7 rounded-[22px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Conta atualmente ligada</p>
            <p className="mt-2 break-all text-sm font-bold">{session.user.email}</p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <SignOutButton />
            <Link href="/dashboard" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#D7B267] px-5 text-sm font-bold text-[#6F4C25]"><ArrowLeft size={15} /> Voltar à aplicação desta conta</Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-[#8A7C6D]">Ao carregar em “Sair”, serás levado ao login para entrares com a conta correta do HQ. Esta página substitui o antigo erro 404.</p>
        </div>
      </section>
    </main>
  );
}
