"use server";

import { EventType } from "@prisma/client";
import { auth } from "@/server/auth";
import { buildDailySessionHash, recordEvent } from "./index";

/**
 * Server Action to securely track analytics events from the client.
 * This is fire-and-forget; it returns nothing on purpose.
 */
export async function trackEventAction(input: {
  type: EventType;
  productId?: string;
  meta?: Record<string, unknown>;
  /** Browser-local visitor id — hashed server-side, never stored raw. */
  visitorId?: string;
}) {
  try {
    if (input.type === "PRODUCT_VIEW") {
      const session = await auth();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (role === "OWNER") {
        return;
      }
    }

    const sessionHash =
      input.visitorId && input.visitorId.length >= 8
        ? buildDailySessionHash(input.visitorId)
        : undefined;

    await recordEvent({
      type: input.type,
      productId: input.productId,
      meta: input.meta,
      sessionHash,
    });
  } catch (error) {
    // Silently fail for analytics to not disrupt user experience
    console.error("Failed to track event:", error);
  }
}
