import { NextResponse } from "next/server";
import { runDiscountReminderCheck } from "@/server/modules/notify";

/**
 * Vercel Cron endpoint — fires the discount reminder scheduler.
 *
 * Vercel's Hobby cron does NOT attach an Authorization header, so this route is
 * intentionally open. It is safe to expose because the reconciliation is fully
 * idempotent (per-discount tracking prevents double-sends) and it respects the
 * shop's 50/day alert cap, so even a malicious caller can only trigger what a
 * normal day would allow.
 *
 * Schedule is defined in vercel.json (runs daily at 09:00 UTC).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runDiscountReminderCheck();
  return NextResponse.json({ ok: true, ...result });
}
