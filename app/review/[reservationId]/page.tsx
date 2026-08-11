import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ReviewForm from "./ReviewForm";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;

  const t = await getTranslations("publicFlows.review");

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      restaurant: true,
      customer: true,
    },
  });

  if (!reservation || !reservation.restaurant) notFound();

  return (
    <main className="min-h-screen bg-[#F5EFE6] px-4 py-10 text-[#16120E]">
      <div className="mx-auto max-w-xl rounded-[36px] border border-[#E1D0B8] bg-white p-6 shadow-[0_24px_80px_rgba(80,55,30,0.09)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#9B6F3B]">
            MesaLink
          </p>

          <LanguageSwitcher />
        </div>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
          {t("title")}
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#6B6258]">
          {t("subtitle", { restaurantName: reservation.restaurant.name })}
        </p>

        <ReviewForm
          reservationId={reservation.id}
          restaurantName={reservation.restaurant.name}
          googleReviewUrl={reservation.restaurant.googleReviewUrl || ""}
          threshold={reservation.restaurant.reviewRedirectThreshold || 4}
        />
      </div>
    </main>
  );
}