CREATE TYPE "PayoutStatus" AS ENUM ('NOT_READY', 'PENDING', 'PAID', 'HOLD');

ALTER TABLE "Booking"
ADD COLUMN "platformFee" DECIMAL(10,2),
ADD COLUMN "sellerEarnings" DECIMAL(10,2),
ADD COLUMN "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NOT_READY',
ADD COLUMN "payoutAt" TIMESTAMP(3);

UPDATE "Booking"
SET
  "platformFee" = ROUND(("totalPrice" * 0.10)::numeric, 2),
  "sellerEarnings" = ROUND(("totalPrice" - ("totalPrice" * 0.10))::numeric, 2),
  "payoutStatus" = CASE
    WHEN "status" = 'COMPLETED' THEN 'PENDING'::"PayoutStatus"
    WHEN "status" = 'DISPUTED' THEN 'HOLD'::"PayoutStatus"
    ELSE 'NOT_READY'::"PayoutStatus"
  END;

CREATE INDEX "Booking_payoutStatus_idx" ON "Booking"("payoutStatus");
