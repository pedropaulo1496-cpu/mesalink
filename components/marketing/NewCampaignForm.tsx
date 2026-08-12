"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CampaignAudiencePreview from "./CampaignAudiencePreview";
import CampaignTemplates from "./CampaignTemplates";
import { MARKETING_CARD_THEMES, type MarketingCardTheme } from "@/lib/marketing-card-themes";

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
  function templateForSegment(segment: string) {
    if (segment === "VIP" || segment === "GOLD" || segment === "PLATINUM") return { subject: t("segmentTemplates.vip.subject"), message: t("segmentTemplates.vip.message") };
    if (segment === "BRONZE" || segment === "SILVER") return { subject: t("segmentTemplates.loyal.subject"), message: t("segmentTemplates.loyal.message") };
    if (segment === "INACTIVE") return { subject: t("segmentTemplates.inactive.subject"), message: t("segmentTemplates.inactive.message") };
    if (segment === "BIRTHDAYS") return { subject: t("segmentTemplates.birthdays.subject"), message: t("segmentTemplates.birthdays.message") };
    if (segment === "TAG") return { subject: t("segmentTemplates.tag.subject"), message: t("segmentTemplates.tag.message") };
    return null;
  }

  const initialTemplate = templateForSegment(initialSegment);
  const [subject, setSubject] = useState(initialTemplate?.subject || "");
  const [message, setMessage] = useState(initialTemplate?.message || "");
  const [includeCard, setIncludeCard] = useState(false);
  const [cardTheme, setCardTheme] = useState<MarketingCardTheme>("GOLD");
  const [benefitType, setBenefitType] = useState("PERCENT");

  function applySegmentTemplate(segment: string) {
    const template = templateForSegment(segment);
    if (!template) return;
    setSubject(template.subject);
    setMessage(template.message);
  }

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

          <div className="mt-5 overflow-hidden rounded-[24px] border border-[#E1D0B8] bg-[#FFF9F0]">
            <label className="flex cursor-pointer items-center gap-3 p-4"><input type="checkbox" name="includeCard" checked={includeCard} onChange={(event) => setIncludeCard(event.target.checked)} className="h-5 w-5 accent-[#17120D]" /><span><strong className="block text-sm">Adicionar cartão digital à promoção</strong><span className="mt-0.5 block text-xs text-[#75695D]">Cada cliente recebe um número único, válido uma vez no restaurante.</span></span></label>
            {includeCard && <div className="border-t border-[#E1D0B8] p-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-[#6B6258]">Título do cartão<input name="offerTitle" required maxLength={100} defaultValue="Uma oferta para si" className="input-premium mt-2" /></label><label className="text-xs font-semibold text-[#6B6258]">Mensagem curta<input name="offerDescription" required maxLength={280} defaultValue="Apresente este cartão na sua próxima visita." className="input-premium mt-2" /></label></div><div className="mt-3 grid gap-3 sm:grid-cols-4"><label className="text-xs font-semibold text-[#6B6258]">Tipo<select name="benefitType" value={benefitType} onChange={(event) => setBenefitType(event.target.value)} className="input-premium mt-2"><option value="PERCENT">Desconto %</option><option value="FIXED">Desconto €</option><option value="GIFT">Oferta</option></select></label><label className="text-xs font-semibold text-[#6B6258]">Valor<input name="benefitValue" type="number" min="1" max={benefitType === "PERCENT" ? 50 : 1000} step={benefitType === "FIXED" ? "0.01" : "1"} defaultValue="10" disabled={benefitType === "GIFT"} className="input-premium mt-2 disabled:bg-[#EDE5DA]" /></label><label className="text-xs font-semibold text-[#6B6258]">Consumo mínimo<input name="minSpend" type="number" min="0" step="0.01" placeholder="0€" className="input-premium mt-2" /></label><label className="text-xs font-semibold text-[#6B6258]">Validade<select name="validDays" defaultValue="30" className="input-premium mt-2"><option value="14">14 dias</option><option value="30">30 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select></label></div><label className="mt-3 block text-xs font-semibold text-[#6B6258]">Condições<input name="cardTerms" maxLength={320} placeholder="Ex.: não acumulável com outras ofertas" className="input-premium mt-2" /></label><p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#806D56]">Template do cartão</p><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(MARKETING_CARD_THEMES) as MarketingCardTheme[]).map((key) => { const theme = MARKETING_CARD_THEMES[key]; return <button key={key} type="button" onClick={() => setCardTheme(key)} className={`aspect-[1.58/1] rounded-2xl border-2 p-3 text-left text-xs font-bold shadow-sm ${cardTheme === key ? "border-[#B9853E] ring-2 ring-[#B9853E]/15" : "border-transparent"}`} style={{ background: theme.background, color: theme.foreground }}>{theme.name}<span className="mt-5 block text-lg" style={{ color: theme.accent }}>{benefitType === "PERCENT" ? "10%" : benefitType === "FIXED" ? "10€" : "OFERTA"}</span></button>; })}</div><input type="hidden" name="cardTemplate" value={cardTheme} /></div>}
          </div>

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
