"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CampaignAudiencePreview from "./CampaignAudiencePreview";
import CampaignTemplates from "./CampaignTemplates";

export default function NewCampaignForm({
  restaurantId,
  initialSegment = "ALL",
  initialTag = "",
}: {
  restaurantId: string;
  initialSegment?: string;
  initialTag?: string;
}) {
  const t = useTranslations("dashboardMarketing.newCampaignForm");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function applySegmentTemplate(segment: string) {
    if (segment === "VIP" || segment === "GOLD" || segment === "PLATINUM") {
      setSubject(t("segmentTemplates.vip.subject"));
      setMessage(t("segmentTemplates.vip.message"));
      return;
    }

    if (segment === "BRONZE" || segment === "SILVER") {
      setSubject(t("segmentTemplates.loyal.subject"));
      setMessage(t("segmentTemplates.loyal.message"));
      return;
    }

    if (segment === "INACTIVE") {
      setSubject(t("segmentTemplates.inactive.subject"));
      setMessage(t("segmentTemplates.inactive.message"));
      return;
    }

    if (segment === "BIRTHDAYS") {
      setSubject(t("segmentTemplates.birthdays.subject"));
      setMessage(t("segmentTemplates.birthdays.message"));
      return;
    }

    if (segment === "TAG") {
      setSubject(t("segmentTemplates.tag.subject"));
      setMessage(t("segmentTemplates.tag.message"));
    }
  }

  useEffect(() => {
    applySegmentTemplate(initialSegment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      action="/api/marketing/send-campaign"
      method="POST"
      className="mt-8 w-full max-w-6xl rounded-[34px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] lg:p-8"
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              {t("segmentLabel")}
            </span>

            <CampaignAudiencePreview
              restaurantId={restaurantId}
              initialSegment={initialSegment}
              initialTag={initialTag}
              onSegmentChange={applySegmentTemplate}
            />
          </label>

          <div className="mt-6">
            <CampaignTemplates
              onSelect={(newSubject, newMessage) => {
                setSubject(newSubject);
                setMessage(newMessage);
              }}
            />
          </div>
        </div>

        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              {t("subjectLabel")}
            </span>

            <input
              name="subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={t("subjectPlaceholder")}
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              {t("messageLabel")}
            </span>

            <textarea
              name="message"
              required
              rows={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("messagePlaceholder")}
              className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm font-semibold leading-7 outline-none"
            />
          </label>

          <div className="mt-6 flex flex-col items-end gap-2">
            <p className="text-xs font-semibold text-[#8A6130]">{t("emailRate")}</p>
            <button className="rounded-full bg-[#16120E] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
              {t("submit")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
