"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertBackofficeAdmin } from "@/lib/staff-auth";
import { commissionPeriodBounds } from "@/lib/sales-commission-statements";

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
  const statement = await prisma.salesCommissionStatement.findUnique({ where: { id: statementId } });
  if (!statement || statement.status !== "VERIFIED" || !statement.invoiceUrl) redirect("/backoffice/commissions?done=invoice-required");
  const { start, end } = commissionPeriodBounds(statement.period);
  await prisma.$transaction([
    prisma.salesCommission.updateMany({
      where: { salesRepresentativeId: statement.salesRepresentativeId, status: "PENDING", earnedAt: { gte: start, lt: end } },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.salesCommissionStatement.update({ where: { id: statement.id }, data: { status: "PAID", paidAt: new Date() } }),
  ]);
  revalidatePath("/backoffice/commissions");
  revalidatePath("/backoffice/team");
  redirect("/backoffice/commissions?done=commission-paid");
}
