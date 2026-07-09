# Borrowa Frontend

React frontend for the Borrowa MVP rental marketplace.

## Features

- Listings page
- Listing detail page
- Create listing page
- Booking form on listing detail
- My bookings page filtered by renter email

## Setup

Requires Node.js 20.19+ or 22.12+.

1. Install dependencies:

```bash
npm install
```

2. Create an environment file:

```bash
cp .env.example .env
```

3. Confirm the backend API URL:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

4. Start the app:

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Backend

Start the backend first from `../backend`:

```bash
npm run dev
```

## Firebase Hosting

For production, set the API URL to the Cloud Run backend before building:

```bash
VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_URL npm run build
```

Deploy from the repository root with:

```bash
firebase deploy --only hosting
```

The root `firebase.json` serves `frontend/dist` and rewrites routes to `index.html`.
