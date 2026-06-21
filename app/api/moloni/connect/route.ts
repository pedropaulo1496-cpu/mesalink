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
  const baseRedirectUri = process.env.MOLONI_REDIRECT_URI;

  if (!developerId || !baseRedirectUri) {
    return NextResponse.json(
      { error: "Moloni não configurado." },
      { status: 500 },
    );
  }

  const redirectUri = `${baseRedirectUri}?restaurantId=${restaurantId}`;

  const url =
    "https://www.moloni.pt/ac/root/oauth/?" +
    new URLSearchParams({
      response_type: "code",
      client_id: developerId,
      redirect_uri: redirectUri,
    });

  return NextResponse.redirect(url);
}