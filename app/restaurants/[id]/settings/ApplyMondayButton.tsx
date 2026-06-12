"use client";

export default function ApplyMondayButton() {
  function applyMondayToAll() {
    const mondayOpen =
      (
        document.querySelector(
          'input[name="mondayOpen"]'
        ) as HTMLInputElement | null
      )?.checked ?? false;

    const mondayLunch =
      (
        document.querySelector(
          'input[name="mondayLunch"]'
        ) as HTMLInputElement | null
      )?.value ?? "";

    const mondayDinner =
      (
        document.querySelector(
          'input[name="mondayDinner"]'
        ) as HTMLInputElement | null
      )?.value ?? "";

    [
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ].forEach((day) => {
      const openInput = document.querySelector(
        `input[name="${day}Open"]`
      ) as HTMLInputElement | null;

      const lunchInput = document.querySelector(
        `input[name="${day}Lunch"]`
      ) as HTMLInputElement | null;

      const dinnerInput = document.querySelector(
        `input[name="${day}Dinner"]`
      ) as HTMLInputElement | null;

      if (openInput) openInput.checked = mondayOpen;
      if (lunchInput) lunchInput.value = mondayLunch;
      if (dinnerInput) dinnerInput.value = mondayDinner;
    });

    alert("Horário de segunda aplicado a todos os dias.");
  }

  return (
    <button
      type="button"
      onClick={applyMondayToAll}
      className="whitespace-nowrap rounded-full border border-cyan-300/25 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-black"
    >
      Aplicar Segunda a todos
    </button>
  );
}