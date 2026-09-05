import { db } from "@/server/db/client";
import { z } from "zod";

/**
 * Leads module — "notify me" interest capture.
 *
 * Buyers type the device they want (free text) + their WhatsApp number.
 * The owner messages them on WhatsApp when that device arrives (no paid API).
 */

export const brandInterestSchema = z.object({
  device: z.string().trim().min(2, "Tell us which device you're looking for").max(120, "Device name too long"),
  whatsapp: z
    .string()
    .trim()
    .min(10, "Enter a valid WhatsApp number")
    .max(20, "Number too long")
    .regex(/^\+?[0-9\s-]+$/, "Enter a valid phone number"),
  name: z.string().trim().max(60).optional().nullable(),
});

export type BrandInterestInput = z.infer<typeof brandInterestSchema>;

/** Public: capture a buyer's interest in a device they're looking for. */
export async function createBrandInterest(input: BrandInterestInput) {
  const parsed = brandInterestSchema.parse(input);

  // Normalise to digits only for storage
  const whatsapp = parsed.whatsapp.replace(/\D/g, "");

  return db.brandInterest.create({
    data: {
      device: parsed.device,
      whatsapp,
      name: parsed.name?.trim() || null,
    },
    select: { id: true },
  });
}

/** Admin: list all leads newest-first. */
export async function listBrandInterests() {
  return db.brandInterest.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      device: true,
      whatsapp: true,
      name: true,
      createdAt: true,
    },
  });
}

/** Admin: delete a lead. */
export async function deleteBrandInterest(id: string) {
  await db.brandInterest.delete({ where: { id } });
  return { ok: true };
}
