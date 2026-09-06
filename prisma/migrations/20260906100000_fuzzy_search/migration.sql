-- Fuzzy (typo-tolerant) catalogue search
-- Enables pg_trgm (trigram similarity) + fuzzystrmatch (Levenshtein edit
-- distance) and a small helper used by src/server/modules/catalog/fuzzy.ts.
-- A query like "somsng" / "simisng" / "poxel" now resolves to the right brand
-- or model without false positives on unrelated words.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- typo_match(q, c): does the user query `q` plausibly mean candidate `c`?
--   exact (case-insensitive)
--   OR trigram similarity above 0.25
--   OR Levenshtein edit distance within ~45% of the candidate length
CREATE OR REPLACE FUNCTION typo_match(q text, c text) RETURNS boolean AS $$
  SELECT lower(q) = lower(c)
    OR similarity(lower(q), lower(c)) > 0.25
    OR levenshtein(lower(q), lower(c)) <= GREATEST(1, floor(length(lower(c)) * 0.45)::int)
$$ LANGUAGE sql IMMUTABLE;

-- typo_match_any(q, phrase): does `q` match the whole phrase OR any single word
-- inside it? Handles multi-word titles/models — e.g. "poxel" -> "Pixel 8 Pro",
-- while "apple" never matches "iPhone 13".
CREATE OR REPLACE FUNCTION typo_match_any(q text, phrase text) RETURNS boolean AS $$
  SELECT lower(trim(q)) = lower(trim(phrase))
    OR EXISTS (
      SELECT 1 FROM regexp_split_to_table(lower(phrase), '[^a-z0-9]+') w
      WHERE w <> '' AND typo_match(q, w)
    )
$$ LANGUAGE sql IMMUTABLE;
