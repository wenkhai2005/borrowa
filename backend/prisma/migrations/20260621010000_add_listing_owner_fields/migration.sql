ALTER TABLE "Listing"
ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT 'Unknown Owner',
ADD COLUMN "ownerEmail" TEXT NOT NULL DEFAULT '';

CREATE INDEX "Listing_ownerEmail_idx" ON "Listing"("ownerEmail");
