import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { id: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const frequencyDays = Number.isFinite(Number(body.frequencyDays)) ? Math.min(30, Math.max(7, Math.round(Number(body.frequencyDays)))) : 14;
  const maxDiscount = Number.isFinite(Number(body.maxDiscount)) ? Math.min(30, Math.max(0, Math.round(Number(body.maxDiscount)))) : 15;
  const updated = await prisma.restaurant.update({
    where: { id },
    data: {
      marketingAutopilotEnabled: body.enabled,
      marketingAutopilotFrequencyDays: frequencyDays,
      marketingAutopilotMaxDiscount: maxDiscount,
      ...(!body.enabled ? {} : { marketingAutopilotLastRunAt: null }),
    },
    select: { marketingAutopilotEnabled: true, marketingAutopilotFrequencyDays: true, marketingAutopilotMaxDiscount: true },
  });
  return NextResponse.json({ success: true, enabled: updated.marketingAutopilotEnabled, frequencyDays: updated.marketingAutopilotFrequencyDays, maxDiscount: updated.marketingAutopilotMaxDiscount });
}
