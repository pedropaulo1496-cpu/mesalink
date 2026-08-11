import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(new URL("/login", request.url), 303);

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const group = user ? await prisma.referralGroup.findFirst({
    where: { id: groupId, acceptedRestaurant: { userId: user.id }, status: "COMPLETED" },
    include: {
      payment: true,
      partner: true,
      acceptedRestaurant: { select: { email: true } },
    },
  }) : null;

  if (!group?.payment || !group.acceptedRestaurantId) {
    return NextResponse.json({ error: "Pagamento não disponível." }, { status: 404 });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const backUrl = `${baseUrl}/restaurants/${group.acceptedRestaurantId}/partner-network`;

  if (!group.partner.stripeOnboardingComplete || !group.partner.stripeAccountId) {
    return NextResponse.redirect(`${backUrl}?result=partner-payment-pending`, 303);
  }

  if (["PAID", "TRANSFERRED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(group.payment.status)) {
    return NextResponse.redirect(`${backUrl}?result=already-paid`, 303);
  }

  if (group.payment.stripeCheckoutSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(group.payment.stripeCheckoutSessionId);
      if (existing.status === "open" && existing.url) return NextResponse.redirect(existing.url, 303);
      if (existing.payment_status === "paid") return NextResponse.redirect(`${backUrl}?result=payment-processing`, 303);
    } catch (error) {
      console.warn("Could not reuse referral checkout", error);
    }
  }

  const attempt = group.payment.checkoutAttempt + 1;
  const checkout = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: group.acceptedRestaurant?.email || session.user.email,
      success_url: `${backUrl}?result=payment-processing`,
      cancel_url: `${backUrl}?result=payment-cancelled`,
      locale: "auto",
      line_items: [{
        quantity: 1,
        price_data: {
          currency: group.payment.currency.toLowerCase(),
          unit_amount: Math.round(Number(group.payment.grossCommission) * 100),
          product_data: {
            name: `Comissão do grupo ${group.publicCode}`,
            description: "85% parceiro · 15% MesaLink",
          },
        },
      }, ...(Number(group.payment.serviceFee) > 0 ? [{
        quantity: 1,
        price_data: {
          currency: group.payment.currency.toLowerCase(),
          unit_amount: Math.round(Number(group.payment.serviceFee) * 100),
          product_data: {
            name: "Serviço MesaLink Partner Network",
            description: "Operação, proteção do pagamento e distribuição da comissão.",
          },
        },
      }] : [])],
      metadata: {
        kind: "REFERRAL_COMMISSION",
        referralPaymentId: group.payment.id,
        referralGroupId: group.id,
        checkoutAttempt: String(attempt),
      },
      payment_intent_data: {
        transfer_group: `REFERRAL_${group.id}`,
        metadata: {
          kind: "REFERRAL_COMMISSION",
          referralPaymentId: group.payment.id,
          referralGroupId: group.id,
        },
      },
    },
    { idempotencyKey: `referral_checkout_${group.payment.id}_${attempt}` },
  );

  await prisma.referralPayment.update({
    where: { id: group.payment.id },
    data: {
      stripeCheckoutSessionId: checkout.id,
      checkoutAttempt: attempt,
      status: "CHECKOUT_CREATED",
      lastError: null,
    },
  });

  if (!checkout.url) return NextResponse.redirect(`${backUrl}?result=payment-error`, 303);
  return NextResponse.redirect(checkout.url, 303);
}
