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

// ---------------------------------------------------------------
// Manual "notify subscribers" button (owner override)
// ---------------------------------------------------------------

/** Shop runs in India (IST, UTC+5:30, no DST) — window + "today" use IST. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
/** Manual sends are only allowed between these IST hours (10 AM – 10 PM). */
const MANUAL_WINDOW_START_HOUR = 10;
const MANUAL_WINDOW_END_HOUR = 22;
/** Max manual discount pushes per IST day (across all live offers). */
export const MANUAL_MAX_PER_DAY = 3;
/** Minimum gap between two manual pushes (so they don't cluster). */
const MANUAL_GAP_MS = 2 * 60 * 60 * 1000;
/** A manual push is pointless if the offer has less than this much time left. */
const MANUAL_MIN_REMAINING_MS = 30 * 60 * 1000;

/** IST wall-clock parts for a UTC instant. */
function istParts(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** UTC instant of the start of the current IST day. */
function istDayStart(date: Date): Date {
  const p = istParts(date);
  return new Date(Date.UTC(p.year, p.month, p.day) - IST_OFFSET_MS);
}

export interface DiscountNotifyState {
  /** Manual pushes already sent this IST day. */
  sentToday: number;
  /** Manual pushes still available this IST day (0–3). */
  remainingToday: number;
  /** True when now is inside the 10 AM – 10 PM IST window. */
  inWindow: boolean;
  /** Next allowed manual-send instant (gap or next-day window), else null. */
  nextAllowedAt: Date | null;
  /** Human label for nextAllowedAt (e.g. "2:10 PM" or "tomorrow 10:00 AM"). */
  nextAllowedLabel: string | null;
  /** True if push is configured & there is quota — button can attempt. */
  canSend: boolean;
}

/**
 * Snapshot of the manual-notification quota for the current IST day, plus the
 * earliest instant a manual push can be sent (respecting the 10 AM–10 PM window
 * and the 2-hour gap). Per-offer "remaining time" is applied separately by the
 * caller because it depends on which offer's button is pressed.
 */
export async function getDiscountNotifyState(now = new Date()): Promise<DiscountNotifyState> {
  const dayStart = istDayStart(now);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const logs = await db.discountNotifyLog.findMany({
    where: { createdAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
    take: MANUAL_MAX_PER_DAY,
  });

  const sentToday = logs.length;
  const remainingToday = Math.max(0, MANUAL_MAX_PER_DAY - sentToday);
  const p = istParts(now);
  const minutesIntoDay = p.hour * 60 + p.minute;
  const inWindow =
    minutesIntoDay >= MANUAL_WINDOW_START_HOUR * 60 &&
    minutesIntoDay < MANUAL_WINDOW_END_HOUR * 60;

  // Earliest allowed instant.
  let nextAllowedAt: Date | null = null;
  if (inWindow && remainingToday > 0) {
    // Respect the 2h gap after the last manual send.
    const last = logs[0];
    if (last) {
      const gapEnd = new Date(last.createdAt.getTime() + MANUAL_GAP_MS);
      if (gapEnd.getTime() > now.getTime()) nextAllowedAt = gapEnd;
    }
  }
  if (!nextAllowedAt) {
    if (inWindow && remainingToday > 0) {
      nextAllowedAt = now; // can send right now
    } else if (remainingToday > 0) {
      // Next day's window opens at 10 AM IST.
      nextAllowedAt = new Date(
        Date.UTC(p.year, p.month, p.day, MANUAL_WINDOW_START_HOUR, 0) - IST_OFFSET_MS
      );
    } else {
      // Quota used up — next IST day window.
      const tomorrow = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      nextAllowedAt = new Date(
        Date.UTC(
          tomorrow.getUTCFullYear(),
          tomorrow.getUTCMonth(),
          tomorrow.getUTCDate(),
          MANUAL_WINDOW_START_HOUR,
          0
        ) - IST_OFFSET_MS
      );
    }
  }

  const canSend = inWindow && remainingToday > 0 && nextAllowedAt.getTime() <= now.getTime();

  return {
    sentToday,
    remainingToday,
    inWindow,
    nextAllowedAt,
    nextAllowedLabel: nextAllowedAt ? formatManualNext(nextAllowedAt, now) : null,
    canSend,
  };
}

function formatManualNext(next: Date, now: Date): string {
  const p = istParts(next);
  const n = istParts(now);
  const sameDay = p.year === n.year && p.month === n.month && p.day === n.day;
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const ampm = p.hour < 12 ? "AM" : "PM";
  const time = `${h12}:${String(p.minute).padStart(2, "0")} ${ampm}`;
  return sameDay ? time : `tomorrow ${time}`;
}

/**
 * How many manual nudges still make sense for THIS offer given how much time it
 * has left. A short same-day sale (e.g. 4 hours) naturally allows fewer than a
 * week-long one. Returns 0 when the offer is over / about to end.
 */
export function remainingManualNudgesForOffer(remainingMs: number): number {
  if (remainingMs < MANUAL_MIN_REMAINING_MS) return 0;
  const slotsFit = Math.floor(remainingMs / MANUAL_GAP_MS);
  return Math.max(1, slotsFit);
}

export interface ManualSendResult {
  ok: boolean;
  error?: string;
  state: DiscountNotifyState;
}

/**
 * Owner-triggered "notify subscribers" for a live offer. Enforces:
 *  - offer is active and currently live, with ≥ 30 min remaining;
 *  - 10 AM – 10 PM IST window;
 *  - ≤ 3 manual sends per IST day (global);
 *  - ≥ 2 h gap since the last manual send;
 *  - the offer's remaining time (short sales allow fewer nudges).
 */
export async function sendManualDiscountNotification(
  discountId: string
): Promise<ManualSendResult> {
  const state = await getDiscountNotifyState();
  const now = new Date();
  const discount = await db.discount.findUnique({
    where: { id: discountId },
    select: { id: true, label: true, percent: true, startsAt: true, endsAt: true, isActive: true },
  });

  if (!discount) return { ok: false, error: "Offer not found.", state };
  if (!discount.isActive) return { ok: false, error: "This offer is paused. Activate it first.", state };
  const remainingMs = discount.endsAt.getTime() - now.getTime();
  if (now.getTime() < discount.startsAt.getTime())
    return { ok: false, error: "This offer hasn't started yet.", state };
  if (remainingMs < 0)
    return { ok: false, error: "This offer has already ended.", state };

  // Per-offer remaining-time adaptation.
  if (remainingManualNudgesForOffer(remainingMs) < 1)
    return { ok: false, error: "Too little time left on this offer to notify.", state };

  if (!state.inWindow)
    return {
      ok: false,
      error: `Notifications can only be sent between 10 AM and 10 PM. Next available ${state.nextAllowedLabel}.`,
      state,
    };
  if (state.remainingToday <= 0)
    return {
      ok: false,
      error: `Daily manual limit reached (${MANUAL_MAX_PER_DAY}/day). Next available ${state.nextAllowedLabel}.`,
      state,
    };
  if (state.nextAllowedAt && state.nextAllowedAt.getTime() > now.getTime())
    return {
      ok: false,
      error: `Please wait before sending again. Next available ${state.nextAllowedLabel}.`,
      state,
    };
  if (!isPushConfigured())
    return { ok: false, error: "Add VAPID keys to enable push notifications.", state };

  // Build a reminder-style message and broadcast it.
  const { shopName, icon } = await shopNotifyAssets();
  const durationMs = discount.endsAt.getTime() - discount.startsAt.getTime();
  const isShort = durationMs <= MULTI_DAY_THRESHOLD_MS;
  const body = isShort
    ? `${discount.label}: ${discount.percent}% off today — tap to grab the deal.`
    : `${discount.label}: ${discount.percent}% off is live — tap to grab the deal.`;

  const summary = await getNotifySummary();
  if (summary.remainingAlerts <= 0)
    return { ok: false, error: "Daily broadcast limit reached. Try again tomorrow.", state };

  await tryAutoBroadcast({
    kind: "ANNOUNCEMENT",
    title: clip(`${shopName} · ${discount.percent}% OFF`, 80),
    body: clip(body, 140),
    url: "/phones?sale=1",
    icon,
  });

  await db.discountNotifyLog.create({ data: { discountId } });

  const updated = await getDiscountNotifyState();
  return { ok: true, state: updated };
}
