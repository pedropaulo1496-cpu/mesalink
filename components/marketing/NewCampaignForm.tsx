"use client";

import { useEffect, useState } from "react";
import CampaignAudiencePreview from "./CampaignAudiencePreview";
import CampaignTemplates from "./CampaignTemplates";

export default function NewCampaignForm({
  restaurantId,
  initialSegment = "ALL",
  initialTag = "",
}: {
  restaurantId: string;
  initialSegment?: string;
  initialTag?: string;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function applySegmentTemplate(segment: string) {
    if (segment === "VIP" || segment === "GOLD" || segment === "PLATINUM") {
      setSubject("Convite exclusivo para clientes VIP");
      setMessage(
        "Temos uma experiência especial reservada para os nossos clientes mais importantes.\n\nReserve a sua mesa e aproveite este benefício exclusivo.",
      );
      return;
    }

    if (segment === "BRONZE" || segment === "SILVER") {
      setSubject("Um benefício especial para si");
      setMessage(
        "Queremos agradecer a sua preferência com uma vantagem especial.\n\nReserve a sua mesa e venha aproveitar este benefício.",
      );
      return;
    }

    if (segment === "INACTIVE") {
      setSubject("Sentimos a sua falta");
      setMessage(
        "Já passou algum tempo desde a sua última visita e gostaríamos muito de o voltar a receber.\n\nReserve a sua mesa e volte a visitar-nos em breve.",
      );
      return;
    }

    if (segment === "BIRTHDAYS") {
      setSubject("Feliz aniversário 🎉");
      setMessage(
        "Queremos celebrar consigo este mês especial.\n\nReserve a sua mesa e venha brindar connosco.",
      );
      return;
    }

    if (segment === "TAG") {
      setSubject("Uma sugestão especial para si");
      setMessage(
        "Preparámos uma comunicação especial para clientes selecionados.\n\nReserve a sua mesa e descubra a novidade.",
      );
    }
  }

  useEffect(() => {
    applySegmentTemplate(initialSegment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      action="/api/marketing/send-campaign"
      method="POST"
      className="mt-8 w-full max-w-6xl rounded-[34px] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] lg:p-8"
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />

      <div className="grid gap-8 xl:grid-cols-[0.85fr_1.15fr]">
        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              Segmento
            </span>

            <CampaignAudiencePreview
              restaurantId={restaurantId}
              initialSegment={initialSegment}
              initialTag={initialTag}
              onSegmentChange={applySegmentTemplate}
            />
          </label>

          <div className="mt-6">
            <CampaignTemplates
              onSelect={(newSubject, newMessage) => {
                setSubject(newSubject);
                setMessage(newMessage);
              }}
            />
          </div>
        </div>

        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              Assunto
            </span>

            <input
              name="subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Ex: Temos novidades para si"
              className="h-12 w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] px-4 text-sm font-semibold outline-none"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-[#6B6258]">
              Mensagem
            </span>

            <textarea
              name="message"
              required
              rows={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escreva a mensagem da campanha..."
              className="w-full rounded-2xl border border-[#E1D0B8] bg-[#FFF9F0] p-4 text-sm font-semibold leading-7 outline-none"
            />
          </label>

          <div className="mt-6 flex justify-end">
            <button className="rounded-full bg-[#16120E] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#2A2118]">
              Enviar campanha
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}