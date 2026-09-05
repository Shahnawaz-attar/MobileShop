"use server";

import { requireOwner } from "@/server/auth/guards";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { notifyAnnouncementLive } from "@/server/modules/notify";

// ─── Schemas ────────────────────────────────────────────────────────

const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  body: z.string().max(500).optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  ctaHref: z.string().max(500).optional().nullable().or(z.literal("")),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean(),
});

const TestimonialSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(100),
  text: z.string().min(1, "Testimonial text is required").max(1000),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

// ─── Announcement Actions ───────────────────────────────────────────

export async function createAnnouncementAction(
  input: z.infer<typeof AnnouncementSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = AnnouncementSchema.parse(input);

    const announcement = await db.announcement.create({
      data: {
        title: parsed.title,
        body: parsed.body || null,
        ctaLabel: parsed.ctaLabel || null,
        ctaHref: parsed.ctaHref || null,
        startsAt: parsed.startsAt || null,
        endsAt: parsed.endsAt || null,
        isActive: parsed.isActive,
      },
    });

    revalidatePath("/", "layout");
    if (announcement.isActive) {
      await notifyAnnouncementLive({ title: announcement.title });
    }
    return { success: true, data: { id: announcement.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError ? firstError.message : "Validation failed", code: "VALIDATION_ERROR" };
    }
    console.error("createAnnouncementAction error:", error);
    return { success: false, error: "Failed to create announcement", code: "INTERNAL" };
  }
}

export async function updateAnnouncementAction(
  id: string,
  input: z.infer<typeof AnnouncementSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = AnnouncementSchema.parse(input);

    const existing = await db.announcement.findUnique({
      where: { id },
      select: { isActive: true },
    });

    const announcement = await db.announcement.update({
      where: { id },
      data: {
        title: parsed.title,
        body: parsed.body || null,
        ctaLabel: parsed.ctaLabel || null,
        ctaHref: parsed.ctaHref || null,
        startsAt: parsed.startsAt || null,
        endsAt: parsed.endsAt || null,
        isActive: parsed.isActive,
      },
    });

    revalidatePath("/", "layout");
    if (!existing?.isActive && announcement.isActive) {
      await notifyAnnouncementLive({ title: announcement.title });
    }
    return { success: true, data: { id: announcement.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError ? firstError.message : "Validation failed", code: "VALIDATION_ERROR" };
    }
    console.error("updateAnnouncementAction error:", error);
    return { success: false, error: "Failed to update announcement", code: "INTERNAL" };
  }
}

export async function deleteAnnouncementAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await db.announcement.delete({ where: { id } });
    revalidatePath("/", "layout");
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteAnnouncementAction error:", error);
    return { success: false, error: "Failed to delete announcement", code: "INTERNAL" };
  }
}

export async function toggleAnnouncementAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    const announcement = await db.announcement.update({
      where: { id },
      data: { isActive },
      select: { title: true },
    });
    revalidatePath("/", "layout");
    if (isActive) {
      await notifyAnnouncementLive({ title: announcement.title });
    }
    return { success: true, data: null };
  } catch (error) {
    console.error("toggleAnnouncementAction error:", error);
    return { success: false, error: "Failed to toggle announcement", code: "INTERNAL" };
  }
}

// ─── Testimonial Actions ────────────────────────────────────────────

export async function createTestimonialAction(
  input: z.infer<typeof TestimonialSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = TestimonialSchema.parse(input);

    const testimonial = await db.testimonial.create({
      data: {
        customerName: parsed.customerName,
        text: parsed.text,
        isPublished: parsed.isPublished,
        sortOrder: parsed.sortOrder,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: { id: testimonial.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError ? firstError.message : "Validation failed", code: "VALIDATION_ERROR" };
    }
    console.error("createTestimonialAction error:", error);
    return { success: false, error: "Failed to create testimonial", code: "INTERNAL" };
  }
}

export async function updateTestimonialAction(
  id: string,
  input: z.infer<typeof TestimonialSchema>
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireOwner();
    const parsed = TestimonialSchema.parse(input);

    const testimonial = await db.testimonial.update({
      where: { id },
      data: {
        customerName: parsed.customerName,
        text: parsed.text,
        isPublished: parsed.isPublished,
        sortOrder: parsed.sortOrder,
      },
    });

    revalidatePath("/", "layout");
    return { success: true, data: { id: testimonial.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { success: false, error: firstError ? firstError.message : "Validation failed", code: "VALIDATION_ERROR" };
    }
    console.error("updateTestimonialAction error:", error);
    return { success: false, error: "Failed to update testimonial", code: "INTERNAL" };
  }
}

export async function deleteTestimonialAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await db.testimonial.delete({ where: { id } });
    revalidatePath("/", "layout");
    return { success: true, data: null };
  } catch (error) {
    console.error("deleteTestimonialAction error:", error);
    return { success: false, error: "Failed to delete testimonial", code: "INTERNAL" };
  }
}

export async function toggleTestimonialAction(
  id: string,
  isPublished: boolean
): Promise<ActionResult<null>> {
  try {
    await requireOwner();
    await db.testimonial.update({ where: { id }, data: { isPublished } });
    revalidatePath("/", "layout");
    return { success: true, data: null };
  } catch (error) {
    console.error("toggleTestimonialAction error:", error);
    return { success: false, error: "Failed to toggle testimonial", code: "INTERNAL" };
  }
}
