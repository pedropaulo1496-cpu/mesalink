import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@mesalink.pt", publicKey, privateKey);
  return true;
}

export function hqPushPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function sendHqPush(message: PushMessage, userIds?: string[]) {
  if (!configurePush()) return;
  const subscriptions = await prisma.hqPushSubscription.findMany({
    where: userIds?.length ? { userId: { in: userIds } } : { user: { isAdmin: true } },
  });
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, JSON.stringify(message));
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error
        ? Number(error.statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.hqPushSubscription.delete({ where: { endpoint: subscription.endpoint } }).catch(() => undefined);
      } else {
        console.error("HQ push notification failed", error);
      }
    }
  }));
}

export async function notifyNewClient(input: { name: string; email: string; salesRepresentativeId: string | null }) {
  const rep = input.salesRepresentativeId
    ? await prisma.salesRepresentative.findUnique({ where: { id: input.salesRepresentativeId }, select: { userId: true, active: true } })
    : null;
  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  const recipients = [...admins.map((admin) => admin.id), ...(rep?.active ? [rep.userId] : [])];
  await sendHqPush({
    title: "Novo cliente MesaLink",
    body: `${input.name || input.email} acabou de criar uma conta.`,
    url: "/backoffice/clients",
    tag: `new-client-${input.email}`,
  }, [...new Set(recipients)]);
}

export async function notifyClientMessage(input: { conversationId: string; clientName: string; preview: string; salesRepresentativeUserId: string | null }) {
  await sendHqPush({
    title: "Nova mensagem de cliente",
    body: `${input.clientName}: ${input.preview}`,
    url: `/backoffice/chat?mode=clients&client=${input.conversationId}`,
    tag: `support-${input.conversationId}`,
  }, input.salesRepresentativeUserId ? [input.salesRepresentativeUserId] : undefined);
}
