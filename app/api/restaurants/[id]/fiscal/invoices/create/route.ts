import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { sessionId, customerId, withVatNumber } = await request.json();

    if (!sessionId || !customerId) {
      return NextResponse.json(
        { error: "sessionId e customerId são obrigatórios." },
        { status: 400 },
      );
    }

    const integration = await prisma.fiscalIntegration.findUnique({
      where: { restaurantId },
    });

    if (!integration?.companyId) {
      return NextResponse.json(
        { error: "Empresa Moloni não configurada." },
        { status: 400 },
      );
    }

    const documentSetId =
  integration.invoiceSerieId ||
  integration.simplifiedInvoiceSerieId;

if (!documentSetId) {
  return NextResponse.json(
    { error: "Série Moloni não configurada." },
    { status: 400 },
  );
}

   const session = await prisma.pOSTableSession.findFirst({
  where: {
    id: sessionId,
    restaurantId,
  },
  include: {
    payments: {
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    },
    orders: {
      include: {
        items: true,
      },
    },
  },
});

    if (!session) {
      return NextResponse.json(
        { error: "Sessão POS não encontrada." },
        { status: 404 },
      );
    }

    const items = session.orders.flatMap((order) => order.items);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "A conta não tem itens para faturar." },
        { status: 400 },
      );
    }

    const token = await getValidMoloniToken(restaurantId);

    const products = items.map((item) => {
  const vatRate = Number((item as any).vatRate ?? 23);

  return {
    name: item.productName,
    qty: Number(item.quantity ?? 1),
    price: Number(item.unitPrice ?? 0),
    taxes: [
      {
        tax_id: 0,
        value: vatRate,
        order: 1,
        cumulative: 0,
      },
    ],
  };
});

    const response = await fetch(
      `https://api.moloni.pt/v1/invoices/insert/?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          company_id: String(integration.companyId),
          document_set_id: String(documentSetId),
          customer_id: String(customerId),
          date: new Date().toISOString().slice(0, 10),
          expiration_date: new Date().toISOString().slice(0, 10),
          status: "1",
          products: JSON.stringify(products),
        }),
      },
    );

    const raw = await response.text();

    console.log("MOLONI STATUS:", response.status);
    console.log("MOLONI RAW RESPONSE:", raw);

    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok || data?.valid === 0 || !data || Array.isArray(data)) {
      return NextResponse.json(
        {
          error: "Erro ao emitir documento Moloni.",
          details: data,
          status: response.status,
          raw,
        },
        { status: 400 },
      );
    }

    const documentId =
      data?.document_id ??
      data?.invoice_id ??
      data?.id ??
      null;

    const documentNumber =
      data?.document_number ??
      data?.number ??
      data?.invoice_number ??
      null;

    const pdfUrl =
      data?.pdf_url ??
      data?.pdfUrl ??
      data?.url ??
      null;

      const latestPayment = session.payments?.[0] ?? null;

    await prisma.fiscalDocument.create({
  data: {
    restaurantId,
    tableSessionId: session.id,
    paymentId: latestPayment?.id,

    documentType: withVatNumber
      ? "INVOICE"
      : "SIMPLIFIED_INVOICE",

    status: "ISSUED",
    provider: "MOLONI",

    externalId: documentId
      ? String(documentId)
      : null,

    documentNumber: documentNumber
      ? String(documentNumber)
      : null,

    pdfUrl: pdfUrl
      ? String(pdfUrl)
      : null,

    totalAmount: Number(
      session.totalAmount ?? 0,
    ),

    issuedAt: new Date(),
  },
});

    return NextResponse.json({
      success: true,
      moloni: data,
    });
  } catch (error: any) {
    console.error("MOLONI INVOICE CREATE ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}