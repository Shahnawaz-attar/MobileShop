-- Add the owner-chosen homepage hero product flag.
ALTER TABLE "Product"
ADD COLUMN "isHero" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Product_isHero_idx" ON "Product"("isHero");
