# Borrowa Platform

MVP Borrowa rental marketplace with a React frontend, Express API, PostgreSQL database, and Prisma ORM.

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
FRONTEND_URLS="http://localhost:5173"
JWT_SECRET="replace-this-with-a-long-random-secret"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Borrowa <no-reply@borrowa.com>"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="borrowa/listings"
```

For production, set `NODE_ENV=production` and provide a strong `JWT_SECRET`. The backend will refuse to start in production without it.

Email verification links use `FRONTEND_URL`, so keep it set to the public frontend URL in deployed environments. CORS uses `FRONTEND_URLS`, a comma-separated list of allowed frontend origins.
Listing image uploads use Cloudinary. Set the `CLOUDINARY_*` variables before creating listings with uploaded images.

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
VITE_API_BASE_URL=http://localhost:4000
```

## Google Cloud Deployment

Target production architecture:

- Frontend: Firebase Hosting for `https://borrowa.com`
- Backend: Google Cloud Run
- Database: Google Cloud SQL PostgreSQL
- Images: Cloudinary
- Email: SMTP

### Backend Production Environment

Set these variables on the Cloud Run service:

```env
NODE_ENV=production
PORT=8080
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="use-a-long-random-production-secret"
FRONTEND_URL="https://borrowa.com"
FRONTEND_URLS="https://borrowa.my,https://borrowa-y1mj185zv-borrowa.vercel.app"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
EMAIL_FROM="Borrowa <no-reply@borrowa.com>"
CLOUDINARY_CLOUD_NAME="cloud-name"
CLOUDINARY_API_KEY="api-key"
CLOUDINARY_API_SECRET="api-secret"
CLOUDINARY_FOLDER="borrowa/listings"
```

`JWT_SECRET` is required when `NODE_ENV=production`.

### Cloud SQL Migration

Run migrations against Cloud SQL before or during deployment:

```bash
cd backend
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public" npx prisma migrate deploy
```

If using the Cloud SQL Auth Proxy locally:

```bash
cloud-sql-proxy PROJECT_ID:REGION:INSTANCE_NAME --port 5432
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE?schema=public" npx prisma migrate deploy
```

### Cloud Run Deployment

Build and deploy the backend container from `backend/Dockerfile`:

```bash
gcloud builds submit backend --tag REGION-docker.pkg.dev/PROJECT_ID/borrowa/backend:latest

gcloud run deploy borrowa-backend \
  --image REGION-docker.pkg.dev/PROJECT_ID/borrowa/backend:latest \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,FRONTEND_URL=https://borrowa.com,FRONTEND_URLS=https://borrowa.my\\,https://borrowa-y1mj185zv-borrowa.vercel.app \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,SMTP_PASS=SMTP_PASS:latest,CLOUDINARY_API_SECRET=CLOUDINARY_API_SECRET:latest
```

Add the remaining SMTP and Cloudinary variables in Cloud Run environment variables or Secret Manager. If Cloud Run connects to Cloud SQL through a private IP or Cloud SQL connection, configure the Cloud Run service networking accordingly.

### Firebase Hosting Deployment

Set the frontend production API URL to the Cloud Run URL:

```bash
cd frontend
echo 'VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_URL' > .env.production
npm install
npm run build
cd ..
firebase deploy --only hosting
```

`firebase.json` serves `frontend/dist` and rewrites all routes to `index.html` for the React app.

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
