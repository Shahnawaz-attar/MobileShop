"use server";

import { headers } from "next/headers";
import { signIn, signOut } from "@/server/auth";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { RATE_LIMITS } from "@/lib/constants";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function loginAction(
  _prevState: ActionResult<null> | null,
  formData: FormData
): Promise<ActionResult<null>> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
      code: "VALIDATION_ERROR",
    };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const limitKey = `login:${ip}:${parsed.data.email.toLowerCase()}`;
  const windowMs = RATE_LIMITS.LOGIN_WINDOW_MINUTES * 60 * 1000;

  if (isRateLimited(limitKey, RATE_LIMITS.LOGIN_ATTEMPTS)) {
    return {
      success: false,
      error: "Too many login attempts. Try again in 15 minutes.",
      code: "RATE_LIMITED",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });

    // signIn throws a NEXT_REDIRECT on success, so this line
    // is only reached if something unexpected happens
    return { success: true, data: null };
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT on success — re-throw it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    recordAttempt(limitKey, windowMs);

    return {
      success: false,
      error: "Invalid email or password",
      code: "UNAUTHORIZED",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
