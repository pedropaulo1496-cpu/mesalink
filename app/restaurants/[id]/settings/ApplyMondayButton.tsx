"use client";

export default function ApplyMondayButton() {
  function applyMondayToAll() {
    const mondayOpen = (
      document.querySelector(
        'input[name="mondayOpen"]'
      ) as HTMLInputElement
    )?.checked;

    const mondayLunch = (
      document.querySelector(
        'input[name="mondayLunch"]'
      ) as HTMLInputElement
    )?.value;

    const mondayDinner = (
      document.querySelector(
        'input[name="mondayDinner"]'
      ) as HTMLInputElement
    )?.value;

    [
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ].forEach((day) => {
      (
        document.querySelector(
          `input[name="${day}Open"]`
        ) as HTMLInputElement
      ).checked = mondayOpen;

      (
        document.querySelector(
          `input[name="${day}Lunch"]`
        ) as HTMLInputElement
      ).value = mondayLunch;

      (
        document.querySelector(
          `input[name="${day}Dinner"]`
        ) as HTMLInputElement
      ).value = mondayDinner;
    });
  }

  return (
    <button
      type="button"
      onClick={applyMondayToAll}
      className="rounded-full border border-[#f0c36a]/20 bg-[#f0c36a]/10 px-4 py-2 text-xs font-bold text-[#f0c36a] hover:bg-[#f0c36a] hover:text-black whitespace-nowrap"
    >
      Aplicar Segunda a todos
    </button>
  );
}