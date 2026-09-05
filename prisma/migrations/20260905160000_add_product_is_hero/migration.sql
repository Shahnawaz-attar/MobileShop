-- Migration: add_product_is_hero
-- Run this in the Neon SQL editor (or psql) to add the isHero column.
-- The Prisma schema + code are already updated and expect this column.

ALTER TABLE "Product"
ADD COLUMN "isHero" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Product_isHero_idx" ON "Product"("isHero");
