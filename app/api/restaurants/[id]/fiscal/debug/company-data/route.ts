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

  const endpoints = [
    "salesmen/getAll",
    "deliveryMethods/getAll",
    "languages/getAll",
  ];

  const results: Record<string, any> = {};

  for (const endpoint of endpoints) {
    const response = await fetch(
      `https://api.moloni.pt/v1/${endpoint}/?access_token=${token}`,
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

    results[endpoint] = await response.json();
  }

  return NextResponse.json(results);
}