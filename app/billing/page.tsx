import CheckoutButton from "@/components/CheckoutButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
        websiteAddon: false,
        qrOrderingAddon: false,
      },
    }));

  const now = new Date();

  const trialActive =
    subscription.status === "TRIAL" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt > now;

  const trialDaysLeft = subscription.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const isPro = subscription.status === "ACTIVE" && subscription.plan === "PRO";
  const hasWebsite = subscription.websiteAddon === true;
  const hasQrOrdering = subscription.qrOrderingAddon === true;

  const canUsePro = isPro || Boolean(trialActive);
  const canUseWebsite = hasWebsite || Boolean(trialActive);
  const canUseQrOrdering = hasQrOrdering || Boolean(trialActive);

  const currentPlan = trialActive ? "Trial Completo" : isPro ? "Pro" : "Free";
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
                Plano e add-ons
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                O MesaLink começa com 7 dias de trial completo. Durante o trial,
                pode experimentar Pro, Website e QR Ordering sem configurar
                pagamentos.
              </p>
            </div>

            <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              {currentPlan}
            </span>
          </div>

          {trialActive && (
            <div className="mt-8 rounded-[1.5rem] border border-violet-300/20 bg-violet-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-violet-100">
                Trial completo ativo: ainda tem {trialDaysLeft} dia(s) para
                experimentar reservas ilimitadas, Website e QR Ordering.
              </p>
            </div>
          )}

          {requestedAddon === "qr-ordering" && !canUseQrOrdering && (
            <div className="mt-8 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-500/10 p-5">
              <p className="text-sm font-bold leading-6 text-cyan-100">
                Para usar o QR Ordering depois do trial, ative o add-on por
                +15€/mês.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Info label="Plano atual" value={currentPlan} />
            <Info label="Reservas" value={canUsePro ? "Ilimitadas" : "100/mês"} />
            <Info label="Website" value={canUseWebsite ? "Ativo" : "Inativo"} />
            <Info
              label="QR Ordering"
              value={canUseQrOrdering ? "Ativo" : "Inativo"}
            />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <PlanCard
              title="Pro"
              badge={
                canUsePro
                  ? trialActive && !isPro
                    ? "Incluído no trial"
                    : "Ativo"
                  : "Upgrade"
              }
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
              active={canUsePro}
              highlighted
              action={
                isPro ? (
                  <ManageSubscriptionButton />
                ) : trialActive ? (
                  <Link
                    href={restaurantId ? `/restaurants/${restaurantId}` : "/dashboard"}
                    className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black transition hover:opacity-90"
                  >
                    Abrir Dashboard →
                  </Link>
                ) : (
                  <CheckoutButton product="PRO" label="Ativar Pro →" />
                )
              }
            />

            <PlanCard
              title="Website"
              badge={
                canUseWebsite
                  ? trialActive && !hasWebsite
                    ? "Incluído no trial"
                    : "Ativo"
                  : "Add-on"
              }
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
              active={canUseWebsite}
              action={
                canUseWebsite ? (
                  <Link
                    href={
                      restaurantId
                        ? `/restaurants/${restaurantId}/website`
                        : "/dashboard"
                    }
                    className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-sm font-black text-black transition hover:opacity-90"
                  >
                    Abrir Website →
                  </Link>
                ) : (
                  <CheckoutButton product="WEBSITE" label="Ativar Website →" />
                )
              }
            />

            <PlanCard
              title="QR Ordering"
              badge={
                canUseQrOrdering
                  ? trialActive && !hasQrOrdering
                    ? "Incluído no trial"
                    : "Ativo"
                  : "Add-on"
              }
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
              active={canUseQrOrdering}
              focused={requestedAddon === "qr-ordering"}
              action={
                canUseQrOrdering ? (
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
                  <CheckoutButton
                    product="QR_ORDERING"
                    label="Ativar QR Ordering →"
                  />
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
            className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] ${
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
