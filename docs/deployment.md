# Deployment Guide (Vercel + Render + MongoDB Atlas)

## Frontend (Vercel)

1. Import repo into Vercel.
2. Set root directory to `apps/frontend`.
3. Set env var: `NEXT_PUBLIC_API_URL=https://<render-backend-url>`.
4. Deploy and enable previews for pull requests.

## Backend (Render)

1. Create Web Service from repo.
2. Set root directory to `apps/backend`.
3. Build command: `npm install`.
4. Start command: `npm run start`.
5. Add env vars from `.env.example`.

## Database (MongoDB Atlas)

1. Create cluster and database `mirai_movies_ai`.
2. Add Render outbound IP to network allowlist (or temporary `0.0.0.0/0` during setup).
3. Set `MONGODB_URI` in Render env vars.

## Health and Verification

- API health: `GET /health`
- Frontend home route renders sections
- Auth register/login endpoints return valid JWT
- Admin endpoint protected by role middleware
