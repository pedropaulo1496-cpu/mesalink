"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock3, Loader2, Lock, Unlock } from "lucide-react";

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
    <section className="mt-6 rounded-[28px] border border-[#D8C5A5] bg-[#FFF9F0] p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9B6F3B]"><Clock3 size={14} /> Disponibilidade deste dia</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">Bloquear horas</h2>
          <p className="mt-1 text-xs leading-5 text-[#6B6258]">Afeta apenas este dia. As reservas existentes mantêm-se; site e Partners deixam de aceitar novas reservas nessa hora.</p>
        </div>
        {blockedTimes.length > 0 && <span className="w-fit rounded-full bg-[#7B4034] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">{blockedTimes.length} {blockedTimes.length === 1 ? "hora bloqueada" : "horas bloqueadas"}</span>}
      </div>

      {displayTimes.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{displayTimes.map((time) => {
        const blocked = blockedTimes.includes(time);
        const loading = loadingTime === time;
        return <button key={time} type="button" disabled={Boolean(loadingTime)} onClick={() => toggle(time)} className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition disabled:opacity-45 ${blocked ? "border-[#D9A896] bg-[#7B4034] text-white" : "border-[#D8C5A5] bg-white text-[#17120D] hover:border-[#9B6F3B]"}`}>{loading ? <Loader2 size={13} className="animate-spin" /> : blocked ? <Lock size={12} /> : <Unlock size={12} />}{time}</button>;
      })}</div>}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E6D8C4] pt-4">
        <input type="time" step="1800" value={customTime} onChange={(event) => setCustomTime(event.target.value)} aria-label="Outra hora" className="h-10 rounded-full border border-[#D8C5A5] bg-white px-4 text-xs font-bold outline-none" />
        <button type="button" disabled={!customTime || Boolean(loadingTime)} onClick={() => toggle(customTime, true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#17120D] px-4 text-xs font-bold text-white disabled:opacity-40"><Lock size={13} /> Bloquear outra hora</button>
        {message && <p className="text-[10px] font-semibold text-[#526D51]">{message}</p>}
      </div>
    </section>
  );
}
