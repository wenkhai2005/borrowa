# Backend QA Notes

## Public Listing Detail Security

Manual check for `GET /api/listings/:id`:

- Response includes safe listing fields only.
- Response must not include `bookings`.
- Response must not include renter names, renter emails, payment fields, refund fields, payout fields, chat messages, reviews, or damage reports.

Manual check for `GET /api/listings/:id/availability`:

- Response may include unavailable date ranges and active booking date ranges.
- Response must not include booking IDs.
- Response must not include renter names, renter emails, payment fields, refund fields, payout fields, chat messages, reviews, or damage reports.
