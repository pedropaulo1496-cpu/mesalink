"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertBackofficeAdmin } from "@/lib/staff-auth";
import { commissionPeriodBounds } from "@/lib/sales-commission-statements";
import { stripe } from "@/lib/stripe";

export async function reviewSalesCommissionInvoice(formData: FormData) {
  const admin = await assertBackofficeAdmin();
  const statementId = String(formData.get("statementId") || "");
  const decision = String(formData.get("decision") || "");
  const reason = String(formData.get("reason") || "").trim().slice(0, 300);
  const statement = await prisma.salesCommissionStatement.findUnique({ where: { id: statementId }, select: { invoiceUrl: true } });
  if (!statement?.invoiceUrl) redirect("/backoffice/commissions?done=invoice-missing");
  await prisma.salesCommissionStatement.update({
    where: { id: statementId },
    data: decision === "VERIFY" ? {
      status: "VERIFIED",
      invoiceVerifiedAt: new Date(),
      invoiceVerifiedBy: admin.email,
      invoiceRejectedAt: null,
      invoiceRejectionReason: null,
    } : {
      status: "REJECTED",
      invoiceVerifiedAt: null,
      invoiceVerifiedBy: null,
      invoiceRejectedAt: new Date(),
      invoiceRejectionReason: reason || "Fatura inválida ou dados incompletos.",
    },
  });
  revalidatePath("/backoffice/commissions");
  redirect("/backoffice/commissions?done=invoice-reviewed");
}

export async function paySalesCommissionStatement(formData: FormData) {
  await assertBackofficeAdmin();
  const statementId = String(formData.get("statementId") || "");
  const statement = await prisma.salesCommissionStatement.findUnique({
    where: { id: statementId },
    include: { salesRepresentative: { select: { stripeAccountId: true, stripeOnboardingComplete: true } } },
  });
  if (!statement || statement.status !== "VERIFIED" || !statement.invoiceUrl) redirect("/backoffice/commissions?done=invoice-required");
  if (!statement.salesRepresentative.stripeAccountId || !statement.salesRepresentative.stripeOnboardingComplete) redirect("/backoffice/commissions?done=iban-required");
  const amount = Math.round(Number(statement.commissionTotal) * 100);
  if (amount <= 0) redirect("/backoffice/commissions?done=no-commission-balance");

  let transferId = statement.stripeTransferId;
  let ibanInvalid = false;
  try {
    if (!transferId) {
      const account = await stripe.accounts.retrieve(statement.salesRepresentative.stripeAccountId);
      if ("deleted" in account || !account.payouts_enabled) {
        await prisma.salesRepresentative.update({ where: { id: statement.salesRepresentativeId }, data: { stripeOnboardingComplete: false } });
        ibanInvalid = true;
      } else {
        const transfer = await stripe.transfers.create({
          amount,
          currency: statement.currency.toLowerCase(),
          destination: statement.salesRepresentative.stripeAccountId,
          description: `Comissões MesaLink ${statement.period}`,
          metadata: { salesCommissionStatementId: statement.id, period: statement.period },
        }, { idempotencyKey: `sales-commission-statement-${statement.id}` });
        transferId = transfer.id;
      }
    }
  } catch (error) {
    console.error("Sales commission transfer failed", error);
    redirect("/backoffice/commissions?done=payout-failed");
  }
  if (ibanInvalid || !transferId) redirect("/backoffice/commissions?done=iban-required");

  const { start, end } = commissionPeriodBounds(statement.period);
  await prisma.$transaction([
    prisma.salesCommission.updateMany({
      where: { salesRepresentativeId: statement.salesRepresentativeId, status: "PENDING", earnedAt: { gte: start, lt: end } },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.salesCommissionStatement.update({ where: { id: statement.id }, data: { status: "PAID", paidAt: new Date(), stripeTransferId: transferId } }),
  ]);
  revalidatePath("/backoffice/commissions");
  revalidatePath("/backoffice/team");
  redirect("/backoffice/commissions?done=commission-paid");
}
