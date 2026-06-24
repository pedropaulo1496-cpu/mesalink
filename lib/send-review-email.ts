import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendReviewEmailParams = {
  to: string;
  customerName: string;
  restaurantName: string;
  reservationId: string;
};

export async function sendReviewEmail({
  to,
  customerName,
  restaurantName,
  reservationId,
}: SendReviewEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const reviewUrl = `${baseUrl}/review/${reservationId}`;

  await resend.emails.send({
    from: "MesaLink <noreply@mesalink.pt>",
    to,
    subject: `Como foi a sua experiência no ${restaurantName}?`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#F5EFE6;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #E1D0B8;border-radius:28px;padding:32px;">
          <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9B6F3B;font-weight:700;">
            ${restaurantName}
          </p>

          <h1 style="font-size:30px;line-height:1.1;margin:16px 0;color:#16120E;">
            Como foi a sua experiência?
          </h1>

          <p style="font-size:15px;line-height:1.6;color:#6B6258;">
            Olá ${customerName}, obrigado pela sua visita. A sua opinião ajuda-nos a melhorar a experiência de cada cliente.
          </p>

          <a href="${reviewUrl}" style="display:inline-block;margin-top:24px;background:#16120E;color:white;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;font-size:14px;">
            Avaliar experiência
          </a>

          <p style="margin-top:28px;font-size:12px;color:#8A7C6D;">
            Este email foi enviado automaticamente através da MesaLink.
          </p>
        </div>
      </div>
    `,
  });
}