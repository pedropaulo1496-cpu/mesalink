import { NextResponse } from "next/server";
import { finalizeReferralAuthorization } from "@/lib/referral-authorization";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const backUrl = new URL(`/partner-reservation/${token}`, request.url);
  if (!sessionId) return NextResponse.redirect(backUrl);
  try {
    const result = await finalizeReferralAuthorization(sessionId);
    backUrl.searchParams.set("result", result.status === "accepted" ? "accepted" : result.status === "fiscal_required" ? "fiscal-required" : result.status === "authorization_too_short" ? "authorization-too-short" : result.status === "unavailable" ? "unavailable" : "processing");
  } catch (error) {
    console.error("External referral authorization error", error);
    backUrl.searchParams.set("result", "payment-error");
  }
  return NextResponse.redirect(backUrl);
}
