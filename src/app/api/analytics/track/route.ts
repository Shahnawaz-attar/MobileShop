import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackClientEvent } from "@/server/modules/analytics/track-client-event";
import { consumeRateLimit } from "@/lib/rate-limit";
import { RATE_LIMITS } from "@/lib/constants";

const trackSchema = z.object({
  type: z.enum([
    "PRODUCT_VIEW",
    "WHATSAPP_CLICK",
    "SHARE_CLICK",
    "QR_SCAN",
  ]),
  productId: z.string().cuid().optional(),
  visitorId: z.string().min(8).max(64).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Throttle public event volume per IP so the endpoint can't be hammered
    // into inflating metrics or flooding the AnalyticsEvent table.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const overLimit = consumeRateLimit(
      `analytics:${ip}`,
      RATE_LIMITS.ANALYTICS_EVENTS_PER_MINUTE,
      60 * 1000
    );
    if (overLimit) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const parsed = trackSchema.parse(await request.json());
    await trackClientEvent(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics track failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
