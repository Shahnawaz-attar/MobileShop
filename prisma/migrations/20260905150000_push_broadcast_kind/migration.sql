-- CreateEnum
CREATE TYPE "PushBroadcastKind" AS ENUM ('MANUAL', 'PRODUCT', 'ANNOUNCEMENT');

-- AlterTable
ALTER TABLE "PushBroadcast" ADD COLUMN "kind" "PushBroadcastKind" NOT NULL DEFAULT 'MANUAL';

-- CreateIndex
CREATE INDEX "PushBroadcast_kind_createdAt_idx" ON "PushBroadcast"("kind", "createdAt");
