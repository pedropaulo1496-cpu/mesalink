import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InvitationClient = Pick<Prisma.TransactionClient, "referralPartnerRestaurantInvitation" | "referralPartnerFavorite" | "referralPartnerRecruitmentReward" | "restaurant">;

export function partnerRestaurantInvitationTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function validPartnerRestaurantInvitationToken(token: string) {
  return /^[A-Za-z0-9_-]{40,120}$/.test(token);
}

export async function findPartnerRestaurantInvitation(token: string) {
  if (!validPartnerRestaurantInvitationToken(token)) return null;
  return prisma.referralPartnerRestaurantInvitation.findUnique({
    where: { tokenHash: partnerRestaurantInvitationTokenHash(token) },
    include: { partner: { select: { businessName: true, contactName: true, email: true } }, restaurant: { select: { id: true, name: true } } },
  });
}

export async function acceptPartnerRestaurantInvitation(client: InvitationClient, input: { token: string; email: string; restaurantId: string }) {
  if (!validPartnerRestaurantInvitationToken(input.token)) throw new Error("INVITATION_INVALID");
  const email = input.email.trim().toLowerCase();
  const invitation = await client.referralPartnerRestaurantInvitation.findUnique({
    where: { tokenHash: partnerRestaurantInvitationTokenHash(input.token) },
    select: { id: true, partnerId: true, email: true, expiresAt: true, acceptedAt: true, rewardEligible: true },
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date() || invitation.email !== email) throw new Error("INVITATION_INVALID");
  const restaurant = await client.restaurant.findUnique({
    where: { id: input.restaurantId },
    select: { id: true, name: true, address: true, email: true, externalPlaceProvider: true, externalPlaceId: true },
  });
  if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
  const provider = restaurant.externalPlaceProvider === "GOOGLE_PLACES" && restaurant.externalPlaceId ? "GOOGLE_PLACES" : "MESALINK";
  const placeId = provider === "GOOGLE_PLACES" ? restaurant.externalPlaceId! : restaurant.id;
  await client.referralPartnerFavorite.upsert({
    where: { partnerId_provider_placeId: { partnerId: invitation.partnerId, provider, placeId } },
    create: { partnerId: invitation.partnerId, provider, placeId, name: restaurant.name, address: restaurant.address || null },
    update: { name: restaurant.name, address: restaurant.address || null },
  });
  await client.referralPartnerRestaurantInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date(), restaurantId: restaurant.id },
  });
  if (invitation.rewardEligible) {
    await client.referralPartnerRecruitmentReward.upsert({
      where: { restaurantId: restaurant.id },
      create: { invitationId: invitation.id, partnerId: invitation.partnerId, restaurantId: restaurant.id },
      update: {},
    });
  }
  return { partnerId: invitation.partnerId, restaurantId: restaurant.id, provider, placeId };
}
