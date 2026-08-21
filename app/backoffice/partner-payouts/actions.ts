"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { transferPartnerCommission } from "@/lib/referral-payouts";
import { transferPartnerRecruitmentReward } from "@/lib/partner-recruitment-rewards";
import { assertBackofficeAdmin } from "@/lib/staff-auth";

export async function processPartnerPayment(formData: FormData) {
  await assertBackofficeAdmin();
  const paymentId = String(formData.get("paymentId") || "");
  if (paymentId) await transferPartnerCommission(paymentId);
  revalidatePath("/backoffice/partner-payouts");
  redirect("/backoffice/partner-payouts?done=transferred");
}

export async function processDuePartnerPayments() {
  await assertBackofficeAdmin();
  const payments = await prisma.referralPayment.findMany({
    where: {
      status: { in: ["CAPTURED_AWAITING_PAYOUT", "TRANSFER_FAILED"] },
      payoutDueAt: { lte: new Date() },
      partnerInvoiceStatus: "VERIFIED",
      partnerInvoiceUrl: { not: null },
    },
    select: { id: true },
    take: 100,
  });
  let completed = 0;
  for (const payment of payments) {
    try {
      await transferPartnerCommission(payment.id);
      completed += 1;
    } catch (error) {
      console.error("Weekly partner transfer failed", payment.id, error);
    }
  }
  const rewards = await prisma.referralPartnerRecruitmentReward.findMany({
    where: { status: { in: ["QUALIFIED", "TRANSFER_FAILED"] }, payoutDueAt: { lte: new Date() }, partnerInvoiceStatus: "VERIFIED", partnerInvoiceUrl: { not: null } },
    select: { id: true },
    take: 100,
  });
  for (const reward of rewards) {
    try {
      await transferPartnerRecruitmentReward(reward.id);
      completed += 1;
    } catch (error) {
      console.error("Partner recruitment reward transfer failed", reward.id, error);
    }
  }
  revalidatePath("/backoffice/partner-payouts");
  redirect(`/backoffice/partner-payouts?done=batch&count=${completed}`);
}

export async function processPartnerRecruitmentReward(formData: FormData) {
  await assertBackofficeAdmin();
  const rewardId = String(formData.get("rewardId") || "");
  if (rewardId) await transferPartnerRecruitmentReward(rewardId);
  revalidatePath("/backoffice/partner-payouts");
  redirect("/backoffice/partner-payouts?done=recruitment-transferred");
}

export async function reviewPartnerRecruitmentInvoice(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const rewardId = String(formData.get("rewardId") || "");
  const decision = String(formData.get("decision") || "");
  const reason = String(formData.get("reason") || "").trim().slice(0, 300);
  if (!rewardId || !["VERIFY", "REJECT"].includes(decision)) return;
  const reward = await prisma.referralPartnerRecruitmentReward.findUnique({ where: { id: rewardId }, select: { partnerInvoiceUrl: true } });
  if (!reward?.partnerInvoiceUrl) return;
  await prisma.referralPartnerRecruitmentReward.update({
    where: { id: rewardId },
    data: decision === "VERIFY"
      ? { partnerInvoiceStatus: "VERIFIED", partnerInvoiceVerifiedAt: new Date(), partnerInvoiceVerifiedBy: admin.email, partnerInvoiceRejectedAt: null, partnerInvoiceRejectionReason: null }
      : { partnerInvoiceStatus: "REJECTED", partnerInvoiceVerifiedAt: null, partnerInvoiceVerifiedBy: null, partnerInvoiceRejectedAt: new Date(), partnerInvoiceRejectionReason: reason || "Fatura inválida ou dados incompletos." },
  });
  revalidatePath("/backoffice/partner-payouts");
  revalidatePath("/partners/app");
  redirect(`/backoffice/partner-payouts?done=recruitment-invoice-${decision === "VERIFY" ? "verified" : "rejected"}`);
}

export async function confirmPartnerRecruitmentPayout(formData: FormData) {
  await assertBackofficeAdmin();
  const rewardId = String(formData.get("rewardId") || "");
  if (rewardId) await prisma.referralPartnerRecruitmentReward.updateMany({ where: { id: rewardId, status: "TRANSFERRED" }, data: { status: "PAID", payoutConfirmedAt: new Date() } });
  revalidatePath("/backoffice/partner-payouts");
  redirect("/backoffice/partner-payouts?done=recruitment-confirmed");
}

export async function reviewPartnerInvoice(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const paymentId = String(formData.get("paymentId") || "");
  const decision = String(formData.get("decision") || "");
  const reason = String(formData.get("reason") || "").trim().slice(0, 300);
  if (!paymentId || !["VERIFY", "REJECT"].includes(decision)) return;

  const payment = await prisma.referralPayment.findUnique({ where: { id: paymentId }, select: { partnerInvoiceUrl: true } });
  if (!payment?.partnerInvoiceUrl) return;

  await prisma.referralPayment.update({
    where: { id: paymentId },
    data: decision === "VERIFY"
      ? {
          partnerInvoiceStatus: "VERIFIED",
          partnerInvoiceVerifiedAt: new Date(),
          partnerInvoiceVerifiedBy: admin.email,
          partnerInvoiceRejectedAt: null,
          partnerInvoiceRejectionReason: null,
        }
      : {
          partnerInvoiceStatus: "REJECTED",
          partnerInvoiceVerifiedAt: null,
          partnerInvoiceVerifiedBy: null,
          partnerInvoiceRejectedAt: new Date(),
          partnerInvoiceRejectionReason: reason || "Fatura inválida ou dados incompletos.",
        },
  });
  revalidatePath("/backoffice/partner-payouts");
  revalidatePath("/partners/app");
  redirect(`/backoffice/partner-payouts?done=invoice-${decision === "VERIFY" ? "verified" : "rejected"}`);
}

export async function confirmPartnerPayout(formData: FormData) {
  await assertBackofficeAdmin();
  const paymentId = String(formData.get("paymentId") || "");
  if (paymentId) {
    await prisma.referralPayment.updateMany({
      where: { id: paymentId, status: "TRANSFERRED" },
      data: { status: "PAID", payoutConfirmedAt: new Date() },
    });
  }
  revalidatePath("/backoffice/partner-payouts");
  redirect("/backoffice/partner-payouts?done=confirmed");
}
