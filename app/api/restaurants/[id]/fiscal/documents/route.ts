import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const documents = await prisma.fiscalDocument.findMany({
      where: {
        restaurantId,
        ...(type && type !== "ALL"
          ? {
              documentType: type,
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      documents: documents.map((document) => ({
        ...document,
        totalAmount: Number(document.totalAmount),
      })),
    });
  } catch (error) {
    console.error("FISCAL DOCUMENTS GET ERROR:", error);

    return NextResponse.json(
      { error: "Erro ao carregar documentos fiscais." },
      { status: 500 },
    );
  }
}