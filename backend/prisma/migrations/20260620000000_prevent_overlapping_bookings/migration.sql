-- Ensure PostgreSQL can compare text values inside GiST exclusion constraints.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Booking dates must form a valid half-open range: [startDate, endDate).
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_valid_date_range"
CHECK ("startDate" < "endDate");

-- Prevent active bookings for the same listing from overlapping.
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_no_overlapping_active_dates"
EXCLUDE USING gist (
  "listingId" WITH =,
  tsrange("startDate", "endDate", '[)') WITH &&
)
WHERE ("status" IN ('PENDING'::"BookingStatus", 'CONFIRMED'::"BookingStatus"));
