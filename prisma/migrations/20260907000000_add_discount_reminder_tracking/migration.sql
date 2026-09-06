-- Add push-reminder tracking to Discount:
--   lastReminderDate — start-of-day (UTC) of the last daily reminder sent,
--                      so multi-day offers notify subscribers at most 1/day.
--   remindersSent    — total reminders already broadcast, so offers that run
--                      ≤ 1 day are capped at 2 per subscriber.

-- AlterTable
ALTER TABLE "Discount" ADD COLUMN "lastReminderDate" TIMESTAMP(3),
ADD COLUMN "remindersSent" INTEGER NOT NULL DEFAULT 0;
