import { db } from "@/server/db/client";
import { EventType } from "@prisma/client";

/**
 * Record an analytics event (e.g. PRODUCT_VIEW, WHATSAPP_CLICK)
 * and optionally increment the viewCount on the Product.
 */
export async function recordEvent(input: {
  type: EventType;
  productId?: string;
  meta?: Record<string, unknown>;
  sessionHash?: string;
}) {
  // We wrap this in a transaction if we need to update viewCount
  // Alternatively, just fire and forget if we don't want to block
  
  if (input.type === "PRODUCT_VIEW" && input.productId) {
    await db.$transaction([
      db.analyticsEvent.create({
        data: {
          type: input.type,
          productId: input.productId,
          meta: input.meta ? JSON.stringify(input.meta) : undefined,
          sessionHash: input.sessionHash,
        },
      }),
      db.product.update({
        where: { id: input.productId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  } else {
    await db.analyticsEvent.create({
      data: {
        type: input.type,
        productId: input.productId,
        meta: input.meta ? JSON.stringify(input.meta) : undefined,
        sessionHash: input.sessionHash,
      },
    });
  }
}
