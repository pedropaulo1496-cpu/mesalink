"use client";

import { useTranslations } from "next-intl";

type Props = {
  onSelect: (subject: string, message: string) => void;
};

export default function CampaignTemplates({
  onSelect,
}: Props) {
  const t = useTranslations("dashboardMarketing.templates");

  const templates = [
    {
      label: t("items.missYou.label"),
      subject: t("items.missYou.subject"),
      message: t("items.missYou.message"),
    },
    {
      label: t("items.birthday.label"),
      subject: t("items.birthday.subject"),
      message: t("items.birthday.message"),
    },
    {
      label: t("items.review.label"),
      subject: t("items.review.subject"),
      message: t("items.review.message"),
    },
    {
      label: t("items.menuNews.label"),
      subject: t("items.menuNews.subject"),
      message: t("items.menuNews.message"),
    },
    {
      label: t("items.event.label"),
      subject: t("items.event.subject"),
      message: t("items.event.message"),
    },
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#6B6258]">
        {t("heading")}
      </p>

      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() =>
              onSelect(template.subject, template.message)
            }
            className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-sm font-semibold text-[#16120E] transition hover:bg-white"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}