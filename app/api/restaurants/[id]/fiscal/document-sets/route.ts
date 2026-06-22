import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

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

    console.log("COMPANY ID:", integration.companyId);
console.log("COMPANY ID TYPE:", typeof integration.companyId);

    const response = await fetch(
      `https://api.moloni.pt/v1/documentSets/getAll/?access_token=${token}`,
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

    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("MOLONI DOCUMENT SETS ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}