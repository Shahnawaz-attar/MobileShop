"use server";

import { requireOwner } from "@/server/auth/guards";
import {
  createProduct,
  updateProduct,
  setAvailability,
  deleteProduct,
  duplicateProduct,
  listAdminProducts,
  listPublicProducts,
  createBrand,
  createModel,
  type ProductInput,
  type PublicFilters,
  type AdminFilters,
} from "@/server/modules/catalog";
import { formatINR } from "@/lib/money";
import { AVAILABILITY_LABELS, CONDITION_LABELS, DEVICE_TYPE_LABELS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { ActionResult, Availability, BrandOption, DeviceType, ModelOption } from "@/types";

/**
 * Catalog Server Actions — thin wrappers over catalog services.
 *
 * Every action follows the pipeline:
 *   requireOwner() → service → revalidate → typed result
 */

export async function loadMoreAdminProductsAction(
  filters: Omit<AdminFilters, "cursor" | "limit">,
  cursor: string | undefined
) {
  await requireOwner();
  const { products, nextCursor } = await listAdminProducts({
    ...filters,
    cursor,
    limit: 20,
  });

  return {
    products: products.map((p) => ({
      ...p,
      price: formatINR(p.pricePaise),
      conditionLabel: CONDITION_LABELS[p.condition],
      availabilityLabel: AVAILABILITY_LABELS[p.availability],
      deviceTypeLabel: DEVICE_TYPE_LABELS[p.deviceType],
    })),
    nextCursor,
  };
}

export async function loadMorePublicProductsAction(
  filters: PublicFilters
) {
  // Public access, no requireOwner()
  const { products, nextCursor } = await listPublicProducts(filters);

  return {
    products: products.map((p) => ({
      ...p,
      price: formatINR(p.pricePaise),
      mrp: p.mrpPaise ? formatINR(p.mrpPaise) : null,
      conditionLabel: CONDITION_LABELS[p.condition],
    })),
    nextCursor,
  };
}

// --- Create Product ---

export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<{ id: string; slug: string; title: string }>> {
  try {
    await requireOwner();
    const product = await createProduct(input);
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
      code: "VALIDATION_ERROR",
    };
  }
}

// --- Update Product ---

export async function updateProductAction(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ id: string; slug: string; title: string }>> {
  try {
    await requireOwner();
    const product = await updateProduct(id, input);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}/edit`);
    revalidatePath(`/phones/${product.slug}`);
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return { success: false, error: "Product not found", code: "NOT_FOUND" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
      code: "VALIDATION_ERROR",
    };
  }
}

// --- Set Availability (quick action) ---

export async function setAvailabilityAction(
  id: string,
  availability: Availability
): Promise<
  ActionResult<{ id: string; slug: string; availability: Availability; previous: Availability }>
> {
  try {
    await requireOwner();
    const product = await setAvailability(id, availability);
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return { success: false, error: "Product not found", code: "NOT_FOUND" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update availability",
      code: "INTERNAL",
    };
  }
}

// --- Delete Product (DRAFT only) ---

export async function deleteProductAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await deleteProduct(id);
    revalidatePath("/admin/products");
    return { success: true, data: null };
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return { success: false, error: "Product not found", code: "NOT_FOUND" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
      code: "INTERNAL",
    };
  }
}

// --- Duplicate Product ---

export async function duplicateProductAction(
  id: string
): Promise<ActionResult<{ id: string; slug: string; title: string }>> {
  try {
    await requireOwner();
    const product = await duplicateProduct(id);
    revalidatePath("/admin/products");
    return { success: true, data: product };
  } catch (error) {
    if (error instanceof Error && error.message === "Product not found") {
      return { success: false, error: "Product not found", code: "NOT_FOUND" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to duplicate product",
      code: "INTERNAL",
    };
  }
}

export async function createBrandAction(
  name: string
): Promise<ActionResult<BrandOption>> {
  try {
    await requireOwner();
    const brand = await createBrand({ name });
    revalidatePath("/admin/products");
    return { success: true, data: brand };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add brand",
      code: "VALIDATION_ERROR",
    };
  }
}

export async function createModelAction(
  input: { brandId: string; name: string; deviceType: DeviceType }
): Promise<ActionResult<ModelOption>> {
  try {
    await requireOwner();
    const model = await createModel(input);
    revalidatePath("/admin/products");
    return { success: true, data: model };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add model",
      code: "VALIDATION_ERROR",
    };
  }
}
