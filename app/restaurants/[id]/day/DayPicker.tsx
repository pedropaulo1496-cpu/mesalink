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
    <div className="flex items-center gap-3 rounded-full border border-[#f0c36a]/15 bg-black/30 p-2">
      <button
        type="button"
        onClick={() => changeDay(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15100b] text-[#f0c36a] hover:bg-[#f0c36a] hover:text-black"
      >
        ←
      </button>

      <label className="relative">
        <input
          type="date"
          value={selectedDay}
          onChange={(e) => {
            router.push(
              `/restaurants/${restaurantId}/day?day=${e.target.value}`
            );
          }}
          className="h-11 rounded-full border border-[#f0c36a]/20 bg-[#15100b] px-5 text-center font-bold text-[#fff7ea] outline-none hover:border-[#f0c36a]/50"
        />
      </label>

      <button
        type="button"
        onClick={() => changeDay(1)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#15100b] text-[#f0c36a] hover:bg-[#f0c36a] hover:text-black"
      >
        →
      </button>

      <div className="hidden border-l border-[#f0c36a]/10 pl-4 pr-3 md:block">
        <p className="text-xs uppercase tracking-widest text-[#7d725f]">
          Dia
        </p>
        <p className="text-sm font-bold text-[#f0c36a]">
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