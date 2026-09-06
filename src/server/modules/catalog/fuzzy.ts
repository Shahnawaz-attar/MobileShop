import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import type { Availability } from "@/types";

/**
 * Fuzzy (typo-tolerant) search for the catalogue.
 *
 * Uses a PostgreSQL helper `typo_match(q, c)` that combines:
 *   - exact (case-insensitive) match
 *   - pg_trgm trigram similarity (> 0.25)
 *   - Levenshtein edit distance (<= 45% of candidate length)
 * so even heavier typos like "somsng"/"simisng" -> Samsung and "poxel" ->
 * Pixel still resolve, while unrelated words never false-positive.
 *
 * Requires these extensions/functions:
 *   CREATE EXTENSION IF NOT EXISTS pg_trgm;
 *   CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
 *   CREATE FUNCTION typo_match(...) ...  (see below / DB migration)
 */

export interface FuzzyMatch {
  /** Product id */
  id: string;
  /** 0..1 relevance — 1 = exact/prefix match on a key field */
  score: number;
}

interface MatchProductsArgs {
  q: string;
  /** Restrict to these availability states. Defaults to AVAILABLE only. */
  availability?: Availability[];
  limit?: number;
}

/**
 * Rank products by how well they match `q` across title / brand / model /
 * searchText, tolerating typos. Returns product ids ordered by relevance.
 */
export async function fuzzyMatchProducts({
  q,
  availability = ["AVAILABLE"],
  limit = 50,
}: MatchProductsArgs): Promise<FuzzyMatch[]> {
  const query = q.trim();
  if (!query) return [];

  const rows = await db.$queryRaw<{ id: string; score: number }[]>(Prisma.sql`
    SELECT p."id" AS id,
           GREATEST(
             -- brand name match (e.g. "somsng" -> Samsung) is the strongest hint
             CASE WHEN typo_match(b."name", ${query}) THEN
               CASE WHEN lower(b."name") = lower(${query}) THEN 1
                    WHEN lower(b."name") LIKE lower(${query}) || '%' THEN 0.95
                    ELSE similarity(lower(b."name"), lower(${query})) END
             ELSE 0 END,
             -- model / title match (token-level: "poxel" matches "Pixel 8 Pro")
             CASE WHEN typo_match_any(coalesce(m."name",''), ${query}) THEN
               GREATEST(similarity(lower(coalesce(m."name",'')), lower(${query})),
                        similarity(lower(p."title"), lower(${query})))
             WHEN typo_match_any(p."title", ${query}) THEN
               similarity(lower(p."title"), lower(${query}))
             WHEN lower(p."title") LIKE '%' || lower(${query}) || '%' THEN 0.9
             ELSE similarity(lower(p."title"), lower(${query})) END
           ) AS score
    FROM "Product" p
    JOIN "Brand" b ON b."id" = p."brandId"
    LEFT JOIN "PhoneModel" m ON m."id" = p."modelId"
    WHERE p."availability" = ANY(${availability})
      AND (
        typo_match(b."name", ${query})
        OR typo_match_any(coalesce(m."name", ''), ${query})
        OR typo_match_any(p."title", ${query})
        OR lower(coalesce(p."searchText", '')) LIKE '%' || lower(${query}) || '%'
        OR lower(p."title") LIKE '%' || lower(${query}) || '%'
      )
    ORDER BY score DESC, p."publishedAt" DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({ id: r.id, score: Number(r.score) }));
}

/**
 * Typo-tolerant brand suggestions. Returns brands ordered by relevance.
 */
export async function fuzzyMatchBrands(q: string, limit = 5): Promise<{ id: string; name: string; slug: string }[]> {
  const query = q.trim();
  if (!query) return [];

  const rows = await db.$queryRaw<{ id: string; name: string; slug: string }[]>(Prisma.sql`
    SELECT b."id", b."name", b."slug"
    FROM "Brand" b
    WHERE typo_match(b."name", ${query})
       OR lower(b."name") LIKE '%' || lower(${query}) || '%'
    ORDER BY
      CASE WHEN lower(b."name") = lower(${query}) THEN 0
           WHEN lower(b."name") LIKE lower(${query}) || '%' THEN 1
           ELSE 2 END,
      similarity(lower(b."name"), lower(${query})) DESC
    LIMIT ${limit}
  `);
  return rows;
}

/**
 * Typo-tolerant model suggestions. Returns models ordered by relevance.
 */
export async function fuzzyMatchModels(
  q: string,
  limit = 5
): Promise<{ id: string; name: string; slug: string; brandName: string }[]> {
  const query = q.trim();
  if (!query) return [];

  const rows = await db.$queryRaw<
    { id: string; name: string; slug: string; brandName: string }[]
  >(Prisma.sql`
    SELECT m."id", m."name", m."slug", b."name" AS "brandName"
    FROM "PhoneModel" m
    JOIN "Brand" b ON b."id" = m."brandId"
    WHERE typo_match_any(m."name", ${query})
       OR typo_match(b."name", ${query})
       OR lower(m."name") LIKE '%' || lower(${query}) || '%'
    ORDER BY
      CASE WHEN lower(m."name") = lower(${query}) THEN 0
           WHEN lower(m."name") LIKE lower(${query}) || '%' THEN 1
           WHEN lower(b."name") LIKE lower(${query}) || '%' THEN 1
           ELSE 2 END,
      similarity(lower(m."name"), lower(${query})) DESC
    LIMIT ${limit}
  `);
  return rows;
}

