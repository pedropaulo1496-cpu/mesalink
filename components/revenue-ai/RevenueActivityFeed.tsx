"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Eye,
  Mail,
  MousePointerClick,
  UserRound,
} from "lucide-react";

export type RevenueActivityItem = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  type: string;
  status: string;
  channel: string;
  sentAt: string;
  openedAt: string | null;
  lastOpenedAt: string | null;
  clickedAt: string | null;
  lastClickedAt: string | null;
  bookedAt: string | null;
  convertedAt: string | null;
  repliedAt: string | null;
  nextFollowUpAt: string | null;
  openCount: number;
  clickCount: number;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  failureReason: string | null;
};

const completedStatuses = new Set(["SENT", "OPENED", "CLICKED", "BOOKED", "CONVERTED"]);

export default function RevenueActivityFeed({
  restaurantId,
  locale,
  actions,
}: {
  restaurantId: string;
  locale: string;
  actions: RevenueActivityItem[];
}) {
  const t = useTranslations("dashboardRevenueAi.activity");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const summary = useMemo(() => {
    const delivered = actions.filter((action) => completedStatuses.has(action.status)).length;
    const opened = actions.filter(
      (action) =>
        action.openedAt ||
        action.openCount > 0 ||
        ["OPENED", "CLICKED"].includes(action.status),
    ).length;
    const clicked = actions.filter(
      (action) => action.clickedAt || action.clickCount > 0 || action.status === "CLICKED",
    ).length;
    const recovered = actions.filter(
      (action) => action.status === "CONVERTED" || Boolean(action.convertedAt),
    ).length;
    const recoveredRevenue = actions.reduce((total, action) => {
      if (action.status !== "CONVERTED" && !action.convertedAt) return total;
      return total + (action.actualRevenue ?? action.estimatedRevenue ?? 0);
    }, 0);

    return { delivered, opened, clicked, recovered, recoveredRevenue };
  }, [actions]);

  const visibleActions = showAll ? actions : actions.slice(0, 6);
  const percent = (value: number) =>
    summary.delivered > 0 ? Math.round((value / summary.delivered) * 100) : 0;
  const formatMoney = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  if (actions.length === 0) {
    return (
      <div className="mt-6 rounded-[24px] border border-dashed border-[#D6C3A5] bg-white/60 p-8 text-center text-sm text-[#6B6258]">
        {t("empty")}
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Mail size={16} />}
          label={t("summary.sent")}
          value={String(summary.delivered)}
          hint={t("summary.attempts", { count: actions.length })}
        />
        <SummaryCard
          icon={<Eye size={16} />}
          label={t("summary.opened")}
          value={String(summary.opened)}
          hint={t("summary.rate", { rate: percent(summary.opened) })}
        />
        <SummaryCard
          icon={<MousePointerClick size={16} />}
          label={t("summary.clicked")}
          value={String(summary.clicked)}
          hint={t("summary.rate", { rate: percent(summary.clicked) })}
        />
        <SummaryCard
          icon={<CircleDollarSign size={16} />}
          label={t("summary.recovered")}
          value={formatMoney(summary.recoveredRevenue)}
          hint={t("summary.bookings", { count: summary.recovered })}
        />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-[#F1E6D5]/70 px-4 py-3 text-xs leading-5 text-[#6B6258]">
        <Eye className="mt-0.5 shrink-0 text-[#9B6F3B]" size={14} />
        {t("privacyNote")}
      </p>

      <div className="mt-4 space-y-3">
        {visibleActions.map((action) => {
          const isExpanded = expandedId === action.id;
          const opens =
            action.openCount ||
            (action.openedAt || ["OPENED", "CLICKED"].includes(action.status) ? 1 : 0);
          const clicks = action.clickCount || (action.clickedAt || action.status === "CLICKED" ? 1 : 0);
          const hasRecoveredValue = action.status === "CONVERTED" || Boolean(action.convertedAt);

          return (
            <article
              key={action.id}
              className={`overflow-hidden rounded-[24px] border bg-white transition ${
                isExpanded
                  ? "border-[#B58A45] shadow-[0_14px_35px_rgba(80,55,30,0.1)]"
                  : "border-[#E1D0B8] hover:border-[#CDB48D]"
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-left sm:gap-4"
                aria-expanded={isExpanded}
                aria-controls={`activity-details-${action.id}`}
                onClick={() => setExpandedId(isExpanded ? null : action.id)}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F1E6D5] text-[#8A6130]">
                  <Mail size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {action.customerName || t("unknownCustomer")}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#7D7164]">
                    {typeLabel(action.type, t)} · {formatDate(action.sentAt, locale)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#5E5144] sm:hidden">
                    {resultLabel(action, opens, clicks, formatMoney, t)}
                  </p>
                </div>
                <div className="hidden min-w-[150px] text-right sm:block">
                  <p className="text-xs font-semibold text-[#5E5144]">
                    {resultLabel(action, opens, clicks, formatMoney, t)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#9A8C7C]">
                    {t("tapHint")}
                  </p>
                </div>
                <StatusPill status={action.status} label={statusLabel(action.status, t)} />
                <ChevronDown
                  size={17}
                  className={`shrink-0 text-[#8A6130] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div
                  id={`activity-details-${action.id}`}
                  className="border-t border-[#EADCC8] bg-[#FFFCF7] px-4 pb-5 pt-4 sm:px-6 sm:pb-6"
                >
                  <div className="grid gap-2 sm:grid-cols-4">
                    <DetailMetric icon={<CheckCircle2 size={15} />} label={t("details.sent")} value={formatDate(action.sentAt, locale)} />
                    <DetailMetric icon={<Eye size={15} />} label={t("details.opens")} value={String(opens)} />
                    <DetailMetric icon={<MousePointerClick size={15} />} label={t("details.clicks")} value={String(clicks)} />
                    <DetailMetric
                      icon={<CalendarCheck2 size={15} />}
                      label={hasRecoveredValue ? t("details.revenue") : t("details.potential")}
                      value={formatMoney(
                        hasRecoveredValue
                          ? action.actualRevenue ?? action.estimatedRevenue ?? 0
                          : action.estimatedRevenue ?? 0,
                      )}
                    />
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">
                      {t("details.timeline")}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <TimelineEvent label={t("details.sentAt")} value={formatDate(action.sentAt, locale)} active />
                      <TimelineEvent label={t("details.firstOpened")} value={formatOptionalDate(action.openedAt, locale, t("details.notRecorded"))} active={Boolean(action.openedAt)} />
                      <TimelineEvent label={t("details.firstClicked")} value={formatOptionalDate(action.clickedAt, locale, t("details.notRecorded"))} active={Boolean(action.clickedAt)} />
                      <TimelineEvent label={t("details.convertedAt")} value={formatOptionalDate(action.convertedAt || action.bookedAt, locale, t("details.notRecorded"))} active={Boolean(action.convertedAt || action.bookedAt)} />
                    </div>
                  </div>

                  {(action.lastOpenedAt || action.lastClickedAt || action.nextFollowUpAt) && (
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#6B6258]">
                      {action.lastOpenedAt && <span>{t("details.lastOpened")}: <strong>{formatDate(action.lastOpenedAt, locale)}</strong></span>}
                      {action.lastClickedAt && <span>{t("details.lastClicked")}: <strong>{formatDate(action.lastClickedAt, locale)}</strong></span>}
                      {action.nextFollowUpAt && <span>{t("details.nextFollowUp")}: <strong>{formatDate(action.nextFollowUpAt, locale)}</strong></span>}
                    </div>
                  )}

                  {action.status === "FAILED" && (
                    <p className="mt-4 flex items-start gap-2 rounded-2xl border border-[#F0C8BC] bg-[#FFF1ED] p-3 text-xs leading-5 text-[#8D3E2C]">
                      <AlertCircle className="mt-0.5 shrink-0" size={15} />
                      {action.failureReason || t("details.deliveryFailed")}
                    </p>
                  )}

                  {action.customerId && (
                    <Link
                      href={`/restaurants/${restaurantId}/customers/${action.customerId}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7A542A]"
                    >
                      <UserRound size={15} /> {t("details.viewCustomer")}
                    </Link>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {actions.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full border border-[#D8C6A9] bg-white px-5 text-sm font-semibold text-[#6F4C26] transition hover:bg-[#FFF9F0] sm:w-auto"
        >
          {showAll ? t("showLess") : t("showAll", { count: actions.length })}
        </button>
      )}
    </>
  );
}

function SummaryCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[20px] border border-[#E1D0B8] bg-white p-4">
      <div className="flex items-center gap-2 text-[#9B6F3B]">{icon}<span className="text-[9px] font-black uppercase tracking-[0.16em]">{label}</span></div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.045em]">{value}</p>
      <p className="mt-1 text-[11px] text-[#817466]">{hint}</p>
    </div>
  );
}

function DetailMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E7D8C3] bg-white p-3">
      <div className="flex items-center gap-2 text-[#9B6F3B]">{icon}<span className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</span></div>
      <p className="mt-2 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function TimelineEvent({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`flex gap-3 rounded-2xl border p-3 ${active ? "border-[#D8C29D] bg-white" : "border-[#E8E0D5] bg-[#F8F4EE] text-[#9B9186]"}`}>
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${active ? "bg-[#EAF4E8] text-[#47704E]" : "bg-[#EAE4DC]"}`}>
        {active ? <CheckCircle2 size={14} /> : <Clock3 size={13} />}
      </span>
      <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.12em]">{label}</p><p className="mt-1 text-xs">{value}</p></div>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const tone = status === "CONVERTED"
    ? "border-[#A9D0A7] bg-[#EFF8EE] text-[#3F6A4D]"
    : status === "FAILED"
      ? "border-[#ECC5B9] bg-[#FFF1ED] text-[#9A4934]"
      : status === "CLICKED" || status === "OPENED"
        ? "border-[#C7DCE8] bg-[#F0F8FC] text-[#3C6B82]"
        : "border-[#DDCFBA] bg-[#FFF9F0] text-[#795D38]";
  return <span className={`hidden rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.11em] sm:inline-flex ${tone}`}>{label}</span>;
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatOptionalDate(value: string | null, locale: string, fallback: string) {
  return value ? formatDate(value, locale) : fallback;
}

function typeLabel(type: string, t: ReturnType<typeof useTranslations<"dashboardRevenueAi.activity">>) {
  if (type === "INACTIVE_RECOVERY") return t("types.recovery");
  if (type === "BIRTHDAY") return t("types.birthday");
  if (type === "MANUAL_CAMPAIGN") return t("types.campaign");
  return t("types.followup");
}

function statusLabel(status: string, t: ReturnType<typeof useTranslations<"dashboardRevenueAi.activity">>) {
  if (status === "CONVERTED") return t("status.converted");
  if (status === "BOOKED") return t("status.booked");
  if (status === "CLICKED") return t("status.clicked");
  if (status === "OPENED") return t("status.opened");
  if (status === "FAILED") return t("status.failed");
  if (status === "QUEUED") return t("status.queued");
  return t("status.sent");
}

function resultLabel(
  action: RevenueActivityItem,
  opens: number,
  clicks: number,
  formatMoney: (value: number) => string,
  t: ReturnType<typeof useTranslations<"dashboardRevenueAi.activity">>,
) {
  if (action.status === "FAILED") return t("result.failed");
  if (action.status === "QUEUED") return t("result.queued");
  if (action.status === "CONVERTED" || action.convertedAt) {
    return t("result.converted", { amount: formatMoney(action.actualRevenue ?? action.estimatedRevenue ?? 0) });
  }
  if (action.status === "BOOKED" || action.bookedAt) return t("result.booked");
  if (clicks > 0 || action.clickedAt) return t("result.clicked", { opens, clicks });
  if (opens > 0 || action.openedAt) return t("result.opened", { opens });
  return t("result.sent");
}
