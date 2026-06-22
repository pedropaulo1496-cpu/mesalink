import { prisma } from "@/lib/prisma";
import { getValidMoloniToken } from "@/lib/moloni";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const {
      vat,
      name,
      email,
    } = await request.json();

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
      `https://api.moloni.pt/v1/customers/insert/?access_token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
  company_id: String(integration.companyId),
  number: vat,
  name: name || "Consumidor Final",
  vat,
  email: email ?? "",
  country_id: "1",

  language_id: "1",
  salesman_id: "0",
  maturity_date_id: "2578073",
  payment_day: "0",
  discount: "0",
  credit_limit: "0",
  payment_method_id: "0",
  delivery_method_id: "3079513",
}),
      },
    );

    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error?.message ?? "Erro interno",
      },
      { status: 500 },
    );
  }
}