import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "jobIds inválidos" },
        { status: 400 },
      );
    }

    await prisma.printJob.updateMany({
      where: {
        id: {
          in: jobIds,
        },
      },
      data: {
        status: "PRINTED",
        printedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}