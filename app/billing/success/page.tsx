import Link from "next/link";

type BillingSuccessPageProps = {
  searchParams?: Promise<{
    product?: string;
    billing?: string;
  }>;
};

export default async function BillingSuccessPage({
  searchParams,
}: BillingSuccessPageProps) {
  const params = searchParams ? await searchParams : {};
  const product = String(params?.product || "").toUpperCase();
  const billing = String(params?.billing || "").toUpperCase();

  const planName = product === "GROWTH" ? "Growth" : "Essentials";
  const billingLabel = billing === "YEARLY" ? "Pagamento anual" : "Pagamento mensal";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5EFE6] text-[#16120E]">
      <Background />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-14 text-center sm:px-8">
        <div className="w-full overflow-hidden rounded-[42px] border border-[#D8C5A5] bg-white p-7 shadow-[0_30px_110px_rgba(80,55,30,0.12)] sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#B7D7B8] bg-[#ECF7EC] text-4xl text-[#3F6A4D]">
            ✓
          </div>

          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#9B6F3B]">
            Subscrição ativa
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
            Plano {planName} ativado.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6B6258]">
            A sua subscrição foi confirmada com sucesso. Agora pode continuar a
            usar a MesaLink sem interrupções.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <SuccessStat value={planName} label="plano ativo" />
            <SuccessStat value={billingLabel} label="ciclo escolhido" />
            <SuccessStat value="0€" label="comissões" />
          </div>

          <div className="mt-8 grid gap-5 text-left md:grid-cols-2">
            <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
              <h2 className="font-semibold text-[#16120E]">
                Já disponível na sua conta
              </h2>

              <ul className="mt-4 space-y-2 text-sm leading-6 text-[#6B6258]">
                <li>✓ Reservas online sem comissões</li>
                <li>✓ Website profissional</li>
                <li>✓ QR Ordering</li>
                <li>✓ CRM de clientes</li>
                <li>✓ Google Reviews</li>
                {planName === "Growth" && <li>✓ Marketing Growth</li>}
              </ul>
            </div>

            <div className="rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
              <h2 className="font-semibold text-[#16120E]">
                Próximos passos úteis
              </h2>

              <ol className="mt-4 space-y-2 text-sm leading-6 text-[#6B6258]">
                <li>1. Rever horários e capacidade</li>
                <li>2. Confirmar salas e mesas</li>
                <li>3. Publicar website e QR Ordering</li>
                <li>4. Partilhar o link de reservas</li>
                <li>5. Acompanhar resultados no dashboard</li>
              </ol>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-[#D8C5A5] bg-[#17130F] p-5 text-left text-white">
            <h2 className="font-semibold text-[#D8C5A5]">
              Nota sobre faturação fiscal
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/68">
              A faturação/POS fiscal é tratada externamente pelo Moloni ou por
              outro software certificado. A MesaLink mantém reservas, clientes,
              QR Ordering, website, reviews e marketing ligados na mesma
              operação.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-[#16120E] px-8 font-semibold text-white shadow-[0_18px_50px_rgba(23,19,15,0.18)] transition hover:bg-[#2A2118]"
          >
            Abrir dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}

function SuccessStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4">
      <p className="text-2xl font-semibold tracking-[-0.05em] text-[#16120E]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9B6F3B]">
        {label}
      </p>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#D8C5A5]/35 blur-[130px]" />
      <div className="absolute right-[-180px] top-[260px] h-[420px] w-[420px] rounded-full bg-[#C8A56A]/18 blur-[120px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(216,197,165,0.22),transparent_34%)]" />
    </div>
  );
}
