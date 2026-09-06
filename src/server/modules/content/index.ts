import { cache } from "react";
import { db } from "@/server/db/client";

// ─── Announcement Queries ────────────────────────────────────────────

/**
 * Get the currently active announcement (for public website banner).
 * Returns null if no announcement is active or within its date window.
 * Wrapped in `cache()` so the banner data is fetched once per request.
 */
export const getActiveAnnouncement = cache(async () => {
  const now = new Date();

  return db.announcement.findFirst({
    where: {
      isActive: true,
      OR: [
        { startsAt: null, endsAt: null },
        { startsAt: null, endsAt: { gte: now } },
        { startsAt: { lte: now }, endsAt: null },
        { startsAt: { lte: now }, endsAt: { gte: now } },
      ],
    },
    orderBy: { id: "desc" },
  });
});

/**
 * List all announcements for admin management (newest first).
 */
export async function listAnnouncements() {
  return db.announcement.findMany({
    orderBy: { id: "desc" },
  });
}

/**
 * Get a single announcement by ID.
 */
export async function getAnnouncement(id: string) {
  return db.announcement.findUnique({ where: { id } });
}

// ─── Testimonial Queries ────────────────────────────────────────────

/**
 * List published testimonials for the public website.
 */
export async function listPublicTestimonials() {
  return db.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * List all testimonials for admin management.
 */
export async function listTestimonials() {
  return db.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Get a single testimonial by ID.
 */
export async function getTestimonial(id: string) {
  return db.testimonial.findUnique({ where: { id } });
}
