import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: restaurantId } = await params;

  const integration = await prisma.fiscalIntegration.findUnique({
    where: { restaurantId },
  });

  const token = await getValidMoloniToken(restaurantId);

  const response = await fetch(
    `https://api.moloni.pt/v1/documentSets/getAll/?access_token=${token}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        company_id: String(integration?.companyId),
      }),
    },
  );

  const data = await response.json();

  return NextResponse.json(data);
}