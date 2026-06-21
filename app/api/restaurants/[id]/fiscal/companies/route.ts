import { prisma } from "@/lib/prisma";
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

    if (!integration?.accessToken) {
      return NextResponse.json(
        { error: "Moloni não ligado." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.moloni.pt/v1/companies/getAll/?access_token=${integration.accessToken}`,
      {
        method: "POST",
      },
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("MOLONI COMPANIES ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno." },
      { status: 500 },
    );
  }
}