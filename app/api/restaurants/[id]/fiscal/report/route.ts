import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const documents = await prisma.fiscalDocument.findMany({
      where: {
        restaurantId,
        status: "ISSUED",
        issuedAt: {
          gte: start,
        },
      },
    });

    const invoices = documents.filter(
      (d) => d.documentType === "INVOICE",
    );

    const simplified = documents.filter(
      (d) => d.documentType === "SIMPLIFIED_INVOICE",
    );

    const creditNotes = documents.filter(
      (d) => d.documentType === "CREDIT_NOTE",
    );

    const total = documents.reduce(
      (sum, d) => sum + Number(d.totalAmount),
      0,
    );

    return NextResponse.json({
      invoices: invoices.length,
      simplifiedInvoices: simplified.length,
      creditNotes: creditNotes.length,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}