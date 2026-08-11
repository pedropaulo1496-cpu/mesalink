"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  reservationId: string;
  restaurantName: string;
  googleReviewUrl: string;
  threshold: number;
};

export default function ReviewForm({
  reservationId,
  restaurantName,
  googleReviewUrl,
  threshold,
}: Props) {
  const t = useTranslations("publicFlows.review");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [wantsVip, setWantsVip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vipLoading, setVipLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [vipSubmitted, setVipSubmitted] = useState(false);
  const [redirectToGoogle, setRedirectToGoogle] = useState(false);

  const isPositive = rating !== null && rating >= threshold;
  const isNegative = rating !== null && rating < threshold;

  async function submitReview() {
    if (!rating) return;

    setLoading(true);

    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reservationId,
        rating,
        comment: isNegative ? comment : "",
      }),
    });

    const data = await response.json();

    setSubmitted(true);
    setRedirectToGoogle(Boolean(data.redirectToGoogle));
    setLoading(false);
  }

  async function joinVipClub() {
    setVipLoading(true);

    await fetch("/api/marketing/vip-opt-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reservationId,
        birthDate: birthDate || null,
      }),
    });

    setVipSubmitted(true);
    setVipLoading(false);
  }

  if (submitted) {
    return (
      <div className="mt-8 space-y-5">
        <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-6">
          {redirectToGoogle ? (
            <>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {t("thankYouPositiveTitle")}
              </h2>

              <p className="mt-3 text-sm text-[#6B6258]">
                {t("thankYouPositiveText")}
              </p>

              {googleReviewUrl ? (
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex rounded-full bg-[#16120E] px-5 py-3 text-sm font-semibold text-white"
                >
                  {t("shareOnGoogle")}
                </a>
              ) : (
                <p className="mt-4 text-sm text-[#6B6258]">
                  {t("positiveNoGoogleText")}
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold tracking-[-0.04em]">
                {t("thankYouNegativeTitle")}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#6B6258]">
                {t("thankYouNegativeText", { restaurantName })}
              </p>
            </>
          )}
        </div>

        {redirectToGoogle && !vipSubmitted ? (
          <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-6 shadow-[0_18px_55px_rgba(80,55,30,0.055)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              {t("vip.badge")}
            </p>

            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.045em]">
              {t("vip.title")}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              {t("vip.text", { restaurantName })}
            </p>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm font-semibold text-[#16120E]">
              <input
                type="checkbox"
                checked={wantsVip}
                onChange={(event) => setWantsVip(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#16120E]"
              />
              {t("vip.checkbox")}
            </label>

            {wantsVip && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-[#6B6258]">
                  {t("vip.birthDateLabel")}
                </label>

                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold text-[#16120E] outline-none focus:border-[#C8A56A]"
                />

                <button
                  type="button"
                  onClick={joinVipClub}
                  disabled={vipLoading}
                  className="mt-5 w-full rounded-full bg-[#16120E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:opacity-50"
                >
                  {vipLoading ? t("vip.confirming") : t("vip.confirmButton")}
                </button>
              </div>
            )}
          </div>
        ) : null}

        {vipSubmitted && (
          <div className="rounded-[28px] border border-[#CFE5CE] bg-[#ECF7EC] p-6 text-[#3F6A4D]">
            <h3 className="text-xl font-semibold tracking-[-0.035em]">
              {t("vip.confirmedTitle")}
            </h3>

            <p className="mt-2 text-sm">
              {t("vip.confirmedText", { restaurantName })}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-5xl transition ${
              rating && star <= rating ? "text-[#D4A24A]" : "text-[#D7D0C7]"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {isNegative && (
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("ratingCommentPlaceholder")}
          className="mt-8 h-36 w-full rounded-[24px] border border-[#E1D0B8] bg-[#FFFDF9] p-4 text-sm outline-none focus:border-[#C8A56A]"
        />
      )}

      {isPositive && (
        <div className="mt-8 rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0] p-5 text-center">
          <p className="text-sm leading-6 text-[#6B6258]">
            {t("positiveHint")}
          </p>
        </div>
      )}

      <button
        onClick={submitReview}
        disabled={!rating || loading}
        className="mt-6 w-full rounded-full bg-[#16120E] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#2A2118] disabled:opacity-50"
      >
        {loading
          ? t("submitting")
          : isPositive
            ? t("continue")
            : t("sendFeedback")}
      </button>

      <p className="mt-4 text-center text-xs text-[#7A6F62]">
        {t("footerThanks", { restaurantName })}
      </p>
    </div>
  );
}