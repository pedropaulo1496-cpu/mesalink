import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isReferralCuisineTag } from "@/lib/referral-tags";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const owner = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  const restaurant = owner
    ? await prisma.restaurant.findFirst({ where: { id, userId: owner.id }, select: { id: true } })
    : null;
  if (!restaurant) return NextResponse.json({ error: "Restaurante não encontrado." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const cuisine = text(body.cuisine, 80);
  const description = text(body.description, 700);
  const heroImage = safeUrl(body.heroImage);
  const menuUrl = safeUrl(body.menuUrl);
  const googleMapsUrl = safeUrl(body.googleMapsUrl);
  const googleRating = optionalNumber(body.googleRating);
  const googleReviewCount = optionalNumber(body.googleReviewCount);
  const googlePriceLevel = optionalNumber(body.googlePriceLevel);
  const gallery = lines(body.gallery, 6, 1000).map(safeUrl).filter(Boolean);
  const highlights = lines(body.highlights, 6, 80);

  if (!isReferralCuisineTag(cuisine)) {
    return NextResponse.json({ error: "Escolhe um tipo de cozinha da lista." }, { status: 400 });
  }

  if ((body.heroImage && !heroImage) || (body.menuUrl && !menuUrl) || (body.googleMapsUrl && !googleMapsUrl)) {
    return NextResponse.json({ error: "Confirma os links da imagem e do menu." }, { status: 400 });
  }
  if ((googleRating != null && (googleRating < 1 || googleRating > 5)) || (googleReviewCount != null && (!Number.isInteger(googleReviewCount) || googleReviewCount < 0)) || (googlePriceLevel != null && (![1, 2, 3, 4].includes(googlePriceLevel)))) {
    return NextResponse.json({ error: "Confirma a avaliação, número de reviews e faixa de preço Google." }, { status: 400 });
  }

  await prisma.restaurant.update({
    where: { id },
    data: {
      referralProfileCuisine: cuisine,
      referralProfileDescription: description || null,
      referralProfileHeroImage: heroImage || null,
      referralProfileGallery: gallery,
      referralProfileHighlights: highlights,
      referralProfileMenuUrl: menuUrl || null,
      googleReviewUrl: googleMapsUrl || null,
      googleRating,
      googleReviewCount,
      googlePriceLevel,
    },
  });

  revalidatePath(`/restaurants/${id}/partner-network`);
  revalidatePath("/partners/app");
  return NextResponse.json({ success: true });
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function lines(value: unknown, maxItems: number, maxLength: number) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\r?\n/)
      : [];
  return Array.from(new Set(values.map((item) => text(item, maxLength)).filter(Boolean))).slice(0, maxItems);
}

function safeUrl(value: unknown) {
  const candidate = text(value, 1000);
  if (!candidate) return "";
  if (candidate.startsWith("/")) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function optionalNumber(value: unknown) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
