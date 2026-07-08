CREATE TYPE "ReviewRole" AS ENUM ('RENTER', 'SELLER');

CREATE TABLE "Review" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "reviewerEmail" TEXT NOT NULL,
  "revieweeEmail" TEXT NOT NULL,
  "reviewerRole" "ReviewRole" NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_bookingId_reviewerRole_key" ON "Review"("bookingId", "reviewerRole");
CREATE INDEX "Review_bookingId_idx" ON "Review"("bookingId");
CREATE INDEX "Review_revieweeEmail_idx" ON "Review"("revieweeEmail");
CREATE INDEX "Review_reviewerEmail_idx" ON "Review"("reviewerEmail");

ALTER TABLE "Review"
ADD CONSTRAINT "Review_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
