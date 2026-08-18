"use client";

import PushNotificationToggle from "@/components/PushNotificationToggle";

export default function HqPushNotifications() {
  return <PushNotificationToggle apiPath="/api/backoffice/push" storageKey="mesalink:hq-notifications" title="Notificações do HQ" description="Avisos de novos clientes, mensagens e escaladas." />;
}
