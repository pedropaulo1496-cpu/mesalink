import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "MesaLink Partners",
      short_name: "ML Partners",
      description: "Envie grupos anónimos para restaurantes e acompanhe as suas comissões.",
      id: "/partners/",
      start_url: "/partners/app",
      scope: "/partners/",
      display: "standalone",
      orientation: "portrait-primary",
      background_color: "#F5EFE6",
      theme_color: "#17120D",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
