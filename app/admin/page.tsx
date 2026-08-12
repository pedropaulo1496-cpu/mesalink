import Link from "next/link";
import type Stripe from "stripe";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import SignOutButton from "@/components/SignOutButton";
import {
  extendTrial,
  grantAiCredits,
  grantEmails,
  updateCostSettings,
  updateSubscription,
} from "./actions";

export const dynamic = "force-dynamic";

type StripeMetrics = {
  revenueCents: number;
  stripeFeeCents: number;
  payments: number;
  connected: boolean;
};

const euro = (cents: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

const date = (value: Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(value)
    : "—";

async function stripeMetrics(customerId: string | null): Promise<StripeMetrics> {
  if (!customerId || !process.env.STRIPE_SECRET_KEY) {
    return { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false };
  }

  try {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
      expand: ["data.balance_transaction"],
    });

    return charges.data.reduce<StripeMetrics>(
      (total, charge) => {
        if (!charge.paid) return total;
        const balance = charge.balance_transaction as Stripe.BalanceTransaction | null;
        total.revenueCents += Math.max(0, charge.amount_captured - charge.amount_refunded);
        total.stripeFeeCents += balance && typeof balance !== "string" ? balance.fee : 0;
        total.payments += 1;
        return total;
      },
      { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: true },
    );
  } catch (error) {
    console.error("Admin Stripe metrics failed", error);
    return { revenueCents: 0, stripeFeeCents: 0, payments: 0, connected: false };
  }
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; done?: string }>;
}) {
  const admin = await requireAdmin();
  const { q = "", done } = await searchParams;
  const now = new Date();
  const query = q.trim();
  const settings =
    (await prisma.adminSettings.findUnique({ where: { id: "global" } })) || {
      emailCostMicros: 400,
      aiCreditCostMicros: 10_000,
      whatsappCostMicros: 5_000,
    };

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { restaurants: { some: { name: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: {
      subscription: true,
      restaurants: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true, createdAt: true },
      },
      _count: { select: { emailUsages: true, aiCreditTransactions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [payments, sentEmails, usedAi, whatsappMessages, domainCosts] = await Promise.all([
        stripeMetrics(user.subscription?.stripeCustomerId || null),
        prisma.emailUsage.count({ where: { userId: user.id, status: "SENT" } }),
        prisma.aiCreditTransaction.aggregate({
          where: {
            userId: user.id,
            kind: "USAGE",
            feature: { not: "EMAIL_BUNDLE" },
            amount: { lt: 0 },
          },
          _sum: { amount: true },
        }),
        prisma.revenueMessage.count({
          where: {
            direction: "OUTBOUND",
            channel: "WHATSAPP",
            status: { in: ["SENT", "DELIVERED", "READ"] },
            conversation: { restaurant: { userId: user.id } },
          },
        }),
        prisma.domainOrder.aggregate({
          where: {
            restaurant: { userId: user.id },
            kind: "PURCHASE",
            status: { in: ["PURCHASED", "DNS_PENDING", "ACTIVE"] },
          },
          _sum: { providerPriceCents: true },
        }),
      ]);

      const aiCreditsUsed = Math.abs(usedAi._sum.amount || 0);
      const usageCostCents = Math.round(
        (sentEmails * settings.emailCostMicros +
          aiCreditsUsed * settings.aiCreditCostMicros +
          whatsappMessages * settings.whatsappCostMicros) /
          10_000,
      );
      const providerCostCents = domainCosts._sum.providerPriceCents || 0;
      const totalCostCents = payments.stripeFeeCents + providerCostCents + usageCostCents;

      return {
        ...user,
        payments,
        sentEmails,
        aiCreditsUsed,
        whatsappMessages,
        usageCostCents,
        providerCostCents,
        totalCostCents,
        marginCents: payments.revenueCents - totalCostCents,
      };
    }),
  );

  const totals = enriched.reduce(
    (sum, user) => ({
      revenue: sum.revenue + user.payments.revenueCents,
      costs: sum.costs + user.totalCostCents,
      emails: sum.emails + user.sentEmails,
      ai: sum.ai + user.aiCreditsUsed,
    }),
    { revenue: 0, costs: 0, emails: 0, ai: 0 },
  );
  const allUserCount = await prisma.user.count();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const newUserCount = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
  const mrr = await prisma.subscription.aggregate({
    where: { status: "ACTIVE" },
    _sum: { priceMonthly: true },
  });
  const auditLogs = await prisma.adminAuditLog.findMany({
    include: {
      actor: { select: { name: true, email: true } },
      targetUser: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <main className="min-h-screen bg-[#F4ECDF] text-[#17130F]">
      <header className="border-b border-[#DCC9AA] bg-[#17130F] px-4 py-5 text-white sm:px-7">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D7B267]">
              MesaLink · Administração
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.05em]">Control Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-white/60 sm:inline">{admin.email}</span>
            <Link href="/dashboard" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/10">
              Abrir restaurante
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
        {done && (
          <div className="mb-5 rounded-2xl border border-[#B8D3B7] bg-[#EEF8EC] px-4 py-3 text-sm font-semibold text-[#315C36]">
            Alteração guardada e registada no histórico.
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Utilizadores" value={allUserCount.toString()} note={`${newUserCount} nos últimos 30 dias`} />
          <Metric label="Receita Stripe" value={euro(totals.revenue)} note="líquida de reembolsos" tone="green" />
          <Metric label="Custos" value={euro(totals.costs)} note="Stripe + domínio + estimativas" tone="red" />
          <Metric label="Margem observada" value={euro(totals.revenue - totals.costs)} note="antes de custos fixos" tone="gold" />
          <Metric label="MRR contratual" value={euro((mrr._sum.priceMonthly || 0) * 100)} note="planos ativos" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[30px] border border-[#DCC9AA] bg-white p-4 shadow-[0_20px_70px_rgba(80,55,30,0.06)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Clientes</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Contas e rentabilidade</h2>
              </div>
              <form className="flex gap-2" action="/admin">
                <input name="q" defaultValue={query} placeholder="Nome, email ou restaurante" className="h-11 min-w-0 rounded-full border border-[#DCC9AA] bg-[#FFF9F0] px-4 text-sm outline-none sm:w-72" />
                <button className="h-11 rounded-full bg-[#17130F] px-5 text-sm font-semibold text-white">Procurar</button>
              </form>
            </div>

            <div className="mt-6 space-y-4">
              {enriched.map((user) => (
                <UserCard key={user.id} user={user} nowMs={now.getTime()} />
              ))}
              {enriched.length === 0 && <p className="rounded-2xl bg-[#FFF9F0] p-5 text-sm text-[#6B6258]">Nenhuma conta encontrada.</p>}
            </div>
          </div>

          <aside className="space-y-5">
            <CostSettings settings={settings} />
            <div className="rounded-[30px] border border-[#DCC9AA] bg-[#17130F] p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#D7B267]">Atividade administrativa</p>
              <div className="mt-4 space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                    <p className="text-xs font-bold">{auditLabel(log.action)}</p>
                    <p className="mt-1 truncate text-[11px] text-white/55">{log.targetUser?.name || log.targetUser?.email || "Configuração global"}</p>
                    <p className="mt-2 text-[10px] text-white/35">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(log.createdAt)}</p>
                  </div>
                ))}
                {auditLogs.length === 0 && <p className="text-sm text-white/50">Ainda sem alterações.</p>}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

type UserRow = Prisma.UserGetPayload<{
  include: {
    subscription: true;
    restaurants: {
      select: { id: true; name: true; slug: true; createdAt: true };
    };
    _count: { select: { emailUsages: true; aiCreditTransactions: true } };
  };
}> & {
  payments: StripeMetrics;
  sentEmails: number;
  aiCreditsUsed: number;
  whatsappMessages: number;
  usageCostCents: number;
  providerCostCents: number;
  totalCostCents: number;
  marginCents: number;
};

function UserCard({ user, nowMs }: { user: UserRow; nowMs: number }) {
  const subscription = user.subscription;
  const restaurant = user.restaurants[0];
  const trialDays = subscription?.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - nowMs) / 86_400_000))
    : 0;

  return (
    <details className="group rounded-[24px] border border-[#E2D3BC] bg-[#FFF9F0] open:bg-white">
      <summary className="cursor-pointer list-none p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-bold">{restaurant?.name || user.name || "Sem restaurante"}</p>
              <StatusBadge status={subscription?.status || "SEM PLANO"} />
              {user.isAdmin && <span className="rounded-full bg-[#17130F] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">Admin</span>}
            </div>
            <p className="mt-1 truncate text-sm text-[#6B6258]">{user.email} · conta desde {date(user.createdAt)}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniMetric label="Gastou" value={user.payments.connected ? euro(user.payments.revenueCents) : "—"} />
            <MiniMetric label="Custou" value={euro(user.totalCostCents)} />
            <MiniMetric label="Margem" value={user.payments.connected ? euro(user.marginCents) : "—"} />
            <MiniMetric label="Trial" value={subscription?.status === "TRIAL" ? `${trialDays}d` : "—"} />
          </div>
        </div>
      </summary>

      <div className="border-t border-[#E2D3BC] p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DataLine label="Plano" value={`${subscription?.plan || "—"} · ${subscription?.status || "—"}`} />
          <DataLine label="Saldos" value={`${subscription?.aiCredits || 0} créditos · ${subscription?.emailBalance || 0} emails`} />
          <DataLine label="Consumo" value={`${user.sentEmails} emails · ${user.aiCreditsUsed} créditos · ${user.whatsappMessages} WhatsApp`} />
          <DataLine label="Custos" value={`${euro(user.payments.stripeFeeCents)} Stripe · ${euro(user.providerCostCents)} domínio · ${euro(user.usageCostCents)} uso`} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <AdminForm title="Aumentar trial" action={extendTrial} userId={user.id}>
            <input name="days" type="number" min="1" max="365" defaultValue="7" className={inputClass} />
            <button className={buttonClass}>Adicionar dias</button>
          </AdminForm>
          <AdminForm title="Oferecer créditos IA" action={grantAiCredits} userId={user.id}>
            <input name="amount" type="number" min="1" max="100000" defaultValue="100" className={inputClass} />
            <input name="reason" defaultValue="Oferta comercial" className={inputClass} />
            <button className={buttonClass}>Dar créditos</button>
          </AdminForm>
          <AdminForm title="Oferecer emails" action={grantEmails} userId={user.id}>
            <input name="amount" type="number" min="1" max="1000000" defaultValue="1000" className={inputClass} />
            <input name="reason" defaultValue="Oferta comercial" className={inputClass} />
            <button className={buttonClass}>Dar emails</button>
          </AdminForm>
          <AdminForm title="Plano e acesso" action={updateSubscription} userId={user.id}>
            <div className="grid grid-cols-2 gap-2">
              <select name="plan" defaultValue={subscription?.plan || "ESSENTIALS"} className={inputClass}>
                <option value="ESSENTIALS">Essentials</option>
                <option value="GROWTH">Growth</option>
              </select>
              <select name="status" defaultValue={subscription?.status || "TRIAL"} className={inputClass}>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Ativo</option>
                <option value="PAST_DUE">Em atraso</option>
                <option value="CANCELED">Cancelado</option>
              </select>
            </div>
            <button className={buttonClass}>Guardar acesso</button>
          </AdminForm>
        </div>

        {restaurant && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/restaurants/${restaurant.id}`} className="rounded-full border border-[#D7B267] px-4 py-2 text-xs font-bold text-[#7B5528]">Abrir dashboard</Link>
            <Link href={`/s/${restaurant.slug}`} target="_blank" className="rounded-full border border-[#DCC9AA] px-4 py-2 text-xs font-bold">Abrir website</Link>
          </div>
        )}
      </div>
    </details>
  );
}

function CostSettings({ settings }: { settings: { emailCostMicros: number; aiCreditCostMicros: number; whatsappCostMicros: number } }) {
  return (
    <form action={updateCostSettings} className="rounded-[30px] border border-[#DCC9AA] bg-white p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#9B6F3B]">Custos estimados</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Preço interno por unidade</h2>
      <p className="mt-2 text-xs leading-5 text-[#6B6258]">Usado para estimar a despesa por cliente. As taxas Stripe e domínios são apuradas separadamente.</p>
      <div className="mt-4 space-y-3">
        <CostField label="1 email" name="emailCost" value={settings.emailCostMicros / 1_000_000} />
        <CostField label="1 crédito IA usado" name="aiCreditCost" value={settings.aiCreditCostMicros / 1_000_000} />
        <CostField label="1 mensagem WhatsApp" name="whatsappCost" value={settings.whatsappCostMicros / 1_000_000} />
      </div>
      <button className="mt-4 h-11 w-full rounded-full bg-[#17130F] text-sm font-semibold text-white">Atualizar estimativas</button>
    </form>
  );
}

function CostField({ label, name, value }: { label: string; name: string; value: number }) {
  return <label className="grid grid-cols-[1fr_120px] items-center gap-3 text-xs font-semibold"><span>{label}</span><span className="relative"><input name={name} type="number" step="0.000001" min="0" defaultValue={value} className={`${inputClass} pr-7`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B6F3B]">€</span></span></label>;
}

function AdminForm({ title, action, userId, children }: { title: string; action: (formData: FormData) => Promise<void>; userId: string; children: React.ReactNode }) {
  return <form action={action} className="rounded-2xl border border-[#E2D3BC] bg-[#FFF9F0] p-3"><input type="hidden" name="userId" value={userId} /><p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#7B5528]">{title}</p><div className="space-y-2">{children}</div></form>;
}

function Metric({ label, value, note, tone = "plain" }: { label: string; value: string; note: string; tone?: "plain" | "green" | "red" | "gold" }) {
  const tones = { plain: "bg-white", green: "bg-[#EEF7ED]", red: "bg-[#FFF1EC]", gold: "bg-[#FFF7E8]" };
  return <div className={`rounded-[24px] border border-[#DCC9AA] p-4 ${tones[tone]}`}><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A6A42]">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p><p className="mt-1 text-xs text-[#6B6258]">{note}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-[88px] rounded-2xl border border-[#E2D3BC] bg-white px-3 py-2"><p className="text-[9px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function DataLine({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#F7F0E5] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[#9B6F3B]">{label}</p><p className="mt-1 text-xs font-semibold leading-5">{value}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE" || status === "TRIAL";
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${active ? "bg-[#E5F3E4] text-[#37613C]" : "bg-[#F8E2D9] text-[#964A35]"}`}>{status}</span>;
}

function auditLabel(action: string) {
  return ({ TRIAL_EXTENDED: "Trial aumentado", AI_CREDITS_GRANTED: "Créditos oferecidos", EMAILS_GRANTED: "Emails oferecidos", SUBSCRIPTION_UPDATED: "Subscrição alterada", COST_SETTINGS_UPDATED: "Custos atualizados" } as Record<string, string>)[action] || action;
}

const inputClass = "h-10 w-full rounded-xl border border-[#DCC9AA] bg-white px-3 text-xs font-semibold outline-none focus:border-[#9B6F3B]";
const buttonClass = "h-10 w-full rounded-xl bg-[#17130F] px-3 text-xs font-bold text-white hover:bg-[#2B231B]";
