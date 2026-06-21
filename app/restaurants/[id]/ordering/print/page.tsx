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
    label: "Premium",
    page: "bg-[#F5EFE6] text-[#16120E]",
    card: "border-[#16120E] bg-[#16120E] text-white",
    accent: "text-[#C8A56A]",
    qrWrap: "bg-white",
  },
  minimal: {
    label: "Minimal",
    page: "bg-[#F5EFE6] text-[#16120E]",
    card: "border-[#E1D0B8] bg-white text-[#16120E]",
    accent: "text-[#9B6F3B]",
    qrWrap: "bg-white",
  },
  mesalink: {
    label: "MesaLink",
    page: "bg-[#F5EFE6] text-[#16120E]",
    card:
      "border-[#D6C3A5] bg-gradient-to-br from-[#FFFDF8] via-[#FFF9F0] to-[#EFE5D6] text-[#16120E]",
    accent: "text-[#9B6F3B]",
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
        <div className="flex flex-col gap-4 rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9B6F3B]">
              QR Ordering
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.055em]">
              QR Codes
            </h1>

            <p className="mt-2 text-sm font-bold text-[#6B6258]">
              {restaurant.name} · {tables.length} mesa(s) · {template.label} ·{" "}
              {size.label}
            </p>
          </div>

          <PrintButton />
        </div>

        <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
            Mesas
          </p>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/restaurants/${restaurant.id}/ordering/print?template=${selectedTemplate}&size=${selectedSize}`}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                !selectedTable
                  ? "border-[#16120E] bg-[#16120E] text-white"
                  : "border-[#E1D0B8] bg-[#FFF9F0] text-[#6B6258] hover:border-[#C8A56A]"
              }`}
            >
              Todas
            </Link>

            {restaurant.tables.map((table) => (
              <Link
                key={table.id}
                href={`/restaurants/${restaurant.id}/ordering/print?table=${table.number}&template=${selectedTemplate}&size=${selectedSize}`}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  selectedTable === table.number
                    ? "border-[#16120E] bg-[#16120E] text-white"
                    : "border-[#E1D0B8] bg-[#FFF9F0] text-[#6B6258] hover:border-[#C8A56A]"
                }`}
              >
                Mesa {table.number}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
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
                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                    selectedTemplate === key
                      ? "border-[#16120E] bg-[#16120E] text-white"
                      : "border-[#E1D0B8] bg-[#FFF9F0] text-[#6B6258] hover:border-[#C8A56A]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#9B6F3B]">
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
                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                    selectedSize === key
                      ? "border-[#16120E] bg-[#16120E] text-white"
                      : "border-[#E1D0B8] bg-[#FFF9F0] text-[#6B6258] hover:border-[#C8A56A]"
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
                  className={`text-xs font-semibold uppercase tracking-[0.22em] ${template.accent}`}
                >
                  MesaLink QR Ordering
                </p>

                <h2 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">
                  Mesa {table.number}
                </h2>

                <p className={`mt-2 text-sm font-semibold ${template.accent}`}>
                  {restaurant.name}
                </p>

                <div
                  className={`mt-6 rounded-[28px] p-4 shadow-sm ${template.qrWrap}`}
                  style={{
                    width: size.qr + 32,
                    height: size.qr + 32,
                  }}
                >
                  <QrCodeImage value={url} size={size.qr} />
                </div>

                <p className="mt-6 text-lg font-semibold">
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