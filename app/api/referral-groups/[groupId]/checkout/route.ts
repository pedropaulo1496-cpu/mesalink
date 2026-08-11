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
  const group = user
    ? await prisma.referralGroup.findFirst({
        where: { id: groupId, acceptedRestaurant: { userId: user.id }, status: "COMPLETED" },
        include: { payment: true, partner: true },
      })
    : null;

  if (!group?.payment || !group.acceptedRestaurantId) return NextResponse.json({ error: "Pagamento não disponível." }, { status: 404 });
  const backUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/restaurants/${group.acceptedRestaurantId}/partner-network`;

  if (!group.partner.stripeOnboardingComplete || !group.partner.stripeAccountId) {
    return NextResponse.redirect(`${backUrl}?result=partner-payment-pending`, 303);
  }

  if (["PAID", "TRANSFERRED"].includes(group.payment.status)) {
    return NextResponse.redirect(`${backUrl}?result=already-paid`, 303);
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${backUrl}?result=payment-success`,
    cancel_url: `${backUrl}?result=payment-cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(Number(group.payment.grossCommission) * 100),
          product_data: {
            name: `Comissão do grupo ${group.publicCode}`,
            description: "85% parceiro · 15% MesaLink",
          },
        },
      },
    ],
    metadata: {
      kind: "REFERRAL_COMMISSION",
      referralPaymentId: group.payment.id,
      referralGroupId: group.id,
    },
    payment_intent_data: {
      transfer_group: `REFERRAL_${group.id}`,
      metadata: { referralPaymentId: group.payment.id },
    },
  });

  await prisma.referralPayment.update({
    where: { id: group.payment.id },
    data: { stripeCheckoutSessionId: checkout.id, status: "CHECKOUT_CREATED" },
  });

  return NextResponse.redirect(checkout.url!, 303);
}
