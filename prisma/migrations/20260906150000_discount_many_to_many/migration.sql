-- Rebuild Discount as many-to-many (multi-brand OR multi-product per discount).
-- NOTE: the prior single-target Discount migration (20260906140000) was removed
-- from history, so this migration must create Discount from scratch (no DROP).

-- CreateTable
CREATE TABLE "Discount" (
    "id"        TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "percent"   INTEGER NOT NULL,
    "startsAt"  TIMESTAMP(3) NOT NULL,
    "endsAt"    TIMESTAMP(3) NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountBrand" (
    "id"         TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "brandId"    TEXT NOT NULL,
    CONSTRAINT "DiscountBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountProduct" (
    "id"         TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "productId"  TEXT NOT NULL,
    CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountBrand_discountId_brandId_key" ON "DiscountBrand"("discountId", "brandId");
CREATE INDEX "DiscountBrand_brandId_idx" ON "DiscountBrand"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountProduct_discountId_productId_key" ON "DiscountProduct"("discountId", "productId");
CREATE INDEX "DiscountProduct_productId_idx" ON "DiscountProduct"("productId");

-- CreateIndex
CREATE INDEX "Discount_isActive_startsAt_endsAt_idx" ON "Discount"("isActive", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "DiscountBrand" ADD CONSTRAINT "DiscountBrand_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountBrand" ADD CONSTRAINT "DiscountBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscountProduct" ADD CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
