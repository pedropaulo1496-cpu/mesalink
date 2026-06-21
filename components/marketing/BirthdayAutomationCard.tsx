"use client";

export default function BirthdayAutomationCard({
  birthdayCustomers,
}: {
  birthdayCustomers: number;
}) {
  async function runBirthdays() {
    try {
      const response = await fetch("/api/marketing/run-birthdays", {
        method: "POST",
      });

      const data = await response.json();

      alert(JSON.stringify(data, null, 2));

      window.location.reload();
    } catch {
      alert("Erro ao executar aniversários.");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[#E1D0B8] bg-[#FFF9F0] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">Aniversários</p>

        <p className="mt-1 text-sm text-[#6B6258]">
          {birthdayCustomers} clientes fazem aniversário este mês.
        </p>
      </div>

      <button
        onClick={runBirthdays}
        className="rounded-full bg-[#16120E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2A2118]"
      >
        Executar agora
      </button>
    </div>
  );
}