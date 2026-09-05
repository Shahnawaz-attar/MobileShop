-- Redesign BrandInterest to capture free-text device (no brand/model FK selection)
-- Drop old foreign keys and columns, add the free-text "device" column.
ALTER TABLE "BrandInterest" DROP CONSTRAINT IF EXISTS "BrandInterest_brandId_fkey";
ALTER TABLE "BrandInterest" DROP CONSTRAINT IF EXISTS "BrandInterest_modelId_fkey";
DROP INDEX IF EXISTS "BrandInterest_brandId_idx";
DROP INDEX IF EXISTS "BrandInterest_modelId_idx";

ALTER TABLE "BrandInterest" DROP COLUMN IF EXISTS "brandId";
ALTER TABLE "BrandInterest" DROP COLUMN IF EXISTS "modelId";
ALTER TABLE "BrandInterest" ADD COLUMN "device" TEXT NOT NULL DEFAULT '';
