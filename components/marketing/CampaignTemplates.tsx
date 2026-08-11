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
      label: t("items.signature.label"),
      subject: t("items.signature.subject"),
      message: t("items.signature.message"),
    },
    {
      label: t("items.weekday.label"),
      subject: t("items.weekday.subject"),
      message: t("items.weekday.message"),
    },
    {
      label: t("items.seasonal.label"),
      subject: t("items.seasonal.subject"),
      message: t("items.seasonal.message"),
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
