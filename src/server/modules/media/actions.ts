"use server";

import { requireOwner } from "@/server/auth/guards";
import {
  signUpload,
  attachMedia,
  reorderMedia,
  deleteMedia,
  signBillUpload,
  saveProductBill,
  deleteProductBill,
} from "@/server/modules/media";
import type { ActionResult } from "@/types";
import type { MediaKind } from "@/types";

// --- Sign Upload Action ---

interface SignUploadInput {
  productId: string;
  kind: MediaKind;
}

interface SignUploadResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
  cloudName: string | undefined;
}

export async function signUploadAction(
  input: SignUploadInput
): Promise<ActionResult<SignUploadResult>> {
  try {
    await requireOwner();
    const result = await signUpload(input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign upload",
      code: "UPLOAD_SIGN_ERROR",
    };
  }
}

// --- Attach Media Action ---

interface AttachMediaInput {
  productId: string;
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  kind: MediaKind;
}

export async function attachMediaAction(
  input: AttachMediaInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const media = await attachMedia(input);
    return { success: true, data: { id: media.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to attach media",
      code: "ATTACH_MEDIA_ERROR",
    };
  }
}

// --- Reorder Media Action ---

interface ReorderMediaInput {
  productId: string;
  mediaIds: string[];
}

export async function reorderMediaAction(
  input: ReorderMediaInput
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await reorderMedia(input);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder media",
      code: "REORDER_MEDIA_ERROR",
    };
  }
}

// --- Delete Media Action ---

export async function deleteMediaAction(
  mediaId: string
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await deleteMedia({ mediaId });
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media",
      code: "DELETE_MEDIA_ERROR",
    };
  }
}

// --- Bill upload (PDF / PNG) ---

type BillMime = "application/pdf" | "image/png" | "image/jpeg" | "image/webp";

export async function signBillUploadAction(input: {
  productId: string;
  mimeType: BillMime;
}): Promise<
  ActionResult<{
    signature: string;
    timestamp: number;
    apiKey: string;
    folder: string;
    cloudName: string | undefined;
    resourceType: "image";
  }>
> {
  try {
    await requireOwner();
    const result = await signBillUpload(input);
    if (!result.apiKey) {
      return { success: false, error: "Cloudinary API key missing", code: "UPLOAD_SIGN_ERROR" };
    }
    return { success: true, data: { ...result, apiKey: result.apiKey } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign bill upload",
      code: "UPLOAD_SIGN_ERROR",
    };
  }
}

export async function saveProductBillAction(input: {
  productId: string;
  publicId: string;
  url: string;
}): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await saveProductBill(input);
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save bill",
      code: "UPLOAD_FAILED",
    };
  }
}

export async function deleteProductBillAction(
  productId: string
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await deleteProductBill({ productId });
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete bill",
      code: "DELETE_MEDIA_ERROR",
    };
  }
}
