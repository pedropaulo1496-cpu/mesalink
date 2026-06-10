import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#f0c36a]/10 bg-[#070504]">
      <div className="mx-auto max-w-7xl px-8 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-2xl font-black text-white">
              Mesa<span className="text-[#f0c36a]">Link</span>
            </h3>

            <p className="mt-4 max-w-sm text-[#a99a82]">
              Transforme visitas no Google Maps em reservas confirmadas.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-[#f0c36a]">
              Links
            </h4>

            <div className="space-y-2">
              <Link href="/pricing" className="block text-[#a99a82] hover:text-white">
                Preços
              </Link>

              <Link href="/contact" className="block text-[#a99a82] hover:text-white">
                Contacto
              </Link>

              <Link href="/login" className="block text-[#a99a82] hover:text-white">
                Entrar
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-[#f0c36a]">
              Legal
            </h4>

            <div className="space-y-2">
              <Link href="/privacy" className="block text-[#a99a82] hover:text-white">
                Política de Privacidade
              </Link>

              <Link href="/terms" className="block text-[#a99a82] hover:text-white">
                Termos e Condições
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#f0c36a]/10 pt-8 text-sm text-[#7d725f] md:flex-row md:justify-between">
          <p>© 2026 MesaLink. Todos os direitos reservados.</p>

          <p>info@mesalink.pt</p>
        </div>
      </div>
    </footer>
  );
}