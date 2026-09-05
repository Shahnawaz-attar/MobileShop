import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local first, fallback to .env
config({ path: ".env.local" });
config({ path: ".env" });

/** Neon pooler URLs often fail migrations (P1001) — use direct host when unset. */
function migrationDatabaseUrl(): string {
  const direct = process.env.DIRECT_URL;
  if (direct) return direct;

  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("-pooler.")) {
    return url.replace("-pooler.", ".");
  }
  return env("DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
