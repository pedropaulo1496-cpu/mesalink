import { NextResponse, type NextRequest } from "next/server";

const VALID_DISTRIBUTIONS = new Set(["direct", "play"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ distribution: string }> }) {
  const { distribution } = await params;
  if (!VALID_DISTRIBUTIONS.has(distribution)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("mesalink_app_distribution", distribution, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return response;
}
