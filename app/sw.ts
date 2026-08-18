/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  const data = event.data?.json() as { title?: string; body?: string; url?: string; tag?: string } | undefined;
  event.waitUntil(self.registration.showNotification(data?.title || "MesaLink HQ", {
    body: data?.body || "Tem uma nova atualização.",
    icon: "/icons/apps/backoffice-192.png",
    badge: "/icons/apps/backoffice-192.png",
    tag: data?.tag,
    data: { url: data?.url || "/backoffice" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(String(event.notification.data?.url || "/backoffice"), self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    const client = clients.find((item) => "focus" in item);
    if (client) {
      await client.navigate(url);
      return client.focus();
    }
    return self.clients.openWindow(url);
  }));
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
