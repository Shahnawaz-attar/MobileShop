-- AlterTable
ALTER TABLE "PhoneModel" ADD COLUMN "deviceType" "DeviceType" NOT NULL DEFAULT 'PHONE';

-- Infer from existing listings so iPads/tabs are not listed under Phone.
UPDATE "PhoneModel" AS pm
SET "deviceType" = p."deviceType"
FROM "Product" AS p
WHERE p."modelId" = pm.id
  AND p."deviceType" <> 'PHONE';

-- CreateIndex
CREATE INDEX "PhoneModel_brandId_deviceType_idx" ON "PhoneModel"("brandId", "deviceType");
