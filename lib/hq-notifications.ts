import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag?: string;
};

async function pushKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY, subject: process.env.VAPID_SUBJECT || "mailto:info@mesalink.pt" };
  }
  const settings = await prisma.adminSettings.findUnique({ where: { id: "global" }, select: { vapidPublicKey: true, vapidPrivateKey: true, vapidSubject: true } });
  return { publicKey: settings?.vapidPublicKey, privateKey: settings?.vapidPrivateKey, subject: settings?.vapidSubject || "mailto:info@mesalink.pt" };
}

async function configurePush() {
  const { publicKey, privateKey, subject } = await pushKeys();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function hqPushPublicKey() {
  return (await pushKeys()).publicKey || null;
}

export async function sendHqPush(message: PushMessage, userIds?: string[]) {
  if (!await configurePush()) return;
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

export async function notifyPartnerMessage(input: { conversationId: string; partnerName: string; preview: string }) {
  await sendHqPush({
    title: "Nova mensagem de parceiro",
    body: `${input.partnerName}: ${input.preview}`,
    url: `/backoffice/chat?mode=partners&partner=${input.conversationId}`,
    tag: `partner-support-${input.conversationId}`,
  });
}

export async function notifyPartnerSupportReply(input: { conversationId: string; partnerUserId: string; staffName: string; preview: string }) {
  await sendHqPush({
    title: "Nova mensagem da MesaLink",
    body: `${input.staffName}: ${input.preview}`,
    url: "/partners/app?tab=help",
    tag: `partner-support-reply-${input.conversationId}`,
  }, [input.partnerUserId]);
}

export async function notifyRestaurantSupportReply(input: { conversationId: string; clientUserId: string; restaurantId: string | null; staffName: string; preview: string }) {
  const selectedRestaurant = input.restaurantId
    ? await prisma.restaurant.findFirst({ where: { id: input.restaurantId, userId: input.clientUserId }, select: { id: true } })
    : null;
  const restaurant = selectedRestaurant || await prisma.restaurant.findFirst({ where: { userId: input.clientUserId }, select: { id: true }, orderBy: { createdAt: "desc" } });
  if (!restaurant) return;
  await sendHqPush({
    title: "Nova mensagem da MesaLink",
    body: `${input.staffName}: ${input.preview}`,
    url: `/restaurants/${restaurant.id}/support`,
    tag: `support-reply-${input.conversationId}`,
  }, [input.clientUserId]);
}

export async function notifyRestaurantReservation(input: { restaurantId: string; customerName: string; guests: number; date: Date; source?: string }) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: input.restaurantId }, select: { name: true, userId: true } });
  if (!restaurant?.userId) return;
  const when = input.date.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" });
  await sendHqPush({
    title: `Nova reserva · ${restaurant.name}`,
    body: `${input.customerName} · ${input.guests} pessoas · ${when}${input.source === "PARTNER_NETWORK" ? " · MesaLink Partner" : ""}`,
    url: `/restaurants/${input.restaurantId}/calendar`,
    tag: `reservation-${input.restaurantId}-${input.date.getTime()}`,
  }, [restaurant.userId]);
}
