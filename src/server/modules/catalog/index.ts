import { db } from "@/server/db/client";
import { z } from "zod";
import { buildProductSlug } from "@/lib/slug";
import { deleteProductMedia } from "@/server/modules/media";
import type { Availability, Condition, DeviceType } from "@/types";

/**
 * Catalog module — Product CRUD, queries, and search.
 *
 * Business logic for listing, creating, updating, and managing phone products.
 * This module is server-only. Pages and actions call these services.
 *
 * Key invariants (from spec):
 * - searchText rebuilt on every write
 * - publishedAt set only on first transition to AVAILABLE
 * - soldAt set on SOLD, cleared on revert
 * - slug = title + storage + colour + short random suffix
 * - hard delete only for DRAFT products
 */

// --- Zod schemas (input boundaries) ---

const conditionEnum = z.enum(["LIKE_NEW", "EXCELLENT", "GOOD", "FAIR"]);
const availabilityEnum = z.enum(["DRAFT", "AVAILABLE", "RESERVED", "SOLD"]);
const deviceTypeEnum = z.enum(["PHONE", "TABLET", "OTHER"]);
const batteryTypeEnum = z.enum(["PERCENTAGE", "RATED", "UNKNOWN"]);
const batteryRatingEnum = z.enum(["GOOD", "AVERAGE", "NEEDS_REPLACEMENT"]);

const productInputSchema = z.object({
  brandId: z.string().cuid("Invalid brand"),
  modelId: z.string().cuid("Invalid model").nullable().optional(),
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title too long"),
  deviceType: deviceTypeEnum.optional(),
  variant: z.string().trim().max(120).nullable().optional(),
  storageGb: z.number().int().positive().max(2048).nullable().optional(),
  ramGb: z.number().int().positive().max(64).nullable().optional(),
  colour: z.string().trim().max(60).nullable().optional(),
  pricePaise: z.number().int().positive("Price must be positive"),
  mrpPaise: z.number().int().positive().nullable().optional(),
  condition: conditionEnum,
  conditionNotes: z.string().trim().max(2000).nullable().optional(),
  batteryType: batteryTypeEnum.optional(),
  batteryPct: z.number().int().min(0).max(100).nullable().optional(),
  batteryRating: batteryRatingEnum.nullable().optional(),
  batteryNote: z.string().trim().max(200).nullable().optional(),
  warrantyMonths: z.number().int().min(0).max(120).nullable().optional(),
  warrantyNote: z.string().trim().max(200).nullable().optional(),
  hasBox: z.boolean().optional(),
  hasCharger: z.boolean().optional(),
  hasCable: z.boolean().optional(),
  otherAccessories: z.array(z.string().trim().max(60)).max(20).optional(),
  simType: z.string().trim().max(60).nullable().optional(),
  networkNote: z.string().trim().max(200).nullable().optional(),
  osVersion: z.string().trim().max(60).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  availability: availabilityEnum.optional(),
  isFeatured: z.boolean().optional(),
  internalNotes: z.string().trim().max(5000).nullable().optional(),
  deviceRefLast4: z.string().trim().max(4).nullable().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// --- Filters / pagination ---

const adminFiltersSchema = z.object({
  availability: availabilityEnum.optional(),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(24),
});

export type AdminFilters = z.input<typeof adminFiltersSchema>;

const publicSortEnum = z.enum(["NEWEST", "PRICE_ASC", "PRICE_DESC"]);

const publicFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  brands: z.array(z.string()).optional(),
  conditions: z.array(conditionEnum).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  sort: publicSortEnum.default("NEWEST"),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(24),
});

export type PublicFilters = z.input<typeof publicFiltersSchema>;

// --- Helpers ---

/**
 * Build the searchText field from product fields.
 * Rebuilt on every product write.
 */
function buildSearchText(input: {
  title: string;
  deviceType?: DeviceType;
  variant?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  colour?: string | null;
  condition?: Condition;
}): string {
  return [
    input.title,
    input.deviceType ? input.deviceType.toLowerCase() : "",
    input.variant,
    input.storageGb != null ? `${input.storageGb}GB` : "",
    input.ramGb != null ? `${input.ramGb}GB RAM` : "",
    input.colour,
    input.condition,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Generate a unique slug. Retries with a fresh suffix on collision.
 */
async function generateUniqueSlug(input: {
  title: string;
  storageGb?: number | null;
  colour?: string | null;
}): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = buildProductSlug(input);
    const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
  }
  // Extremely unlikely to reach here — add a longer suffix as a final fallback
  return `${buildProductSlug(input)}-${Date.now().toString(36)}`;
}

// --- Service functions ---

/**
 * List products for the admin dashboard.
 * Supports filtering by availability and search query, cursor pagination.
 */
export async function listAdminProducts(filters: AdminFilters = {}) {
  const parsed = adminFiltersSchema.parse(filters);

  const where: {
    availability?: Availability;
    OR?: { title?: { contains: string; mode: "insensitive" }; searchText?: { contains: string } }[];
  } = {};

  if (parsed.availability) {
    where.availability = parsed.availability;
  }

  if (parsed.q) {
    where.OR = [
      { title: { contains: parsed.q, mode: "insensitive" } },
      { searchText: { contains: parsed.q.toLowerCase() } },
    ];
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: parsed.limit + 1, // fetch one extra to detect next page
      ...(parsed.cursor
        ? { cursor: { id: parsed.cursor }, skip: 1 }
        : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        deviceType: true,
        storageGb: true,
        colour: true,
        pricePaise: true,
        condition: true,
        availability: true,
        isFeatured: true,
        publishedAt: true,
        soldAt: true,
        createdAt: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
        media: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
        _count: { select: { media: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  const hasNextPage = products.length > parsed.limit;
  const page = hasNextPage ? products.slice(0, parsed.limit) : products;

  return {
    products: page.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      deviceType: p.deviceType,
      storageGb: p.storageGb,
      colour: p.colour,
      pricePaise: p.pricePaise,
      condition: p.condition,
      availability: p.availability,
      isFeatured: p.isFeatured,
      publishedAt: p.publishedAt,
      soldAt: p.soldAt,
      createdAt: p.createdAt,
      brandName: p.brand.name,
      modelName: p.model?.name ?? null,
      primaryImageUrl: p.media[0]?.url ?? null,
      imageCount: p._count.media,
    })),
    nextCursor: hasNextPage ? page[page.length - 1]?.id ?? null : null,
    total,
  };
}

/**
 * List products for the public storefront.
 * Supports filtering by brand, condition, price range, and search query.
 * Always restricted to AVAILABLE products.
 */
export async function listPublicProducts(filters: PublicFilters = {}) {
  const parsed = publicFiltersSchema.parse(filters);

  // Prisma Where Clause
  // Note: We use 'any' temporarily to build up the 'AND' structure dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    availability: "AVAILABLE",
  };

  if (parsed.q) {
    where.OR = [
      { title: { contains: parsed.q, mode: "insensitive" } },
      { searchText: { contains: parsed.q.toLowerCase() } },
    ];
  }

  if (parsed.brands && parsed.brands.length > 0) {
    where.brand = { slug: { in: parsed.brands } };
  }

  if (parsed.conditions && parsed.conditions.length > 0) {
    where.condition = { in: parsed.conditions };
  }

  if (parsed.isFeatured !== undefined) {
    where.isFeatured = parsed.isFeatured;
  }

  if (parsed.minPrice !== undefined || parsed.maxPrice !== undefined) {
    where.pricePaise = {};
    if (parsed.minPrice !== undefined) where.pricePaise.gte = parsed.minPrice;
    if (parsed.maxPrice !== undefined) where.pricePaise.lte = parsed.maxPrice;
  }

  // Prisma Order By Clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = [{ publishedAt: "desc" }, { createdAt: "desc" }];
  if (parsed.sort === "PRICE_ASC") {
    orderBy = [{ pricePaise: "asc" }, { publishedAt: "desc" }];
  } else if (parsed.sort === "PRICE_DESC") {
    orderBy = [{ pricePaise: "desc" }, { publishedAt: "desc" }];
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      take: parsed.limit + 1, // fetch one extra to detect next page
      ...(parsed.cursor ? { cursor: { id: parsed.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        deviceType: true,
        storageGb: true,
        colour: true,
        pricePaise: true,
        mrpPaise: true,
        condition: true,
        availability: true,
        isFeatured: true,
        brand: { select: { name: true } },
        media: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true, alt: true },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  const hasNextPage = products.length > parsed.limit;
  const page = hasNextPage ? products.slice(0, parsed.limit) : products;

  return {
    products: page.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      deviceType: p.deviceType,
      storageGb: p.storageGb,
      colour: p.colour,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      condition: p.condition,
      availability: p.availability,
      isFeatured: p.isFeatured,
      brandName: p.brand.name,
      primaryImageUrl: p.media[0]?.url ?? null,
      primaryImageAlt: p.media[0]?.alt ?? null,
    })),
    nextCursor: hasNextPage ? page[page.length - 1]?.id ?? null : null,
    total,
  };
}

/**
 * List products that have been sold (for the recently sold section).
 */
export async function listPublicSoldProducts(limit: number = 4) {
  const products = await db.product.findMany({
    where: { availability: "SOLD" },
    orderBy: { soldAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      deviceType: true,
      storageGb: true,
      colour: true,
      pricePaise: true,
      mrpPaise: true,
      condition: true,
      availability: true,
      isFeatured: true,
      brand: { select: { name: true } },
      media: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    deviceType: p.deviceType,
    storageGb: p.storageGb,
    colour: p.colour,
    pricePaise: p.pricePaise,
    mrpPaise: p.mrpPaise,
    condition: p.condition,
    availability: p.availability,
    isFeatured: p.isFeatured,
    brandName: p.brand.name,
    primaryImageUrl: p.media[0]?.url ?? null,
    primaryImageAlt: p.media[0]?.alt ?? null,
  }));
}

/**
 * Get a single product's full detail for the admin edit form.
 */
export async function getAdminProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      brandId: true,
      modelId: true,
      title: true,
      deviceType: true,
      variant: true,
      storageGb: true,
      ramGb: true,
      colour: true,
      pricePaise: true,
      mrpPaise: true,
      condition: true,
      conditionNotes: true,
      batteryType: true,
      batteryPct: true,
      batteryRating: true,
      batteryNote: true,
      warrantyMonths: true,
      warrantyNote: true,
      hasBox: true,
      hasCharger: true,
      hasCable: true,
      otherAccessories: true,
      simType: true,
      networkNote: true,
      osVersion: true,
      description: true,
      availability: true,
      isFeatured: true,
      internalNotes: true,
      deviceRefLast4: true,
      media: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          url: true,
          kind: true,
          sortOrder: true,
        },
      },
    },
  });

  return product;
}

/**
 * Get a single product's full detail for the public view.
 * Excludes private fields and returns null if the product is DRAFT.
 */
export async function getPublicProduct(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      deviceType: true,
      variant: true,
      storageGb: true,
      ramGb: true,
      colour: true,
      pricePaise: true,
      mrpPaise: true,
      condition: true,
      conditionNotes: true,
      batteryType: true,
      batteryPct: true,
      batteryRating: true,
      batteryNote: true,
      warrantyMonths: true,
      warrantyNote: true,
      hasBox: true,
      hasCharger: true,
      hasCable: true,
      otherAccessories: true,
      simType: true,
      networkNote: true,
      osVersion: true,
      description: true,
      availability: true,
      isFeatured: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
      media: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          url: true,
          alt: true,
          kind: true,
          width: true,
          height: true,
        },
      },
    },
  });

  if (!product || product.availability === "DRAFT") {
    return null;
  }

  return product;
}

/**
 * Create a new product. Auto-generates slug, sets searchText.
 * Defaults to DRAFT unless availability explicitly provided.
 */
export async function createProduct(input: ProductInput) {
  const parsed = productInputSchema.parse(input);

  // Validate brand exists
  const brand = await db.brand.findUnique({ where: { id: parsed.brandId }, select: { id: true } });
  if (!brand) {
    throw new Error("Brand not found");
  }

  // Validate model exists and belongs to brand (if provided)
  if (parsed.modelId) {
    const model = await db.phoneModel.findUnique({
      where: { id: parsed.modelId },
      select: { id: true, brandId: true },
    });
    if (!model || model.brandId !== parsed.brandId) {
      throw new Error("Model not found for this brand");
    }
  }

  const slug = await generateUniqueSlug({
    title: parsed.title,
    storageGb: parsed.storageGb,
    colour: parsed.colour,
  });

  const availability = parsed.availability ?? "DRAFT";
  const publishedAt = availability === "AVAILABLE" ? new Date() : null;
  const soldAt = availability === "SOLD" ? new Date() : null;

  const searchText = buildSearchText({
    title: parsed.title,
    deviceType: parsed.deviceType,
    variant: parsed.variant,
    storageGb: parsed.storageGb,
    ramGb: parsed.ramGb,
    colour: parsed.colour,
    condition: parsed.condition,
  });

  const product = await db.product.create({
    data: {
      slug,
      brandId: parsed.brandId,
      modelId: parsed.modelId ?? null,
      title: parsed.title,
      deviceType: parsed.deviceType ?? "PHONE",
      variant: parsed.variant ?? null,
      storageGb: parsed.storageGb ?? null,
      ramGb: parsed.ramGb ?? null,
      colour: parsed.colour ?? null,
      pricePaise: parsed.pricePaise,
      mrpPaise: parsed.mrpPaise ?? null,
      condition: parsed.condition,
      conditionNotes: parsed.conditionNotes ?? null,
      batteryType: parsed.batteryType ?? "UNKNOWN",
      batteryPct: parsed.batteryPct ?? null,
      batteryRating: parsed.batteryRating ?? null,
      batteryNote: parsed.batteryNote ?? null,
      warrantyMonths: parsed.warrantyMonths ?? null,
      warrantyNote: parsed.warrantyNote ?? null,
      hasBox: parsed.hasBox ?? false,
      hasCharger: parsed.hasCharger ?? false,
      hasCable: parsed.hasCable ?? false,
      otherAccessories: parsed.otherAccessories ?? [],
      simType: parsed.simType ?? null,
      networkNote: parsed.networkNote ?? null,
      osVersion: parsed.osVersion ?? null,
      description: parsed.description ?? null,
      availability,
      isFeatured: parsed.isFeatured ?? false,
      publishedAt,
      soldAt,
      internalNotes: parsed.internalNotes ?? null,
      deviceRefLast4: parsed.deviceRefLast4 ?? null,
      searchText,
    },
    select: { id: true, slug: true, title: true },
  });

  return product;
}

/**
 * Update an existing product. Partial update — rebuilds searchText.
 * Handles publishedAt/soldAt transitions if availability changes.
 */
export async function updateProduct(id: string, input: ProductInput) {
  const parsed = productInputSchema.parse(input);

  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true, availability: true, publishedAt: true },
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  // Validate brand exists
  const brand = await db.brand.findUnique({ where: { id: parsed.brandId }, select: { id: true } });
  if (!brand) {
    throw new Error("Brand not found");
  }

  // Validate model belongs to brand
  if (parsed.modelId) {
    const model = await db.phoneModel.findUnique({
      where: { id: parsed.modelId },
      select: { id: true, brandId: true },
    });
    if (!model || model.brandId !== parsed.brandId) {
      throw new Error("Model not found for this brand");
    }
  }

  const searchText = buildSearchText({
    title: parsed.title,
    deviceType: parsed.deviceType,
    variant: parsed.variant,
    storageGb: parsed.storageGb,
    ramGb: parsed.ramGb,
    colour: parsed.colour,
    condition: parsed.condition,
  });

  // Compute availability transitions
  const newAvailability = parsed.availability ?? existing.availability;
  let publishedAt = existing.publishedAt;
  let soldAt: Date | null = null;

  if (newAvailability === "AVAILABLE" && !existing.publishedAt) {
    publishedAt = new Date();
  }

  if (newAvailability === "SOLD") {
    soldAt = new Date();
  }

  const product = await db.product.update({
    where: { id },
    data: {
      brandId: parsed.brandId,
      modelId: parsed.modelId ?? null,
      title: parsed.title,
      deviceType: parsed.deviceType ?? "PHONE",
      variant: parsed.variant ?? null,
      storageGb: parsed.storageGb ?? null,
      ramGb: parsed.ramGb ?? null,
      colour: parsed.colour ?? null,
      pricePaise: parsed.pricePaise,
      mrpPaise: parsed.mrpPaise ?? null,
      condition: parsed.condition,
      conditionNotes: parsed.conditionNotes ?? null,
      batteryType: parsed.batteryType ?? "UNKNOWN",
      batteryPct: parsed.batteryPct ?? null,
      batteryRating: parsed.batteryRating ?? null,
      batteryNote: parsed.batteryNote ?? null,
      warrantyMonths: parsed.warrantyMonths ?? null,
      warrantyNote: parsed.warrantyNote ?? null,
      hasBox: parsed.hasBox ?? false,
      hasCharger: parsed.hasCharger ?? false,
      hasCable: parsed.hasCable ?? false,
      otherAccessories: parsed.otherAccessories ?? [],
      simType: parsed.simType ?? null,
      networkNote: parsed.networkNote ?? null,
      osVersion: parsed.osVersion ?? null,
      description: parsed.description ?? null,
      availability: newAvailability,
      isFeatured: parsed.isFeatured ?? false,
      publishedAt,
      soldAt,
      internalNotes: parsed.internalNotes ?? null,
      deviceRefLast4: parsed.deviceRefLast4 ?? null,
      searchText,
    },
    select: { id: true, slug: true, title: true },
  });

  return product;
}

/**
 * Set a product's availability (quick action: mark sold / available / reserved / draft).
 * Handles publishedAt/soldAt timestamps per spec rules.
 */
export async function setAvailability(id: string, availability: Availability) {
  const parsed = availabilityEnum.parse(availability);

  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, availability: true, publishedAt: true, soldAt: true },
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  // No-op if already in the target state
  if (existing.availability === parsed) {
    return { id, slug: existing.slug, availability: parsed, previous: existing.availability };
  }

  let publishedAt = existing.publishedAt;
  let soldAt: Date | null = null;

  if (parsed === "AVAILABLE" && !existing.publishedAt) {
    publishedAt = new Date();
  }

  if (parsed === "SOLD") {
    soldAt = new Date();
  }

  const product = await db.product.update({
    where: { id },
    data: {
      availability: parsed,
      publishedAt,
      soldAt,
    },
    select: { id: true, slug: true, availability: true },
  });

  return { ...product, previous: existing.availability };
}

/**
 * Delete a product. Only DRAFT products can be hard-deleted.
 * SOLD is historical — never casually delete sold listings.
 */
export async function deleteProduct(id: string) {
  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true, availability: true },
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  if (existing.availability !== "DRAFT") {
    throw new Error("Only draft products can be deleted");
  }

  await deleteProductMedia(id);
  await db.product.delete({ where: { id } });

  return { id };
}

/**
 * Duplicate a product — creates a new DRAFT copy.
 * Useful for listing similar phones quickly.
 */
export async function duplicateProduct(id: string) {
  const existing = await db.product.findUnique({
    where: { id },
  });
  if (!existing) {
    throw new Error("Product not found");
  }

  const slug = await generateUniqueSlug({
    title: existing.title,
    storageGb: existing.storageGb,
    colour: existing.colour,
  });

  const copy = await db.product.create({
    data: {
      slug,
      brandId: existing.brandId,
      modelId: existing.modelId,
      title: existing.title,
      deviceType: existing.deviceType,
      variant: existing.variant,
      storageGb: existing.storageGb,
      ramGb: existing.ramGb,
      colour: existing.colour,
      pricePaise: existing.pricePaise,
      mrpPaise: existing.mrpPaise,
      condition: existing.condition,
      conditionNotes: existing.conditionNotes,
      batteryType: existing.batteryType,
      batteryPct: existing.batteryPct,
      batteryRating: existing.batteryRating,
      batteryNote: existing.batteryNote,
      warrantyMonths: existing.warrantyMonths,
      warrantyNote: existing.warrantyNote,
      hasBox: existing.hasBox,
      hasCharger: existing.hasCharger,
      hasCable: existing.hasCable,
      otherAccessories: existing.otherAccessories,
      simType: existing.simType,
      networkNote: existing.networkNote,
      osVersion: existing.osVersion,
      description: existing.description,
      availability: "DRAFT",
      isFeatured: false,
      publishedAt: null,
      soldAt: null,
      internalNotes: existing.internalNotes,
      deviceRefLast4: existing.deviceRefLast4,
      searchText: existing.searchText,
    },
    select: { id: true, slug: true, title: true },
  });

  return copy;
}

/**
 * List all brands for the product form dropdown.
 */
export async function listBrands() {
  const brands = await db.brand.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
  return brands;
}

/**
 * List all models for the cascading model dropdown.
 */
export async function listModels() {
  const models = await db.phoneModel.findMany({
    orderBy: [{ brandId: "asc" }, { name: "asc" }],
    select: { id: true, name: true, brandId: true },
  });
  return models;
}
