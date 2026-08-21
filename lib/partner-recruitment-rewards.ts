import Stripe from "stripe";
import { Resend } from "resend";
import { sendHqPush } from "@/lib/hq-notifications";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const PARTNER_RECRUITMENT_REWARD_BASE = 100;
export const PARTNER_RECRUITMENT_REWARD_TAX_RATE = 23;
export const PARTNER_RECRUITMENT_REWARD_TOTAL = 123;
export const PARTNER_RECRUITMENT_REQUIRED_MONTHS = 6;

const CONTINUITY_TOLERANCE_MS = 3 * 24 * 60 * 60 * 1000;

export async function recordRecruitmentSubscriptionInvoice(invoice: Stripe.Invoice) {
  if (invoice.amount_paid <= 0) return;
  const subscriptionDetails = invoice.parent?.subscription_details;
  const metadataUserId = subscriptionDetails?.metadata?.userId;
  const stripeSubscriptionId = typeof subscriptionDetails?.subscription === "string"
    ? subscriptionDetails.subscription
    : subscriptionDetails?.subscription?.id;
  const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscription = metadataUserId
    ? await prisma.subscription.findUnique({ where: { userId: metadataUserId }, select: { userId: true } })
    : await prisma.subscription.findFirst({
        where: { OR: [
          ...(stripeSubscriptionId ? [{ stripeSubscriptionId }] : []),
          ...(stripeCustomerId ? [{ stripeCustomerId }] : []),
        ] },
        select: { userId: true },
      });
  const userId = metadataUserId || subscription?.userId;
  if (!userId) return;

  const reward = await prisma.referralPartnerRecruitmentReward.findFirst({
    where: { restaurant: { userId }, status: "TRACKING" },
    select: { id: true, invitation: { select: { acceptedAt: true } } },
  });
  if (!reward?.invitation.acceptedAt) return;

  const periods = invoice.lines.data
    .filter((line) => line.amount > 0 && line.period?.end > line.period?.start)
    .map((line) => ({ start: new Date(line.period.start * 1000), end: new Date(line.period.end * 1000) }));
  if (!periods.length) return;
  const periodStart = periods.reduce((earliest, period) => period.start < earliest ? period.start : earliest, periods[0].start);
  const periodEnd = periods.reduce((latest, period) => period.end > latest ? period.end : latest, periods[0].end);
  if (periodEnd <= reward.invitation.acceptedAt) return;

  await prisma.partnerRecruitmentSubscriptionInvoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      rewardId: reward.id,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      periodStart,
      periodEnd,
      paidAt: new Date((invoice.status_transitions.paid_at || invoice.created) * 1000),
    },
    update: {},
  });
  await refreshRecruitmentReward(reward.id);
}

export async function refreshTrackingRecruitmentRewards(now = new Date()) {
  const rewards = await prisma.referralPartnerRecruitmentReward.findMany({
    where: { status: "TRACKING" },
    select: { id: true },
    take: 500,
  });
  let qualified = 0;
  for (const reward of rewards) {
    if (await refreshRecruitmentReward(reward.id, now)) qualified += 1;
  }
  return { checked: rewards.length, qualified };
}

export async function refreshRecruitmentReward(rewardId: string, now = new Date()) {
  const reward = await prisma.referralPartnerRecruitmentReward.findUnique({
    where: { id: rewardId },
    include: {
      invitation: { select: { acceptedAt: true, createdAt: true } },
      partner: { select: { userId: true, businessName: true, contactName: true, email: true } },
      restaurant: { select: { name: true, billingTaxId: true, user: { select: { subscription: { select: { status: true } } } } } },
      subscriptionInvoices: { orderBy: { periodStart: "asc" }, select: { periodStart: true, periodEnd: true } },
    },
  });
  if (!reward || reward.status !== "TRACKING" || !reward.invitation.acceptedAt) return false;

  if (reward.restaurant.billingTaxId) {
    const preExistingBusiness = await prisma.restaurant.count({
      where: { id: { not: reward.restaurantId }, billingTaxId: reward.restaurant.billingTaxId, createdAt: { lt: reward.invitation.createdAt } },
    });
    if (preExistingBusiness > 0) {
      await prisma.referralPartnerRecruitmentReward.update({ where: { id: reward.id }, data: { status: "INELIGIBLE", lastError: "NIF já existente antes do convite." } });
      return false;
    }
  }

  const coverage = continuousCoverage(reward.subscriptionInvoices, reward.invitation.acceptedAt);
  const paidMonths = coverage ? Math.min(PARTNER_RECRUITMENT_REQUIRED_MONTHS, completedCalendarMonths(coverage.start, minDate(now, coverage.end))) : 0;
  const qualifiesAt = coverage ? addUtcMonths(coverage.start, PARTNER_RECRUITMENT_REQUIRED_MONTHS) : null;
  const qualified = Boolean(
    coverage && qualifiesAt && now >= qualifiesAt && coverage.end >= qualifiesAt && reward.restaurant.user?.subscription?.status === "ACTIVE",
  );
  if (!qualified) {
    await prisma.referralPartnerRecruitmentReward.update({ where: { id: reward.id }, data: { coverageStartedAt: coverage?.start || null, paidThroughAt: coverage?.end || null, paidMonths } });
    return false;
  }
  const transition = await prisma.referralPartnerRecruitmentReward.updateMany({
    where: { id: reward.id, status: "TRACKING" },
    data: { coverageStartedAt: coverage?.start || null, paidThroughAt: coverage?.end || null, paidMonths, status: "QUALIFIED", qualifiedAt: now, payoutDueAt: nextWeeklyPayout(now) },
  });
  if (transition.count !== 1) return false;

  await Promise.allSettled([
    notifyQualifiedReward({
      email: reward.partner.email,
      partnerName: reward.partner.contactName || reward.partner.businessName,
      restaurantName: reward.restaurant.name,
      rewardId: reward.id,
    }),
    sendHqPush({
      title: "Prémio de 100 € + IVA conquistado",
      body: `${reward.restaurant.name} completou seis meses de subscrição paga. Anexa a fatura para receberes 100 € + IVA.`,
      url: "/partners/app?tab=stats",
      tag: `recruitment-reward-${reward.id}`,
    }, [reward.partner.userId]),
  ]);
  return true;
}

export async function transferPartnerRecruitmentReward(rewardId: string) {
  const reward = await prisma.referralPartnerRecruitmentReward.findUnique({
    where: { id: rewardId },
    include: { partner: true },
  });
  if (!reward) throw new Error("Prémio não encontrado.");
  if (reward.stripeTransferId) return reward;
  if (!["QUALIFIED", "TRANSFER_FAILED"].includes(reward.status)) throw new Error("Este prémio ainda não está pronto para pagamento.");
  if (!reward.partner.stripeAccountId || !reward.partner.stripeOnboardingComplete) throw new Error("Falta o IBAN verificado do parceiro.");
  if (!reward.partnerInvoiceUrl || reward.partnerInvoiceStatus !== "VERIFIED") throw new Error("A fatura do parceiro ainda não foi verificada pelo MesaLink.");

  const account = await stripe.v2.core.accounts.retrieve(reward.partner.stripeAccountId);
  const transferCapability = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status;
  if (transferCapability !== "active") throw new Error("A conta Stripe do parceiro ainda não pode receber transferências.");

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(Number(reward.totalAmount) * 100),
      currency: reward.currency.toLowerCase(),
      destination: reward.partner.stripeAccountId,
      transfer_group: `RECRUITMENT_${reward.id}`,
      metadata: { recruitmentRewardId: reward.id, restaurantId: reward.restaurantId },
    }, { idempotencyKey: `partner_recruitment_reward_${reward.id}` });
    return await prisma.referralPartnerRecruitmentReward.update({
      where: { id: reward.id },
      data: { status: "TRANSFERRED", stripeTransferId: transfer.id, transferredAt: new Date(), lastError: null },
    });
  } catch (error) {
    await prisma.referralPartnerRecruitmentReward.update({
      where: { id: reward.id },
      data: { status: "TRANSFER_FAILED", lastError: error instanceof Error ? error.message.slice(0, 500) : "Transfer failed" },
    });
    throw error;
  }
}

function continuousCoverage(periods: Array<{ periodStart: Date; periodEnd: Date }>, acceptedAt: Date) {
  let start: Date | null = null;
  let end: Date | null = null;
  for (const period of periods) {
    if (period.periodEnd <= acceptedAt) continue;
    const periodStart = period.periodStart < acceptedAt ? acceptedAt : period.periodStart;
    if (!start || !end || periodStart.getTime() > end.getTime() + CONTINUITY_TOLERANCE_MS) {
      start = periodStart;
      end = period.periodEnd;
      continue;
    }
    if (period.periodEnd > end) end = period.periodEnd;
  }
  return start && end ? { start, end } : null;
}

function completedCalendarMonths(start: Date, end: Date) {
  if (end <= start) return 0;
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
  if (addUtcMonths(start, months) > end) months -= 1;
  return Math.max(0, months);
}

function addUtcMonths(value: Date, months: number) {
  const result = new Date(value);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

function minDate(a: Date, b: Date) {
  return a < b ? a : b;
}

function nextWeeklyPayout(from: Date) {
  const date = new Date(from);
  const days = ((8 - date.getUTCDay()) % 7) || 7;
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}

async function notifyQualifiedReward(input: { email: string; partnerName: string; restaurantName: string; rewardId: string }) {
  if (!process.env.RESEND_API_KEY) return;
  await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: input.email,
    subject: "Ganhou 100 € + IVA com o MesaLink",
    text: `Olá ${input.partnerName},\n\n${input.restaurantName} completou seis meses consecutivos de subscrição paga. O seu prémio de 100 € + IVA aplicável já está disponível.\n\nEntre no MesaLink Partners, abra Estatísticas e anexe a fatura para receber o pagamento.\n\nhttps://www.mesalink.pt/partners/app?tab=stats\n\nEquipa MesaLink\ninfo@mesalink.pt`,
    html: `<div style="margin:0;background:#f5efe6;padding:28px 14px;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:620px;margin:auto;border:1px solid #dfcfb8;border-radius:22px;background:white;padding:28px"><p style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9b6f3b">Convida e ganha</p><h1 style="font:700 30px Georgia,serif">Ganhou 100 € + IVA</h1><p style="font-size:15px;line-height:1.65;color:#685d52"><strong>${escapeHtml(input.restaurantName)}</strong> completou seis meses consecutivos de subscrição paga. O prémio de <strong>100 € + IVA aplicável</strong> já está disponível.</p><a href="https://www.mesalink.pt/partners/app?tab=stats" style="display:inline-block;margin-top:12px;border-radius:999px;background:#17120d;padding:15px 24px;color:white;text-decoration:none;font-weight:700">Anexar fatura</a></div></div>`,
  }, { idempotencyKey: `partner-recruitment-qualified-${input.rewardId}` });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
