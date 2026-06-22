"use client";

type FiscalIntegration = {
  id: string;
  provider: string;
  clientId: string | null;
  clientSecret: string | null;
  companyId: string | null;
  invoiceSerieId: string | null;
  simplifiedInvoiceSerieId: string | null;
  creditNoteSerieId: string | null;
  active: boolean;
} | null;

type FiscalDocument = {
  id: string;
  documentType: string;
  documentNumber: string | null;
  status: string;
  totalAmount: number;
  createdAt: Date | string;
};

export default function FiscalSettingsClient({
  restaurantId,
  restaurantName,
  integration,
  documents,
}: {
  restaurantId: string;
  restaurantName: string;
  integration: FiscalIntegration;
  documents: FiscalDocument[];
}) {
  const connected = Boolean(integration?.active && integration?.companyId);

  function connectMoloni() {
    window.location.href = `/api/moloni/connect?restaurantId=${restaurantId}`;
  }

  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#B58A45]">
            Fiscalidade
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.08em] text-[#0E0D0C]">
            Faturação Moloni
          </h1>

          <p className="mt-3 text-sm font-medium text-[#7D746A]">
            Liga a conta Moloni de {restaurantName}. As faturas serão emitidas
            pela entidade fiscal do restaurante.
          </p>
        </div>

        <div className="rounded-[32px] border border-[#E8E0D4] bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#B58A45]">
                Estado da integração
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.06em] text-[#0E0D0C]">
                {connected ? "Moloni ligado" : "Moloni não ligado"}
              </h2>

              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[#7D746A]">
                {connected
                  ? "A conta Moloni deste restaurante está ligada. O MesaLink pode preparar emissão de documentos fiscais através desta entidade."
                  : "O restaurante precisa de autorizar a sua própria conta Moloni para que as faturas saiam com o NIF, morada, ATCUD e QR Code fiscal corretos."}
              </p>
            </div>

            <span
              className={
                connected
                  ? "rounded-full bg-[#E9F8EE] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#166534]"
                  : "rounded-full bg-[#FFF4E6] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#9B6F3B]"
              }
            >
              {connected ? "Ligado" : "Pendente"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              label="Provider"
              value={integration?.provider ?? "Moloni"}
            />

            <InfoCard
              label="Company ID"
              value={integration?.companyId ?? "Ainda não ligado"}
            />

            <InfoCard
              label="Série"
              value={
                integration?.invoiceSerieId ||
                integration?.simplifiedInvoiceSerieId ||
                "Automática"
              }
            />
          </div>

          <button
            onClick={connectMoloni}
            className="mt-8 h-12 rounded-xl bg-[#171412] px-6 text-sm font-black text-white transition hover:opacity-90"
          >
            {connected ? "Atualizar ligação Moloni" : "Ligar Moloni"}
          </button>
        </div>

        <div className="mt-8 rounded-[32px] border border-[#E8E0D4] bg-white p-8">
          <h2 className="text-xl font-black text-[#171412]">
            Últimos documentos
          </h2>

          {documents.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-6">
              <p className="font-black text-[#0E0D0C]">
                Ainda não existem documentos.
              </p>
              <p className="mt-1 text-sm font-medium text-[#7D746A]">
                Quando o POS emitir faturas ou notas de crédito, elas aparecem
                aqui.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8E0D4]">
                    <th className="pb-3 text-xs uppercase">Número</th>
                    <th className="pb-3 text-xs uppercase">Tipo</th>
                    <th className="pb-3 text-xs uppercase">Estado</th>
                    <th className="pb-3 text-xs uppercase">Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id} className="border-b border-[#F1ECE5]">
                      <td className="py-4">{document.documentNumber ?? "-"}</td>
                      <td className="py-4">{document.documentType}</td>
                      <td className="py-4">{document.status}</td>
                      <td className="py-4">
                        €{document.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-black text-[#0E0D0C]">
        {value}
      </p>
    </div>
  );
}