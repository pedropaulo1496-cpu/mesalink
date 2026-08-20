import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { searchGoogleRestaurants } from "@/lib/google-places";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: { name: true, address: true, googleBusinessAddress: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || restaurant.name;
  const location = url.searchParams.get("location")?.trim() || restaurant.address || restaurant.googleBusinessAddress || "Portugal";
  try {
    const result = await searchGoogleRestaurants({ query, location });
    return NextResponse.json({
      restaurants: result.restaurants.slice(0, 6).map((place) => ({
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        reviewCount: place.reviewCount,
        mapUrl: place.mapUrl,
      })),
    });
  } catch (error) {
    console.error("Google Maps association search failed", error);
    return NextResponse.json({ error: "Não foi possível pesquisar no Google Maps agora." }, { status: 502 });
  }
}
