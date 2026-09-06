"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { BellRing, BellOff } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/server/modules/notify/actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function StockAlertSubscribe({ vapidPublicKey }: { vapidPublicKey: string | undefined }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"off" | "on" | "unsupported">("off");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !vapidPublicKey) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, [vapidPublicKey]);

  const isProductDetails = pathname?.startsWith("/phones/") && pathname.length > 8;
  if (isProductDetails) {
    return null;
  }

  if (status === "unsupported" && !vapidPublicKey) {
    return null;
  }

  async function enable() {
    setMessage(null);
    if (!vapidPublicKey) {
      setMessage("Alerts are not set up on this shop yet.");
      return;
    }
    if (Notification.permission === "denied") {
      setMessage("Notifications are blocked in the browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Allow notifications to get new stock alerts.");
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      setMessage("Could not subscribe.");
      return;
    }
    const endpoint = json.endpoint;
    const p256dh = json.keys.p256dh;
    const auth = json.keys.auth;
    startTransition(async () => {
      const result = await subscribePushAction({
        endpoint,
        keys: { p256dh, auth },
      });
      if (result.success) {
        setStatus("on");
      } else {
        setMessage(result.error);
      }
    });
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await unsubscribePushAction(sub.endpoint);
      await sub.unsubscribe();
    }
    setStatus("off");
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 flex max-w-[220px] flex-col items-end gap-2 lg:bottom-24">
      <button
        type="button"
        disabled={isPending}
        onClick={() => void (status === "on" ? disable() : enable())}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-4 text-xs font-bold text-white shadow-xl"
      >
        {status === "on" ? (
          <>
            <BellOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            Alerts on
          </>
        ) : (
          <>
            <BellRing className="h-4 w-4 shrink-0" aria-hidden="true" />
            Notify me — new stock
          </>
        )}
      </button>
      {message && <p className="rounded-lg bg-white px-2 py-1 text-[11px] text-slate-600 shadow">{message}</p>}
    </div>
  );
}
