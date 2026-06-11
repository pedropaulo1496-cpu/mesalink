import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Voltar
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge>Fale connosco</Badge>

            <h1 className="mt-5 text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl">
              Vamos ligar o seu restaurante ao futuro das reservas.
            </h1>

            <p className="mt-6 text-base leading-relaxed text-slate-400">
              Tem dúvidas sobre o MesaLink, preços, implementação ou reservas
              online? Envie-nos uma mensagem.
            </p>

            <div className="mt-8 rounded-[2rem] border border-cyan-300/15 bg-white/[0.04] p-6 backdrop-blur-2xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Email
              </p>

              <p className="mt-3 text-2xl font-black text-white">
                info@mesalink.pt
              </p>

              <p className="mt-3 text-sm text-slate-400">
                Respondemos o mais rapidamente possível.
              </p>
            </div>
          </div>

          <form className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-6 shadow-[0_0_80px_rgba(34,211,238,0.14)] backdrop-blur-2xl sm:p-8">
            <div className="space-y-4">
              <Input placeholder="Nome" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Restaurante" />

              <textarea
                placeholder="Mensagem"
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              className="mt-6 h-14 w-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-base font-black text-black shadow-[0_0_60px_rgba(96,165,250,0.35)] hover:opacity-90"
            >
              Enviar mensagem
            </Button>

            <p className="mt-4 text-center text-xs text-slate-500">
              O formulário será ligado ao email no próximo passo.
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Input({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="h-14 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
    />
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-200">
      {children}
    </span>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-160px] top-[280px] h-[360px] w-[360px] rounded-full bg-violet-500/15 blur-[110px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.15),transparent_35%),linear-gradient(to_bottom,#020617,#050816_45%,#020617)]" />
    </div>
  );
}