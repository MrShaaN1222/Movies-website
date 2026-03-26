# Mirai Movies AI

Monorepo workspace for the Mirai Movies AI platform.

Legal-first platform: only official APIs, authorized uploads, and lawful streaming links are allowed.

## Structure

- `apps/frontend` - Next.js application
- `apps/backend` - Express API
- `packages/shared` - shared types/utilities
- `docs` - architecture, freeze logs, and product docs
- `infra` - deployment and infrastructure helpers

## Workspace Commands

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`

## App Commands

- Frontend: `npm run dev -w @mirai/frontend`
- Backend: `npm run dev -w @mirai/backend`

## Core APIs (Backend)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/movies/trending`
- `GET /api/v1/movies/popular`
- `GET /api/v1/movies/upcoming`
- `GET /api/v1/movies/search?q=...`
- `GET /api/v1/movies/:slug`
- `GET /api/v1/movies/:slug/watch-providers`
- `GET /api/v1/movies/:slug/reviews`
- `POST /api/v1/movies/:slug/reviews`
- `GET /api/v1/free-movies`
- `GET /api/v1/blog/posts`
- `GET /api/v1/ott`
- `GET /api/v1/admin/analytics/overview`

## Node Version

- Node.js `>=20`
