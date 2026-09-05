"use server";

import { requireOwner } from "@/server/auth/guards";
import {
  savePushSubscription,
  deletePushSubscription,
  sendStockBroadcast,
} from "@/server/modules/notify";
import type { ActionResult } from "@/types";

export async function subscribePushAction(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<ActionResult<{ id: string }>> {
  try {
    const data = await savePushSubscription(input);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save alerts",
      code: "VALIDATION_ERROR",
    };
  }
}

export async function unsubscribePushAction(
  endpoint: string
): Promise<ActionResult<null>> {
  try {
    await deletePushSubscription(endpoint);
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Could not turn off alerts", code: "INTERNAL" };
  }
}

export async function sendStockBroadcastAction(input: {
  title: string;
  body: string;
}): Promise<ActionResult<{ sentCount: number; subscriberCount: number }>> {
  try {
    await requireOwner();
    const data = await sendStockBroadcast(input);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Send failed",
      code: "VALIDATION_ERROR",
    };
  }
}

