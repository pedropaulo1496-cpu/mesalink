"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderingAutoRefresh({
  enabled = true,
  interval = 5000,
}: {
  enabled?: boolean;
  interval?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      router.refresh();
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, router]);

  return null;
}