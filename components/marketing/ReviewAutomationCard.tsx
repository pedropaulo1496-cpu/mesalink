"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Mail, UserX } from "lucide-react";

export default function ReviewAutomationCard({
  restaurantId,
  initialEnabled,
  labels,
}: {
  restaurantId: string;
  initialEnabled: boolean;
  labels: Record<string, string>;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/marketing/review-automation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || labels.error);
      setEnabled(Boolean(data.enabled));
      setMessage(data.enabled ? labels.enabledMessage : labels.disabledMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : labels.error);
    } finally {
      setSaving(false);
    }
  }

  return <div className={`overflow-hidden rounded-[28px] border transition ${enabled ? "border-[#BDD8BF] bg-[#F7FCF7]" : "border-[#E1D0B8] bg-[#FFF9F0]"}`}>
    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-[#E3F3E5] text-[#3F6A4D]" : "bg-[#EFE5D6] text-[#8A7863]"}`}><Mail size={19} /></span>
          <div><p className="font-semibold">{labels.title}</p><p className="mt-0.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8A7863]">{enabled ? labels.active : labels.inactive}</p></div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#6B6258]">{labels.description}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Info icon={<Clock3 size={15} />} text={labels.delay} />
          <Info icon={<UserX size={15} />} text={labels.noShow} />
          <Info icon={<CheckCircle2 size={15} />} text={labels.automatic} />
        </div>
        <p className="mt-4 text-xs font-semibold text-[#8A6130]">{labels.balance}</p>
        {message && <p className="mt-3 text-xs font-semibold text-[#55705A]">{message}</p>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={saving}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${enabled ? "bg-[#4D8B50]" : "bg-[#CFC2B2]"} disabled:opacity-55`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "left-7" : "left-1"}`} />
        <span className="sr-only">{labels.toggle}</span>
      </button>
    </div>
  </div>;
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-[#E1D0B8]/80 bg-white/75 px-3 py-3 text-xs font-semibold text-[#5E5448]"><span className="text-[#9B6F3B]">{icon}</span>{text}</div>;
}
