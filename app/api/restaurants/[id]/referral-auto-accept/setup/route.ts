import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePortugueseTaxId(value: string) {
  const normalized = value.toUpperCase().replace(/[\s.-]/g, "").replace(/^PT/, "");
  return /^\d{9}$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, user: { email: session.user.email } },
    select: {
      id: true,
      name: true,
      email: true,
      billingLegalName: true,
      billingTaxId: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingPostalCode: true,
      billingCity: true,
      user: { select: { id: true, subscription: { select: { stripeCustomerId: true } } } },
    },
  });
  if (!restaurant?.user) return NextResponse.redirect(new URL("/dashboard", request.url), 303);

  const formData = await request.formData();
  const legalName = field(formData, "legalName") || restaurant.billingLegalName || "";
  const taxId = normalizePortugueseTaxId(field(formData, "taxId") || restaurant.billingTaxId || "");
  const addressLine1 = field(formData, "addressLine1") || restaurant.billingAddressLine1 || "";
  const addressLine2 = field(formData, "addressLine2") || restaurant.billingAddressLine2 || "";
  const postalCode = field(formData, "postalCode") || restaurant.billingPostalCode || "";
  const city = field(formData, "city") || restaurant.billingCity || "";
  if (!legalName || !taxId || !addressLine1 || !/^\d{4}-\d{3}$/.test(postalCode) || !city) {
    return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=fiscal-invalid`, request.url), 303);
  }

  let customerId = restaurant.user.subscription?.stripeCustomerId || null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: restaurant.email || session.user.email,
      name: restaurant.name,
      metadata: { userId: restaurant.user.id, restaurantId: restaurant.id },
    });
    customerId = customer.id;
    await prisma.subscription.upsert({
      where: { userId: restaurant.user.id },
      create: { userId: restaurant.user.id, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }

  await stripe.customers.update(customerId, {
    name: legalName,
    email: restaurant.email || session.user.email,
    address: { line1: addressLine1, line2: addressLine2 || undefined, postal_code: postalCode, city, country: "PT" },
  });
  const stripeTaxId = `PT${taxId}`;
  const existingTaxIds = await stripe.customers.listTaxIds(customerId, { limit: 100 });
  if (!existingTaxIds.data.some((item) => item.type === "eu_vat" && item.value.replace(/\s/g, "").toUpperCase() === stripeTaxId)) {
    if (existingTaxIds.data.length > 0) {
      return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=fiscal-tax-id-conflict`, request.url), 303);
    }
    await stripe.customers.createTaxId(customerId, { type: "eu_vat", value: stripeTaxId });
  }
  await prisma.restaurant.update({
    where: { id },
    data: {
      billingLegalName: legalName,
      billingTaxId: taxId,
      billingTaxIdType: "eu_vat",
      billingEmail: restaurant.email || session.user.email,
      billingAddressLine1: addressLine1,
      billingAddressLine2: addressLine2 || null,
      billingPostalCode: postalCode,
      billingCity: city,
      billingCountry: "PT",
      billingDetailsSyncedAt: new Date(),
    },
  });

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const checkout = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${baseUrl}/api/restaurants/${id}/referral-auto-accept/setup/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/restaurants/${id}/partner-network?result=card-cancelled`,
    locale: "auto",
    metadata: { kind: "REFERRAL_AUTO_ACCEPT_SETUP", restaurantId: id },
  });

  if (!checkout.url) return NextResponse.redirect(new URL(`/restaurants/${id}/partner-network?result=card-error`, request.url), 303);
  return NextResponse.redirect(checkout.url, 303);
}
