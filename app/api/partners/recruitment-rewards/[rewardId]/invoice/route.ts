import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ rewardId: string }> }) {
  const { rewardId } = await params;
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const invoiceUrl = safeUrl(body?.invoiceUrl);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim().slice(0, 80) : "";
  const taxAmount = Number(body?.taxAmount);
  if (!invoiceUrl || !invoiceNumber) return NextResponse.json({ error: "Indica o número e carrega a fatura em PDF." }, { status: 400 });
  if (!Number.isFinite(taxAmount) || taxAmount < 0 || taxAmount > 30) return NextResponse.json({ error: "Confirma o valor de IVA indicado na fatura." }, { status: 400 });

  const reward = await prisma.referralPartnerRecruitmentReward.findFirst({
    where: { id: rewardId, partnerId: partner.id },
    select: { id: true, status: true, stripeTransferId: true },
  });
  if (!reward) return NextResponse.json({ error: "Prémio não encontrado." }, { status: 404 });
  if (!["QUALIFIED", "TRANSFER_FAILED"].includes(reward.status) || reward.stripeTransferId) {
    return NextResponse.json({ error: "Este prémio ainda não está disponível para faturação." }, { status: 409 });
  }

  await prisma.referralPartnerRecruitmentReward.update({
    where: { id: reward.id },
    data: {
      partnerInvoiceUrl: invoiceUrl,
      partnerInvoiceNumber: invoiceNumber,
      partnerInvoiceUploadedAt: new Date(),
      partnerInvoiceStatus: "PENDING",
      partnerInvoiceVerifiedAt: null,
      partnerInvoiceVerifiedBy: null,
      partnerInvoiceRejectedAt: null,
      partnerInvoiceRejectionReason: null,
      taxRate: Math.round(taxAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: 100 + Math.round(taxAmount * 100) / 100,
    },
  });
  return NextResponse.json({ success: true });
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const uploadThingHost = host === "ufs.sh" || host.endsWith(".ufs.sh") || host === "utfs.io" || host.endsWith(".utfs.io");
    return url.protocol === "https:" && uploadThingHost ? url.toString() : "";
  } catch {
    return "";
  }
}
