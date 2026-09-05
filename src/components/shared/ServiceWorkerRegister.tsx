"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA installability and offline support.
 * Only registers in production to avoid stale SW during development.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.warn("Service worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
