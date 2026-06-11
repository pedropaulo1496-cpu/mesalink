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
    <main className="min-h-screen bg-[#050711] px-4 py-6 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col justify-center">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 shadow-lg shadow-cyan-500/20">
              <span className="text-3xl">{isPending ? "⏳" : "✓"}</span>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-300/80">
              MesaLink AI
            </p>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {isPending ? "Pedido recebido" : "Reserva confirmada"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/55">
              {isPending
                ? "O restaurante recebeu o seu pedido e irá responder em breve."
                : "A sua reserva foi registada com sucesso."}
            </p>
          </div>

          <div className="mt-8 space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
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
            className="mt-6 flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            Conhecer o MesaLink
          </a>

          <p className="mt-6 text-center text-xs text-white/35">
            Powered by <span className="text-white/55">MesaLink</span>
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
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-white/45">{label}</span>
      <span
        className={`text-right text-sm font-medium ${
          highlight ? "text-cyan-300" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}