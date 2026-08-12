import OpenAI from "openai";

export type RevenueWhatsappIntent = "RESERVATION" | "OTHER";

export async function classifyInboundWhatsappIntent(message: string): Promise<RevenueWhatsappIntent> {
  const normalized = message.toLocaleLowerCase("pt-PT").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const humanTopics = /reclam|fatura|fornecedor|emprego|trabalh|curricul|alerg|intoler|pagamento|reembolso|evento|imprensa|parceria|objeto perdido|perdi|esqueci/;
  const bookingTopics = /reserv|marcar|mesa|disponibilidade|lugar|jantar|almoco|almoçar|grupo|pessoa|horario|hora|cancelar.*reserv|alterar.*reserv/;
  if (humanTopics.test(normalized)) return "OTHER";
  if (bookingTopics.test(normalized)) return "RESERVATION";
  if (!process.env.OPENAI_API_KEY) return "OTHER";

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Classifica a mensagem recebida por um restaurante. Responde apenas RESERVATION se o assunto for reservar, alterar ou cancelar uma reserva. Para qualquer outro assunto responde OTHER." },
        { role: "user", content: message.slice(0, 1200) },
      ],
      max_tokens: 8,
      temperature: 0,
    });
    return response.choices[0]?.message.content?.trim() === "RESERVATION" ? "RESERVATION" : "OTHER";
  } catch (error) {
    console.warn("Revenue WhatsApp intent fallback", error);
    return "OTHER";
  }
}

export async function generateInboundWhatsappReply(input: {
  restaurantName: string;
  contactName: string;
  customerMessage: string;
  address?: string | null;
  cuisine?: string | null;
  description?: string | null;
  recoveryOffer?: string | null;
}) {
  const fallback = `Olá ${firstName(input.contactName)}, sou o assistente do ${input.restaurantName}. Obrigado pela mensagem. Para ajudar rapidamente, pretende fazer uma reserva, alterar uma marcação ou pedir informação?`;
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "És o agente WhatsApp de um restaurante em Portugal. Responde em português europeu, de forma calorosa e muito breve. Identifica-te como assistente do restaurante. Responde apenas com informação fornecida. Nunca inventes preços, disponibilidade, horários, promoções ou uma reserva confirmada. Se não souberes, recolhe o pedido e diz que uma pessoa vai confirmar. Reclamações, alergias, reembolsos, pagamentos e pedidos sensíveis devem ser reconhecidos e encaminhados imediatamente para uma pessoa. Produz apenas a mensagem final, sem aspas, até 450 caracteres.",
        },
        {
          role: "user",
          content: `Restaurante: ${input.restaurantName}\nCliente: ${input.contactName}\nMorada: ${input.address || "Não indicada"}\nCozinha: ${input.cuisine || "Não indicada"}\nDescrição: ${input.description || "Não indicada"}\nOferta autorizada: ${input.recoveryOffer || "Nenhuma"}\nMensagem recebida: ${input.customerMessage}`,
        },
      ],
      max_tokens: 180,
    });
    return response.choices[0]?.message.content?.trim().slice(0, 600) || fallback;
  } catch (error) {
    console.warn("Revenue WhatsApp agent fallback", error);
    return fallback;
  }
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "";
}
