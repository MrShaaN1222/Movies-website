# Mirai Movies AI Architecture

## Runtime

- Frontend: Next.js App Router with SSR/ISR for SEO pages.
- Backend: Express modular API with JWT auth and RBAC.
- Database: MongoDB (Mongoose models for movies, users, reviews, OTT, monetization).
- Storage: S3/Cloudinary-compatible upload and HLS pipeline hooks.

## Modules

- Discovery: movie search, trending, popular, upcoming.
- Aggregation: where-to-watch providers with affiliate redirect tracking.
- Free Hub: legal YouTube/public-domain content.
- OTT: creator upload intent, transcode queue, premium playback.
- Monetization: ad events, affiliate clicks, sponsored blog, subscription intent.
