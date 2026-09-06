import { db } from "@/server/db/client";
import { z } from "zod";
import webpush from "web-push";
import { format } from "date-fns";
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
  icon: z.string().url().optional(),
  image: z.string().url().optional(),
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
    icon: parsed.icon,
    image: parsed.image,
  });

  let sentCount = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        { TTL: 60, urgency: "high" }
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

  const { icon } = await shopNotifyAssets();
  return deliverBroadcast({ ...parsed, icon: parsed.icon ?? icon }, "MANUAL");
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
      { title: input.title, body: input.body, url: input.url, icon: input.icon, image: input.image },
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

function bitmapUrl(url: string | null | undefined): string | undefined {
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  if (/\.svg(\?|$)/i.test(url)) return undefined;
  return url;
}

async function shopNotifyAssets() {
  const shop = await db.shop.findFirst({
    select: { name: true, logoUrl: true },
    orderBy: { createdAt: "asc" },
  });
  return {
    shopName: shop?.name ?? "Shop",
    icon: bitmapUrl(shop?.logoUrl),
  };
}

export async function notifyProductListed(input: { title: string; slug: string }) {
  const [{ shopName, icon }, media] = await Promise.all([
    shopNotifyAssets(),
    db.media.findFirst({
      where: { product: { slug: input.slug } },
      orderBy: { sortOrder: "asc" },
      select: { url: true },
    }),
  ]);
  await tryAutoBroadcast({
    kind: "PRODUCT",
    title: clip(`New at ${shopName}`, 80),
    body: clip(`${input.title} just went live — tap to see photos & price`, 140),
    url: `/phones/${input.slug}`,
    icon,
    image: bitmapUrl(media?.url),
  });
}

export async function notifyAnnouncementLive(input: { title: string }) {
  const { shopName, icon } = await shopNotifyAssets();
  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title: clip(`${shopName}`, 80),
    body: clip(input.title, 140),
    url: "/",
    icon,
  });
}

/**
 * Broadcast a "stay tuned" teaser when a discount is announced for the future
 * (not yet live), e.g. "10% off launches tomorrow at 10:00 AM — stay tuned!".
 * Fires once at scheduling time (create), respects the daily alert cap.
 */
export async function notifyDiscountUpcoming(input: {
  label: string;
  percent: number;
  startsAt: Date;
  url: string;
}) {
  const { shopName, icon } = await shopNotifyAssets();
  const summary = await getNotifySummary();
  if (summary.remainingAlerts <= 0) return;

  const now = new Date();
  const startsAt = input.startsAt;
  const sameDay =
    startsAt.getFullYear() === now.getFullYear() &&
    startsAt.getMonth() === now.getMonth() &&
    startsAt.getDate() === now.getDate();
  const startLabel = sameDay
    ? `today at ${format(startsAt, "h:mm a")}`
    : `tomorrow at ${format(startsAt, "h:mm a")}`;

  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title: clip(`${shopName} · ${input.percent}% OFF coming`, 80),
    body: clip(`${input.label}: ${input.percent}% off starts ${startLabel}. Stay tuned!`, 140),
    url: input.url,
    icon,
  });
}

/**
 * Broadcast a push alert when a timed discount offer goes live (e.g. "Diwali
 * Sale: 20% off Apple"). Only fires if the offer is currently within its date
 * window and the shop still has daily alert quota. Fires once per discount.
 */
export async function notifyDiscountLive(input: { label: string; percent: number; url: string }) {
  const { shopName, icon } = await shopNotifyAssets();
  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title: clip(`${shopName} · ${input.percent}% OFF`, 80),
    body: clip(`${input.label} is live now — tap to grab the deal`, 140),
    url: input.url,
    icon,
  });
}

// ---------------------------------------------------------------
// Discount reminder scheduler (auto push while an offer is live)
// ---------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
/** A sale longer than this is treated as "multi-day" (1 reminder per day). */
const MULTI_DAY_THRESHOLD_MS = DAY_MS;
/** Short (≤ 1 day) sales get at most this many reminders total. */
const SHORT_SALE_MAX_REMINDERS = 2;
/** For short sales, send the final reminder once less than this remains. */
const SHORT_END_WINDOW_MS = 3 * 60 * 60 * 1000;

interface LiveDiscountRow {
  id: string;
  label: string;
  percent: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  lastReminderDate: Date | null;
  remindersSent: number;
}

/**
 * Decide whether an auto reminder is due for a live discount right now.
 * Deduplicated so repeated runs never double-blast the same subscribers.
 */
function reminderDue(d: LiveDiscountRow, now: Date): boolean {
  const durationMs = d.endsAt.getTime() - d.startsAt.getTime();
  const isShort = durationMs <= MULTI_DAY_THRESHOLD_MS;

  if (!isShort) {
    // Multi-day: at most one per calendar day. Compare UTC date keys.
    const todayKey = now.toISOString().slice(0, 10);
    const lastKey = d.lastReminderDate ? d.lastReminderDate.toISOString().slice(0, 10) : null;
    return lastKey !== todayKey;
  }

  // Short (≤ 1 day): up to 2 total.
  if (d.remindersSent >= SHORT_SALE_MAX_REMINDERS) return false;
  if (d.remindersSent === 0) {
    // First reminder once the offer is live (a little grace so the broadcast
    // still lands inside the window even if created a moment early).
    return now.getTime() >= d.startsAt.getTime();
  }
  // Second reminder near the end.
  return now.getTime() >= d.endsAt.getTime() - SHORT_END_WINDOW_MS;
}

/**
 * Build the human reminder message. Distinguishes the "just went live" opener
 * from the "ending soon" closer so subscribers aren't spammed with the same text.
 */
function reminderCopy(
  d: LiveDiscountRow,
  isShort: boolean,
  shopName: string
): { title: string; body: string } {
  const percent = d.percent;
  const opener = isShort && d.remindersSent === 0
    ? `${d.label}: ${percent}% off — only today!`
    : isShort
      ? `${d.label}: ${percent}% off ends soon!`
      : `${d.label}: ${percent}% off today`;
  const closer = isShort && d.remindersSent >= 1 ? " Last chance — tap before it ends." : " Tap to grab the deal.";
  return {
    title: clip(`${shopName} · ${percent}% OFF`, 80),
    body: clip(opener + closer, 140),
  };
}

async function sendDiscountReminder(d: LiveDiscountRow, now: Date) {
  const { shopName, icon } = await shopNotifyAssets();
  const durationMs = d.endsAt.getTime() - d.startsAt.getTime();
  const isShort = durationMs <= MULTI_DAY_THRESHOLD_MS;
  const { title, body } = reminderCopy(d, isShort, shopName);

  const summary = await getNotifySummary();
  if (summary.remainingAlerts <= 0) return false; // daily cap reached — stop for the run

  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title,
    body,
    url: "/phones?sale=1",
    icon,
  });

  // Persist tracking so we never re-send this slot.
  await db.discount.update({
    where: { id: d.id },
    data: {
      lastReminderDate: isShort ? null : startOfUtcDay(now),
      remindersSent: isShort ? d.remindersSent + 1 : d.remindersSent,
    },
  });
  return true;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Reconciliation pass: walk every currently-live discount and push any reminder
 * that is due (multi-day → 1/day; short → up to 2 total). Safe to run more than
 * once a day — tracking fields make it idempotent. Returns how many reminders
 * were actually sent. Stops early once the shop's daily alert cap is exhausted.
 */
export async function runDiscountReminderCheck(): Promise<{ sent: number; checked: number }> {
  if (!isPushConfigured()) return { sent: 0, checked: 0 };

  const now = new Date();
  const live = await db.discount.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    select: {
      id: true,
      label: true,
      percent: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      lastReminderDate: true,
      remindersSent: true,
    },
  });

  let sent = 0;
  for (const d of live) {
    if (!reminderDue(d, now)) continue;
    const ok = await sendDiscountReminder(d, now);
    if (ok) sent += 1;
    else break; // daily cap exhausted
  }
  return { sent, checked: live.length };
}
