-- CreateTable
CREATE TABLE "BrandInterest" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandInterest_brandId_idx" ON "BrandInterest"("brandId");

-- CreateIndex
CREATE INDEX "BrandInterest_createdAt_idx" ON "BrandInterest"("createdAt");

-- AddForeignKey
ALTER TABLE "BrandInterest" ADD CONSTRAINT "BrandInterest_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
