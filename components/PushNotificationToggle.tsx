"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function PushNotificationToggle({ apiPath, storageKey, title = "Notificações", description = "Recebe avisos importantes desta aplicação." }: { apiPath: string; storageKey: string; title?: string; description?: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    queueMicrotask(() => setSupported(available));
    if (!available) return;
    queueMicrotask(() => setPermission(Notification.permission));
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => {
      const disabled = localStorage.getItem(storageKey) === "disabled";
      setEnabled(Boolean(subscription) && Notification.permission === "granted" && !disabled);
      if (subscription && !disabled) fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
    }).catch(() => undefined);
  }, [apiPath, storageKey]);

  async function enable() {
    setBusy(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") return;
      const config = await fetch(apiPath, { cache: "no-store" }).then((response) => response.json());
      if (!config.publicKey) throw new Error("Notificações ainda não configuradas.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(config.publicKey) });
      const response = await fetch(apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Não foi possível ativar as notificações.");
      localStorage.removeItem(storageKey);
      setEnabled(true);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const subscription = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      await fetch(apiPath, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription?.endpoint }) });
      localStorage.setItem(storageKey, "disabled");
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  return <section className="flex flex-col gap-4 rounded-[26px] border border-[#E1D0B8] bg-white p-5 text-[#17130F] shadow-[0_12px_34px_rgba(75,52,29,0.04)] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-[#E2F1E5] text-[#3D7045]" : "bg-[#F5ECDE] text-[#9B6F3B]"}`}>{enabled ? <BellRing size={20} /> : permission === "denied" ? <BellOff size={20} /> : <Bell size={20} />}</span><div><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-[#6B6258]">{!supported ? "Este dispositivo não suporta notificações." : enabled ? "Ativas neste dispositivo." : permission === "denied" ? "Bloqueadas nas definições do dispositivo." : description}</p></div></div>{supported && permission !== "denied" && <button type="button" onClick={enabled ? disable : enable} disabled={busy} className={`rounded-2xl px-5 py-3 text-sm font-black disabled:opacity-50 ${enabled ? "border border-[#DCC9AA] bg-[#FFF9F0] text-[#765B39]" : "bg-[#17130F] text-white"}`}>{busy ? "A guardar…" : enabled ? "Desativar" : "Ativar"}</button>}</section>;
}
