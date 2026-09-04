/**
 * Slug utilities — product slug generation.
 *
 * Slug format per spec: title + storage + colour + short random suffix.
 * Example: "iphone-15-128gb-blue-a1b2"
 *
 * The random suffix guarantees uniqueness without leaking a sequential ID.
 */

/**
 * Convert an arbitrary string into a URL-safe slug segment.
 * Lowercases, strips diacritics, removes punctuation, collapses whitespace.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Generate a short random suffix (e.g., "a1b2") for slug uniqueness.
 * Uses crypto-safe random values where available.
 */
export function randomSuffix(length = 4): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i]! % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }

  return result;
}

interface BuildProductSlugInput {
  title: string;
  storageGb?: number | null;
  colour?: string | null;
}

/**
 * Build a product slug from title + storage + colour + random suffix.
 *
 * Example:
 *   { title: "iPhone 15", storageGb: 128, colour: "Blue" }
 *   → "iphone-15-128gb-blue-a1b2"
 *
 * Storage and colour are only appended if they are NOT already present in
 * the title (avoids duplicates like "ipad-64gb-blue-64gb-blue").
 */
export function buildProductSlug(input: BuildProductSlugInput): string {
  const titleSlug = slugify(input.title);
  const parts: string[] = [titleSlug];

  if (input.storageGb != null) {
    const storageToken = `${input.storageGb}gb`;
    // Only append if the title doesn't already contain a storage token like "64gb" or "64-gb"
    if (!titleSlug.includes(storageToken) && !titleSlug.includes(`${input.storageGb}-gb`)) {
      parts.push(storageToken);
    }
  }

  if (input.colour) {
    const colourSlug = slugify(input.colour);
    // Only append if the title doesn't already mention this colour
    if (colourSlug && !titleSlug.split("-").includes(colourSlug)) {
      parts.push(colourSlug);
    }
  }

  const base = parts.filter(Boolean).join("-");
  const suffix = randomSuffix();

  return `${base}-${suffix}`;
}

/**
 * Generate a slug for a brand or model name.
 * Used when creating new models/brands (future phases).
 */
export function generateSlug(input: string): string {
  const slug = slugify(input);
  return slug || randomSuffix(6);
}
