"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Clock3, Loader2, Lock, Unlock } from "lucide-react";

export default function TimeBlockControls({
  restaurantId,
  day,
  times,
  initialBlockedTimes,
}: {
  restaurantId: string;
  day: string;
  times: string[];
  initialBlockedTimes: string[];
}) {
  const router = useRouter();
  const [blockedTimes, setBlockedTimes] = useState(initialBlockedTimes);
  const [loadingTime, setLoadingTime] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  async function toggle(time: string, shouldBlock = !blockedTimes.includes(time)) {
    if (!time) return;
    setLoadingTime(time);
    setMessage("");
    const response = await fetch(`/api/restaurants/${restaurantId}/reservation-time-blocks`, {
      method: shouldBlock ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, time }),
    });
    const result = await response.json();
    setLoadingTime("");
    if (!response.ok) return setMessage(result.error || "Não foi possível alterar o horário.");
    setBlockedTimes((items) => shouldBlock ? [...new Set([...items, time])].sort() : items.filter((item) => item !== time));
    setCustomTime("");
    setMessage(shouldBlock ? `${time} bloqueado apenas neste dia.` : `${time} novamente disponível neste dia.`);
    router.refresh();
  }

  const displayTimes = [...new Set([...times, ...blockedTimes])].sort();

  return (
    <section className="mt-4 rounded-[20px] border border-[#D8C5A5] bg-[#FFF9F0] px-3 py-2.5 shadow-[0_10px_30px_rgba(80,55,30,0.035)] sm:px-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F0E3D0] text-[#8A6130]"><Clock3 size={15} /></span>
          <div className="min-w-0">
            <p className="text-sm font-bold">Bloquear horas</p>
            <p className="truncate text-[10px] text-[#6B6258]">Apenas para este dia{blockedTimes.length > 0 ? ` · ${blockedTimes.join(", ")}` : ""}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {blockedTimes.length > 0 && <span className="rounded-full bg-[#7B4034] px-2.5 py-1 text-[9px] font-black text-white">{blockedTimes.length}</span>}
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D8C5A5] bg-white px-3 text-[10px] font-bold">{expanded ? "Fechar" : "Gerir"}<ChevronDown size={13} className={`transition ${expanded ? "rotate-180" : ""}`} /></button>
        </div>
      </div>

      {expanded && <div className="mt-3 border-t border-[#E6D8C4] pt-3">
      <p className="mb-3 text-[10px] leading-4 text-[#6B6258]">Escolhe as horas a fechar neste dia. As reservas existentes não são alteradas.</p>
      {displayTimes.length > 0 && <div className="flex flex-wrap gap-2">{displayTimes.map((time) => {
        const blocked = blockedTimes.includes(time);
        const loading = loadingTime === time;
        return <button key={time} type="button" disabled={Boolean(loadingTime)} onClick={() => toggle(time)} className={`inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[11px] font-bold transition disabled:opacity-45 ${blocked ? "border-[#D9A896] bg-[#7B4034] text-white" : "border-[#D8C5A5] bg-white text-[#17120D] hover:border-[#9B6F3B]"}`}>{loading ? <Loader2 size={12} className="animate-spin" /> : blocked ? <Lock size={11} /> : <Unlock size={11} />}{time}</button>;
      })}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input type="time" step="1800" value={customTime} onChange={(event) => setCustomTime(event.target.value)} aria-label="Outra hora" className="h-9 rounded-full border border-[#D8C5A5] bg-white px-3 text-[11px] font-bold outline-none" />
        <button type="button" disabled={!customTime || Boolean(loadingTime)} onClick={() => toggle(customTime, true)} className="inline-flex h-9 items-center gap-2 rounded-full bg-[#17120D] px-3 text-[10px] font-bold text-white disabled:opacity-40"><Lock size={12} /> Bloquear outra</button>
        {message && <p className="text-[10px] font-semibold text-[#526D51]">{message}</p>}
      </div>
      </div>}
    </section>
  );
}
