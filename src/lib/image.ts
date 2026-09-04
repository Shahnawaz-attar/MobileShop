/**
 * Cloudinary image URL utilities.
 *
 * Generates optimized URLs with:
 * - f_auto (format auto-negotiation)
 * - q_auto:good (quality)
 * - responsive widths
 * - No EXIF/GPS leakage (Cloudinary strips by default)
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Build an optimized Cloudinary delivery URL.
 * Never proxy images through the app server.
 */
export function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "thumb" | "scale";
    quality?: "auto" | "auto:good" | "auto:best" | "auto:low";
    format?: "auto" | "webp" | "avif";
  } = {}
): string {
  if (!CLOUD_NAME) {
    // Fallback for development without Cloudinary
    return `https://placehold.co/${options.width ?? 400}x${options.height ?? 400}/e5e5e5/737373?text=No+Image`;
  }

  const transforms: string[] = ["f_auto", "q_auto:good"];

  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  const transformStr = transforms.join(",");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformStr}/${publicId}`;
}

/**
 * Generate srcSet for responsive images.
 */
export function cloudinarySrcSet(
  publicId: string,
  widths: number[] = [320, 480, 640, 768, 1024, 1280]
): string {
  return widths
    .map((w) => `${cloudinaryUrl(publicId, { width: w, crop: "fill" })} ${w}w`)
    .join(", ");
}

/**
 * Get a thumbnail URL for admin lists.
 */
export function cloudinaryThumb(publicId: string, size = 80): string {
  return cloudinaryUrl(publicId, {
    width: size,
    height: size,
    crop: "thumb",
  });
}
