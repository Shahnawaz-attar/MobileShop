import { z } from "zod";

/**
 * Server-side environment variables validated at startup.
 * If any required variable is missing or invalid, the app fails fast
 * with a readable error listing ALL problems — not just the first one.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  ANALYTICS_SALT: z.string().min(16, "ANALYTICS_SALT must be at least 16 characters").optional(),
  VAPID_PRIVATE_KEY: z.string().min(20).optional(),
  VAPID_SUBJECT: z.string().min(3).optional(),
  ALLOW_SEED: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

/**
 * Client-side environment variables (NEXT_PUBLIC_ prefix).
 * These are embedded in the client bundle at build time.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(20).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/** Vercel injects VERCEL_URL at build; custom domain still belongs in NEXT_PUBLIC_APP_URL. */
function resolveAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}

function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    ...process.env,
    NEXT_PUBLIC_APP_URL: resolveAppUrl(),
  });

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nCheck .env.local against .env.example\n`
    );
  }

  return result.data;
}

/**
 * Validated server environment — import this instead of using process.env directly.
 * Fails fast on startup if any required variable is missing.
 */
export const env = validateEnv();

/**
 * Client-safe environment variables.
 * Only includes NEXT_PUBLIC_ prefixed variables.
 */
export const clientEnv: ClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: resolveAppUrl(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
});
