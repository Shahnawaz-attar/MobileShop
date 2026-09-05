import { db } from "@/server/db/client";
import { EventType } from "@prisma/client";
import type { OwnerInsights, ProductInterestRow } from "@/types";
import { buildDailySessionHash } from "./session-hash";

export { buildDailySessionHash };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  if (input.type === "PRODUCT_VIEW" && input.productId) {
    if (!input.sessionHash) {
      return;
    }

    const alreadyViewed = await db.analyticsEvent.findFirst({
      where: {
        type: "PRODUCT_VIEW",
        productId: input.productId,
        sessionHash: input.sessionHash,
      },
      select: { id: true },
    });

    if (alreadyViewed) {
      return;
    }

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

function countByType(
  rows: { type: EventType; _count: { _all: number } }[],
  type: EventType
): number {
  return rows.find((row) => row.type === type)?._count._all ?? 0;
}

/**
 * Weekly owner insights: totals + per-product views / WhatsApp taps.
 * Used by /admin/analytics. Does not expose session hashes or raw events.
 */
export async function getOwnerInsights(): Promise<OwnerInsights> {
  const weekStartsAt = new Date(Date.now() - WEEK_MS);

  const [totalsByType, interestByProduct] = await Promise.all([
    db.analyticsEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: weekStartsAt } },
      _count: { _all: true },
    }),
    db.analyticsEvent.groupBy({
      by: ["productId", "type"],
      where: {
        createdAt: { gte: weekStartsAt },
        productId: { not: null },
        type: { in: ["PRODUCT_VIEW", "WHATSAPP_CLICK"] },
      },
      _count: { _all: true },
    }),
  ]);

  const interestMap = new Map<string, { viewCount: number; whatsappClicks: number }>();
  for (const row of interestByProduct) {
    if (!row.productId) continue;
    const current = interestMap.get(row.productId) ?? { viewCount: 0, whatsappClicks: 0 };
    if (row.type === "PRODUCT_VIEW") current.viewCount = row._count._all;
    if (row.type === "WHATSAPP_CLICK") current.whatsappClicks = row._count._all;
    interestMap.set(row.productId, current);
  }

  const productIds = [...interestMap.keys()];
  const titles =
    productIds.length === 0
      ? []
      : await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true },
        });
  const titleById = new Map(titles.map((p) => [p.id, p.title]));

  const products: ProductInterestRow[] = productIds
    .map((productId) => {
      const counts = interestMap.get(productId);
      if (!counts) return null;
      const title = titleById.get(productId);
      if (!title) return null;
      return {
        productId,
        title,
        viewCount: counts.viewCount,
        whatsappClicks: counts.whatsappClicks,
      };
    })
    .filter((row): row is ProductInterestRow => row !== null)
    .sort((a, b) => b.whatsappClicks - a.whatsappClicks || b.viewCount - a.viewCount);

  return {
    weekStartsAt,
    totals: {
      productViews: countByType(totalsByType, "PRODUCT_VIEW"),
      whatsappClicks: countByType(totalsByType, "WHATSAPP_CLICK"),
      callClicks: countByType(totalsByType, "CALL_CLICK"),
      searches: countByType(totalsByType, "SEARCH"),
      directionsClicks: countByType(totalsByType, "DIRECTIONS_CLICK"),
      shareClicks: countByType(totalsByType, "SHARE_CLICK"),
      qrScans: countByType(totalsByType, "QR_SCAN"),
    },
    products,
  };
}
