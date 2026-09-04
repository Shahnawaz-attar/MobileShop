-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('PHONE', 'TABLET', 'OTHER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "deviceType" "DeviceType" NOT NULL DEFAULT 'PHONE';
