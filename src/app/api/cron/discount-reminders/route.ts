import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDiscountReminderCheck } from "@/server/modules/notify";

/**
 * Vercel Cron endpoint — fires the discount reminder scheduler.
 *
 * Vercel sends an `Authorization: Bearer <CRON_SECRET>` header when the cron is
 * configured with `CRON_SECRET` in vercel.json. We also accept the same secret
 * as a query param so the endpoint can be triggered by any external uptime
 * service / scheduled request on non-Vercel hosts. Returns 401 otherwise.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const querySecret = request.nextUrl.searchParams.get("secret") ?? "";
  const expected = env.CRON_SECRET;

  // When a CRON_SECRET is configured, require it. If none is set (e.g. local
  // dev), allow the call so the owner can smoke-test the scheduler.
  if (expected) {
    const authorized = bearer === expected || querySecret === expected;
    if (!authorized) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runDiscountReminderCheck();
  return NextResponse.json({ ok: true, ...result });
}
