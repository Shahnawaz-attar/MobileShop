/** Client-safe analytics — POST to API route (never import server modules in client). */

export type ClientTrackEventType =
  | "PRODUCT_VIEW"
  | "WHATSAPP_CLICK"
  | "SHARE_CLICK"
  | "QR_SCAN";

export interface TrackEventInput {
  type: ClientTrackEventType;
  productId?: string;
  visitorId?: string;
}

/** Fire-and-forget — safe to call from click handlers and useEffect. */
export function trackEvent(input: TrackEventInput): void {
  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => {
    /* analytics must never break UX */
  });
}
