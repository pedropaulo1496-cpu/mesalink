import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json(
      { error: "restaurantId em falta." },
      { status: 400 },
    );
  }

  const developerId = process.env.MOLONI_DEVELOPER_ID;
  const redirectUri = process.env.MOLONI_REDIRECT_URI;

  if (!developerId || !redirectUri) {
    return NextResponse.json(
      { error: "Moloni não configurado." },
      { status: 500 },
    );
  }

  const url =
    "https://www.moloni.pt/ac/root/oauth/?" +
    new URLSearchParams({
      response_type: "code",
      client_id: developerId,
      redirect_uri: redirectUri,
    });

  const response = NextResponse.redirect(url);

  response.cookies.set("moloni_restaurant_id", restaurantId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}