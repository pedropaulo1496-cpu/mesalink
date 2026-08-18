"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export default function RestaurantPushNotifications({ variant = "first-run" }: { variant?: "first-run" | "settings" }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    queueMicrotask(() => setSupported(available));
    if (!available) return;
    queueMicrotask(() => setPermission(Notification.permission));
    navigator.serviceWorker.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => {
      setEnabled(Boolean(subscription) && Notification.permission === "granted");
      if (subscription) fetch("/api/restaurants/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (variant === "first-run" && !subscription && Notification.permission === "default" && !localStorage.getItem("mesalink:notifications-prompted")) setShowPrompt(true);
    }).catch(() => undefined);
  }, [variant]);

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
      setPermission("granted");
      setShowPrompt(false);
      localStorage.setItem("mesalink:notifications-prompted", "1");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível ativar as notificações.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setShowPrompt(false);
    localStorage.setItem("mesalink:notifications-prompted", "1");
  }

  if (variant === "settings") {
    return <section className="mt-6 flex flex-col gap-4 rounded-[28px] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)] sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-[#E2F1E5] text-[#3D7045]" : "bg-[#F5ECDE] text-[#9B6F3B]"}`}>{enabled ? <BellRing size={20} /> : <Bell size={20} />}</span><div><h2 className="font-black">Avisos de novas reservas</h2><p className="mt-1 text-sm text-[#6B6258]">{!supported ? "Este dispositivo não suporta notificações." : enabled ? "Ativos neste dispositivo." : permission === "denied" ? "Bloqueados nas definições do dispositivo." : "Recebe um aviso quando entra uma reserva."}</p></div></div>{supported && !enabled && permission !== "denied" && <button type="button" onClick={enable} disabled={busy} className="rounded-2xl bg-[#17130F] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "A ativar…" : "Ativar"}</button>}</section>;
  }

  if (!supported || enabled || !showPrompt) return null;
  return <div className="pointer-events-auto fixed inset-0 z-[100] grid place-items-end bg-black/40 p-4 backdrop-blur-sm sm:place-items-center"><section className="relative w-full max-w-md rounded-[30px] border border-[#E1D0B8] bg-[#FFF9F0] p-6 text-[#17130F] shadow-2xl"><button type="button" onClick={dismiss} aria-label="Agora não" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-[#F1E5D5] text-[#6B6258]"><X size={17} /></button><span className="grid h-14 w-14 place-items-center rounded-[20px] bg-[#17130F] text-[#D7B267]"><BellRing size={25} /></span><h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">Queres receber avisos de novas reservas?</h2><p className="mt-2 text-sm leading-6 text-[#6B6258]">A MesaLink avisa-te assim que entrar uma reserva, mesmo quando não estás com a app aberta.</p><div className="mt-6 grid grid-cols-2 gap-2"><button type="button" onClick={dismiss} className="rounded-2xl border border-[#DCC9AA] px-4 py-3 text-sm font-bold">Agora não</button><button type="button" onClick={enable} disabled={busy} className="rounded-2xl bg-[#17130F] px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "A ativar…" : "Ativar"}</button></div></section></div>;
}
