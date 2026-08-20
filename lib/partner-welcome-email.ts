import { Resend } from "resend";

const WEB_ACCESS_URL = "https://www.mesalink.pt/partners/login";
const ANDROID_DOWNLOAD_URL = "https://www.mesalink.pt/downloads/MesaLink-Parceiros-v1.0.3.apk";

export async function sendPartnerWelcomeEmail(input: { email: string; contactName: string; businessName: string }) {
  if (!process.env.RESEND_API_KEY) return false;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const name = escapeHtml(input.contactName || input.businessName || "Parceiro MesaLink");
  const business = escapeHtml(input.businessName);
  const response = await resend.emails.send({
    from: "MesaLink Partners <info@mesalink.pt>",
    to: input.email,
    replyTo: "info@mesalink.pt",
    subject: "A sua conta MesaLink Partners está pronta",
    html: `<!doctype html><html><body style="margin:0;background:#f5efe6;font-family:Arial,sans-serif;color:#17120d"><div style="max-width:640px;margin:0 auto;padding:28px 14px"><div style="border-radius:24px 24px 0 0;background:#17120d;padding:28px;color:#fff"><div style="font-family:Georgia,serif;font-size:29px"><span style="color:#d9b46b">Mesa</span>Link</div><p style="margin:16px 0 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d9b46b">Partners</p><h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:30px;line-height:1.15">A sua conta está pronta.</h1></div><div style="border:1px solid #e1d0b8;border-top:0;background:#fff;padding:28px"><p style="font-size:16px;line-height:1.65">Olá, ${name}.</p><p style="font-size:16px;line-height:1.65">A conta de <strong>${business}</strong> foi criada. Pode usar o MesaLink Partners no computador ou instalar a aplicação Android — os dados e as reservas são os mesmos em ambos.</p><div style="margin:24px 0;padding:18px;border:1px solid #ddc8a5;border-radius:18px;background:#fff9ef"><p style="margin:0 0 7px;font-weight:700">Usar no computador</p><p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#665b50">Abra o acesso web em qualquer PC, sem instalar nada.</p><a href="${WEB_ACCESS_URL}" style="display:inline-block;border-radius:999px;background:#17120d;padding:13px 20px;color:#fff;font-weight:700;text-decoration:none">Entrar no MesaLink Partners</a></div><div style="margin:24px 0;padding:18px;border:1px solid #ddc8a5;border-radius:18px;background:#fff9ef"><p style="margin:0 0 7px;font-weight:700">Instalar no telemóvel Android</p><p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#665b50">Descarregue diretamente a aplicação oficial MesaLink Partners.</p><a href="${ANDROID_DOWNLOAD_URL}" style="display:inline-block;border-radius:999px;background:#d7b267;padding:13px 20px;color:#17120d;font-weight:700;text-decoration:none">Descarregar a app Android</a></div><p style="font-size:14px;line-height:1.6;color:#665b50">Se precisar de ajuda, use o pequeno botão de ajuda dentro da plataforma ou responda a este email.</p><p style="font-size:14px;line-height:1.6">Cumprimentos,<br><strong>Equipa MesaLink Partners</strong><br><a href="mailto:info@mesalink.pt" style="color:#8a5e24">info@mesalink.pt</a></p></div></div></body></html>`,
    text: `Olá, ${input.contactName || input.businessName}.\n\nA conta de ${input.businessName} está pronta.\n\nUsar no computador: ${WEB_ACCESS_URL}\n\nDescarregar a app Android: ${ANDROID_DOWNLOAD_URL}\n\nPode usar a mesma conta e os mesmos dados em ambos. Se precisar de ajuda, responda a este email ou use o botão de ajuda na plataforma.\n\nEquipa MesaLink Partners\ninfo@mesalink.pt`,
  }, { idempotencyKey: `partner-welcome-${input.email.toLowerCase()}` });
  if (response.error) throw new Error(response.error.message);
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!);
}
