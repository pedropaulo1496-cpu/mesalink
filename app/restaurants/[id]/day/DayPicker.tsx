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
    <div className="flex items-center gap-2 rounded-full border border-[#E1D0B8] bg-white p-2 shadow-[0_14px_40px_rgba(80,55,30,0.06)]">
      <button
        type="button"
        onClick={() => changeDay(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-[#16120E] transition hover:bg-[#EFE5D6]"
      >
        ←
      </button>

      <input
        type="date"
        value={selectedDay}
        onChange={(e) =>
          router.push(`/restaurants/${restaurantId}/day?day=${e.target.value}`)
        }
        className="h-11 rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-center text-sm font-semibold text-[#16120E] outline-none transition hover:border-[#C8A56A]"
      />

      <button
        type="button"
        onClick={() => changeDay(1)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E1D0B8] bg-[#FFF9F0] text-[#16120E] transition hover:bg-[#EFE5D6]"
      >
        →
      </button>

      <div className="hidden border-l border-[#E1D0B8] pl-4 pr-2 md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
          Dia
        </p>

        <p className="text-sm font-semibold text-[#16120E]">
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