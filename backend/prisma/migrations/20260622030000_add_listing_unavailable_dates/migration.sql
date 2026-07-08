CREATE TYPE "UnavailableDateType" AS ENUM ('SELLER_BLOCKED', 'BOOKING');

CREATE TABLE "ListingUnavailableDate" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "type" "UnavailableDateType" NOT NULL DEFAULT 'SELLER_BLOCKED',
  "bookingId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ListingUnavailableDate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingUnavailableDate_listingId_idx" ON "ListingUnavailableDate"("listingId");
CREATE INDEX "ListingUnavailableDate_listingId_startDate_endDate_idx" ON "ListingUnavailableDate"("listingId", "startDate", "endDate");
CREATE INDEX "ListingUnavailableDate_bookingId_idx" ON "ListingUnavailableDate"("bookingId");

ALTER TABLE "ListingUnavailableDate"
ADD CONSTRAINT "ListingUnavailableDate_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
