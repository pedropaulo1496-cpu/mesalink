import CheckoutButton from "@/components/CheckoutButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasTrialExpired } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type BillingPageProps = {
  searchParams?: Promise<{
    addon?: string;
    restaurantId?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const requestedAddon = params?.addon;
  const restaurantId = params?.restaurantId;

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
        status: "ACTIVE",
        trialEndsAt: null,
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

  const isPro =
    (subscription.status === "ACTIVE" && subscription.plan === "PRO") ||
    trialActive;

  const hasWebsite = subscription.websiteAddon === true;
  const hasQrOrdering = false;

  const currentPlan = isPro ? "Pro" : "Free";

  const backHref = restaurantId ? `/restaurants/${restaurantId}` : "/dashboard";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <Link
          href={backHref}
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
                Plano, trials e add-ons
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                A conta começa sempre no plano Free. Depois pode experimentar
                Pro, Website e QR Ordering durante 7 dias, quando quiser.
              </p>
            </div>

            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              {currentPlan}
            </span>
          </div>

          {requestedAddon === "qr-ordering" && (
            <div className="mt-8 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-cyan-100">
                Para usar o QR Ordering, inicie o trial de 7 dias ou ative o
                add-on por +15€/mês.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Info label="Plano atual" value={currentPlan} />
            <Info label="Reservas" value={isPro ? "Ilimitadas" : "100/mês"} />
            <Info label="Website" value={hasWebsite ? "Ativo" : "Inativo"} />
            <Info
              label="QR Ordering"
              value={hasQrOrdering ? "Ativo" : "Inativo"}
            />
          </div>

          {trialActive && (
            <div className="mt-8 rounded-[1.5rem] border border-violet-300/20 bg-violet-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-violet-100">
                Trial ativo: tem acesso durante mais {trialDaysLeft} dia(s).
                Depois disso, continua no plano Free com até 100 reservas online
                por mês, exceto se ativar uma subscrição.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <PlanCard
              title="Pro"
              badge={isPro ? "Ativo" : "7 dias trial"}
              price="10€/mês"
              description="Reservas ilimitadas, gestão de mesas e controlo avançado da operação."
              features={[
                "Reservas online ilimitadas",
                "Gestão de mesas",
                "Reservas por capacidade",
                "Calendário",
                "Serviço do dia",
                "Clientes",
              ]}
              active={isPro}
              highlighted
              action={
                isPro ? (
                  <ManageSubscriptionButton />
                ) : (
                  <div className="grid gap-3">
                    <TrialButton feature="pro" restaurantId={restaurantId}>
                      Iniciar Trial 7 dias
                    </TrialButton>
                    <CheckoutButton product="PRO" label="Ativar Pro →" />
                  </div>
                )
              }
            />

            <PlanCard
              title="Website"
              badge={hasWebsite ? "Ativo" : "7 dias trial"}
              price="+10€/mês"
              description="Website profissional para o restaurante com reservas integradas."
              features={[
                "Website profissional",
                "Templates premium",
                "Menus PDF",
                "Galeria",
                "SEO básico",
                "Google Maps",
              ]}
              active={hasWebsite}
              action={
                hasWebsite ? (
                  <ManageSubscriptionButton />
                ) : (
                  <div className="grid gap-3">
                    <TrialButton feature="website" restaurantId={restaurantId}>
                      Iniciar Trial 7 dias
                    </TrialButton>
                    <CheckoutButton product="WEBSITE" label="Ativar Website →" />
                  </div>
                )
              }
            />

            <PlanCard
              title="QR Ordering"
              badge={hasQrOrdering ? "Ativo" : "7 dias trial"}
              price="+15€/mês"
              description="Menu digital por QR, pedidos por mesa, chamar empregado e pedir conta."
              features={[
                "Menu digital por QR",
                "Pedidos por mesa",
                "Chamar empregado",
                "Pedir conta",
                "Alertas no painel",
                "Gestão e impressão de QR Codes",
                "Templates de QR",
                "Ativar/desativar funcionalidades",
              ]}
              active={hasQrOrdering}
              focused={requestedAddon === "qr-ordering"}
              action={
                hasQrOrdering ? (
                  <Link
                    href={
                      restaurantId
                        ? `/restaurants/${restaurantId}/ordering`
                        : "/dashboard"
                    }
                    className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black transition hover:opacity-90"
                  >
                    Abrir QR Ordering →
                  </Link>
                ) : (
                  <div className="grid gap-3">
                    <TrialButton
                      feature="qr-ordering"
                      restaurantId={restaurantId}
                    >
                      Iniciar Trial 7 dias
                    </TrialButton>
                    <CheckoutButton
                      product="QR_ORDERING"
                      label="Ativar QR Ordering →"
                    />
                  </div>
                )
              }
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ComingSoon title="IA" icon="🤖" />
            <ComingSoon title="Marketing" icon="📣" />
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
  highlighted,
  focused,
}: {
  title: string;
  badge: string;
  price: string;
  description: string;
  features: string[];
  active: boolean;
  action: React.ReactNode;
  highlighted?: boolean;
  focused?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border p-6 ${
        active
          ? "border-green-300/20 bg-green-500/10"
          : focused
          ? "border-cyan-300/45 bg-cyan-500/10 shadow-[0_0_80px_rgba(34,211,238,0.18)]"
          : highlighted
          ? "border-cyan-300/25 bg-[#06111f]"
          : "border-cyan-300/15 bg-black/25"
      }`}
    >
      {(focused || highlighted) && (
        <div className="absolute -right-16 top-8 h-48 w-48 rounded-full bg-cyan-500/20 blur-[70px]" />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-[-0.04em]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
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
    </div>
  );
}

function TrialButton({
  feature,
  restaurantId,
  children,
}: {
  feature: "pro" | "website" | "qr-ordering";
  restaurantId?: string;
  children: React.ReactNode;
}) {
  const href = restaurantId
    ? `/billing/start-trial?feature=${feature}&restaurantId=${restaurantId}`
    : `/billing/start-trial?feature=${feature}`;

  return (
    <Link
      href={href}
      className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black shadow-[0_0_45px_rgba(96,165,250,0.25)] transition hover:opacity-90"
    >
      {children}
    </Link>
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
