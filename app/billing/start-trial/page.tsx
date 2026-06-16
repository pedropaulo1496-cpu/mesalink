import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

type Feature = "pro" | "website" | "qr-ordering";

type StartTrialPageProps = {
  searchParams?: Promise<{
    feature?: string;
    restaurantId?: string;
  }>;
};

export default async function StartTrialPage({
  searchParams,
}: StartTrialPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : {};
  const feature = params.feature as Feature | undefined;
  const restaurantId = params.restaurantId;

  if (!feature || !["pro", "website", "qr-ordering"].includes(feature)) {
    redirect("/billing");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) {
    redirect("/login");
  }

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const subscription =
    user.subscription ??
    (await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: "FREE",
        status: "ACTIVE",
        trialEndsAt: null,
        restaurantLimit: 1,
        priceMonthly: 0,
        websiteAddon: false,
        qrOrderingAddon: false,
      },
    }));

  if (feature === "pro") {
    if (subscription.proTrialEndsAt || subscription.plan === "PRO") {
      redirect("/billing");
    }

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        proTrialEndsAt: trialEndsAt,
      },
    });
  }

  if (feature === "website") {
    if (subscription.websiteTrialEndsAt || subscription.websiteAddon) {
      redirect("/billing");
    }

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        websiteTrialEndsAt: trialEndsAt,
      },
    });
  }

  if (feature === "qr-ordering") {
    if (subscription.qrOrderingTrialEndsAt || subscription.qrOrderingAddon) {
      redirect("/billing");
    }

    await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        qrOrderingTrialEndsAt: trialEndsAt,
      },
    });
  }

  if (feature === "qr-ordering" && restaurantId) {
    redirect(`/restaurants/${restaurantId}/ordering`);
  }

  if (feature === "website" && restaurantId) {
    redirect(`/restaurants/${restaurantId}/website`);
  }

  if (restaurantId) {
    redirect(`/restaurants/${restaurantId}`);
  }

  redirect("/billing");
}