import { NextResponse } from "next/server";
import { getPartnerIdentity } from "@/lib/partner-auth";
import { referralInvoiceDeadline } from "@/lib/referral-deadlines";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const partner = await getPartnerIdentity();
  if (!partner) return NextResponse.json({ error: "Não autenticado na app Partners." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const invoiceUrl = safeUrl(body?.invoiceUrl);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim().slice(0, 80) : "";
  if (!invoiceUrl || !invoiceNumber) return NextResponse.json({ error: "Indica o número e carrega a fatura em PDF." }, { status: 400 });

  const group = await prisma.referralGroup.findFirst({
    where: { id: groupId, partnerId: partner.id },
    select: {
      status: true,
      payment: { select: { id: true, status: true, capturedAt: true, stripeTransferId: true } },
    },
  });
  if (!group?.payment) return NextResponse.json({ error: "Reserva Partner não encontrada." }, { status: 404 });
  if (group.status === "REFUNDED" || group.payment.status === "REFUNDED_INVOICE_EXPIRED") {
    return NextResponse.json({ error: "O prazo de faturação terminou e o valor já foi devolvido ao restaurante." }, { status: 410 });
  }
  if (!["COMPLETED", "PAID"].includes(group.status) || !group.payment.capturedAt) {
    return NextResponse.json({ error: "A fatura fica disponível assim que o restaurante confirmar a visita ou terminar o prazo de 3 dias." }, { status: 409 });
  }
  if (group.payment.stripeTransferId || ["TRANSFERRED", "PAID"].includes(group.payment.status)) {
    return NextResponse.json({ error: "Este pagamento já foi processado." }, { status: 409 });
  }
  const invoiceDeadline = referralInvoiceDeadline(group.payment.capturedAt);
  if (invoiceDeadline <= new Date()) {
    return NextResponse.json({
      error: "O prazo de 30 dias terminou. O valor será devolvido ao restaurante e deixa de estar disponível para pagamento.",
    }, { status: 410 });
  }

  await prisma.referralPayment.update({
    where: { id: group.payment.id },
    data: {
      partnerInvoiceUrl: invoiceUrl,
      partnerInvoiceNumber: invoiceNumber,
      partnerInvoiceUploadedAt: new Date(),
      partnerInvoiceStatus: "PENDING",
      partnerInvoiceVerifiedAt: null,
      partnerInvoiceVerifiedBy: null,
      partnerInvoiceRejectedAt: null,
      partnerInvoiceRejectionReason: null,
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
