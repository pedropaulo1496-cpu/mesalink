"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function RestaurantPushNotifications({ mobile = false }: { mobile?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    queueMicrotask(() => setSupported(available));
    if (!available) return;
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => {
      setEnabled(Boolean(subscription) && Notification.permission === "granted");
      if (subscription) fetch("/api/restaurants/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
    }).catch(() => undefined);
  }, []);

  async function enable() {
    setBusy(true);
    try {
      if (await Notification.requestPermission() !== "granted") return;
      const config = await fetch("/api/restaurants/push", { cache: "no-store" }).then((response) => response.json());
      if (!config.publicKey) throw new Error("Notificações ainda não configuradas.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(config.publicKey) });
      const response = await fetch("/api/restaurants/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Não foi possível ativar as notificações.");
      setEnabled(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported || enabled) return null;
  return <button type="button" onClick={enable} disabled={busy} className={mobile ? "pointer-events-auto mb-2 ml-auto flex items-center gap-2 rounded-full bg-[#D7B267] px-4 py-2 text-xs font-black text-[#17130F] shadow-lg" : "flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D7B267] bg-white/5 px-3 py-2.5 text-xs font-bold text-white"}><Bell size={15} />{busy ? "A ativar…" : "Ativar avisos de reservas"}</button>;
}
