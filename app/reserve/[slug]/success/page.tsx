export default async function ReservationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    guests?: string;
    date?: string;
    status?: string;
  }>;
}) {
  const { name, guests, date, status } = await searchParams;

  const reservationDate = date ? new Date(date) : null;
  const isPending = status === "PENDING";

  return (
    <main className="min-h-screen bg-[#F5EFE6] px-4 py-6 text-[#16120E]">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col justify-center">
        <div className="rounded-[32px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.08)] sm:p-8">
          <div className="mb-6 flex justify-center">
            <div
              className={
                isPending
                  ? "flex h-16 w-16 items-center justify-center rounded-full border border-[#D8C5A5] bg-[#FFF1D0] text-2xl font-semibold text-[#9B6F3B]"
                  : "flex h-16 w-16 items-center justify-center rounded-full border border-[#9CCB9B] bg-[#ECF7EC] text-2xl font-semibold text-[#3F6A4D]"
              }
            >
              {isPending ? "…" : "✓"}
            </div>
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              MesaLink
            </p>

            <h1 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
              {isPending ? "Pedido recebido" : "Reserva confirmada"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#6B6258]">
              {isPending
                ? "O restaurante recebeu o seu pedido e irá responder em breve."
                : "A sua reserva foi registada com sucesso."}
            </p>
          </div>

          <div className="mt-8 space-y-3 rounded-[28px] border border-[#E1D0B8] bg-[#FFF9F0] p-4">
            {name && <InfoRow label="Nome" value={name} />}
            {guests && <InfoRow label="Pessoas" value={guests} />}

            {reservationDate && (
              <>
                <InfoRow
                  label="Data"
                  value={reservationDate.toLocaleDateString("pt-PT")}
                />

                <InfoRow
                  label="Hora"
                  value={reservationDate.toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </>
            )}

            <InfoRow
              label="Estado"
              value={isPending ? "Pendente de aprovação" : "Confirmada"}
              highlight
            />
          </div>

          <a
            href="https://mesalink.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-[#16120E] text-sm font-semibold text-white transition hover:bg-[#2A2118] active:scale-[0.99]"
          >
            Conhecer o MesaLink
          </a>

          <p className="mt-6 text-center text-xs text-[#9B8F82]">
            Powered by <span className="font-semibold text-[#6B6258]">MesaLink</span>
          </p>
        </div>
      </section>
    </main>
  );
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8DCCB] bg-white px-4 py-3">
      <span className="text-sm text-[#6B6258]">{label}</span>
      <span
        className={`text-right text-sm font-semibold ${
          highlight ? "text-[#9B6F3B]" : "text-[#16120E]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
