import { db } from "@/server/db/client";
import { z } from "zod";
import webpush from "web-push";
import { env } from "@/lib/env";
import { RATE_LIMITS } from "@/lib/constants";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(8),
  }),
});

const broadcastSchema = z.object({
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(3).max(140),
  url: z.string().startsWith("/").max(200).optional(),
});

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Push is not configured");
  }
  const subject =
    env.VAPID_SUBJECT && (env.VAPID_SUBJECT.startsWith("mailto:") || env.VAPID_SUBJECT.startsWith("https:"))
      ? env.VAPID_SUBJECT
      : env.NEXT_PUBLIC_APP_URL.startsWith("https:")
        ? env.NEXT_PUBLIC_APP_URL
        : "mailto:alerts@localhost";
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function savePushSubscription(input: z.infer<typeof subscribeSchema>) {
  const parsed = subscribeSchema.parse(input);
  return db.pushSubscription.upsert({
    where: { endpoint: parsed.endpoint },
    create: {
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
    },
    update: {
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
    },
    select: { id: true },
  });
}

export async function deletePushSubscription(endpoint: string) {
  await db.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function getNotifySummary() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [subscriberCount, alertsLast24h, productsLast24h, recent] = await Promise.all([
    db.pushSubscription.count(),
    db.pushBroadcast.count({
      where: { createdAt: { gte: dayAgo }, kind: { in: ["MANUAL", "ANNOUNCEMENT"] } },
    }),
    db.pushBroadcast.count({
      where: { createdAt: { gte: dayAgo }, kind: "PRODUCT" },
    }),
    db.pushBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, title: true, body: true, sentCount: true, createdAt: true, kind: true },
    }),
  ]);

  const remainingAlerts = Math.max(0, RATE_LIMITS.PUSH_ALERTS_PER_DAY - alertsLast24h);
  const remainingProductPings = Math.max(
    0,
    RATE_LIMITS.PUSH_PRODUCT_LISTED_PER_DAY - productsLast24h
  );

  return {
    configured: isPushConfigured(),
    subscriberCount,
    alertsLast24h,
    productsLast24h,
    remainingAlerts,
    remainingProductPings,
    remainingToday: remainingAlerts,
    sentLast24h: alertsLast24h + productsLast24h,
    recent,
  };
}

type BroadcastKind = "MANUAL" | "PRODUCT" | "ANNOUNCEMENT";

async function deliverBroadcast(
  parsed: z.infer<typeof broadcastSchema>,
  kind: BroadcastKind
) {
  configureWebPush();
  const subs = await db.pushSubscription.findMany();
  const payload = JSON.stringify({
    title: parsed.title,
    body: parsed.body,
    url: parsed.url ?? "/phones",
  });

  let sentCount = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      sentCount += 1;
    } catch (error) {
      const status =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode: number }).statusCode)
          : 0;
      if (status === 404 || status === 410) {
        await db.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }

  await db.pushBroadcast.create({
    data: { kind, title: parsed.title, body: parsed.body, sentCount },
  });

  return { sentCount, subscriberCount: subs.length };
}

export async function sendStockBroadcast(input: z.infer<typeof broadcastSchema>) {
  if (!isPushConfigured()) {
    throw new Error("Add VAPID keys to enable alerts");
  }

  const parsed = broadcastSchema.parse(input);
  const summary = await getNotifySummary();
  if (summary.remainingAlerts <= 0) {
    throw new Error("You can send 50 shop alerts per day. Try tomorrow.");
  }

  return deliverBroadcast(parsed, "MANUAL");
}

async function tryAutoBroadcast(
  input: z.infer<typeof broadcastSchema> & { kind: "PRODUCT" | "ANNOUNCEMENT" }
) {
  if (!isPushConfigured()) return;
  const summary = await getNotifySummary();
  if (input.kind === "PRODUCT" && summary.remainingProductPings <= 0) return;
  if (input.kind === "ANNOUNCEMENT" && summary.remainingAlerts <= 0) return;
  try {
    await deliverBroadcast(
      { title: input.title, body: input.body, url: input.url },
      input.kind
    );
  } catch (error) {
    console.error("tryAutoBroadcast", error);
  }
}

function clip(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export async function notifyProductListed(input: { title: string; slug: string }) {
  const shop = await db.shop.findFirst({ select: { name: true }, orderBy: { createdAt: "asc" } });
  const shopName = shop?.name ?? "Shop";
  await tryAutoBroadcast({
    kind: "PRODUCT",
    title: clip(`${shopName}: new stock`, 80),
    body: clip(`${input.title} is live. Open to see photos and price.`, 140),
    url: `/phones/${input.slug}`,
  });
}

export async function notifyAnnouncementLive(input: { title: string }) {
  const shop = await db.shop.findFirst({ select: { name: true }, orderBy: { createdAt: "asc" } });
  const shopName = shop?.name ?? "Shop";
  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title: clip(`${shopName}: shop update`, 80),
    body: clip(input.title, 140),
    url: "/",
  });
}
