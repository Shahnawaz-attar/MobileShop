-- AlterTable: add optional model selection to brand interest leads
ALTER TABLE "BrandInterest" ADD COLUMN "modelId" TEXT;

-- CreateIndex
CREATE INDEX "BrandInterest_modelId_idx" ON "BrandInterest"("modelId");

-- AddForeignKey
ALTER TABLE "BrandInterest" ADD CONSTRAINT "BrandInterest_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "PhoneModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
