import Link from "next/link";

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
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(240,195,106,0.15),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 md:p-10 shadow-2xl">

            <div className="flex justify-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0c36a]/10 border border-[#f0c36a]/20">
                <span className="text-4xl">
                  {isPending ? "⏳" : "✓"}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-4xl font-black">
                {isPending
                  ? "Pedido Recebido"
                  : "Reserva Confirmada"}
              </h1>

              <p className="mt-4 text-[#a99a82] text-lg">
                {isPending
                  ? "Recebemos o seu pedido. O restaurante irá analisar e responder em breve."
                  : "A sua reserva foi registada com sucesso."}
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-[#f0c36a]/10 bg-black/20 p-6">
              <div className="space-y-4">

                {name && (
                  <div className="flex justify-between">
                    <span className="text-[#a99a82]">Nome</span>
                    <span className="font-bold">{name}</span>
                  </div>
                )}

                {guests && (
                  <div className="flex justify-between">
                    <span className="text-[#a99a82]">Pessoas</span>
                    <span className="font-bold">{guests}</span>
                  </div>
                )}

                {reservationDate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#a99a82]">Data</span>
                      <span className="font-bold">
                        {reservationDate.toLocaleDateString("pt-PT")}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#a99a82]">Hora</span>
                      <span className="font-bold">
                        {reservationDate.toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between border-t border-[#f0c36a]/10 pt-4">
                  <span className="text-[#a99a82]">Estado</span>

                  <span
                    className={`font-bold ${
                      isPending
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {isPending
                      ? "Pendente de aprovação"
                      : "Confirmada"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#f0c36a]/10 bg-[#0f0b08] p-4">
              <p className="text-sm text-[#a99a82] text-center">
                Obrigado por utilizar o MesaLink.
              </p>
            </div>

            <Link
              href="/"
              className="mt-8 block w-full rounded-full bg-[#f0c36a] py-4 text-center font-bold text-black transition hover:bg-[#ffd982]"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}