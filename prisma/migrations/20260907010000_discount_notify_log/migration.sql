-- Manual "notify subscribers" log for running offers.
-- Each row = one manual push the owner triggered. Used to enforce the daily
-- manual-send quota (max 3/day, 10am–10pm, spaced out, adapted to the offer's
-- remaining time).

-- CreateTable
CREATE TABLE "DiscountNotifyLog" (
    "id"         TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscountNotifyLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountNotifyLog_createdAt_idx" ON "DiscountNotifyLog"("createdAt");
CREATE INDEX "DiscountNotifyLog_discountId_createdAt_idx" ON "DiscountNotifyLog"("discountId", "createdAt");

-- AddForeignKey
ALTER TABLE "DiscountNotifyLog" ADD CONSTRAINT "DiscountNotifyLog_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
