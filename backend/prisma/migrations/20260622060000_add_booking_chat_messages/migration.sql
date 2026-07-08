CREATE TYPE "ChatSenderRole" AS ENUM ('RENTER', 'SELLER');

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "senderEmail" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "senderRole" "ChatSenderRole" NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_bookingId_idx" ON "ChatMessage"("bookingId");
CREATE INDEX "ChatMessage_senderEmail_idx" ON "ChatMessage"("senderEmail");

ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
