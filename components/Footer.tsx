import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-cyan-300/10 bg-[#020617] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <h3 className="text-2xl font-black tracking-tight">
              Mesa
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Link
              </span>
            </h3>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Transforme Google Maps, Instagram e website num sistema
              inteligente de reservas.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Links
            </h4>

            <div className="space-y-3">
              <FooterLink href="/pricing">Preços</FooterLink>
              <FooterLink href="/contact">Contacto</FooterLink>
              <FooterLink href="/login">Entrar</FooterLink>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
              Legal
            </h4>

            <div className="space-y-3">
              <FooterLink href="/privacy">Política de Privacidade</FooterLink>
              <FooterLink href="/terms">Termos e Condições</FooterLink>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-cyan-300/10 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 MesaLink. Todos os direitos reservados.</p>
          <p>info@mesalink.pt</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block text-sm text-slate-400 transition hover:text-white"
    >
      {children}
    </Link>
  );
}