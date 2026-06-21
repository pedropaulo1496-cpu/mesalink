import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const formData = await request.formData();

  await prisma.restaurant.update({
    where: { id },
    data: {
      averageTicket: Number(formData.get("averageTicket")),

      googleReviewUrl:
        String(formData.get("googleReviewUrl")) || null,

      reviewRedirectThreshold: Number(
        formData.get("reviewRedirectThreshold")
      ),

      birthdayOffer:
        String(formData.get("birthdayOffer")) || null,

      recoveryOffer:
        String(formData.get("recoveryOffer")) || null,

      vipOffer:
        String(formData.get("vipOffer")) || null,
    },
  });

  return NextResponse.redirect(
  new URL(`/restaurants/${id}/marketing?saved=1`, request.url),
  303
  );
}