import Footer from "@/components/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#070504] text-[#fff7ea]">
      <div className="mx-auto max-w-5xl px-8 py-16">
        <Link href="/" className="text-[#a99a82] hover:text-white">
          ← Voltar
        </Link>

        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-black">
              Fale connosco
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-[#a99a82]">
              Tem dúvidas sobre o MesaLink, preços, implementação ou reservas online?
              Envie-nos uma mensagem.
            </p>

            <div className="mt-8 rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-6">
              <p className="text-sm text-[#a99a82]">
                Email
              </p>

              <p className="mt-2 text-xl font-black text-[#f0c36a]">
                info@mesalink.pt
              </p>
            </div>
          </div>

          <form className="rounded-[2rem] border border-[#f0c36a]/15 bg-[#15100b] p-8 shadow-2xl">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
              />

              <input
                type="email"
                placeholder="Email"
                className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Restaurante"
                className="h-14 w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
              />

              <textarea
                placeholder="Mensagem"
                rows={5}
                className="w-full rounded-2xl border border-[#f0c36a]/10 bg-black/20 px-4 py-4 text-white placeholder:text-[#7d725f] focus:border-[#f0c36a]/40 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              className="mt-6 h-14 w-full rounded-full bg-[#f0c36a] text-base font-bold text-black hover:bg-[#ffd982]"
            >
              Enviar mensagem
            </Button>

            <p className="mt-4 text-center text-xs text-[#7d725f]">
              O formulário será ligado ao email no próximo passo.
            </p>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}