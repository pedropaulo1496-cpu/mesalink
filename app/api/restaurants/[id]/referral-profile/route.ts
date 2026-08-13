import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "O perfil Partner é sincronizado a partir do Google e das definições verificadas do restaurante." },
    { status: 405, headers: { Allow: "GET" } },
  );
}
