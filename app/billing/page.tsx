import CheckoutButton from "@/components/CheckoutButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) {
    redirect("/login");
  }

  const subscription =
    user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
        websiteAddon: false,
      },
    }));

  const trialActive =
    subscription.status === "TRIAL" &&
    !hasTrialExpired(subscription.trialEndsAt);

  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const isPro = subscription.status === "ACTIVE" && subscription.plan === "PRO";
  const hasWebsite = subscription.websiteAddon === true;

  const currentPlan = trialActive ? "Trial" : isPro ? "Pro" : "Free";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
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
                Plano e add-ons
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Ative reservas ilimitadas, gestão de mesas e o website
                profissional do restaurante.
              </p>
            </div>

            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              {currentPlan}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Info label="Plano atual" value={currentPlan} />
            <Info
              label="Reservas"
              value={isPro || trialActive ? "Ilimitadas" : "100/mês"}
            />
            <Info
              label="Website"
              value={hasWebsite || trialActive ? "Ativo" : "Inativo"}
            />
          </div>

          {trialActive && (
            <div className="mt-8 rounded-[1.5rem] border border-violet-300/20 bg-violet-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-violet-100">
                Trial ativo: tem acesso total durante mais {trialDaysLeft} dia(s).
                Depois disso, continua no plano Free com até 100 reservas online
                por mês.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <PlanCard
              title="Pro"
              badge={isPro || trialActive ? "Ativo" : "Upgrade"}
              price="10€/mês"
              description="Para restaurantes que querem reservas ilimitadas e controlo avançado da operação."
              features={[
                "Reservas online ilimitadas",
                "Gestão de mesas",
                "Reservas por capacidade",
                "Calendário",
                "Clientes",
              ]}
              active={isPro || trialActive}
              action={
                isPro ? (
                  <ManageSubscriptionButton />
                ) : (
                  <CheckoutButton product="PRO" label="Ativar Pro →" />
                )
              }
            />

            <PlanCard
              title="Website"
              badge={hasWebsite || trialActive ? "Ativo" : "Add-on"}
              price="+10€/mês"
              description="Website profissional para o restaurante com reservas integradas."
              features={[
                "Website profissional",
                "Templates",
                "Menus PDF",
                "Galeria",
                "SEO",
                "Google Maps",
              ]}
              active={hasWebsite || trialActive}
              action={
                hasWebsite ? (
                  <ManageSubscriptionButton />
                ) : (
                  <CheckoutButton
                    product="WEBSITE"
                    label="Ativar Website →"
                  />
                )
              }
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ComingSoon title="IA" icon="🤖" />
            <ComingSoon title="Marketing" icon="📣" />
            <ComingSoon title="QR Ordering" icon="📲" />
            <ComingSoon title="POS" icon="🧾" />
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

function PlanCard({
  title,
  badge,
  price,
  description,
  features,
  active,
  action,
}: {
  title: string;
  badge: string;
  price: string;
  description: string;
  features: string[];
  active: boolean;
  action: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[2rem] border p-6 ${
        active
          ? "border-green-300/20 bg-green-500/10"
          : "border-cyan-300/15 bg-black/25"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.04em]">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
            active
              ? "border-green-300/20 bg-green-400/10 text-green-300"
              : "border-cyan-300/20 bg-cyan-400/10 text-cyan-300"
          }`}
        >
          {badge}
        </span>
      </div>

      <p className="mt-6 text-4xl font-black text-cyan-300">{price}</p>

      <ul className="mt-6 space-y-3 text-sm text-slate-300">
        {features.map((feature) => (
          <li key={feature}>✓ {feature}</li>
        ))}
      </ul>

      <div className="mt-6">{action}</div>
    </div>
  );
}

function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-3xl">{icon}</p>
      <h3 className="mt-3 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">Coming soon</p>
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