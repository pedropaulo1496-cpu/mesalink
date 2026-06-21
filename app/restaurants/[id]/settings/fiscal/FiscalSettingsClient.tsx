"use client";

import { useState } from "react";

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
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState(
    integration?.clientId ?? "",
  );

  const [clientSecret, setClientSecret] = useState(
    integration?.clientSecret ?? "",
  );

  const [companyId, setCompanyId] = useState(
    integration?.companyId ?? "",
  );

  const [invoiceSerieId, setInvoiceSerieId] = useState(
    integration?.invoiceSerieId ?? "",
  );

  const [simplifiedInvoiceSerieId, setSimplifiedInvoiceSerieId] =
    useState(integration?.simplifiedInvoiceSerieId ?? "");

  const [creditNoteSerieId, setCreditNoteSerieId] =
    useState(integration?.creditNoteSerieId ?? "");

  const [active, setActive] = useState(
    integration?.active ?? false,
  );

  async function saveSettings() {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/restaurants/${restaurantId}/fiscal/settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId,
            clientSecret,
            companyId,
            invoiceSerieId,
            simplifiedInvoiceSerieId,
            creditNoteSerieId,
            active,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Erro.");
      }

      alert("Configuração guardada.");
    } catch (error: any) {
      alert(error?.message ?? "Erro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#B58A45]">
            Faturação
          </p>

          <h1 className="mt-3 text-5xl font-black tracking-[-0.08em] text-[#0E0D0C]">
            Moloni
          </h1>

          <p className="mt-3 text-sm font-medium text-[#7D746A]">
            Configuração fiscal para {restaurantName}.
          </p>
        </div>

        <div className="rounded-[32px] border border-[#E8E0D4] bg-white p-8 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Client ID"
              value={clientId}
              onChange={setClientId}
            />

            <Input
              label="Client Secret"
              value={clientSecret}
              onChange={setClientSecret}
            />

            <Input
              label="Company ID"
              value={companyId}
              onChange={setCompanyId}
            />

            <Input
              label="Série Fatura"
              value={invoiceSerieId}
              onChange={setInvoiceSerieId}
            />

            <Input
              label="Série Fatura Simplificada"
              value={simplifiedInvoiceSerieId}
              onChange={setSimplifiedInvoiceSerieId}
            />

            <Input
              label="Série Nota Crédito"
              value={creditNoteSerieId}
              onChange={setCreditNoteSerieId}
            />
          </div>

          <label className="mt-6 flex items-center gap-3">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />

            <span className="text-sm font-bold text-[#171412]">
              Integração ativa
            </span>
          </label>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="mt-8 h-12 rounded-xl bg-[#171412] px-6 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>

        <div className="mt-8 rounded-[32px] border border-[#E8E0D4] bg-white p-8">
          <h2 className="text-xl font-black text-[#171412]">
            Últimos documentos
          </h2>

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
                  <tr
                    key={document.id}
                    className="border-b border-[#F1ECE5]"
                  >
                    <td className="py-4">
                      {document.documentNumber ?? "-"}
                    </td>

                    <td className="py-4">
                      {document.documentType}
                    </td>

                    <td className="py-4">
                      {document.status}
                    </td>

                    <td className="py-4">
                      €{document.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#7D746A]">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-[#E8E0D4] px-4 outline-none focus:border-[#B58A45]"
      />
    </div>
  );
}