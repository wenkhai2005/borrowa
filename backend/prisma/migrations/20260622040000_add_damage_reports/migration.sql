ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

CREATE TYPE "DamageReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

CREATE TABLE "DamageReport" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "sellerEmail" TEXT NOT NULL,
  "renterEmail" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "claimAmount" DECIMAL(10,2),
  "imageUrls" JSONB,
  "status" "DamageReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DamageReport_bookingId_idx" ON "DamageReport"("bookingId");
CREATE INDEX "DamageReport_sellerEmail_idx" ON "DamageReport"("sellerEmail");
CREATE INDEX "DamageReport_renterEmail_idx" ON "DamageReport"("renterEmail");

ALTER TABLE "DamageReport"
ADD CONSTRAINT "DamageReport_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
