/**
 * Shared TypeScript types for public DTOs and form inputs.
 * These types are used across server and client boundaries.
 *
 * IMPORTANT: Public types must NEVER expose private fields
 * (passwordHash, internalNotes, deviceRefLast4, etc.)
 */

/** Condition enum — matches Prisma enum */
export type Condition = "LIKE_NEW" | "EXCELLENT" | "GOOD" | "FAIR";

/** Device type enum — matches Prisma enum. Drives which fields are relevant. */
export type DeviceType = "PHONE" | "TABLET" | "OTHER";

/** Availability enum — matches Prisma enum */
export type Availability = "DRAFT" | "AVAILABLE" | "RESERVED" | "SOLD";

/** Battery type enum — matches Prisma enum */
export type BatteryType = "PERCENTAGE" | "RATED" | "UNKNOWN";

/** Battery rating enum — matches Prisma enum */
export type BatteryRating = "GOOD" | "AVERAGE" | "NEEDS_REPLACEMENT";

/** Media kind enum — matches Prisma enum */
export type MediaKind =
  | "FRONT"
  | "BACK"
  | "SIDE"
  | "SCREEN"
  | "SCREEN_OFF"
  | "CAMERA"
  | "BATTERY_SCREEN"
  | "BOX"
  | "ACCESSORY"
  | "DAMAGE"
  | "OTHER";

/** Sort options for product listing */
export type SortOption = "newest" | "price_asc" | "price_desc";

/** Public product card — safe for listing pages */
export interface PublicProductCard {
  id: string;
  slug: string;
  title: string;
  variant: string | null;
  storageGb: number | null;
  ramGb: number | null;
  colour: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  condition: Condition;
  availability: Availability;
  isFeatured: boolean;
  publishedAt: Date | null;
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  brandName: string;
  brandSlug: string;
}

/** Public product detail — safe for product detail page */
export interface PublicProductDetail extends PublicProductCard {
  conditionNotes: string | null;
  batteryType: BatteryType;
  batteryPct: number | null;
  batteryRating: BatteryRating | null;
  batteryNote: string | null;
  warrantyMonths: number | null;
  warrantyNote: string | null;
  hasBox: boolean;
  hasCharger: boolean;
  hasCable: boolean;
  otherAccessories: string[];
  simType: string | null;
  networkNote: string | null;
  osVersion: string | null;
  description: string | null;
  modelName: string | null;
  soldAt: Date | null;
  images: PublicMedia[];
}

/** Public media — safe for client display */
export interface PublicMedia {
  id: string;
  kind: MediaKind;
  url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt: string | null;
  sortOrder: number;
}

/** Public shop info — safe for display on public pages */
export interface PublicShopInfo {
  name: string;
  slug: string;
  tagline: string | null;
  about: string | null;
  logoUrl: string | null;
  footerLogoUrl: string | null;
  dashboardLogoUrl: string | null;
  coverUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  hours: Record<string, string>;
  yearsInBiz: number | null;
  trustBadges: string[];
  policies: Record<string, string>;
  isActive: boolean;
}

/** Product filter params — from URL search params */
export interface ProductFilters {
  q?: string;
  brandSlug?: string;
  minPaise?: number;
  maxPaise?: number;
  condition?: Condition[];
  storageGb?: number[];
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}

/** Admin product card — for the admin product list (may include private fields) */
export interface AdminProductCard {
  id: string;
  slug: string;
  title: string;
  deviceType: DeviceType;
  storageGb: number | null;
  colour: string | null;
  pricePaise: number;
  condition: Condition;
  availability: Availability;
  isFeatured: boolean;
  publishedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  brandName: string;
  modelName: string | null;
  primaryImageUrl: string | null;
  imageCount: number;
}

/** Admin product detail — full detail for the edit form (includes private fields) */
export interface AdminProductDetail {
  id: string;
  slug: string;
  brandId: string;
  modelId: string | null;
  title: string;
  deviceType: DeviceType;
  variant: string | null;
  storageGb: number | null;
  ramGb: number | null;
  colour: string | null;
  pricePaise: number;
  mrpPaise: number | null;
  condition: Condition;
  conditionNotes: string | null;
  batteryType: BatteryType;
  batteryPct: number | null;
  batteryRating: BatteryRating | null;
  batteryNote: string | null;
  warrantyMonths: number | null;
  warrantyNote: string | null;
  hasBox: boolean;
  hasCharger: boolean;
  hasCable: boolean;
  otherAccessories: string[];
  simType: string | null;
  networkNote: string | null;
  osVersion: string | null;
  description: string | null;
  availability: Availability;
  isFeatured: boolean;
  internalNotes: string | null;
  deviceRefLast4: string | null;
  media: {
    id: string;
    url: string;
    kind: MediaKind;
    sortOrder: number;
  }[];
}

/** Create product input — validated by Zod on the server */
export interface CreateProductInput {
  brandId: string;
  modelId?: string | null;
  title: string;
  deviceType?: DeviceType;
  variant?: string | null;
  storageGb?: number | null;
  ramGb?: number | null;
  colour?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  condition: Condition;
  conditionNotes?: string | null;
  batteryType?: BatteryType;
  batteryPct?: number | null;
  batteryRating?: BatteryRating | null;
  batteryNote?: string | null;
  warrantyMonths?: number | null;
  warrantyNote?: string | null;
  hasBox?: boolean;
  hasCharger?: boolean;
  hasCable?: boolean;
  otherAccessories?: string[];
  simType?: string | null;
  networkNote?: string | null;
  osVersion?: string | null;
  description?: string | null;
  availability?: Availability;
  isFeatured?: boolean;
  internalNotes?: string | null;
  deviceRefLast4?: string | null;
}

/** Update product input — all fields optional (partial update) */
export type UpdateProductInput = Partial<CreateProductInput>;

/** Admin product list filters */
export interface AdminProductFilters {
  availability?: Availability;
  q?: string;
  cursor?: string;
  limit?: number;
}

/** Paginated admin product list result */
export interface AdminProductListResult {
  products: AdminProductCard[];
  nextCursor: string | null;
  total: number;
}

/** Brand option — for the product form brand dropdown */
export interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

/** Model option — filtered by brand + device type */
export interface ModelOption {
  id: string;
  name: string;
  brandId: string;
  deviceType: DeviceType;
}

/** Owner insights — weekly interest, never expose sessionHash or raw event rows */
export interface OwnerInsightsTotals {
  productViews: number;
  whatsappClicks: number;
  callClicks: number;
  searches: number;
  directionsClicks: number;
  shareClicks: number;
  qrScans: number;
}

export interface ProductInterestRow {
  productId: string;
  title: string;
  viewCount: number;
  whatsappClicks: number;
}

export interface OwnerInsights {
  weekStartsAt: Date;
  totals: OwnerInsightsTotals;
  products: ProductInterestRow[];
}

/** API result wrapper — typed success/error pattern */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

/** Error codes — never expose internals */
export type ErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UPLOAD_FAILED"
  | "UPLOAD_SIGN_ERROR"
  | "ATTACH_MEDIA_ERROR"
  | "REORDER_MEDIA_ERROR"
  | "DELETE_MEDIA_ERROR"
  | "INTERNAL";
