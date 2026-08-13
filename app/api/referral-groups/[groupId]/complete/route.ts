import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReferralSettlementError, settleReferralAttendance } from "@/lib/referral-settlement";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const form = await request.formData();
  const outcome = form.get("outcome") === "NO_SHOW" ? "NO_SHOW" : "ATTENDED";
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const group = user ? await prisma.referralGroup.findFirst({
    where: { id: groupId, acceptedRestaurant: { userId: user.id } },
    select: { acceptedRestaurantId: true },
  }) : null;
  if (!user || !group?.acceptedRestaurantId) {
    return NextResponse.json({ error: "Reserva Partner não encontrada." }, { status: 404 });
  }

  const backUrl = new URL(`/restaurants/${group.acceptedRestaurantId}/partner-network`, request.url);
  try {
    const result = await settleReferralAttendance({
      groupId,
      outcome,
      actualGuests: Number(form.get("actualGuests")),
      restaurantUserId: user.id,
    });
    backUrl.searchParams.set("result", result.status === "NO_SHOW" ? "no-show" : "captured");
  } catch (error) {
    const code = error instanceof ReferralSettlementError ? error.code : "PAYMENT_FAILED";
    backUrl.searchParams.set("result", resultCode(code));
  }
  return NextResponse.redirect(backUrl, 303);
}

function resultCode(code: ReferralSettlementError["code"] | "PAYMENT_FAILED") {
  if (code === "TOO_EARLY") return "too-early";
  if (code === "CONFIRMATION_EXPIRED") return "confirmation-expired";
  if (code === "INVALID_ATTENDANCE") return "invalid-attendance";
  if (code === "ALREADY_SETTLED") return "already-settled";
  if (code === "NOT_FOUND") return "not-found";
  return "payment-blocked";
}
