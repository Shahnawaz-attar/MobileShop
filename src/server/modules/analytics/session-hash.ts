import { createHash } from "node:crypto";
import { env } from "@/lib/env";

/** Daily salted hash — one view per visitor per product per day (spec §23). */
export function buildDailySessionHash(visitorId: string): string {
  const salt = env.ANALYTICS_SALT ?? env.AUTH_SECRET;
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}:${day}:${visitorId}`).digest("hex");
}
