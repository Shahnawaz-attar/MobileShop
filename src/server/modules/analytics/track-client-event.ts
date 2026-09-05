import { EventType } from "@prisma/client";
import { auth } from "@/server/auth";
import { recordEvent } from "./index";
import { buildDailySessionHash } from "./session-hash";

export async function trackClientEvent(input: {
  type: EventType;
  productId?: string;
  meta?: Record<string, unknown>;
  visitorId?: string;
}) {
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
}
