import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStaffIdentity } from "@/lib/staff-auth";
import { commissionInvoiceDeadlineLabel, commissionPeriodBounds, isClosedCommissionPeriod, isCommissionInvoiceExpired } from "@/lib/sales-commission-statements";

export async function POST(request: Request) {
  const staff = await getStaffIdentity();
  if (!staff || staff.role !== "SALES" || !staff.salesRepresentativeId) return NextResponse.json({ error: "Acesso reservado a comerciais." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const period = typeof body?.period === "string" ? body.period : "";
  const invoiceUrl = safeUploadUrl(body?.invoiceUrl);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim().slice(0, 80) : "";
  if (!invoiceUrl || !invoiceNumber) return NextResponse.json({ error: "Indica o número e carrega a fatura em PDF." }, { status: 400 });
  if (!isClosedCommissionPeriod(period)) return NextResponse.json({ error: "A fatura só pode ser emitida depois de o mês terminar." }, { status: 409 });
  if (isCommissionInvoiceExpired(period)) return NextResponse.json({ error: `O prazo terminou em ${commissionInvoiceDeadlineLabel(period)}. Este saldo já não é elegível para pagamento.` }, { status: 410 });
  const { start, end } = commissionPeriodBounds(period);
  const totals = await prisma.salesCommission.aggregate({
    where: { salesRepresentativeId: staff.salesRepresentativeId, status: "PENDING", earnedAt: { gte: start, lt: end } },
    _sum: { grossAmount: true, commissionAmount: true },
    _count: true,
  });
  if (!totals._count || Number(totals._sum.commissionAmount || 0) <= 0) return NextResponse.json({ error: "Não existe saldo pendente neste mês." }, { status: 404 });

  await prisma.salesCommissionStatement.upsert({
    where: { salesRepresentativeId_period: { salesRepresentativeId: staff.salesRepresentativeId, period } },
    create: {
      salesRepresentativeId: staff.salesRepresentativeId,
      period,
      grossSales: totals._sum.grossAmount || 0,
      commissionTotal: totals._sum.commissionAmount || 0,
      status: "PENDING",
      invoiceUrl,
      invoiceNumber,
      invoiceUploadedAt: new Date(),
    },
    update: {
      grossSales: totals._sum.grossAmount || 0,
      commissionTotal: totals._sum.commissionAmount || 0,
      status: "PENDING",
      invoiceUrl,
      invoiceNumber,
      invoiceUploadedAt: new Date(),
      invoiceVerifiedAt: null,
      invoiceVerifiedBy: null,
      invoiceRejectedAt: null,
      invoiceRejectionReason: null,
    },
  });
  revalidatePath("/backoffice/commissions");
  return NextResponse.json({ success: true });
}

function safeUploadUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const allowed = host === "ufs.sh" || host.endsWith(".ufs.sh") || host === "utfs.io" || host.endsWith(".utfs.io");
    return url.protocol === "https:" && allowed ? url.toString() : "";
  } catch {
    return "";
  }
}
