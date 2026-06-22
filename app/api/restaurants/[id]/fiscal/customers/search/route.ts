import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: restaurantId } = await params;

  const token = await getValidMoloniToken(restaurantId);

  return Response.json({
    success: true,
    tokenExists: Boolean(token),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { vat } = await request.json();

    if (!vat) {
      return NextResponse.json(
        { error: "NIF obrigatório." },
        { status: 400 },
      );
    }

    const integration = await prisma.fiscalIntegration.findUnique({
      where: {
        restaurantId,
      },
    });

    if (!integration?.companyId) {
      return NextResponse.json(
        { error: "Empresa Moloni não configurada." },
        { status: 400 },
      );
    }

    const token = await getValidMoloniToken(restaurantId);

    const response = await fetch(
      `https://api.moloni.pt/v1/customers/getAll/?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          company_id: String(integration.companyId),
        }),
      },
    );

    const customers = await response.json();

    const customer = Array.isArray(customers)
      ? customers.find((c) => c.vat === vat)
      : null;

    return NextResponse.json({
      found: Boolean(customer),
      customer,
    });
  } catch (error: any) {
    console.error("MOLONI CUSTOMER SEARCH ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}