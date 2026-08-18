import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { referralInvoiceDeadline } from "@/lib/referral-deadlines";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; groupId: string }> }) {
  const { id, groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const restaurant = await prisma.restaurant.findFirst({ where: { id, user: { email: session.user.email } }, select: { outboundReferralPartnerId: true } });
  if (!restaurant?.outboundReferralPartnerId) return NextResponse.json({ error: "Encaminhamentos não configurados." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const invoiceUrl = safeUrl(body?.invoiceUrl);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim().slice(0, 80) : "";
  if (!invoiceUrl || !invoiceNumber) return NextResponse.json({ error: "Indica o número e carrega a fatura em PDF." }, { status: 400 });
  const group = await prisma.referralGroup.findFirst({
    where: { id: groupId, partnerId: restaurant.outboundReferralPartnerId },
    select: { status: true, payment: { select: { id: true, status: true, capturedAt: true, stripeTransferId: true } } },
  });
  if (!group?.payment) return NextResponse.json({ error: "Comissão não encontrada." }, { status: 404 });
  if (!group.payment.capturedAt || !["COMPLETED", "PAID"].includes(group.status)) return NextResponse.json({ error: "A fatura fica disponível depois de a visita ser confirmada." }, { status: 409 });
  if (group.payment.stripeTransferId || ["TRANSFERRED", "PAID"].includes(group.payment.status)) return NextResponse.json({ error: "Este pagamento já foi processado." }, { status: 409 });
  if (referralInvoiceDeadline(group.payment.capturedAt) <= new Date()) return NextResponse.json({ error: "O prazo de faturação terminou." }, { status: 410 });
  await prisma.referralPayment.update({
    where: { id: group.payment.id },
    data: { partnerInvoiceUrl: invoiceUrl, partnerInvoiceNumber: invoiceNumber, partnerInvoiceUploadedAt: new Date(), partnerInvoiceStatus: "PENDING", partnerInvoiceVerifiedAt: null, partnerInvoiceVerifiedBy: null, partnerInvoiceRejectedAt: null, partnerInvoiceRejectionReason: null },
  });
  return NextResponse.json({ success: true });
}

function safeUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "ufs.sh" || host.endsWith(".ufs.sh") || host === "utfs.io" || host.endsWith(".utfs.io")) ? url.toString() : "";
  } catch { return ""; }
}
