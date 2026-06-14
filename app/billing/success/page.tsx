import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-8 text-center">
        <div className="w-full rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-10 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-green-400/20 bg-green-500/10 text-4xl text-green-300">
            ✓
          </div>

          <h1 className="text-4xl font-black tracking-[-0.05em]">
            Pagamento concluído
          </h1>

          <p className="mt-4 text-lg text-slate-300">
            A sua subscrição foi ativada com sucesso.
          </p>

          <p className="mt-2 text-slate-400">
            As novas funcionalidades já estão disponíveis na sua conta.
          </p>

          <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-black/25 p-5 text-left">
            <h2 className="font-black text-cyan-300">
              O que acontece agora?
            </h2>

            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>✓ Reservas ilimitadas ou add-on ativo</li>
              <li>✓ Funcionalidades desbloqueadas</li>
              <li>✓ Acesso imediato na dashboard</li>
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-8 font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90"
          >
            Ir para o dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}