import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nif = searchParams.get("nif");

  if (!nif) {
    return NextResponse.json(
      { error: "NIF obrigatório." },
      { status: 400 },
    );
  }

  const key = process.env.NIF_PT_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "API key NIF.PT não configurada." },
      { status: 500 },
    );
  }

  const response = await fetch(
    `https://www.nif.pt/?json=1&q=${encodeURIComponent(nif)}&key=${encodeURIComponent(key)}`,
  );

  const data = await response.json();

  return NextResponse.json(data);
}