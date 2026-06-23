import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const { status } = await request.json();

    if (!["PENDING", "PRINTED", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    await prisma.printJob.update({
      where: { id: jobId },
      data: {
        status,
        printedAt: status === "PRINTED" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PRINT JOB UPDATE ERROR:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}