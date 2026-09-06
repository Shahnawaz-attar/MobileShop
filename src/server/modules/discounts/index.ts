import { cache } from "react";
import { z } from "zod";
import { db } from "@/server/db/client";

/**
 * Discount module — timed price promotions (many-to-many).
 *
 * A Discount targets EITHER one or more whole brands (brandIds) OR one or more
 * specific products (productIds), never both. Its `percent` is applied to a
 * product's normal selling price (pricePaise) to derive a "sale price".
 *
 * Rules (loophole-free):
 *  - A discount must have at least one brand OR at least one product (never both).
 *  - percent is 1–90.
 *  - endsAt must be strictly after startsAt.
 *  - A product-specific discount always wins over a brand-wide one.
 *  - Only one discount applies per product (no stacking campaigns).
 *  - Only AVAILABLE products are ever discounted.
 *  - A discount only applies while now is within [startsAt, endsAt] AND isActive.
 */

export interface ActiveDiscount {
  id: string;
  label: string;
  percent: number;
  brandIds: string[];
  productIds: string[];
}

const discountSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(60, "Label too long"),
    percent: z.number().int().min(1, "Percent must be at least 1").max(90, "Percent cannot exceed 90"),
    brandIds: z.array(z.string().cuid("Invalid brand")).default([]),
    productIds: z.array(z.string().cuid("Invalid product")).default([]),
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

export type DiscountInput = z.infer<typeof discountSchema>;

/** Compute the discounted (sale) price, in integer paise. */
export function applyDiscountPercent(pricePaise: number, percent: number): number {
  return Math.round((pricePaise * (100 - percent)) / 100);
}

/**
 * Load every discount that is currently applicable (isActive AND within its
 * date window), with their brand/product targets. Cached per request.
 */
export const getActiveDiscounts = cache(async (): Promise<ActiveDiscount[]> => {
  const now = new Date();
  const rows = await db.discount.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    select: {
      id: true,
      label: true,
      percent: true,
      brands: { select: { brandId: true } },
      products: { select: { productId: true } },
    },
  });
  return rows.map((d) => ({
    id: d.id,
    label: d.label,
    percent: d.percent,
    brandIds: d.brands.map((b) => b.brandId),
    productIds: d.products.map((p) => p.productId),
  }));
});

/**
 * Find the single best discount for a product from a set of active discounts.
 * A product-specific discount always beats a brand-wide one.
 */
export function resolveDiscountForProduct(
  product: { id: string; brandId: string },
  activeDiscounts: ActiveDiscount[]
): ActiveDiscount | null {
  // Product-specific first.
  const direct = activeDiscounts.find((d) => d.productIds.includes(product.id));
  if (direct) return direct;
  return activeDiscounts.find((d) => d.brandIds.includes(product.brandId)) ?? null;
}

// --- Admin CRUD ---

export interface DiscountWithTargets {
  id: string;
  label: string;
  percent: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  brands: { id: string; name: string; slug: string }[];
  products: { id: string; title: string; slug: string }[];
}

/** List all discounts (admin), newest first, with their targets. */
export async function listDiscounts(): Promise<DiscountWithTargets[]> {
  const rows = await db.discount.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      brands: { include: { brand: { select: { id: true, name: true, slug: true } } } },
      products: { include: { product: { select: { id: true, title: true, slug: true } } } },
    },
  });
  return rows.map((d) => ({
    id: d.id,
    label: d.label,
    percent: d.percent,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    isActive: d.isActive,
    createdAt: d.createdAt,
    brands: d.brands.map((b) => b.brand),
    products: d.products.map((p) => p.product),
  }));
}

export async function createDiscount(input: DiscountInput) {
  const parsed = discountSchema.parse(input);

  // Validate targets exist (defensive; FKs also enforce).
  if (parsed.brandIds.length > 0) {
    const count = await db.brand.count({ where: { id: { in: parsed.brandIds } } });
    if (count !== parsed.brandIds.length) throw new Error("One or more brands not found");
  }
  if (parsed.productIds.length > 0) {
    const count = await db.product.count({ where: { id: { in: parsed.productIds } } });
    if (count !== parsed.productIds.length) throw new Error("One or more products not found");
  }

  return db.discount.create({
    data: {
      label: parsed.label,
      percent: parsed.percent,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      isActive: parsed.isActive ?? true,
      brands:
        parsed.brandIds.length > 0
          ? { create: parsed.brandIds.map((brandId) => ({ brandId })) }
          : undefined,
      products:
        parsed.productIds.length > 0
          ? { create: parsed.productIds.map((productId) => ({ productId })) }
          : undefined,
    },
  });
}

export async function updateDiscount(id: string, input: DiscountInput) {
  const parsed = discountSchema.parse(input);
  const existing = await db.discount.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Discount not found");

  if (parsed.brandIds.length > 0) {
    const count = await db.brand.count({ where: { id: { in: parsed.brandIds } } });
    if (count !== parsed.brandIds.length) throw new Error("One or more brands not found");
  }
  if (parsed.productIds.length > 0) {
    const count = await db.product.count({ where: { id: { in: parsed.productIds } } });
    if (count !== parsed.productIds.length) throw new Error("One or more products not found");
  }

  // Replace targets atomically.
  await db.$transaction([
    db.discountBrand.deleteMany({ where: { discountId: id } }),
    db.discountProduct.deleteMany({ where: { discountId: id } }),
    db.discount.update({
      where: { id },
      data: {
        label: parsed.label,
        percent: parsed.percent,
        startsAt: parsed.startsAt,
        endsAt: parsed.endsAt,
        isActive: parsed.isActive ?? true,
      },
    }),
    ...(parsed.brandIds.length > 0
      ? [db.discountBrand.createMany({ data: parsed.brandIds.map((brandId) => ({ discountId: id, brandId })) })]
      : []),
    ...(parsed.productIds.length > 0
      ? [db.discountProduct.createMany({ data: parsed.productIds.map((productId) => ({ discountId: id, productId })) })]
      : []),
  ]);
  return { id };
}

export async function deleteDiscount(id: string) {
  await db.discount.deleteMany({ where: { id } });
  return { ok: true };
}

export async function setDiscountActive(id: string, isActive: boolean) {
  const existing = await db.discount.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error("Discount not found");
  return db.discount.update({ where: { id }, data: { isActive } });
}
