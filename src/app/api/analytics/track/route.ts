import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { trackClientEvent } from "@/server/modules/analytics/track-client-event";

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
    const parsed = trackSchema.parse(await request.json());
    await trackClientEvent(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics track failed:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
