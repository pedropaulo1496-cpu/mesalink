import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Cria ou entra diretamente na tua conta MesaLink Partners." },
    { status: 410 },
  );
}
