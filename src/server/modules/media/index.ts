import { v2 as cloudinary } from "cloudinary";
import { requireOwner } from "@/server/auth/guards";
import { db } from "@/server/db/client";
import { z } from "zod";

/**
 * Media module — Cloudinary signed uploads, attach, reorder, delete.
 *
 * Rules from spec:
 * - Max 8 images per product
 * - Client downscales to <=1600px before upload
 * - Server verifies upload result/signature
 * - MIME check (image only)
 * - No image proxy through app server
 * - Cloudinary CDN delivery with f_auto, q_auto
 * - No EXIF/GPS leakage (Cloudinary strips by default)
 */

const MAX_IMAGES_PER_PRODUCT = 8;

// --- Schemas ---

const signUploadSchema = z.object({
  productId: z.string().cuid(),
  kind: z.enum([
    "FRONT", "BACK", "SIDE", "SCREEN", "SCREEN_OFF",
    "CAMERA", "BATTERY_SCREEN", "BOX", "ACCESSORY", "DAMAGE", "OTHER",
  ]),
});

const attachMediaSchema = z.object({
  productId: z.string().cuid(),
  publicId: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  kind: z.enum([
    "FRONT", "BACK", "SIDE", "SCREEN", "SCREEN_OFF",
    "CAMERA", "BATTERY_SCREEN", "BOX", "ACCESSORY", "DAMAGE", "OTHER",
  ]),
});

const reorderMediaSchema = z.object({
  productId: z.string().cuid(),
  mediaIds: z.array(z.string().cuid()),
});

const deleteMediaSchema = z.object({
  mediaId: z.string().cuid(),
});

const billMimeSchema = z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

const saveBillSchema = z.object({
  productId: z.string().cuid(),
  publicId: z.string().min(1),
  url: z.string().url(),
});

const deleteBillSchema = z.object({
  productId: z.string().cuid(),
});

function billResourceType(_mime: z.infer<typeof billMimeSchema>): "image" {
  // PDFs upload as image so page 1 can be delivered without raw/PDF CDN restrictions.
  return "image";
}

function cloudinaryResourceTypeFromUrl(url: string): "raw" | "image" {
  return url.includes("/raw/upload/") ? "raw" : "image";
}

// --- Cloudinary config ---

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return { cloudName, apiKey, apiSecret };
}

// --- Service functions ---

/**
 * Generate a signed upload URL for direct browser→Cloudinary upload.
 * The client uploads directly to Cloudinary (no app server proxy).
 */
export async function signUpload(input: z.infer<typeof signUploadSchema>) {
  await requireOwner();
  const parsed = signUploadSchema.parse(input);

  const { apiKey, apiSecret } = getCloudinaryConfig();

  // Verify product exists
  const product = await db.product.findUnique({
    where: { id: parsed.productId },
    select: { 
      id: true, 
      slug: true, 
      deviceType: true,
      brand: { select: { name: true } },
      _count: { select: { media: true } } 
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product._count.media >= MAX_IMAGES_PER_PRODUCT) {
    throw new Error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images per product`);
  }

  const timestamp = Math.round(Date.now() / 1000);
  
  // Format: mobileshop/phones/apple/iphone-15-128gb...
  const category = `${product.deviceType.toLowerCase()}s`;
  const brandSafe = product.brand.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const folder = `mobileshop/${category}/${brandSafe}/${product.slug}`;

  const params = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    apiSecret
  );

  return {
    signature,
    timestamp,
    apiKey,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Attach a successfully uploaded media to a product.
 * Called after the client receives the Cloudinary upload response.
 */
export async function attachMedia(input: z.infer<typeof attachMediaSchema>) {
  await requireOwner();
  const parsed = attachMediaSchema.parse(input);

  // Verify product exists and check limit
  const product = await db.product.findUnique({
    where: { id: parsed.productId },
    select: { id: true, _count: { select: { media: true } } },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product._count.media >= MAX_IMAGES_PER_PRODUCT) {
    throw new Error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images per product`);
  }

  const media = await db.media.create({
    data: {
      productId: parsed.productId,
      publicId: parsed.publicId,
      url: parsed.url,
      width: parsed.width,
      height: parsed.height,
      kind: parsed.kind,
      sortOrder: product._count.media, // append to end
    },
  });

  return media;
}

/**
 * Reorder media for a product. Receives the full ordered list of media IDs.
 */
export async function reorderMedia(input: z.infer<typeof reorderMediaSchema>) {
  await requireOwner();
  const parsed = reorderMediaSchema.parse(input);

  // Verify all media belong to the product
  const existingMedia = await db.media.findMany({
    where: { productId: parsed.productId },
    select: { id: true },
  });

  const existingIds = new Set(existingMedia.map((m) => m.id));
  for (const id of parsed.mediaIds) {
    if (!existingIds.has(id)) {
      throw new Error("Media does not belong to this product");
    }
  }

  // Update sort orders in a transaction
  await db.$transaction(
    parsed.mediaIds.map((id, index) =>
      db.media.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return { success: true };
}

/**
 * Delete a media item. Removes from DB and Cloudinary.
 */
export async function deleteMedia(input: z.infer<typeof deleteMediaSchema>) {
  await requireOwner();
  const parsed = deleteMediaSchema.parse(input);

  const media = await db.media.findUnique({
    where: { id: parsed.mediaId },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  // Delete from Cloudinary
  try {
    getCloudinaryConfig();
    await cloudinary.uploader.destroy(media.publicId);
  } catch {
    // Log but don't fail — media row should still be deleted
    console.error("Failed to delete from Cloudinary:", media.publicId);
  }

  // Delete from DB
  await db.media.delete({
    where: { id: parsed.mediaId },
  });

  // Re-order remaining media
  const remaining = await db.media.findMany({
    where: { productId: media.productId },
    orderBy: { sortOrder: "asc" },
  });

  if (remaining.length > 0) {
    await db.$transaction(
      remaining.map((m, index) =>
        db.media.update({
          where: { id: m.id },
          data: { sortOrder: index },
        })
      )
    );
  }

  return { success: true };
}

/**
 * Get all media for a product, ordered by sortOrder.
 */
export async function getProductMedia(productId: string) {
  return db.media.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Signed upload for purchase bill (PDF or image). One bill per product.
 */
export async function signBillUpload(input: {
  productId: z.infer<typeof signUploadSchema>["productId"];
  mimeType: z.infer<typeof billMimeSchema>;
}) {
  await requireOwner();
  const parsed = z
    .object({ productId: z.string().cuid(), mimeType: billMimeSchema })
    .parse(input);

  const product = await db.product.findUnique({
    where: { id: parsed.productId },
    select: { id: true, slug: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const { apiSecret } = getCloudinaryConfig();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `mobileshop/bills/${product.slug}`;
  const resourceType = billResourceType(parsed.mimeType);

  // resource_type is set via upload URL (/raw/upload or /image/upload), not in the signed params
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    resourceType,
  };
}

/** Save bill URL on product after Cloudinary upload. Replaces any previous bill. */
export async function saveProductBill(input: z.infer<typeof saveBillSchema>) {
  await requireOwner();
  const parsed = saveBillSchema.parse(input);

  const product = await db.product.findUnique({
    where: { id: parsed.productId },
    select: { id: true, billPublicId: true, billUrl: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.billPublicId && product.billUrl) {
    try {
      getCloudinaryConfig();
      await cloudinary.uploader.destroy(product.billPublicId, {
        resource_type: cloudinaryResourceTypeFromUrl(product.billUrl),
      });
    } catch {
      console.error("Failed to delete old bill from Cloudinary:", product.billPublicId);
    }
  }

  await db.product.update({
    where: { id: parsed.productId },
    data: {
      billUrl: parsed.url,
      billPublicId: parsed.publicId,
    },
  });

  return { success: true as const };
}

/** Remove uploaded bill from product and Cloudinary. */
export async function deleteProductBill(input: z.infer<typeof deleteBillSchema>) {
  await requireOwner();
  const parsed = deleteBillSchema.parse(input);

  const product = await db.product.findUnique({
    where: { id: parsed.productId },
    select: { id: true, billPublicId: true, billUrl: true },
  });

  if (!product?.billPublicId || !product.billUrl) {
    return { success: true as const };
  }

  try {
    getCloudinaryConfig();
    await cloudinary.uploader.destroy(product.billPublicId, {
      resource_type: cloudinaryResourceTypeFromUrl(product.billUrl),
    });
  } catch {
    console.error("Failed to delete bill from Cloudinary:", product.billPublicId);
  }

  await db.product.update({
    where: { id: parsed.productId },
    data: { billUrl: null, billPublicId: null },
  });

  return { success: true as const };
}

/**
 * Delete all media associated with a product from Cloudinary.
 * Used when a product is hard-deleted.
 */
export async function deleteProductMedia(productId: string) {
  const media = await db.media.findMany({
    where: { productId },
    select: { publicId: true },
  });

  if (media.length === 0) return;

  try {
    getCloudinaryConfig();
    const publicIds = media.map((m) => m.publicId);
    
    // Cloudinary's destroy method can only take one string,
    // so we use the API to delete multiple resources.
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error("Failed to delete product media from Cloudinary:", error);
  }
}
