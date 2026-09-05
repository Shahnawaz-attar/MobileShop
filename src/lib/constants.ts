/**
 * Application-wide constants.
 * Single source of truth for labels, limits, and fixed taxonomies.
 */

/** Fixed condition taxonomy — shops cannot invent their own in V1 */
export const CONDITION_LABELS = {
  LIKE_NEW: "Like New",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
} as const;

export const CONDITION_DESCRIPTIONS = {
  LIKE_NEW: "Virtually indistinguishable from new. No visible marks or wear.",
  EXCELLENT: "Minimal signs of use. May have faint surface marks only visible under bright light.",
  GOOD: "Normal signs of use. May have light scratches or marks visible at arm's length.",
  FAIR: "Noticeable wear. May have scratches, dents, or discolouration. Fully functional.",
} as const;

/** Battery display states — three honest representations */
export const BATTERY_TYPE_LABELS = {
  PERCENTAGE: "Battery Health",
  RATED: "Battery Rating",
  UNKNOWN: "Battery health: Not measured",
} as const;

export const BATTERY_RATING_LABELS = {
  GOOD: "Good",
  AVERAGE: "Average",
  NEEDS_REPLACEMENT: "Needs Replacement",
} as const;

/** Availability states */
export const AVAILABILITY_LABELS = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
} as const;

/** Device type labels — a shop may sell phones, tablets, and other devices */
export const DEVICE_TYPE_LABELS = {
  PHONE: "Phone",
  TABLET: "Tablet",
  OTHER: "Other Device",
} as const;

/** Media/image constraints */
export const MEDIA_LIMITS = {
  MAX_IMAGES_PER_PRODUCT: 8,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  MAX_DIMENSION_PX: 1600,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "image/heic"] as const,
} as const;

/** Sort options for product listing */
export const SORT_OPTIONS = {
  newest: { label: "Newest First", field: "publishedAt", direction: "desc" },
  price_asc: { label: "Price: Low to High", field: "pricePaise", direction: "asc" },
  price_desc: { label: "Price: High to Low", field: "pricePaise", direction: "desc" },
} as const;

/** Pagination */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 48,
} as const;

/** Rate limiting */
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  ANALYTICS_EVENTS_PER_MINUTE: 30,
  PUSH_ALERTS_PER_DAY: 50,
  PUSH_PRODUCT_LISTED_PER_DAY: 100,
} as const;
