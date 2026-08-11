"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bot, Download, Image as ImageIcon, LoaderCircle, Sparkles } from "lucide-react";

type LatestCampaign = {
  subject: string;
  aiReason: string | null;
  emailsSent: number;
  audienceSize: number;
  cardToken: string | null;
  createdAt: string;
} | null;

export default function MarketingAutopilotCard({
  restaurantId,
  initialEnabled,
  initialFrequencyDays,
  initialMaxDiscount,
  aiCredits,
  latestCampaign,
}: {
  restaurantId: string;
  initialEnabled: boolean;
  initialFrequencyDays: number;
  initialMaxDiscount: number;
  aiCredits: number;
  latestCampaign: LatestCampaign;
}) {
  const t = useTranslations("dashboardMarketing.autopilot");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [frequencyDays, setFrequencyDays] = useState(initialFrequencyDays);
  const [maxDiscount, setMaxDiscount] = useState(initialMaxDiscount);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function save(nextEnabled = enabled, runAfter = false) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/marketing/autopilot`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled, frequencyDays, maxDiscount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("errors.save"));
      setEnabled(data.enabled);
      setSuccess(true);
      setMessage(data.enabled ? t("messages.enabled") : t("messages.disabled"));
      if (runAfter && data.enabled) await runNow();
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : t("errors.save"));
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setMessage(t("messages.working"));
    try {
      const response = await fetch("/api/marketing/run-autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || t("errors.run"));
      setSuccess(true);
      setMessage(data.skipped ? t(`messages.${data.reason === "NO_AUDIENCE" ? "noAudience" : "notDue"}`) : t("messages.sent", { emails: data.emailsSent, audience: data.audienceSize }));
      if (!data.skipped) setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : t("errors.run"));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[34px] border border-[#34281D] bg-[#17120D] text-white shadow-[0_26px_80px_rgba(45,31,18,0.16)]">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D7B267] text-[#17120D]"><Bot size={21} /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#D7B267]">{t("eyebrow")}</p>
              <p className="mt-1 text-xs text-[#D5C6B4]">{enabled ? t("status.active") : t("status.inactive")}</p>
            </div>
          </div>
          <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.055em]">{t("title")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D5C6B4]">{t("description")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat icon={<Sparkles size={15} />} label={t("stats.cost")} value={t("stats.costValue")} />
            <Stat label={t("stats.emails")} value={t("stats.emailsValue")} />
            <Stat label={t("stats.balance")} value={`${aiCredits}`} />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold">{t("controls.toggle")}</span>
            <button
              type="button"
              aria-pressed={enabled}
              aria-label={t("controls.toggle")}
              disabled={saving || running}
              onClick={() => save(!enabled, !enabled)}
              className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-[#D7B267]" : "bg-white/20"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
            </button>
          </label>

          <label className="mt-5 block text-xs font-semibold text-[#D5C6B4]">
            {t("controls.frequency")}
            <select value={frequencyDays} onChange={(event) => setFrequencyDays(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#211A14] px-3 text-sm text-white outline-none">
              <option value={7}>{t("controls.weekly")}</option>
              <option value={14}>{t("controls.fortnightly")}</option>
              <option value={30}>{t("controls.monthly")}</option>
            </select>
          </label>

          <label className="mt-4 block text-xs font-semibold text-[#D5C6B4]">
            {t("controls.maxDiscount")}
            <select value={maxDiscount} onChange={(event) => setMaxDiscount(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#211A14] px-3 text-sm text-white outline-none">
              <option value={0}>{t("controls.noDiscount")}</option>
              <option value={10}>10%</option>
              <option value={15}>15%</option>
              <option value={20}>20%</option>
              <option value={30}>30%</option>
            </select>
          </label>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button type="button" disabled={saving || running} onClick={() => save()} className="rounded-full border border-white/15 px-4 py-3 text-sm font-bold transition hover:bg-white/10 disabled:opacity-50">
              {saving ? t("controls.saving") : t("controls.save")}
            </button>
            <button type="button" disabled={!enabled || saving || running} onClick={runNow} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D7B267] px-4 py-3 text-sm font-black text-[#17120D] transition hover:bg-[#E7C77F] disabled:opacity-50">
              {running && <LoaderCircle size={16} className="animate-spin" />}{running ? t("controls.running") : t("controls.runNow")}
            </button>
          </div>
        </div>
      </div>

      {(latestCampaign || message) && (
        <div className="border-t border-white/10 bg-black/15 px-6 py-5 lg:px-8">
          {message && <p className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${success ? "bg-[#D7B267]/15 text-[#F2D99D]" : "bg-red-500/15 text-red-200"}`}>{message}</p>}
          {latestCampaign && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D7B267]">{t("latest.eyebrow")}</p>
                <p className="mt-1 font-semibold">{latestCampaign.subject}</p>
                <p className="mt-1 text-xs text-[#D5C6B4]">{t("latest.results", { sent: latestCampaign.emailsSent, audience: latestCampaign.audienceSize })}</p>
                {latestCampaign.aiReason && <p className="mt-2 max-w-3xl text-xs leading-5 text-[#AFA294]">{latestCampaign.aiReason}</p>}
              </div>
              {latestCampaign.cardToken && (
                <div className="flex shrink-0 gap-2">
                  <a href={`/api/marketing/cards/${latestCampaign.cardToken}/png`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold"><ImageIcon size={14} />PNG</a>
                  <a href={`/api/marketing/cards/${latestCampaign.cardToken}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold"><Download size={14} />PDF</a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#D7B267]">{icon}{label}</p><p className="mt-2 font-semibold">{value}</p></div>;
}
