"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/track-event";

/**
 * Counts a shop QR landing once per browser tab when utm_source=qr is present.
 */
export function QrScanTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("utm_source") !== "qr") return;
    tracked.current = true;
    trackEvent({ type: "QR_SCAN" });
  }, []);

  return null;
}
