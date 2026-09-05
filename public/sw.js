/* MobileShop Service Worker — PWA foundation.
 *
 * Caching strategy per spec (Section 16):
 * - App shell / static assets → cache-first
 * - Images → cache-first
 * - Catalogue lists → network-first (fall back to cache)
 * - Product details → network-only
 * - Admin → NEVER cache
 */

const CACHE_NAME = "mobileshop-v8";
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/maskable-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests to same origin
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // NEVER cache admin routes
  if (url.pathname.startsWith("/admin")) {
    return;
  }

  // Product details — network-only (stale sold/price must not linger)
  if (url.pathname.startsWith("/phones/") && url.pathname !== "/phones/") {
    return;
  }

  // API/auth routes — network only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Next.js chunks — network-first (cache-first caused stale module errors after deploy/dev)
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Icons / manifest / offline shell — cache-first
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline.html"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Navigation requests (catalogue lists) — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Images — cache-first
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});

self.addEventListener("push", (event) => {
  let title = "New stock";
  let body = "Fresh listings are live.";
  let url = "/phones";
  let icon = "/icons/notify-192.png";
  let image;
  try {
    const data = event.data ? event.data.json() : {};
    if (typeof data.title === "string") title = data.title;
    if (typeof data.body === "string") body = data.body;
    if (typeof data.url === "string") url = data.url;
    if (typeof data.icon === "string") icon = data.icon;
    if (typeof data.image === "string") image = data.image;
  } catch {
    if (event.data) body = event.data.text();
  }

  /** Distinct ~2s pulse (Android). iOS ignores vibrate. */
  const vibrate = [280, 90, 280, 90, 450, 110, 700];

  const options = {
    body,
    icon,
    badge: "/icons/notify-badge.png",
    vibrate,
    tag: "mobileshop-stock",
    renotify: true,
    silent: false,
    requireInteraction: false,
    data: { url },
    actions: [{ action: "open", title: "Open listing" }],
  };
  if (image) options.image = image;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "STOCK_PUSH", title, body, url });
        }
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/phones", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && "navigate" in client) {
          try {
            await client.navigate(targetUrl);
            return client.focus();
          } catch {
            break;
          }
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
