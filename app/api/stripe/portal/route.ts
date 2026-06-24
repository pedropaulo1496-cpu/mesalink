import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user?.subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Ainda não existe uma subscrição ativa para gerir." },
      { status: 400 },
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}