"use client";

type Props = {
  onSelect: (subject: string, message: string) => void;
};

export default function CampaignTemplates({
  onSelect,
}: Props) {
  const templates = [
    {
      label: "🍷 Sentimos a sua falta",
      subject: "Sentimos a sua falta 🍽️",
      message: `Já passou algum tempo desde a sua última visita.

Gostávamos muito de o voltar a receber.

Reserve já a sua mesa e venha descobrir as novidades.`,
    },
    {
      label: "🎂 Feliz aniversário",
      subject: "Feliz aniversário 🎂",
      message: `Toda a equipa deseja-lhe um excelente aniversário.

Esperamos recebê-lo em breve para celebrar connosco.`,
    },
    {
      label: "⭐ Deixe a sua opinião",
      subject: "A sua opinião é importante",
      message: `Obrigado pela sua visita.

A sua opinião ajuda-nos a melhorar continuamente a experiência dos nossos clientes.`,
    },
    {
      label: "🔥 Novidades do menu",
      subject: "Temos novidades no menu ✨",
      message: `Acabámos de lançar novas sugestões e pratos especiais.

Reserve já a sua mesa e venha experimentar.`,
    },
    {
      label: "🎉 Evento especial",
      subject: "Evento especial no restaurante 🎉",
      message: `Temos um evento especial a chegar.

Garanta já a sua mesa antes que esgote.`,
    },
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#6B6258]">
        Campanhas rápidas
      </p>

      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() =>
              onSelect(template.subject, template.message)
            }
            className="rounded-full border border-[#E1D0B8] bg-[#FFF9F0] px-4 py-2 text-sm font-semibold text-[#16120E] transition hover:bg-white"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
}