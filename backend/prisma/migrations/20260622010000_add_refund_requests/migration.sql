CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED');

ALTER TABLE "Booking"
ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN "refundRespondedAt" TIMESTAMP(3),
ADD COLUMN "refundResponseNote" TEXT;

CREATE INDEX "Booking_refundStatus_idx" ON "Booking"("refundStatus");
