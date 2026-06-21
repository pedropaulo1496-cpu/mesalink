import { NextResponse } from "next/server";

export async function GET() {
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

console.log(
  process.env.MOLONI_DEVELOPER_ID,
  process.env.MOLONI_REDIRECT_URI,
);

  return NextResponse.redirect(url);
}