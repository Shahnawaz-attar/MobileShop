"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Registers the service worker for PWA installability and offline support.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.warn("Service worker registration failed:", error);
      });

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; title?: string; body?: string } | undefined;
      if (data?.type !== "STOCK_PUSH" || !data.title) return;
      toast(data.title, {
        description: data.body,
        duration: 2000,
        position: "top-center",
      });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  return null;
}
