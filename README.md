This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Revenue AI — WhatsApp e chamadas

O conector usa uma conta Twilio central do MesaLink. Em produção são necessárias estas variáveis:

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_API_KEY_SID=SK...
TWILIO_API_KEY_SECRET=...
```

As chamadas à API usam preferencialmente a chave revogável. O Auth Token principal fica reservado para validar `X-Twilio-Signature` nos webhooks.

Cada restaurante termina a configuração em `Revenue AI → Canais`. O MesaLink tenta configurar automaticamente os webhooks quando o número pertence à conta Twilio; para números externos, a página apresenta os URLs que devem ser copiados para o fornecedor.

- WhatsApp recebido: `/api/revenue-ai/webhooks/twilio/whatsapp`
- Estado de entrega WhatsApp: `/api/revenue-ai/webhooks/twilio/whatsapp/status`
- Chamada recebida: `/api/revenue-ai/webhooks/twilio/voice/incoming`
- Resultado da chamada: gerado automaticamente pelo MesaLink no `<Dial action>`

Todos os webhooks validam `X-Twilio-Signature`. Em desenvolvimento, a validação só pode ser ignorada fora de produção com `TWILIO_SKIP_SIGNATURE_VALIDATION=true`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
