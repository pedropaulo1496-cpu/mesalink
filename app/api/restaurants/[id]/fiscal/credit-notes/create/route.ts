import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { documentId, reason } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Documento original obrigatório." },
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

    if (!integration.creditNoteSerieId) {
      return NextResponse.json(
        { error: "Série de nota de crédito não configurada." },
        { status: 400 },
      );
    }

    const originalDocument = await prisma.fiscalDocument.findFirst({
      where: {
        id: documentId,
        restaurantId,
        status: "ISSUED",
      },
      include: {
        creditNotes: true,
        tableSession: {
          include: {
            orders: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    if (!originalDocument) {
      return NextResponse.json(
        { error: "Documento original não encontrado." },
        { status: 404 },
      );
    }

    if (!originalDocument.externalId) {
      return NextResponse.json(
        { error: "Documento original sem ID Moloni." },
        { status: 400 },
      );
    }

    if (originalDocument.creditNotes.length > 0) {
      return NextResponse.json(
        { error: "Este documento já tem uma nota de crédito associada." },
        { status: 400 },
      );
    }

    const items =
      originalDocument.tableSession?.orders.flatMap((order) => order.items) ??
      [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Documento original não tem itens associados." },
        { status: 400 },
      );
    }

    const token = await getValidMoloniToken(restaurantId);

    const products = items.map((item) => ({
      name: item.productName,
      qty: Number(item.quantity ?? 1),
      price: Number(item.unitPrice ?? 0),
      taxes: [
        {
          tax_id: 0,
          value: 23,
          order: 1,
          cumulative: 0,
        },
      ],
    }));

    const response = await fetch(
      `https://api.moloni.pt/v1/creditNotes/insert/?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          company_id: String(integration.companyId),
          document_set_id: String(integration.creditNoteSerieId),
          date: new Date().toISOString().slice(0, 10),
          status: "1",
          reason: reason || "Anulação de documento",
          associated_documents: JSON.stringify([
            {
              document_id: Number(originalDocument.externalId),
            },
          ]),
          products: JSON.stringify(products),
        }),
      },
    );

    const raw = await response.text();

    console.log("MOLONI CREDIT NOTE STATUS:", response.status);
    console.log("MOLONI CREDIT NOTE RAW:", raw);

    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok || data?.valid === 0 || !data || Array.isArray(data)) {
      return NextResponse.json(
        {
          error: "Erro ao emitir nota de crédito Moloni.",
          details: data,
          status: response.status,
          raw,
        },
        { status: 400 },
      );
    }

    const moloniDocumentId =
      data?.document_id ?? data?.credit_note_id ?? data?.id ?? null;

    const documentNumber =
      data?.document_number ?? data?.number ?? data?.credit_note_number ?? null;

    const pdfUrl = data?.pdf_url ?? data?.pdfUrl ?? data?.url ?? null;

    const creditNote = await prisma.fiscalDocument.create({
      data: {
        restaurantId,
        tableSessionId: originalDocument.tableSessionId,
        paymentId: null,
        documentType: "CREDIT_NOTE",
        status: "ISSUED",
        provider: "MOLONI",
        externalId: moloniDocumentId ? String(moloniDocumentId) : null,
        documentNumber: documentNumber ? String(documentNumber) : null,
        pdfUrl: pdfUrl ? String(pdfUrl) : null,
        totalAmount: Number(originalDocument.totalAmount ?? 0),
        relatedDocumentId: originalDocument.id,
        issuedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      creditNote,
      moloni: data,
    });
  } catch (error: any) {
    console.error("MOLONI CREDIT NOTE CREATE ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}