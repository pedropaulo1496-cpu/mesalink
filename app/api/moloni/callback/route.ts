import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getCookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    const restaurantId = getCookie(request, "moloni_restaurant_id");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurante não encontrado na ligação Moloni." },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code em falta." },
        { status: 400 },
      );
    }

    const developerId = process.env.MOLONI_DEVELOPER_ID;
    const clientSecret = process.env.MOLONI_CLIENT_SECRET;
    const redirectUri = process.env.MOLONI_REDIRECT_URI;

    if (!developerId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Moloni não configurado no servidor." },
        { status: 500 },
      );
    }

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

    if (!response.ok || !data?.access_token) {
      return NextResponse.json(
        { error: "Erro ao obter token Moloni.", details: data },
        { status: 400 },
      );
    }

    const expiresIn = Number(data.expires_in ?? 3600);
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    await prisma.fiscalIntegration.upsert({
      where: { restaurantId },
      create: {
        restaurantId,
        provider: "MOLONI",
        clientId: developerId,
        clientSecret,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        tokenExpiresAt,
        active: true,
      },
      update: {
        provider: "MOLONI",
        clientId: developerId,
        clientSecret,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        tokenExpiresAt,
        active: true,
      },
    });

    const redirect = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/restaurants/${restaurantId}/pos`,
    );

    redirect.cookies.delete("moloni_restaurant_id");

    return redirect;
  } catch (error: any) {
    console.error("MOLONI CALLBACK ERROR:", error);

    return NextResponse.json(
      { error: error?.message ?? "Erro interno Moloni." },
      { status: 500 },
    );
  }
}