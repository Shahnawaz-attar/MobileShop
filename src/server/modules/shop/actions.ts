"use server";

import { requireOwner } from "@/server/auth/guards";
import { getShop } from "@/server/modules/shop";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import type { ActionResult } from "@/types";

/**
 * Shop settings update schema — validates all editable shop fields.
 */
const UpdateShopSchema = z.object({
  name: z.string().min(1, "Shop name is required").max(100),
  tagline: z.string().max(200).optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  phone: z.string().min(10, "Phone number is required").max(20),
  whatsapp: z.string().min(10, "WhatsApp number is required").max(20),
  email: z.string().email().optional().nullable().or(z.literal("")),
  addressLine1: z.string().min(1, "Address is required").max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().min(5, "Pincode is required").max(10),
  mapsUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  yearsInBiz: z.coerce.number().int().min(0).max(100).optional().nullable(),
  hours: z.record(z.string()).optional(),
  trustBadges: z.array(z.string()).optional(),
  policies: z.record(z.string()).optional(),
});

type UpdateShopInput = z.infer<typeof UpdateShopSchema>;

/**
 * Server action: Update shop settings.
 * Follows the standard pipeline: requireOwner() → validate → update → revalidate → result
 */
export async function updateShopAction(
  input: UpdateShopInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = UpdateShopSchema.parse(input);

    const shop = await getShop();

    // Clean empty strings to null
    const cleanData = {
      ...parsed,
      email: parsed.email || null,
      mapsUrl: parsed.mapsUrl || null,
      tagline: parsed.tagline || null,
      about: parsed.about || null,
      addressLine2: parsed.addressLine2 || null,
      instagram: parsed.instagram || null,
      facebook: parsed.facebook || null,
      logoUrl: parsed.logoUrl || null,
      yearsInBiz: parsed.yearsInBiz ?? null,
    };

    const updated = await db.shop.update({
      where: { id: shop.id },
      data: cleanData,
    });

    // Revalidate all public pages since shop data is used everywhere
    revalidatePath("/", "layout");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError ? firstError.message : "Validation failed",
        code: "VALIDATION_ERROR",
      };
    }
    console.error("updateShopAction error:", error);
    return { success: false, error: "Failed to update shop settings", code: "INTERNAL" };
  }
}

// --- Logo Management ---

type ShopLogoType = "header" | "footer" | "dashboard";

const LOGO_FIELD_MAP: Record<ShopLogoType, { url: "logoUrl" | "footerLogoUrl" | "dashboardLogoUrl"; publicId: "logoPublicId" | "footerLogoPublicId" | "dashboardLogoPublicId" }> = {
  header:    { url: "logoUrl",          publicId: "logoPublicId" },
  footer:    { url: "footerLogoUrl",    publicId: "footerLogoPublicId" },
  dashboard: { url: "dashboardLogoUrl", publicId: "dashboardLogoPublicId" },
};

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudName;
}

/**
 * Server action: Upload a shop logo (header, footer, or dashboard).
 * Automatically deletes the old logo from Cloudinary before saving the new one.
 */
export async function uploadShopLogoAction(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    await requireOwner();

    const logoType = formData.get("logoType") as ShopLogoType;
    const file = formData.get("file") as File | null;

    if (!logoType || !LOGO_FIELD_MAP[logoType]) {
      return { success: false, error: "Invalid logo type", code: "VALIDATION_ERROR" };
    }
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided", code: "VALIDATION_ERROR" };
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return { success: false, error: "Logo must be under 2MB", code: "VALIDATION_ERROR" };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: "Only PNG, JPEG, WebP, and SVG are allowed", code: "VALIDATION_ERROR" };
    }

    configureCloudinary();
    const shop = await getShop();
    const fields = LOGO_FIELD_MAP[logoType];

    // Delete old logo from Cloudinary if it exists
    const oldPublicId = shop[fields.publicId];
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch {
        console.error("Failed to delete old logo from Cloudinary:", oldPublicId);
      }
    }

    // Upload new logo to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "shop-logos",
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error("Upload failed"));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    });

    // Update DB
    await db.shop.update({
      where: { id: shop.id },
      data: {
        [fields.url]: uploadResult.secure_url,
        [fields.publicId]: uploadResult.public_id,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: { url: uploadResult.secure_url } };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("uploadShopLogoAction error:", errMsg, error);
    return { success: false, error: "Failed to upload logo", code: "INTERNAL" };
  }
}

/**
 * Server action: Delete a shop logo (header, footer, or dashboard).
 * Removes from Cloudinary and sets DB field to null.
 */
export async function deleteShopLogoAction(
  logoType: ShopLogoType
): Promise<ActionResult<null>> {
  try {
    await requireOwner();

    if (!LOGO_FIELD_MAP[logoType]) {
      return { success: false, error: "Invalid logo type", code: "VALIDATION_ERROR" };
    }

    configureCloudinary();
    const shop = await getShop();
    const fields = LOGO_FIELD_MAP[logoType];

    // Delete from Cloudinary
    const publicId = shop[fields.publicId];
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        console.error("Failed to delete logo from Cloudinary:", publicId);
      }
    }

    // Clear from DB
    await db.shop.update({
      where: { id: shop.id },
      data: {
        [fields.url]: null,
        [fields.publicId]: null,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteShopLogoAction error:", error);
    return { success: false, error: "Failed to delete logo", code: "INTERNAL" };
  }
}
