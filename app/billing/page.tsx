import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    redirect("/pricing");
  }

  const subscription = user.subscription;
  const isActive = subscription.status === "ACTIVE";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-slate-400 hover:text-white"
        >
          ← Voltar ao dashboard
        </Link>

        <div className="mt-8 rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Billing
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Subscrição
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                Gerencie o plano ativo, estado da subscrição e acesso ao portal
                de pagamentos.
              </p>
            </div>

            <span
              className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
                isActive
                  ? "border-green-400/20 bg-green-500/10 text-green-300"
                  : "border-cyan-300/20 bg-cyan-500/10 text-cyan-300"
              }`}
            >
              {isActive ? "Ativo" : "Trial"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Info label="Plano" value={subscription.plan} />
            <Info label="Estado" value={subscription.status} />
            <Info
              label="Preço"
              value={`${(subscription.priceMonthly / 100).toFixed(
                2
              )}€ + IVA / mês`}
            />
            <Info
              label="Trial termina"
              value={
                subscription.trialEndsAt
                  ? subscription.trialEndsAt.toLocaleDateString("pt-PT")
                  : "Não aplicável"
              }
            />
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
            <p className="text-sm leading-6 text-slate-300">
              {isActive
                ? "A sua subscrição está ativa. Pode gerir pagamentos, faturas e cancelamento através do portal Stripe."
                : "O seu trial está ativo. Ative o Starter para continuar a usar o MesaLink após o período gratuito."}
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <ManageSubscriptionButton />

            <Link
              href="/pricing"
              className="flex h-14 items-center justify-center rounded-full border border-cyan-300/25 bg-white/5 px-8 text-base font-black text-white backdrop-blur hover:bg-white/10"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 break-words text-xl font-black text-cyan-300">
        {value}
      </p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}