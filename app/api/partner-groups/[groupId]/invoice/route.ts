import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const invoiceUrl = safeUrl(body?.invoiceUrl);
  const invoiceNumber = typeof body?.invoiceNumber === "string" ? body.invoiceNumber.trim().slice(0, 80) : "";
  if (!invoiceUrl || !invoiceNumber) return NextResponse.json({ error: "Indica o número e carrega a fatura em PDF." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { referralPartner: { select: { id: true } } } });
  const group = user?.referralPartner ? await prisma.referralGroup.findFirst({
    where: { id: groupId, partnerId: user.referralPartner.id, status: { in: ["COMPLETED", "PAID"] } },
    select: { desiredDate: true, payment: { select: { id: true } } },
  }) : null;
  if (!group?.payment) return NextResponse.json({ error: "Este grupo ainda não está pronto para faturação." }, { status: 404 });
  const invoiceAvailableAt = new Date(group.desiredDate.getTime() + 24 * 60 * 60 * 1000);
  if (invoiceAvailableAt > new Date()) {
    return NextResponse.json({
      error: `A fatura fica disponível 24h após a reserva, em ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(invoiceAvailableAt)}.`,
    }, { status: 409 });
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
