import { createRestaurant } from "./actions";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(240,195,106,0.16),transparent_30%),linear-gradient(to_bottom,#070504,#120d08)]" />

      <div className="relative mx-auto max-w-7xl px-8 py-8">
        <header className="mb-14 border-b border-[#f0c36a]/10 pb-8">
          <h1 className="text-2xl font-black text-[#fff7ea]">
            Mesa<span className="text-[#f0c36a]">Link</span>
          </h1>
        </header>

        <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#f0c36a]/10 bg-[#15100b] p-8 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f0c36a]">
            Onboarding
          </p>

          <h2 className="mt-3 text-4xl font-black">Criar restaurante</h2>

          <p className="mt-3 text-[#a99a82]">
            Preenche os dados principais para começares a receber reservas.
          </p>

          <form action={createRestaurant} className="mt-8 space-y-4">
            <input
              name="name"
              required
              placeholder="Nome do restaurante"
              className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-[#fff7ea] outline-none placeholder:text-[#a99a82]"
            />

            <input
              name="email"
              type="email"
              placeholder="Email do restaurante"
              className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-[#fff7ea] outline-none placeholder:text-[#a99a82]"
            />

            <input
              name="phone"
              placeholder="Telefone"
              className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-[#fff7ea] outline-none placeholder:text-[#a99a82]"
            />

            <input
              name="address"
              placeholder="Morada"
              className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/25 px-5 py-4 text-[#fff7ea] outline-none placeholder:text-[#a99a82]"
            />

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#f0c36a] px-5 py-4 font-black text-black transition hover:bg-[#ffd98a]"
            >
              Criar restaurante
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}