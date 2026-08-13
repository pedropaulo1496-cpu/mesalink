import { euroCents } from "@/components/backoffice/BackofficeUI";

type Month = {
  key: string;
  label: string;
  revenueCents: number;
  expenseCents: number;
  profitCents: number;
};

export default function FinancialTrendChart({ months }: { months: Month[] }) {
  const max = Math.max(1, ...months.flatMap((month) => [month.revenueCents, month.expenseCents, Math.max(0, month.profitCents)]));
  return (
    <section className="rounded-[22px] border border-[#DCC9AA] bg-white p-4 shadow-[0_12px_34px_rgba(75,52,29,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9B6F3B]">Últimos 6 meses</p><h2 className="mt-1 text-lg font-semibold">Receita, despesa e lucro</h2></div>
        <div className="flex gap-3 text-[9px] font-bold text-[#6B6258]"><Key color="#B7833B" label="Receita" /><Key color="#C66B52" label="Despesa" /><Key color="#4F8056" label="Lucro" /></div>
      </div>
      <div className="mt-4 grid h-40 grid-cols-6 items-end gap-2 border-b border-[#DED1BE] px-1">
        {months.map((month) => (
          <div key={month.key} className="flex h-full min-w-0 flex-col justify-end">
            <p className={`mb-1 truncate text-center text-[9px] font-bold ${month.profitCents < 0 ? "text-[#A14E36]" : "text-[#466D4B]"}`}>{euroCents(month.profitCents)}</p>
            <div className="flex h-[112px] items-end justify-center gap-1">
              <Bar value={month.revenueCents} max={max} color="bg-[#B7833B]" />
              <Bar value={month.expenseCents} max={max} color="bg-[#C66B52]" />
              <Bar value={Math.max(0, month.profitCents)} max={max} color="bg-[#4F8056]" />
            </div>
            <p className="mt-1.5 text-center text-[9px] font-black uppercase text-[#766A5D]">{month.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const height = value <= 0 ? 2 : Math.max(4, Math.round((value / max) * 100));
  return <div title={euroCents(value)} className={`w-2.5 rounded-t-sm ${color}`} style={{ height: `${height}%` }} />;
}

function Key({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />{label}</span>;
}
