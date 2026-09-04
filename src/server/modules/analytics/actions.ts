"use server";

import { recordEvent } from "./index";
import { EventType } from "@prisma/client";

/**
 * Server Action to securely track analytics events from the client.
 * This is fire-and-forget; it returns nothing on purpose.
 */
export async function trackEventAction(input: {
  type: EventType;
  productId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    // We don't have sessionHash logic yet, could add it later using headers/cookies
    await recordEvent(input);
  } catch (error) {
    // Silently fail for analytics to not disrupt user experience
    console.error("Failed to track event:", error);
  }
}
