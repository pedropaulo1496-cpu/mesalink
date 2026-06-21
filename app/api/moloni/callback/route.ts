import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code em falta." },
      { status: 400 },
    );
  }

  const developerId = process.env.MOLONI_DEVELOPER_ID!;
  const clientSecret = process.env.MOLONI_CLIENT_SECRET!;
  const redirectUri = process.env.MOLONI_REDIRECT_URI!;

  const tokenUrl =
    "https://api.moloni.pt/v1/grant/?" +
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: developerId,
      redirect_uri: redirectUri,
      client_secret: clientSecret,
      code,
    });

  const response = await fetch(tokenUrl);

  const data = await response.json();

  console.log("MOLONI TOKEN RESPONSE:", data);

  return NextResponse.json(data);
}