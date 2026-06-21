"use client";

import { useEffect, useState } from "react";

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
      <option value="ALL">Todos os clientes marketing</option>
      <option value="VIP">Todos os VIP</option>
      <option value="BRONZE">VIP Bronze</option>
      <option value="SILVER">VIP Silver</option>
      <option value="GOLD">VIP Gold</option>
      <option value="PLATINUM">VIP Platinum</option>
      <option value="TAG">Por tag</option>
      <option value="INACTIVE">Clientes inativos</option>
      <option value="BIRTHDAYS">Aniversários deste mês</option>
    </select>

    {segment === "TAG" && (
      <input
        name="tag"
        value={tag}
        onChange={(event) => checkTagAudience(event.target.value)}
        placeholder="Ex: local, influencer, alto valor"
        className="mt-3 h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold outline-none"
      />
    )}

    <p className="mt-2 text-xs text-[#9B8F82]">
      {count ?? 0} clientes vão receber esta campanha.
    </p>
  </div>
);
}