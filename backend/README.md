# Borrowa Backend

Express, PostgreSQL, and Prisma backend for the Borrowa MVP rental marketplace.

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

Email verification links are generated from `FRONTEND_URL`; set it to the deployed frontend URL outside local development. CORS allows origins from `FRONTEND_URLS`, using a comma-separated list.

Listing image uploads use Cloudinary. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and optionally `CLOUDINARY_FOLDER` in `.env`.

Transactional email uses Resend when `RESEND_API_KEY` is configured. SMTP remains an optional fallback for environments that allow outbound SMTP. On Render free web services, use Resend because outbound SMTP ports are blocked.

Production deployments to Cloud Run should provide:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="use-a-long-random-production-secret"
FRONTEND_URL="https://borrowa.com"
FRONTEND_URLS="https://borrowa.my,https://borrowa-y1mj185zv-borrowa.vercel.app"
RESEND_API_KEY="re_your_resend_api_key"
EMAIL_FROM="Borrowa <no-reply@borrowa.com>"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
CLOUDINARY_CLOUD_NAME="cloud-name"
CLOUDINARY_API_KEY="api-key"
CLOUDINARY_API_SECRET="api-secret"
CLOUDINARY_FOLDER="borrowa/listings"
```

Build the Cloud Run image from `backend/Dockerfile`. Run Cloud SQL migrations with `npx prisma migrate deploy` before routing traffic to a new revision.

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
  "imageUrls": ["https://res.cloudinary.com/example/image/upload/listing.jpg"],
  "isAvailable": true
}
```

Upload listing images first with `POST /api/uploads/listing-images` using multipart field `images` with up to 5 jpg, jpeg, png, or webp files.

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
