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

  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-4xl px-8 py-8">
        <Link href="/dashboard" className="text-sm font-bold text-[#a99a82] hover:text-white">
          ← Voltar ao dashboard
        </Link>

        <section className="mt-8 rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
            Billing
          </p>

          <h1 className="mt-3 text-4xl font-black">Subscrição</h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Info label="Plano" value={subscription.plan} />
            <Info label="Estado" value={subscription.status} />
            <Info label="Preço" value={`${(subscription.priceMonthly / 100).toFixed(2)}€ + IVA / mês`} />
            <Info
              label="Trial termina"
              value={
                subscription.trialEndsAt
                  ? subscription.trialEndsAt.toLocaleDateString("pt-PT")
                  : "Não aplicável"
              }
            />
          </div>

          <div className="mt-8 rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-5 text-[#a99a82]">
            {subscription.status === "ACTIVE"
              ? "A sua subscrição está ativa."
              : "O seu trial está ativo. Ative o Starter para continuar após o período gratuito."}
          </div>

          <div className="mt-6 flex gap-3">
  <ManageSubscriptionButton />

  <Link
    href="/pricing"
    className="flex h-14 items-center justify-center rounded-full border border-[#f0c36a]/20 px-8 font-bold text-white"
  >
    Ver planos
  </Link>
</div>
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f0c36a]/10 bg-black/20 p-5">
      <p className="text-sm text-[#a99a82]">{label}</p>
      <p className="mt-2 text-xl font-black text-[#f0c36a]">{value}</p>
    </div>
  );
}