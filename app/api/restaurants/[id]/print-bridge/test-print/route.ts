import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: restaurantId } = await params;
    const { restaurantPrinterId } = await request.json();

    if (!restaurantPrinterId) {
      return NextResponse.json(
        { error: "restaurantPrinterId obrigatório." },
        { status: 400 },
      );
    }

    const printer = await prisma.restaurantPrinter.findFirst({
      where: {
        id: restaurantPrinterId,
        restaurantId,
        active: true,
      },
    });

    if (!printer) {
      return NextResponse.json(
        { error: "Impressora não encontrada." },
        { status: 404 },
      );
    }

    await prisma.printJob.create({
      data: {
        restaurantId,
        printerId: printer.id,
        status: "PENDING",
        type: "TEST",
        title: `Teste ${printer.name}`,
        payload: {
          source: "PRINT_BRIDGE_TEST",
          productionCenter: {
            name: "Teste de impressão",
          },
          items: [
            {
              id: "test",
              name: "Teste de impressão MesaLink",
              quantity: 1,
              notes: "Se este talão saiu, a impressora está configurada.",
            },
          ],
          createdAt: new Date(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PRINT BRIDGE TEST PRINT ERROR:", error);

    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}