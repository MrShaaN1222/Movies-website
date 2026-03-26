# API Routes

## Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Movies and Discovery

- `GET /api/v1/movies/trending`
- `GET /api/v1/movies/popular`
- `GET /api/v1/movies/upcoming`
- `GET /api/v1/movies/search?q=...`
- `GET /api/v1/movies/:slug`
- `GET /api/v1/movies/:slug/reviews`
- `POST /api/v1/movies/:slug/reviews`

## Providers and Affiliate

- `GET /api/v1/movies/:slug/watch-providers`
- `POST /api/v1/movies/affiliate/click`
- `GET /r/:code`

## Free Hub

- `GET /api/v1/free-movies`
- `GET /api/v1/free-movies/:id`

## OTT and Premium

- `GET /api/v1/ott`
- `POST /api/v1/ott`
- `GET /api/v1/ott/:slug`
- `POST /api/v1/ott/upload-intent`
- `POST /api/v1/ott/:slug/transcode`
- `GET /api/v1/ott/:slug/playback`
- `POST /api/v1/ott/:slug/progress`

## Recommendations

- `POST /api/v1/recommendations/query`
- `GET /api/v1/recommendations/personalized`

## Blog and Admin

- `GET /api/v1/blog/posts`
- `GET /api/v1/blog/posts/:slug`
- `GET /api/v1/admin/analytics/overview`
- `GET /api/v1/admin/users`

## Monetization

- `POST /api/v1/monetization/ads/events`
- `POST /api/v1/monetization/subscriptions/intent`
- `POST /api/v1/monetization/subscriptions/webhook/razorpay`
