import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function syncRestaurantBillingDetails(session: Stripe.Checkout.Session, restaurantId: string) {
  const details = session.customer_details;
  const address = details?.address;
  const taxId = details?.tax_ids?.[0];
  if (!details) return { complete: false as const };

  const complete = Boolean(details.name && taxId?.value && address?.line1 && address?.postal_code && address?.city && address?.country);
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      billingLegalName: details.name || null,
      billingTaxId: taxId?.value || null,
      billingTaxIdType: taxId?.type || null,
      billingEmail: details.email || null,
      billingAddressLine1: address?.line1 || null,
      billingAddressLine2: address?.line2 || null,
      billingPostalCode: address?.postal_code || null,
      billingCity: address?.city || null,
      billingState: address?.state || null,
      billingCountry: address?.country || null,
      billingDetailsSyncedAt: complete ? new Date() : null,
    },
  });
  return { complete, taxId: taxId?.value || null };
}

export async function syncUserRestaurantBillingDetails(session: Stripe.Checkout.Session, userId: string) {
  const restaurant = await prisma.restaurant.findFirst({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true } });
  if (!restaurant) return { complete: false as const };
  return syncRestaurantBillingDetails(session, restaurant.id);
}
