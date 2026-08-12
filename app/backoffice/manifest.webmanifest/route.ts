import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "MesaLink Backoffice",
    short_name: "MesaLink HQ",
    description: "Clientes, comissões e equipa comercial MesaLink.",
    start_url: "/backoffice",
    scope: "/backoffice",
    display: "standalone",
    background_color: "#F4ECDF",
    theme_color: "#17130F",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
