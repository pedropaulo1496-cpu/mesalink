import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-8 text-center">
        <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-10 shadow-2xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-3xl text-green-300">
            ✓
          </div>

          <h1 className="text-4xl font-black">
            Subscrição ativada
          </h1>

          <p className="mt-4 text-[#a99a82]">
            O pagamento foi concluído com sucesso. O seu plano Starter está ativo.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#f0c36a] px-8 font-black text-black hover:bg-[#ffd982]"
          >
            Ir para o dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}