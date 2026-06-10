import Link from "next/link";

export default function TrialExpiredPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto flex min-h-screen max-w-2xl items-center justify-center px-8">
        <div className="rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-10 text-center shadow-2xl">
          <h1 className="text-4xl font-black">
            Período experimental terminado
          </h1>

          <p className="mt-4 text-[#a99a82]">
            Os seus 7 dias gratuitos terminaram.
            Ative um plano para continuar a receber reservas.
          </p>

          <Link
            href="/pricing"
            className="mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#f0c36a] px-8 font-black text-black hover:bg-[#ffd982]"
          >
            Ativar Plano
          </Link>
        </div>
      </div>
    </main>
  );
}