import CheckoutButton from "@/components/CheckoutButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";
import UpgradeToGrowthButton from "@/components/UpgradeToGrowthButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type BillingPageProps = {
  searchParams?: Promise<{
    restaurantId?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
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
        plan: "ESSENTIALS",
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        restaurantLimit: 1,
        priceMonthly: 0,
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
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const activePlan = String(subscription.plan || "").toUpperCase();
  const isEssentials =
    subscription.status === "ACTIVE" && activePlan === "ESSENTIALS";
  const isGrowth = subscription.status === "ACTIVE" && activePlan === "GROWTH";
  const hasActiveSubscription = isEssentials || isGrowth;

  const currentPlan = trialActive
    ? "Trial completo"
    : isGrowth
      ? "Growth"
      : isEssentials
        ? "Essentials"
        : "Sem plano ativo";

  const backHref = restaurantId ? `/restaurants/${restaurantId}` : "/dashboard";
  const trialProgress = trialActive ? Math.min(100, Math.round(((7 - trialDaysLeft) / 7) * 100)) : 0;

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-[#16120E]">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="rounded-full border border-[#E1D0B8] bg-white px-4 py-2 text-sm font-semibold text-[#6B6258] transition hover:text-[#16120E]"
          >
            ← Voltar ao dashboard
          </Link>

          <span className="hidden rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#9B6F3B] sm:inline-flex">
            MesaLink Billing
          </span>
        </div>

        <section className="mt-8 overflow-hidden rounded-[44px] border border-[#D8C5A5] bg-[#FFF9F0] shadow-[0_30px_110px_rgba(80,55,30,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-[#9B6F3B]">
                Growth. Visibility. Control.
              </p>

              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-6xl">
                Escolha o plano certo para fazer crescer o restaurante.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6B6258]">
                Todos os planos incluem Website, Reservas, QR Ordering, CRM,
                Reviews e operação integrada. O Growth adiciona Marketing para
                recuperar clientes e aumentar visitas recorrentes.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-4">
                <Info label="Plano atual" value={currentPlan} />
                <Info
                  label="Trial"
                  value={trialActive ? `${trialDaysLeft} dias` : "Terminado"}
                />
                <Info label="Comissões" value="0€" />
                <Info label="Pagamento anual" value="1 mês grátis" />
              </div>
            </div>

            <div className="border-t border-[#D8C5A5] bg-[#17130F] p-7 text-white lg:border-l lg:border-t-0 sm:p-10">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D8C5A5]">
                    Estado da conta
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
                    {currentPlan}
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-white/62">
                    {trialActive
                      ? "Está a experimentar todas as funcionalidades da MesaLink."
                      : hasActiveSubscription
                        ? "A sua subscrição está ativa."
                        : "Escolha um plano para continuar a usar a plataforma."}
                  </p>
                </div>

                <TrialRing percentage={trialActive ? trialProgress : hasActiveSubscription ? 100 : 0} />
              </div>

              {trialActive && (
                <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.07] p-5">
                  <p className="font-semibold text-[#D8C5A5]">
                    Trial completo ativo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Ainda tem {trialDaysLeft} dia(s) para testar Website, QR
                    Ordering, CRM, Reviews e Marketing antes de escolher plano.
                  </p>
                </div>
              )}

              {isEssentials && (
                <div className="mt-8 rounded-[28px] border border-[#D8C5A5]/30 bg-[#D8C5A5]/10 p-5">
                  <p className="font-semibold text-[#D8C5A5]">
                    Upgrade disponível
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Ative o Growth por apenas +20€/mês (até ao lançamento do POS). Mantém a mesma data de
                    renovação e o Stripe calcula a diferença proporcional.
                  </p>
                  <div className="mt-4">
                    <UpgradeToGrowthButton />
                  </div>
                </div>
              )}

              {hasActiveSubscription && (
                <div className="mt-8">
                  <ManageSubscriptionButton />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-2">
          <PlanCard
            title="Essentials"
            badge={isEssentials ? "Plano atual" : "Plano base"}
            price="55€"
            yearlyPrice="605€"
            description="Para restaurantes que querem centralizar reservas, website, QR Ordering, CRM, reviews e operação num único sistema."
            features={[
              "Mais reservas diretas",
              "Website premium incluído",
              "QR Ordering incluído",
              "CRM de clientes",
              "Google Reviews",
              "Mapa de mesas",
              "Relatórios essenciais",
              "Sem comissões por reserva",
            ]}
            active={trialActive || isEssentials}
            action={
              isEssentials ? (
                <Link
                  href={backHref}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
                >
                  Plano atual · Abrir Dashboard →
                </Link>
              ) : (
               <div className="grid gap-2 sm:grid-cols-2">
                  <CheckoutButton
                    product="ESSENTIALS"
                    billing="MONTHLY"
                    label="Mensal 55€ →"
                    variant="dark"
                  />
                  <CheckoutButton
                    product="ESSENTIALS"
                    billing="YEARLY"
                    label="Anual 605€ →"
                    variant="outline"
                  />
                </div>
              )
            }
          />

          <PlanCard
            title="Growth"
            badge={isGrowth ? "Plano atual" : "Mais recomendado"}
            price="75€"
            yearlyPrice="825€"
            description="Para restaurantes que querem recuperar clientes, promover dias fracos e aumentar visitas recorrentes com Marketing."
            features={[
              "Tudo do Essentials",
              "Marketing MesaLink incluído",
              "Recuperar clientes inativos",
              "Campanhas para dias fracos",
              "Clientes em risco",
              "Aniversários automáticos",
              "Fidelização VIP",
              "Mais visitas recorrentes",
            ]}
            active={trialActive || isGrowth}
            highlighted
            action={
              isGrowth ? (
                <Link
                  href={backHref}
                  className="flex h-14 w-full items-center justify-center rounded-full bg-[#17130F] px-8 text-base font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
                >
                  Plano atual · Abrir Dashboard →
                </Link>
              ) : isEssentials ? (
                <div className="rounded-[24px] border border-[#D8C5A5]/35 bg-white/[0.06] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#D8C5A5]">
                        Upgrade
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                        +20€/mês (até ao lançamento do POS)
                      </p>
                      <p className="mt-1 text-xs text-white/62">
                        Mantém a data de renovação atual.
                      </p>
                    </div>

                    <UpgradeToGrowthButton />
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <CheckoutButton
                    product="GROWTH"
                    billing="MONTHLY"
                    label="Mensal 75€ →"
                    variant="gold"
                  />
                  <CheckoutButton
                    product="GROWTH"
                    billing="YEARLY"
                    label="Anual 825€ →"
                    variant="goldOutline"
                  />
                </div>
              )
            }
          />
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[34px] border border-[#D8C5A5] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
              Restaurant Essentials
            </p>

            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
              Uma plataforma viva para restaurantes.
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              A MesaLink continuará a lançar novas ferramentas para ajudar
              restaurantes a crescer, ganhar visibilidade e simplificar a
              operação diária.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniFeature title="Mais receita" text="QR Ordering + Marketing" />
              <MiniFeature title="Mais visibilidade" text="Website + Reviews" />
              <MiniFeature title="Mais controlo" text="CRM + Reservas" />
              <MiniFeature title="0€ comissões" text="Reservas diretas" />
            </div>
          </div>

          <div className="rounded-[34px] border border-[#D8C5A5] bg-[#FFF9F0] p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)]">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
              Faturação fiscal
            </p>

            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.055em]">
              POS fiscal tratado fora da MesaLink.
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              A faturação/POS fiscal é tratada externamente pelo Moloni ou por
              outro software certificado. Esse custo não é cobrado pela
              MesaLink.
            </p>

            <p className="mt-4 rounded-2xl border border-[#D8C5A5] bg-white px-4 py-3 text-sm font-semibold text-[#16120E]">
              A MesaLink mantém reservas, clientes, QR Ordering, website,
              reviews e marketing ligados na mesma operação.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-semibold tracking-[-0.04em] text-[#16120E]">
        {value}
      </p>
    </div>
  );
}

function TrialRing({ percentage }: { percentage: number }) {
  const safePercentage = Math.max(0, Math.min(100, percentage));
  const circle = 2 * Math.PI * 22;
  const offset = circle - (safePercentage / 100) * circle;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="22"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r="22"
          stroke="#D8C5A5"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circle}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#D8C5A5]">
        {safePercentage}%
      </div>
    </div>
  );
}

function PlanCard({
  title,
  badge,
  price,
  yearlyPrice,
  description,
  features,
  active,
  action,
  highlighted,
}: {
  title: string;
  badge: string;
  price: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  active: boolean;
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  const saving = title === "Growth" ? "75€" : "55€";

  return (
    <div
      className={`relative flex h-full min-h-[660px] flex-col overflow-hidden rounded-[38px] border p-8 shadow-[0_24px_80px_rgba(80,55,30,0.08)] ${
        highlighted
          ? "border-[#2C2117] bg-[#17130F] text-white"
          : "border-[#D8C5A5] bg-white text-[#16120E]"
      }`}
    >
      {highlighted && (
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C8A56A]/16 blur-[80px]" />
      )}

      <div className="relative flex h-full flex-col">
        <div className="flex min-h-[94px] items-start justify-between gap-4">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.28em] ${
                highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"
              }`}
            >
              MesaLink
            </p>

            <h2 className="mt-3 text-5xl font-semibold tracking-[-0.07em]">
              {title}
            </h2>
          </div>

          <span
            className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
              active
                ? "border-[#A7D8AA] bg-[#E9F7EA] text-[#3F6A4D]"
                : highlighted
                  ? "border-[#D8C5A5]/30 bg-[#F4E9D5] text-[#17130F]"
                  : "border-[#D8C5A5] bg-[#FFF9F0] text-[#9B6F3B]"
            }`}
          >
            {badge}
          </span>
        </div>

        <p
          className={`mt-5 min-h-[72px] text-sm leading-7 ${
            highlighted ? "text-white/68" : "text-[#6B6258]"
          }`}
        >
          {description}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-7xl font-semibold tracking-[-0.08em]">
            {price}
          </span>
          <span
            className={`mb-3 text-sm ${
              highlighted ? "text-white/62" : "text-[#6B6258]"
            }`}
          >
            /mês
          </span>
        </div>

        <div
          className={`mt-5 rounded-[24px] px-5 py-4 text-sm ${
            highlighted
              ? "border border-white/10 bg-white/[0.07] text-white/76"
              : "border border-[#D8C5A5] bg-[#FFF9F0] text-[#6B6258]"
          }`}
        >
          <p
            className={
              highlighted
                ? "font-semibold text-[#D8C5A5]"
                : "font-semibold text-[#9B6F3B]"
            }
          >
            Pagamento anual
          </p>

          <p className="mt-1 text-xs">
            <span
              className={
                highlighted ? "font-black text-white" : "font-black text-[#16120E]"
              }
            >
              {yearlyPrice}/ano
            </span>{" "}
            · 1 mês grátis · poupa {saving}
          </p>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature}
              className={`flex gap-2 text-sm leading-6 ${
                highlighted ? "text-white/84" : "text-[#4F463B]"
              }`}
            >
              <span className={highlighted ? "text-[#D8C5A5]" : "text-[#9B6F3B]"}>
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">{action}</div>
      </div>
    </div>
  );
}


function MiniFeature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="font-semibold text-[#16120E]">{title}</p>
      <p className="mt-1 text-sm text-[#6B6258]">{text}</p>
    </div>
  );
}
