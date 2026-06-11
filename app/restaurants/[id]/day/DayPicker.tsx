"use client";

import { useRouter } from "next/navigation";

export default function DayPicker({
  restaurantId,
  selectedDay,
}: {
  restaurantId: string;
  selectedDay: string;
}) {
  const router = useRouter();

  const date = new Date(selectedDay);

  function changeDay(days: number) {
    const newDate = new Date(selectedDay);
    newDate.setDate(newDate.getDate() + days);

    const formatted = newDate.toISOString().slice(0, 10);

    router.push(`/restaurants/${restaurantId}/day?day=${formatted}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-[#06111f]/80 p-2 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => changeDay(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-300 hover:text-black"
      >
        ←
      </button>

      <input
        type="date"
        value={selectedDay}
        onChange={(e) =>
          router.push(
            `/restaurants/${restaurantId}/day?day=${e.target.value}`
          )
        }
        className="h-11 rounded-full border border-cyan-300/20 bg-[#020617] px-4 text-center text-sm font-bold text-white outline-none transition hover:border-cyan-300/50"
      />

      <button
        type="button"
        onClick={() => changeDay(1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 transition hover:bg-cyan-300 hover:text-black"
      >
        →
      </button>

      <div className="hidden border-l border-cyan-300/10 pl-4 pr-2 md:block">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">
          Live Day
        </p>

        <p className="text-sm font-bold text-white">
          {date.toLocaleDateString("pt-PT", {
            weekday: "short",
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>
    </div>
  );
}