import { NextResponse } from "next/server";
import { finalizeReferralAuthorization } from "@/lib/referral-authorization";

export async function GET(request: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return NextResponse.redirect(new URL("/dashboard", request.url));

  try {
    const result = await finalizeReferralAuthorization(sessionId);
    if (result.status === "accepted") {
      return NextResponse.redirect(new URL(`/restaurants/${result.restaurantId}/partner-network?result=accepted`, request.url));
    }
    if (result.status === "fiscal_required") {
      return NextResponse.redirect(new URL(`/restaurants/${result.restaurantId}/partner-network?result=fiscal-required`, request.url));
    }
    if (result.status === "authorization_too_short") {
      return NextResponse.redirect(new URL(`/restaurants/${result.restaurantId}/partner-network?result=authorization-too-short`, request.url));
    }
    if (result.status === "unavailable") {
      return NextResponse.redirect(new URL(`/dashboard?result=group-unavailable`, request.url));
    }
    return NextResponse.redirect(new URL(`/dashboard?result=authorization-processing&offer=${offerId}`, request.url));
  } catch (error) {
    console.error("Finalize referral authorization error", error);
    return NextResponse.redirect(new URL(`/dashboard?result=authorization-error&offer=${offerId}`, request.url));
  }
}
