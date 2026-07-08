# Camera Rental Platform

MVP camera rental platform with a React frontend, Express API, PostgreSQL database, and Prisma ORM.

## Current Scope

- Listings module
- Bookings module
- Overlapping bookings are blocked for the same listing

Not included yet: payments, KYC, chat, reviews, or admin panel.

## Project Structure

```text
backend/   Express API, Prisma schema, PostgreSQL migrations
frontend/  React app built with Vite
```

## Prerequisites

- Node.js 20.19+ or 22.12+
- PostgreSQL 14+
- npm

Docker is optional but recommended for running PostgreSQL locally.

## 1. Start PostgreSQL

Using Docker:

```bash
docker run --name camera-rental-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=camera_rental \
  -p 5432:5432 \
  -d postgres:16
```

If the container already exists:

```bash
docker start camera-rental-postgres
```

Without Docker, create a local PostgreSQL database named `camera_rental`.

## 2. Set Up Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate
npm run dev
```

Backend runs at:

```text
http://localhost:4000
```

The backend `.env` should match your PostgreSQL connection:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/camera_rental?schema=public"
PORT=4000
FRONTEND_URL="http://localhost:5173"
JWT_SECRET="replace-this-with-a-long-random-secret"
```

For production, set `NODE_ENV=production` and provide a strong `JWT_SECRET`. The backend will refuse to start in production without it.

Email verification links use `FRONTEND_URL`, so keep it set to the public frontend URL in deployed environments.

## 3. Set Up Frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

The frontend `.env` should point to the backend:

```env
VITE_API_URL=http://localhost:4000
```

## Useful Commands

Backend:

```bash
cd backend
npm run prisma:studio
npm run prisma:generate
```

Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Booking Rules

- `startDate` must be before `endDate`.
- `startDate` cannot be in the past.
- `endDate` is exclusive, so a booking from July 1 to July 4 is charged as 3 days.
- Active bookings with status `PENDING` or `CONFIRMED` cannot overlap for the same listing.
