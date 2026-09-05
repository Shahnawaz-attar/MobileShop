"use server";

import { requireOwner } from "@/server/auth/guards";
import {
  createBrandInterest,
  deleteBrandInterest,
  type BrandInterestInput,
} from "@/server/modules/leads";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

/** Public: a buyer leaves their WhatsApp number to be notified about a brand. */
export async function createBrandInterestAction(
  input: BrandInterestInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const lead = await createBrandInterest(input);
    return { success: true, data: { id: lead.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not save your interest",
      code: "VALIDATION_ERROR",
    };
  }
}

/** Admin: delete a captured lead. */
export async function deleteBrandInterestAction(
  id: string
): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireOwner();
    await deleteBrandInterest(id);
    revalidatePath("/admin/leads");
    return { success: true, data: { ok: true } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete lead",
      code: "INTERNAL",
    };
  }
}
