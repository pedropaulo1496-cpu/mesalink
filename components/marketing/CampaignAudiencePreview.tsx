"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function CampaignAudiencePreview({
  restaurantId,
  initialSegment = "ALL",
  initialTag = "",
  onSegmentChange,
}: {
  restaurantId: string;
  initialSegment?: string;
  initialTag?: string;
  onSegmentChange?: (segment: string) => void;
}) {
  const t = useTranslations("dashboardMarketing.audiencePreview");
  const [segment, setSegment] = useState(initialSegment);
  const [tag, setTag] = useState(initialTag);
  const [count, setCount] = useState<number | null>(null);

  async function checkAudience(nextSegment: string, nextTag = tag) {
    setSegment(nextSegment);
    onSegmentChange?.(nextSegment);

    const params = new URLSearchParams({
      restaurantId,
      segment: nextSegment,
    });

    if (nextSegment === "TAG" && nextTag.trim()) {
      params.set("tag", nextTag.trim());
    }

    const response = await fetch(`/api/marketing/audience-count?${params}`);
    const data = await response.json();

    setCount(data.count ?? 0);
  }

  async function checkTagAudience(value: string) {
    setTag(value);

    if (segment !== "TAG") return;

    const params = new URLSearchParams({
      restaurantId,
      segment: "TAG",
      tag: value.trim(),
    });

    const response = await fetch(`/api/marketing/audience-count?${params}`);
    const data = await response.json();

    setCount(data.count ?? 0);
  }

  useEffect(() => {
    checkAudience(initialSegment, initialTag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 return (
  <div>
    <select
      name="segment"
      value={segment}
      onChange={(event) => checkAudience(event.target.value)}
      className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold outline-none"
    >
      <option value="ALL">{t("options.all")}</option>
      <option value="VIP">{t("options.allVip")}</option>
      <option value="BRONZE">{t("options.bronze")}</option>
      <option value="SILVER">{t("options.silver")}</option>
      <option value="GOLD">{t("options.gold")}</option>
      <option value="PLATINUM">{t("options.platinum")}</option>
      <option value="TAG">{t("options.tag")}</option>
      <option value="INACTIVE">{t("options.inactive")}</option>
      <option value="BIRTHDAYS">{t("options.birthdays")}</option>
    </select>

    {segment === "TAG" && (
      <input
        name="tag"
        value={tag}
        onChange={(event) => checkTagAudience(event.target.value)}
        placeholder={t("tagPlaceholder")}
        className="mt-3 h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold outline-none"
      />
    )}

    <p className="mt-2 text-xs text-[#9B8F82]">
      {t("recipientsCount", { count: count ?? 0 })}
    </p>
  </div>
);
}