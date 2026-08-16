"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "mesalink_visitor_id";
const SESSION_KEY = "mesalink_session_id";
const SESSION_TOUCH_KEY = "mesalink_session_touch";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const privatePrefixes = [
  "/api",
  "/admin",
  "/backoffice",
  "/billing",
  "/dashboard",
  "/hq",
  "/onboarding",
  "/restaurants",
  "/partners/app",
  "/__qa",
  "/design-preview",
  "/dev-card-preview",
  "/partner-design-preview",
  "/qa-",
  "/revenue-activity-preview",
];

function randomId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function shouldTrack(pathname: string) {
  return !privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix.endsWith("-") && pathname.startsWith(prefix)));
}

function getIdentity() {
  let visitorId = "";
  let isNewVisitor = false;
  try {
    visitorId = localStorage.getItem(VISITOR_KEY) || "";
    if (!visitorId) {
      visitorId = randomId();
      localStorage.setItem(VISITOR_KEY, visitorId);
      isNewVisitor = true;
    }
  } catch {
    visitorId = randomId();
    isNewVisitor = true;
  }

  let sessionId = "";
  try {
    const lastTouch = Number(sessionStorage.getItem(SESSION_TOUCH_KEY) || 0);
    sessionId = sessionStorage.getItem(SESSION_KEY) || "";
    if (!sessionId || Date.now() - lastTouch > SESSION_TIMEOUT_MS) {
      sessionId = randomId();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    sessionStorage.setItem(SESSION_TOUCH_KEY, String(Date.now()));
  } catch {
    sessionId = randomId();
  }

  return { visitorId, sessionId, isNewVisitor };
}

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname) || navigator.doNotTrack === "1") return;

    const timer = window.setTimeout(() => {
      const identity = getIdentity();
      const query = new URLSearchParams(window.location.search);
      const payload = JSON.stringify({
        eventKey: randomId(),
        ...identity,
        path: pathname,
        title: document.title,
        referrer: document.referrer || null,
        source: query.get("utm_source"),
        medium: query.get("utm_medium"),
        campaign: query.get("utm_campaign"),
        language: navigator.language || null,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/analytics/pageview", new Blob([payload], { type: "application/json" }));
        return;
      }
      fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
