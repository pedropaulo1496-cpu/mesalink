import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const integration = await prisma.fiscalIntegration.findUnique({
      where: { restaurantId },
    });

    return NextResponse.json({
      integration,
    });
  } catch (error) {
    console.error("FISCAL SETTINGS GET ERROR:", error);

    return NextResponse.json(
      { error: "Erro ao carregar configuração fiscal." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const {
      clientId,
      clientSecret,
      companyId,
      invoiceSerieId,
      simplifiedInvoiceSerieId,
      creditNoteSerieId,
      active,
    } = await request.json();

    const integration = await prisma.fiscalIntegration.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        provider: "MOLONI",
        clientId: clientId || null,
        clientSecret: clientSecret || null,
        companyId: companyId || null,
        invoiceSerieId: invoiceSerieId || null,
        simplifiedInvoiceSerieId: simplifiedInvoiceSerieId || null,
        creditNoteSerieId: creditNoteSerieId || null,
        active: Boolean(active),
      },
      update: {
        clientId: clientId || null,
        clientSecret: clientSecret || null,
        companyId: companyId || null,
        invoiceSerieId: invoiceSerieId || null,
        simplifiedInvoiceSerieId: simplifiedInvoiceSerieId || null,
        creditNoteSerieId: creditNoteSerieId || null,
        active: Boolean(active),
      },
    });

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error) {
    console.error("FISCAL SETTINGS PATCH ERROR:", error);

    return NextResponse.json(
      { error: "Erro ao guardar configuração fiscal." },
      { status: 500 },
    );
  }
}