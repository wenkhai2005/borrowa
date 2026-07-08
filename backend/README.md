# Camera Rental Backend

Express, PostgreSQL, and Prisma backend for the MVP camera rental platform.

## Features

- Listings CRUD API
- Booking creation and lookup API
- Overlapping booking prevention per listing at API and database levels
- Basic request validation
- Prisma PostgreSQL schema

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` in `.env` for your local PostgreSQL database.

For production, set `NODE_ENV=production` and provide a strong `JWT_SECRET`. The API will fail fast on startup if `JWT_SECRET` is missing in production.

Email verification links are generated from `FRONTEND_URL`; set it to the deployed frontend URL outside local development.

4. Create database tables:

```bash
npm run prisma:migrate
```

5. Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:4000` by default.

## API Endpoints

### Health

- `GET /health`

### Listings

- `GET /api/listings`
- `POST /api/listings`
- `GET /api/listings/:id`
- `PATCH /api/listings/:id`
- `DELETE /api/listings/:id`

Example listing payload:

```json
{
  "title": "Sony A7 III with 24-70mm Lens",
  "description": "Full-frame mirrorless camera kit for events and portraits.",
  "category": "Camera",
  "cameraBrand": "Sony",
  "cameraModel": "A7 III",
  "location": "Kuala Lumpur",
  "dailyRate": 120,
  "imageUrl": "https://example.com/camera.jpg",
  "isAvailable": true
}
```

### Bookings

- `GET /api/bookings`
- `GET /api/bookings?email=renter@example.com`
- `POST /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`

Example booking payload:

```json
{
  "listingId": "replace-with-listing-id",
  "renterName": "Alex Tan",
  "renterEmail": "alex@example.com",
  "startDate": "2026-07-01T00:00:00.000Z",
  "endDate": "2026-07-04T00:00:00.000Z"
}
```

Bookings use an exclusive end date. A booking from July 1 to July 4 charges 3 days.
