"use server";

import { requireOwner } from "@/server/auth/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  setDiscountActive,
} from "@/server/modules/discounts";
import { runDiscountReminderCheck, notifyDiscountUpcoming, sendManualDiscountNotification, getDiscountNotifyState, type DiscountNotifyState } from "@/server/modules/notify";

const DiscountFormSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(60, "Label too long"),
    percent: z.coerce.number().int().min(1, "Percent must be at least 1").max(90, "Percent cannot exceed 90"),
    brandIds: z.array(z.string()).default([]),
    productIds: z.array(z.string()).default([]),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.endsAt > d.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  })
  .refine((d) => d.brandIds.length > 0 || d.productIds.length > 0, {
    message: "Choose at least one brand or one product",
    path: ["brandIds"],
  })
  .refine((d) => !(d.brandIds.length > 0 && d.productIds.length > 0), {
    message: "Apply to either brands OR products, not both",
    path: ["brandIds"],
  });

type DiscountFormInput = z.infer<typeof DiscountFormSchema>;

function revalidateAll() {
  revalidatePath("/admin/discounts");
  revalidatePath("/", "layout");
  revalidatePath("/phones");
}

/** True if the offer is active AND currently inside its start/end window. */
function isNowLive(startsAt: Date, endsAt: Date, isActive: boolean): boolean {
  if (!isActive) return false;
  const now = Date.now();
  return now >= startsAt.getTime() && now <= endsAt.getTime();
}

/** True if the offer is active AND scheduled to start in the future. */
function isUpcoming(startsAt: Date, isActive: boolean): boolean {
  if (!isActive) return false;
  return startsAt.getTime() > Date.now();
}

/**
 * Best-effort push when a discount is scheduled/announced:
 *  - If it starts in the future → send a "coming soon / stay tuned" teaser.
 *  - If it is live right now → run the reminder reconciliation immediately so
 *    a "goes live today" offer notifies between daily cron runs.
 */
async function notifyAnnounced(params: {
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  label: string;
  percent: number;
}) {
  if (!params.isActive) return;
  if (isUpcoming(params.startsAt, params.isActive)) {
    try {
      await notifyDiscountUpcoming({
        label: params.label,
        percent: params.percent,
        startsAt: params.startsAt,
        url: "/phones",
      });
    } catch {
      // best-effort
    }
    return;
  }
  if (isNowLive(params.startsAt, params.endsAt, params.isActive)) {
    try {
      await runDiscountReminderCheck();
    } catch {
      // best-effort
    }
  }
}

export async function createDiscountAction(
  input: DiscountFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = DiscountFormSchema.parse(input);
    const discount = await createDiscount({
      label: parsed.label,
      percent: parsed.percent,
      brandIds: parsed.brandIds,
      productIds: parsed.productIds,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      isActive: parsed.isActive ?? true,
    });
    revalidateAll();
    await notifyAnnounced({
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      isActive: parsed.isActive ?? true,
      label: parsed.label,
      percent: parsed.percent,
    });
    return { success: true, data: { id: discount.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }
    console.error("createDiscountAction error:", error);
    return { success: false, error: "Could not create discount", code: "INTERNAL" };
  }
}

export async function updateDiscountAction(
  id: string,
  input: DiscountFormInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = DiscountFormSchema.parse(input);
    await updateDiscount(id, {
      label: parsed.label,
      percent: parsed.percent,
      brandIds: parsed.brandIds,
      productIds: parsed.productIds,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      isActive: parsed.isActive ?? true,
    });
    revalidateAll();
    // On edit, only handle the "now live" case — don't re-send the "coming
    // soon" teaser each time an upcoming offer is tweaked.
    if (isNowLive(parsed.startsAt, parsed.endsAt, parsed.isActive ?? true)) {
      try {
        await runDiscountReminderCheck();
      } catch {
        // best-effort
      }
    }
    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }
    console.error("updateDiscountAction error:", error);
    return { success: false, error: "Could not update discount", code: "INTERNAL" };
  }
}

export async function deleteDiscountAction(id: string): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await deleteDiscount(id);
    revalidateAll();
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteDiscountAction error:", error);
    return { success: false, error: "Could not delete discount", code: "INTERNAL" };
  }
}

export async function toggleDiscountAction(id: string, isActive: boolean): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    const discount = await setDiscountActive(id, isActive);
    revalidateAll();
    // Re-enabling an offer notifies subscribers: teaser if it's still upcoming,
    // or the due live reminder if it's running right now.
    if (isActive) {
      await notifyAnnounced({
        startsAt: discount.startsAt,
        endsAt: discount.endsAt,
        isActive: true,
        label: discount.label,
        percent: discount.percent,
      });
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("toggleDiscountAction error:", error);
    return { success: false, error: "Could not update discount", code: "INTERNAL" };
  }
}

export interface SendNotificationResult {
  success: boolean;
  error?: string;
  /** Fresh quota state so the UI can update the button without a full reload. */
  state?: DiscountNotifyState;
}

/**
 * Manual "notify subscribers" button. Enforces the daily window, 3/day cap,
 * 2-hour gap, and the offer's remaining time. Returns updated quota state.
 */
export async function sendDiscountNotificationAction(
  discountId: string
): Promise<SendNotificationResult> {
  try {
    await requireOwner();
    const res = await sendManualDiscountNotification(discountId);
    if (!res.ok) {
      return { success: false, error: res.error, state: res.state };
    }
    revalidatePath("/admin/discounts");
    revalidatePath("/", "layout");
    revalidatePath("/phones");
    return { success: true, state: res.state };
  } catch (error) {
    console.error("sendDiscountNotificationAction error:", error);
    return { success: false, error: "Could not send notification. Try again." };
  }
}

/** Read-only quota snapshot for the admin Discounts page header/buttons. */
export async function getDiscountNotifyStateAction(): Promise<DiscountNotifyState> {
  await requireOwner();
  return getDiscountNotifyState();
}
