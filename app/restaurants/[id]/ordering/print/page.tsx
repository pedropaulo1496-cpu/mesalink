import QrCodeImage from "@/components/QrCodeImage";
import PrintButton from "@/components/PrintButton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    table?: string;
    size?: string;
    template?: string;
  }>;
};

const QR_SIZES = {
  small: {
    label: "Pequeno",
    qr: 150,
    card: "print:h-[105mm]",
    cols: "print:grid-cols-2",
  },
  medium: {
    label: "Médio",
    qr: 220,
    card: "print:h-[148.5mm]",
    cols: "print:grid-cols-2",
  },
  large: {
    label: "Grande",
    qr: 320,
    card: "print:h-[297mm]",
    cols: "print:grid-cols-1",
  },
};

const QR_TEMPLATES = {
  premium: {
    label: "Premium Dark",
    page: "bg-[#020617] text-white",
    card: "border-cyan-300/25 bg-[#020617] text-white",
    accent: "text-cyan-300",
    qrWrap: "bg-white",
  },
  minimal: {
    label: "Minimal White",
    page: "bg-white text-black",
    card: "border-slate-200 bg-white text-black",
    accent: "text-slate-500",
    qrWrap: "bg-white",
  },
  mesalink: {
    label: "MesaLink",
    page: "bg-[#020617] text-white",
    card:
      "border-violet-300/25 bg-gradient-to-br from-[#020617] via-[#06111f] to-[#1b1035] text-white",
    accent: "text-violet-300",
    qrWrap: "bg-white",
  },
};

export default async function PrintQrCodesPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};

  const selectedSize =
    query.size === "small" || query.size === "large" ? query.size : "medium";

  const selectedTemplate =
    query.template === "minimal" || query.template === "mesalink"
      ? query.template
      : "premium";

  const selectedTable = query.table ? Number(query.table) : null;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      tables: {
        orderBy: { number: "asc" },
      },
    },
  });

  if (!restaurant) notFound();

  const tables = selectedTable
    ? restaurant.tables.filter((table) => table.number === selectedTable)
    : restaurant.tables;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  const size = QR_SIZES[selectedSize];
  const template = QR_TEMPLATES[selectedTemplate];

  return (
    <main className={`min-h-screen p-6 print:p-0 ${template.page}`}>
      <div className="mx-auto mb-6 max-w-5xl space-y-4 print:hidden">
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <div>
            <h1 className="text-2xl font-black">QR Codes</h1>
            <p className="text-sm opacity-70">
              {restaurant.name} · {tables.length} mesa(s) · {template.label} ·{" "}
              {size.label}
            </p>
          </div>

          <PrintButton />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] opacity-60">
            Mesas
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/restaurants/${restaurant.id}/ordering/print?template=${selectedTemplate}&size=${selectedSize}`}
              className={`rounded-full border px-4 py-2 text-xs font-black ${
                !selectedTable ? "bg-white text-black" : "border-white/20"
              }`}
            >
              Todas
            </Link>

            {restaurant.tables.map((table) => (
              <Link
                key={table.id}
                href={`/restaurants/${restaurant.id}/ordering/print?table=${table.number}&template=${selectedTemplate}&size=${selectedSize}`}
                className={`rounded-full border px-4 py-2 text-xs font-black ${
                  selectedTable === table.number
                    ? "bg-white text-black"
                    : "border-white/20"
                }`}
              >
                Mesa {table.number}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] opacity-60">
              Template
            </p>

            <div className="flex flex-wrap gap-2">
              {Object.entries(QR_TEMPLATES).map(([key, item]) => (
                <Link
                  key={key}
                  href={`/restaurants/${restaurant.id}/ordering/print${
                    selectedTable
                      ? `?table=${selectedTable}&template=${key}&size=${selectedSize}`
                      : `?template=${key}&size=${selectedSize}`
                  }`}
                  className={`rounded-full border px-4 py-2 text-xs font-black ${
                    selectedTemplate === key
                      ? "bg-white text-black"
                      : "border-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] opacity-60">
              Tamanho
            </p>

            <div className="flex flex-wrap gap-2">
              {Object.entries(QR_SIZES).map(([key, item]) => (
                <Link
                  key={key}
                  href={`/restaurants/${restaurant.id}/ordering/print${
                    selectedTable
                      ? `?table=${selectedTable}&template=${selectedTemplate}&size=${key}`
                      : `?template=${selectedTemplate}&size=${key}`
                  }`}
                  className={`rounded-full border px-4 py-2 text-xs font-black ${
                    selectedSize === key
                      ? "bg-white text-black"
                      : "border-white/20"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section
        className={`mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 print:gap-0 ${size.cols}`}
      >
        {tables.map((table) => {
          const url = `${appUrl}/o/${restaurant.id}/${table.number}`;

          return (
            <div
              key={table.id}
              className={`break-inside-avoid border p-6 print:border print:p-8 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact] ${size.card} ${template.card}`}
            >
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p
                  className={`text-xs font-black uppercase tracking-[0.22em] ${template.accent}`}
                >
                  MesaLink QR Ordering
                </p>

                <h2 className="mt-3 text-5xl font-black tracking-[-0.06em]">
                  Mesa {table.number}
                </h2>

                <p className={`mt-2 text-sm font-bold ${template.accent}`}>
                  {restaurant.name}
                </p>

                <div
                  className={`mt-6 rounded-3xl p-4 ${template.qrWrap}`}
                  style={{
                    width: size.qr + 32,
                    height: size.qr + 32,
                  }}
                >
                  <QrCodeImage value={url} size={size.qr} />
                </div>

                <p className="mt-6 text-lg font-black">
                  Abra a câmara e faça o seu pedido
                </p>

                <p className="mt-2 max-w-xs break-all text-[10px] font-bold opacity-50">
                  {url}
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}